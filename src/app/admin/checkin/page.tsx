'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'
import ClubIcon from '@/components/ClubIcon'

/* ─── Types ──────────────────────────────────────────── */
type QrErrorCode = 'INVALID_QR' | 'NOT_FOUND' | 'SYSTEM' | 'NETWORK'

const QR_ERROR_INFO: Record<QrErrorCode, { label: string; hint: string }> = {
  INVALID_QR: { label: 'QR Code 無效', hint: '此 QR Code 非本系統所生成，或連結已損毀' },
  NOT_FOUND:  { label: '找不到學生紀錄', hint: '學生可能尚未完成測驗，請確認後重試' },
  SYSTEM:     { label: '系統錯誤', hint: '伺服器發生問題，錯誤已自動記錄，請稍後重試' },
  NETWORK:    { label: '網路錯誤', hint: '請確認裝置網路連線後重試' },
}

const QR_ERROR_COLORS: Record<QrErrorCode, string> = {
  INVALID_QR: '#ff3366',
  NOT_FOUND:  '#ff9966',
  SYSTEM:     '#ff3366',
  NETWORK:    '#ffd700',
}

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'processing' }
  | { status: 'confirm'; submissionId: string; token: string; lockedResult: string; department: string; studentId: string }
  | { status: 'confirming' }
  | { status: 'success'; lockedResult: string; department: string; studentId: string }
  | { status: 'already'; lockedResult: string; checkedInAt: string; department: string }
  | { status: 'error'; code: QrErrorCode; detail?: string }

interface CheckinRecord {
  id: string
  student_id: string
  locked_result: string
  checked_in_at: string
  scanned_by: string | null
  department: string
}

const CLUB_COLORS: Record<string, string> = {
  '學術性社團':    '#00d4ff',
  '休閒聯誼性社團': '#ffd700',
  '服務性社團':    '#00ff88',
  '藝術性社團':    '#ff00ff',
  '音樂性社團':    '#ff9966',
  '體能性社團':    '#ff3366',
  '其他單位':      '#9966ff',
}

/* ─── Component ───────────────────────────────────────── */
export default function AdminCheckinPage() {
  const router = useRouter()

  const videoRef       = useRef<HTMLVideoElement>(null)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const lastUrlRef     = useRef<{ url: string; ts: number }>({ url: '', ts: 0 })
  const scanStateRef   = useRef<ScanState>({ status: 'idle' })
  const resetTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scanState, setScanState]     = useState<ScanState>({ status: 'idle' })
  const [records, setRecords]         = useState<CheckinRecord[]>([])
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [showLog, setShowLog]         = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => { scanStateRef.current = scanState }, [scanState])

  /* ── Records ── */
  const refreshRecords = useCallback(() => {
    fetch('/api/admin/checkin/records')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRecords(d) })
      .catch(() => {})
  }, [])

  useEffect(() => { refreshRecords() }, [refreshRecords])

  /* ── Cancel a check-in ── */
  const handleCancel = useCallback(async (checkinId: string) => {
    setCancellingId(checkinId)
    try {
      const res = await fetch('/api/admin/checkin/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkinId }),
      })
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== checkinId))
      }
    } catch { /* ignore */ }
    setCancellingId(null)
  }, [])

  /* ── Process a decoded QR URL: fetch preview, then wait for staff confirm ── */
  const processQR = useCallback(async (rawText: string) => {
    const now = Date.now()
    if (rawText === lastUrlRef.current.url && now - lastUrlRef.current.ts < 6000) return
    lastUrlRef.current = { url: rawText, ts: now }

    let submissionId = '', token = ''
    try {
      const u = new URL(rawText)
      submissionId = u.searchParams.get('id') ?? ''
      token        = u.searchParams.get('t')  ?? ''
    } catch { return }

    if (!submissionId || !token) return

    setScanState({ status: 'processing' })

    try {
      // Fetch student info and check-in status in parallel
      const [subRes, ciRes] = await Promise.all([
        fetch(`/api/result?id=${submissionId}`),
        fetch(`/api/checkin/token?submissionId=${submissionId}`),
      ])
      const subData = await subRes.json()
      const ciData  = await ciRes.json()

      if (subData.error || !subRes.ok) {
        setScanState({ status: 'error', code: 'NOT_FOUND' })
        scheduleReset()
        return
      }

      // Already checked in — show info directly, no confirmation needed
      if (ciData.isCheckedIn) {
        setScanState({
          status: 'already',
          lockedResult: ciData.lockedResult ?? subData.result,
          checkedInAt:  ciData.checkedInAt ?? '',
          department:   subData.department ?? '',
        })
        scheduleReset()
        return
      }

      // Not checked in — show confirmation card
      setScanState({
        status:       'confirm',
        submissionId,
        token,
        lockedResult: subData.result,
        department:   subData.department ?? '',
        studentId:    subData.student_id ?? '',
      })
      // No auto-reset here — wait for staff to tap confirm or cancel
    } catch {
      setScanState({ status: 'error', code: 'NETWORK' })
      scheduleReset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scheduleReset(delay = 3500) {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      setScanState({ status: 'scanning' })
      lastUrlRef.current = { url: '', ts: 0 }
    }, delay)
  }

  /* ── Staff taps "確認簽到" ── */
  const handleConfirmCheckin = useCallback(async () => {
    if (scanStateRef.current.status !== 'confirm') return
    const { submissionId, token } = scanStateRef.current
    setScanState({ status: 'confirming' })

    let code: QrErrorCode = 'SYSTEM'
    try {
      const res  = await fetch('/api/admin/checkin/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ submissionId, token }),
      })
      const data = await res.json()

      if (res.status === 409 && data.alreadyChecked) {
        setScanState({ status: 'already', lockedResult: data.lockedResult, checkedInAt: data.checkedInAt, department: data.department })
      } else if (!res.ok) {
        if (res.status === 400 || data.errorCode === 'INVALID_QR') code = 'INVALID_QR'
        else if (res.status === 404 || data.errorCode === 'NOT_FOUND') code = 'NOT_FOUND'
        else code = data.errorCode ?? 'SYSTEM'
        setScanState({ status: 'error', code, detail: data.error })
        fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 'admin_checkin',
            description: `QR掃描錯誤 [${code}]: submissionId=${submissionId}`,
            category: 'qr_scan_error',
          }),
        }).catch(() => {})
      } else {
        setScanState({ status: 'success', lockedResult: data.lockedResult, department: data.department, studentId: data.studentId })
        refreshRecords()
      }
    } catch {
      code = 'NETWORK'
      setScanState({ status: 'error', code: 'NETWORK' })
    }
    scheduleReset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshRecords])

  /* ── Staff taps "取消" on confirm card ── */
  const handleCancelConfirm = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    lastUrlRef.current = { url: '', ts: 0 }
    setScanState({ status: 'scanning' })
  }, [])

  /* ── Scan loop via setInterval ── */
  useEffect(() => {
    if (!cameraReady) return

    const id = setInterval(() => {
      if (scanStateRef.current.status !== 'scanning') return

      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      if (video.readyState !== 4) return
      if (video.videoWidth === 0 || video.videoHeight === 0) return

      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(video, 0, 0)
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const qr  = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })
      if (qr?.data) processQR(qr.data)
    }, 250)

    return () => clearInterval(id)
  }, [cameraReady, processQR])

  /* ── Camera init ── */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then(stream => {
        streamRef.current = stream
        const v = videoRef.current
        if (!v) return
        v.srcObject = stream
        v.onloadedmetadata = () => {
          v.play()
            .then(() => { setCameraReady(true); setScanState({ status: 'scanning' }) })
            .catch(() => setCameraError('無法啟動相機'))
        }
      })
      .catch(() => setCameraError('請允許相機權限後重新整理'))

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  /* ── Derived ── */
  const todayStr   = new Date().toISOString().slice(0, 10)
  const todayCount = records.filter(r => r.checked_in_at.slice(0, 10) === todayStr).length
  const s          = scanState.status
  const isConfirmOrConfirming = s === 'confirm' || s === 'confirming'
  const borderCol  = s === 'success' ? '#ffd700'
    : s === 'already'                ? '#ffd700'
    : s === 'error'                  ? '#ff3366'
    : isConfirmOrConfirming          ? '#00d4ff'
    :                                  '#00ff88'

  return (
    <div className="min-h-screen max-h-screen cyber-grid flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b"
        style={{ background: '#12121a', borderColor: '#2a2a3a' }}>
        <span className="dot-green neon-pulse" />
        <span className="font-orbitron font-black text-xs uppercase tracking-widest text-neon hidden sm:block">
          CHECKIN SCANNER
        </span>
        <span className="font-orbitron font-black text-xs uppercase tracking-wider text-neon sm:hidden">
          SCAN
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="dot-amber" />
          <span className="text-xs font-orbitron" style={{ color: '#ffd700' }}>{todayCount}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowLog(v => !v)}
            className="sm:hidden text-xs font-orbitron border cyber-chamfer-sm px-2.5 py-1"
            style={{ borderColor: '#ffd70040', color: '#ffd700' }}
          >
            {showLog ? '📷 掃碼' : `📋 紀錄 (${records.length})`}
          </button>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="cyber-btn-ghost cyber-chamfer-sm text-xs px-2.5 py-1.5"
          >
            ← 儀表板
          </button>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">

        {/* ── Camera panel ── */}
        <div className={`flex-1 flex flex-col items-center justify-center p-3 gap-3 ${showLog ? 'hidden sm:flex' : 'flex'}`}>

          {/* Viewfinder */}
          <div className="relative w-full" style={{ maxWidth: 380 }}>
            {(['tl','tr','bl','br'] as const).map(p => (
              <div key={p} className="absolute w-7 h-7 z-20 pointer-events-none qr-corner"
                style={{
                  ...(p==='tl' ? {top:-2,left:-2,borderTop:'2.5px solid',borderLeft:'2.5px solid'}
                    :p==='tr' ? {top:-2,right:-2,borderTop:'2.5px solid',borderRight:'2.5px solid'}
                    :p==='bl' ? {bottom:-2,left:-2,borderBottom:'2.5px solid',borderLeft:'2.5px solid'}
                               :{bottom:-2,right:-2,borderBottom:'2.5px solid',borderRight:'2.5px solid'}),
                  borderColor: borderCol,
                  filter: `drop-shadow(0 0 5px ${borderCol})`,
                }}
              />
            ))}

            <div className="relative overflow-hidden bg-black w-full"
              style={{ aspectRatio: '4/3', border: `1px solid ${borderCol}40` }}>

              <video ref={videoRef} className="w-full h-full object-cover"
                playsInline muted autoPlay />
              <canvas ref={canvasRef} className="hidden" />

              {(s === 'scanning') && cameraReady && (
                <>
                  {/* Scan guide — fills full frame, aligned with corner brackets */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{
                      border: '2px solid rgba(0,255,136,.5)',
                      boxShadow: 'inset 0 0 30px rgba(0,255,136,.04)',
                    }}
                  />
                  {/* Scan beam full width */}
                  <div className="absolute qr-scan-beam pointer-events-none"
                    style={{ left: 0, right: 0, height: 2 }}
                  />
                  {/* Hint text at bottom of frame */}
                  <div className="absolute bottom-0 left-0 right-0 py-2.5 flex items-center justify-center gap-2 pointer-events-none z-10"
                    style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.55))' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-neon neon-pulse shrink-0" />
                    <span className="text-xs font-orbitron tracking-widest" style={{ color: '#00ff88' }}>
                      對準 QR Code 進行掃描
                    </span>
                  </div>
                </>
              )}

              {(s === 'processing' || s === 'confirming') && (
                <div className="absolute inset-0 flex items-center justify-center z-10"
                  style={{ background: 'rgba(10,10,15,.7)' }}>
                  <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">驗證中</p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-5 text-center"
                  style={{ background: '#0a0a0f' }}>
                  <p className="text-4xl mb-3">📷</p>
                  <p className="text-danger text-xs font-orbitron tracking-wider leading-relaxed">{cameraError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mt-2 py-1">
              <span className={s === 'error' ? 'dot-red' : s === 'success' || s === 'already' ? 'dot-amber' : 'dot-green'}
                style={s === 'scanning' ? undefined : { animation: 'none' }} />
              <span className="text-xs font-orbitron tracking-widest"
                style={{ color: s === 'success' || s === 'already' ? '#ffd700' : s === 'error' ? '#ff3366' : s === 'processing' || s === 'confirming' ? '#00d4ff' : isConfirmOrConfirming ? '#00d4ff' : '#4a4a6a' }}>
                {s === 'idle'        ? '初始化相機中'
                :s === 'scanning'    ? 'SCANNING'
                :s === 'processing'  ? '讀取學生資料中...'
                :s === 'confirm'     ? '請確認後完成簽到'
                :s === 'confirming'  ? '確認簽到中...'
                :s === 'success'     ? '簽到成功！'
                :s === 'already'     ? '此學生已簽到'
                :                     '發生錯誤'}
              </span>
            </div>
          </div>

          {/* Result / Confirm card */}
          {(s === 'confirm' || s === 'success' || s === 'already' || s === 'error') && (
            <div className="w-full terminal-card cyber-chamfer fade-in-up overflow-hidden"
              style={{
                maxWidth: 380,
                borderColor: s === 'confirm'  ? 'rgba(0,212,255,.45)'
                  : s === 'success'           ? 'rgba(255,215,0,.45)'
                  : s === 'already'           ? 'rgba(255,215,0,.2)'
                  :                             'rgba(255,51,102,.3)',
              }}>
              <div className="h-0.5"
                style={{ background: s === 'confirm'  ? 'linear-gradient(90deg,transparent,#00d4ff,transparent)'
                  : s === 'success'                   ? 'linear-gradient(90deg,transparent,#ffd700,transparent)'
                  : s === 'already'                   ? 'linear-gradient(90deg,transparent,#ffd70050,transparent)'
                  :                                     'linear-gradient(90deg,transparent,#ff3366,transparent)' }} />

              {s === 'confirm' && scanState.status === 'confirm' && (
                <div className="p-4 space-y-3">
                  {/* Student info */}
                  <div className="flex items-start gap-3">
                    <ClubIcon category={scanState.lockedResult} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="font-orbitron font-black tracking-wider mb-0.5" style={{ color: '#00d4ff' }}>
                        待確認簽到
                      </p>
                      <p className="text-xs font-orbitron mb-0.5" style={{ color: CLUB_COLORS[scanState.lockedResult] ?? '#00ff88' }}>
                        {scanState.lockedResult}
                      </p>
                      <p className="text-dim text-xs truncate">{scanState.department}</p>
                      <p className="text-xs mt-0.5 font-orbitron" style={{ color: '#4a4a6a' }}>
                        學號: {scanState.studentId.slice(0,3)}••••{scanState.studentId.slice(-2)}
                      </p>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleCancelConfirm}
                      className="text-xs font-orbitron tracking-wider py-2 cyber-chamfer-sm border transition-colors"
                      style={{ borderColor: '#ff336640', color: '#ff3366' }}
                    >
                      ✕ 取消
                    </button>
                    <button
                      onClick={handleConfirmCheckin}
                      className="text-xs font-orbitron tracking-wider py-2 cyber-chamfer-sm border transition-colors"
                      style={{ borderColor: '#00d4ff80', color: '#00d4ff', background: 'rgba(0,212,255,.08)' }}
                    >
                      ✓ 確認簽到
                    </button>
                  </div>
                </div>
              )}

              {s === 'success' && scanState.status === 'success' && (
                <div className="p-4 flex items-center gap-4">
                  <div className="text-4xl shrink-0" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,.6)' }}>✓</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-orbitron font-black tracking-wider mb-1" style={{ color: '#ffd700' }}>簽到成功</p>
                    <div className="flex items-center gap-2">
                      <ClubIcon category={scanState.lockedResult} size={14} />
                      <span className="text-xs font-orbitron" style={{ color: CLUB_COLORS[scanState.lockedResult] ?? '#00ff88' }}>
                        {scanState.lockedResult}
                      </span>
                    </div>
                    <p className="text-dim text-xs mt-0.5 truncate">{scanState.department}</p>
                  </div>
                </div>
              )}

              {s === 'already' && scanState.status === 'already' && (
                <div className="p-4 flex items-center gap-4">
                  <div className="text-3xl shrink-0" style={{ color: '#ffd70070' }}>🔒</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-orbitron text-sm tracking-wider mb-1" style={{ color: '#ffd70070' }}>已簽到過</p>
                    <p className="text-dim text-xs mb-0.5 truncate">{scanState.department}</p>
                    <p className="text-xs" style={{ color: '#4a4a6a' }}>
                      {new Date(scanState.checkedInAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>
              )}

              {s === 'error' && scanState.status === 'error' && (
                <div className="p-4 flex items-center gap-4">
                  <div className="text-3xl shrink-0" style={{ color: QR_ERROR_COLORS[scanState.code] }}>✕</div>
                  <div>
                    <p className="font-orbitron text-sm tracking-wider mb-1"
                      style={{ color: QR_ERROR_COLORS[scanState.code] }}>
                      {QR_ERROR_INFO[scanState.code].label}
                    </p>
                    <p className="text-dim text-xs">{QR_ERROR_INFO[scanState.code].hint}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Records panel ── */}
        <div className={`w-full sm:w-72 flex flex-col border-t sm:border-t-0 sm:border-l overflow-hidden ${showLog ? 'flex' : 'hidden sm:flex'}`}
          style={{ borderColor: '#2a2a3a' }}>

          <div className="terminal-header shrink-0 flex items-center gap-2">
            <span className="dot-amber" />
            <span className="ml-1 text-xs font-orbitron uppercase tracking-widest text-dim flex-1">簽到紀錄</span>
            <span className="font-orbitron text-xs" style={{ color: '#ffd700' }}>{records.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {records.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-dim text-xs font-orbitron tracking-widest cyber-cursor">尚無簽到紀錄</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#1a1a2a' }}>
                {records.map((r, idx) => {
                  const col     = CLUB_COLORS[r.locked_result] ?? '#00ff88'
                  const isToday = r.checked_in_at.slice(0, 10) === todayStr
                  const cancelling = cancellingId === r.id
                  return (
                    <div key={r.id} className="px-3 py-2.5 flex items-center gap-2"
                      style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.012)' }}>
                      <ClubIcon category={r.locked_result} size={16} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-orbitron truncate" style={{ color: col, fontSize: 10 }}>
                            {r.locked_result}
                          </span>
                          {isToday && (
                            <span className="shrink-0 text-xs font-orbitron px-1 py-px rounded-sm"
                              style={{ background: 'rgba(0,255,136,.1)', color: '#00ff88', fontSize: 8 }}>
                              今日
                            </span>
                          )}
                        </div>
                        <p className="text-dim truncate" style={{ fontSize: 10 }}>
                          {r.department.split(' ')[0] ?? r.department}
                        </p>
                      </div>
                      <p className="shrink-0 font-orbitron" style={{ color: '#3a3a5a', fontSize: 9 }}>
                        {new Date(r.checked_in_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {/* Cancel button */}
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancelling}
                        title="取消簽到"
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-sm transition-colors"
                        style={{
                          color: cancelling ? '#3a3a5a' : '#ff336660',
                          fontSize: 10,
                          border: '1px solid currentColor',
                        }}
                        onMouseEnter={e => { if (!cancelling) (e.currentTarget as HTMLButtonElement).style.color = '#ff3366' }}
                        onMouseLeave={e => { if (!cancelling) (e.currentTarget as HTMLButtonElement).style.color = '#ff336660' }}
                      >
                        {cancelling ? '…' : '✕'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
