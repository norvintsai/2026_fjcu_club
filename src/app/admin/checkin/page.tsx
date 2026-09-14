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

  const videoRef      = useRef<HTMLVideoElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const rafRef        = useRef<number>(0)
  const lastUrlRef    = useRef<{ url: string; ts: number }>({ url: '', ts: 0 })
  const streamRef     = useRef<MediaStream | null>(null)

  const [scanState, setScanState]     = useState<ScanState>({ status: 'idle' })
  const [records, setRecords]         = useState<CheckinRecord[]>([])
  const [cameraError, setCameraError] = useState('')
  const [showRecords, setShowRecords] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  /* ── Fetch today's records ── */
  function refreshRecords() {
    fetch('/api/admin/checkin/records')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecords(data) })
      .catch(() => {})
  }

  useEffect(() => {
    refreshRecords()
  }, [])

  /* ── Parse QR URL and confirm ── */
  const processQR = useCallback(async (rawText: string) => {
    // Debounce: skip same URL within 6 seconds
    const now = Date.now()
    if (rawText === lastUrlRef.current.url && now - lastUrlRef.current.ts < 6000) return
    lastUrlRef.current = { url: rawText, ts: now }

    let submissionId = ''
    let token = ''

    try {
      const url = new URL(rawText)
      submissionId = url.searchParams.get('id') ?? ''
      token        = url.searchParams.get('t') ?? ''
    } catch {
      // Not a valid URL – ignore
      return
    }

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
        setScanState({
          status:       'already',
          lockedResult: data.lockedResult,
          checkedInAt:  data.checkedInAt,
          department:   data.department,
        })
      } else if (!res.ok) {
        setScanState({ status: 'error', message: data.error ?? '簽到失敗' })
      } else {
        setScanState({
          status:       'success',
          lockedResult: data.lockedResult,
          department:   data.department,
          studentId:    data.studentId,
        })
        refreshRecords()
      }
    } catch {
      setScanState({ status: 'error', message: '網路錯誤，請重試' })
    }

    // Auto-reset after 4 seconds
    setTimeout(() => {
      setScanState({ status: 'scanning' })
      lastUrlRef.current = { url: '', ts: 0 }
    }, 4000)
  }, [])

  /* ── Camera scan loop ── */
  const scanLoop = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop)
      return
    }

    // Skip if processing or showing result
    const state = (document.getElementById('scan-state-holder') as HTMLInputElement | null)?.value
    if (state === 'processing' || state === 'success' || state === 'already' || state === 'error') {
      rafRef.current = requestAnimationFrame(scanLoop)
      return
    }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) { rafRef.current = requestAnimationFrame(scanLoop); return }

    ctx.drawImage(video, 0, 0)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const result  = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'attemptBoth',
    })
    if (result?.data) processQR(result.data)

    rafRef.current = requestAnimationFrame(scanLoop)
  }, [processQR])

  /* ── Start camera ── */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } })
      .then(stream => {
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          video.play().then(() => {
            setCameraReady(true)
            setScanState({ status: 'scanning' })
            rafRef.current = requestAnimationFrame(scanLoop)
          }).catch(() => setCameraError('無法啟動相機'))
        }
      })
      .catch(() => setCameraError('無法存取相機，請允許相機權限'))

    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [scanLoop])

  const todayStr    = new Date().toISOString().slice(0, 10)
  const todayCount  = records.filter(r => r.checked_in_at.slice(0, 10) === todayStr).length
  const stateKey    = scanState.status

  return (
    <div className="min-h-screen cyber-grid flex flex-col">
      {/* Hidden state tracker for scan loop */}
      <input id="scan-state-holder" type="hidden" value={stateKey} />

      {/* ── Header ── */}
      <div className="terminal-card border-0 border-b px-5 py-3 flex items-center gap-3 shrink-0"
        style={{ borderColor: '#2a2a3a' }}>
        <span className="dot-green neon-pulse" />
        <span className="font-orbitron font-black text-sm uppercase tracking-widest text-neon">
          STELLAR CHECKIN SCANNER
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-orbitron" style={{ color: '#ffd700' }}>
            今日 {todayCount} 人
          </span>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="cyber-btn-ghost cyber-chamfer-sm text-xs px-3 py-1.5"
          >
            ← 返回儀表板
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* ── Left: Camera ── */}
        <div className="flex-1 flex flex-col items-center justify-start p-4 gap-4">

          {/* Camera frame */}
          <div className="relative w-full max-w-sm">
            {/* Corner decorations */}
            {(['tl','tr','bl','br'] as const).map(pos => (
              <div key={pos} className="absolute w-8 h-8 z-20 pointer-events-none qr-corner"
                style={{
                  ...(pos === 'tl' ? { top: -2, left: -2, borderTop: '2px solid', borderLeft: '2px solid' } :
                     pos === 'tr' ? { top: -2, right: -2, borderTop: '2px solid', borderRight: '2px solid' } :
                     pos === 'bl' ? { bottom: -2, left: -2, borderBottom: '2px solid', borderLeft: '2px solid' } :
                                    { bottom: -2, right: -2, borderBottom: '2px solid', borderRight: '2px solid' }),
                  borderColor: stateKey === 'success' ? '#ffd700'
                             : stateKey === 'already'  ? '#ffd700'
                             : stateKey === 'error'    ? '#ff3366'
                             : '#00ff88',
                  boxShadow: `0 0 6px ${stateKey === 'error' ? '#ff3366' : stateKey === 'success' || stateKey === 'already' ? '#ffd700' : '#00ff88'}`,
                }}
              />
            ))}

            {/* Video */}
            <div className="relative overflow-hidden rounded-sm bg-black aspect-[4/3] w-full"
              style={{ border: '1px solid #2a2a3a' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline muted autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scan beam (only while scanning) */}
              {(stateKey === 'scanning' || stateKey === 'idle') && cameraReady && (
                <div className="absolute left-0 right-0 z-10 qr-scan-beam" style={{ height: 3 }} />
              )}

              {/* Processing overlay */}
              {stateKey === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center z-10"
                  style={{ background: 'rgba(10,10,15,.6)' }}>
                  <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">驗證中</p>
                </div>
              )}

              {/* Camera error */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center"
                  style={{ background: '#0a0a0f' }}>
                  <p className="text-danger text-3xl mb-3">📷</p>
                  <p className="text-danger text-xs font-orbitron tracking-wider">{cameraError}</p>
                </div>
              )}
            </div>

            {/* Status label below camera */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={
                stateKey === 'success' ? 'dot-amber' :
                stateKey === 'already' ? 'dot-amber' :
                stateKey === 'error'   ? 'dot-red' :
                'dot-green'
              } style={stateKey === 'scanning' ? { animation: 'none' } : undefined} />
              <span className="text-xs font-orbitron tracking-widest"
                style={{ color:
                  stateKey === 'success' ? '#ffd700' :
                  stateKey === 'already' ? '#ffd700' :
                  stateKey === 'error'   ? '#ff3366' :
                  stateKey === 'processing' ? '#00d4ff' :
                  '#6b7280'
                }}>
                {stateKey === 'idle'       ? '相機初始化中'  :
                 stateKey === 'scanning'   ? '掃描中，請對準 QR Code' :
                 stateKey === 'processing' ? '驗證中...'    :
                 stateKey === 'success'    ? '簽到成功！'   :
                 stateKey === 'already'    ? '已簽到過'     :
                 '錯誤'}
              </span>
            </div>
          </div>

          {/* Result card */}
          {(stateKey === 'success' || stateKey === 'already' || stateKey === 'error') && (
            <div className="w-full max-w-sm terminal-card cyber-chamfer fade-in-up overflow-hidden"
              style={{ borderColor:
                stateKey === 'success' ? 'rgba(255,215,0,.4)' :
                stateKey === 'already' ? 'rgba(255,215,0,.2)' :
                'rgba(255,51,102,.3)'
              }}>
              <div className="h-0.5"
                style={{ background:
                  stateKey === 'success' ? 'linear-gradient(90deg,transparent,#ffd700,transparent)' :
                  stateKey === 'already' ? 'linear-gradient(90deg,transparent,#ffd70060,transparent)' :
                  'linear-gradient(90deg,transparent,#ff3366,transparent)'
                }} />

              {stateKey === 'success' && (
                <div className="p-5 flex items-center gap-4">
                  <div className="text-4xl shrink-0" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,.6)' }}>
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-orbitron font-black tracking-wider mb-1" style={{ color: '#ffd700' }}>
                      簽到成功
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ClubIcon category={scanState.lockedResult} size={14} />
                      <span className="text-xs font-orbitron" style={{ color: CLUB_COLORS[scanState.lockedResult] ?? '#00ff88' }}>
                        {scanState.lockedResult}
                      </span>
                    </div>
                    <p className="text-dim text-xs mt-0.5 truncate">{scanState.department}</p>
                  </div>
                </div>
              )}

              {stateKey === 'already' && (
                <div className="p-5 flex items-center gap-4">
                  <div className="text-4xl shrink-0" style={{ color: '#ffd70080' }}>🔒</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-orbitron text-sm tracking-wider mb-1" style={{ color: '#ffd70080' }}>
                      已簽到過
                    </p>
                    <p className="text-xs font-orbitron text-dim mb-0.5 truncate">{scanState.department}</p>
                    <p className="text-xs" style={{ color: '#4a4a6a' }}>
                      {new Date(scanState.checkedInAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>
              )}

              {stateKey === 'error' && (
                <div className="p-5 flex items-center gap-4">
                  <div className="text-3xl shrink-0" style={{ color: '#ff3366' }}>✕</div>
                  <div>
                    <p className="font-orbitron text-sm tracking-wider text-danger mb-1">錯誤</p>
                    <p className="text-dim text-xs">{(scanState as { status: 'error'; message: string }).message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Records ── */}
        <div className="w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l"
          style={{ borderColor: '#2a2a3a' }}>

          {/* Records header */}
          <button
            onClick={() => setShowRecords(v => !v)}
            className="terminal-header flex items-center gap-2 w-full text-left lg:cursor-default"
          >
            <span className="dot-amber" />
            <span className="ml-1 text-xs font-orbitron uppercase tracking-widest text-dim flex-1">
              簽到紀錄
            </span>
            <span className="font-orbitron text-xs" style={{ color: '#ffd700' }}>{records.length}</span>
            <span className="text-dim text-xs font-orbitron lg:hidden ml-2">
              {showRecords ? '▲' : '▼'}
            </span>
          </button>

          <div className={`flex-1 overflow-y-auto ${showRecords || 'hidden lg:block'}`}>
            {records.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-dim text-xs font-orbitron tracking-widest cyber-cursor">尚無簽到紀錄</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#1a1a2a' }}>
                {records.map((r, idx) => {
                  const col = CLUB_COLORS[r.locked_result] ?? '#00ff88'
                  const isToday = r.checked_in_at.slice(0, 10) === todayStr
                  return (
                    <div key={r.id}
                      className="px-4 py-3 flex items-start gap-3"
                      style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.012)' }}>
                      <ClubIcon category={r.locked_result} size={16} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-orbitron truncate"
                            style={{ color: col }}>{r.locked_result}</span>
                          {isToday && (
                            <span className="text-xs px-1.5 py-px font-orbitron rounded-sm shrink-0"
                              style={{ background: 'rgba(0,255,136,.1)', color: '#00ff88', fontSize: 9 }}>
                              今日
                            </span>
                          )}
                        </div>
                        <p className="text-dim text-xs truncate" style={{ fontSize: 10 }}>
                          {r.department.split(' ')[0] ?? r.department}
                        </p>
                        {r.scanned_by && (
                          <p className="text-xs mt-0.5" style={{ color: '#3a3a5a', fontSize: 9 }}>
                            by {r.scanned_by}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-orbitron" style={{ color: '#3a3a5a', fontSize: 9 }}>
                          {new Date(r.checked_in_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
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
