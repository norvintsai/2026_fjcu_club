'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'
import ClubIcon from '@/components/ClubIcon'

/* ─── Types ──────────────────────────────────────────── */
type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'processing' }
  | { status: 'success'; lockedResult: string; department: string; studentId: string }
  | { status: 'already'; lockedResult: string; checkedInAt: string; department: string }
  | { status: 'error'; message: string }

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
  // Keep a ref in sync with scanState so setInterval closure can read it without stale values
  const scanStateRef   = useRef<ScanState>({ status: 'idle' })
  const resetTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scanState, setScanState]     = useState<ScanState>({ status: 'idle' })
  const [records, setRecords]         = useState<CheckinRecord[]>([])
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [showLog, setShowLog]         = useState(false)

  // Keep ref in sync with state
  useEffect(() => { scanStateRef.current = scanState }, [scanState])

  /* ── Records ── */
  const refreshRecords = useCallback(() => {
    fetch('/api/admin/checkin/records')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRecords(d) })
      .catch(() => {})
  }, [])

  useEffect(() => { refreshRecords() }, [refreshRecords])

  /* ── Process a decoded QR URL ── */
  const processQR = useCallback(async (rawText: string) => {
    const now = Date.now()
    // Debounce: ignore same URL within 6 s
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
      const res  = await fetch('/api/admin/checkin/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ submissionId, token }),
      })
      const data = await res.json()

      if (res.status === 409 && data.alreadyChecked) {
        setScanState({ status: 'already', lockedResult: data.lockedResult, checkedInAt: data.checkedInAt, department: data.department })
      } else if (!res.ok) {
        setScanState({ status: 'error', message: data.error ?? '簽到失敗' })
      } else {
        setScanState({ status: 'success', lockedResult: data.lockedResult, department: data.department, studentId: data.studentId })
        refreshRecords()
      }
    } catch {
      setScanState({ status: 'error', message: '網路錯誤，請重試' })
    }

    // Auto-reset after 3.5 s
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      setScanState({ status: 'scanning' })
      lastUrlRef.current = { url: '', ts: 0 }
    }, 3500)
  }, [refreshRecords])

  /* ── Scan loop via setInterval (250 ms = 4 fps, plenty for QR) ── */
  useEffect(() => {
    if (!cameraReady) return

    const id = setInterval(() => {
      // Read from ref – no stale-closure problem
      if (scanStateRef.current.status !== 'scanning') return

      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      // readyState 4 = HAVE_ENOUGH_DATA – reliable frames
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
  const borderCol  = s === 'success' ? '#ffd700' : s === 'already' ? '#ffd700' : s === 'error' ? '#ff3366' : '#00ff88'

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
          {/* Mobile: toggle log */}
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
            {/* Corner brackets */}
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

            {/* Video box */}
            <div className="relative overflow-hidden bg-black w-full"
              style={{ aspectRatio: '4/3', border: `1px solid ${borderCol}40` }}>

              <video ref={videoRef} className="w-full h-full object-cover"
                playsInline muted autoPlay />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scan target guide */}
              {(s === 'scanning') && cameraReady && (
                <>
                  {/* Dimmed areas outside target */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,.35)' }} />
                  {/* Centre clear box */}
                  <div className="absolute pointer-events-none"
                    style={{
                      top: '20%', left: '20%', right: '20%', bottom: '20%',
                      border: '2px solid rgba(0,255,136,.6)',
                      boxShadow: 'inset 0 0 20px rgba(0,255,136,.06)',
                      background: 'transparent',
                    }}
                  />
                  {/* Scan beam inside target only */}
                  <div className="absolute qr-scan-beam pointer-events-none"
                    style={{ left: '20%', right: '20%', height: 2 }}
                  />
                </>
              )}

              {/* Processing */}
              {s === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center z-10"
                  style={{ background: 'rgba(10,10,15,.7)' }}>
                  <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">驗證中</p>
                </div>
              )}

              {/* Camera error */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-5 text-center"
                  style={{ background: '#0a0a0f' }}>
                  <p className="text-4xl mb-3">📷</p>
                  <p className="text-danger text-xs font-orbitron tracking-wider leading-relaxed">{cameraError}</p>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-center gap-2 mt-2 py-1">
              <span className={s === 'error' ? 'dot-red' : s === 'success' || s === 'already' ? 'dot-amber' : 'dot-green'}
                style={s === 'scanning' ? undefined : { animation: 'none' }} />
              <span className="text-xs font-orbitron tracking-widest"
                style={{ color: s === 'success' || s === 'already' ? '#ffd700' : s === 'error' ? '#ff3366' : s === 'processing' ? '#00d4ff' : '#6b7280' }}>
                {s === 'idle'       ? '初始化相機中'
                :s === 'scanning'   ? '對準 QR Code 進行掃描'
                :s === 'processing' ? '驗證中...'
                :s === 'success'    ? '簽到成功！'
                :s === 'already'    ? '此學生已簽到'
                :                    '發生錯誤'}
              </span>
            </div>
          </div>

          {/* Result card */}
          {(s === 'success' || s === 'already' || s === 'error') && (
            <div className="w-full terminal-card cyber-chamfer fade-in-up overflow-hidden"
              style={{
                maxWidth: 380,
                borderColor: s === 'success' ? 'rgba(255,215,0,.45)' : s === 'already' ? 'rgba(255,215,0,.2)' : 'rgba(255,51,102,.3)',
              }}>
              <div className="h-0.5"
                style={{ background: s === 'success' ? 'linear-gradient(90deg,transparent,#ffd700,transparent)'
                  : s === 'already' ? 'linear-gradient(90deg,transparent,#ffd70050,transparent)'
                  : 'linear-gradient(90deg,transparent,#ff3366,transparent)' }} />

              {s === 'success' && (
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

              {s === 'already' && (
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

              {s === 'error' && (
                <div className="p-4 flex items-center gap-4">
                  <div className="text-3xl shrink-0 text-danger">✕</div>
                  <div>
                    <p className="font-orbitron text-sm tracking-wider text-danger mb-1">錯誤</p>
                    <p className="text-dim text-xs">{(scanState as { status: 'error'; message: string }).message}</p>
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
                  return (
                    <div key={r.id} className="px-3 py-2.5 flex items-center gap-2.5"
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
