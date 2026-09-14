'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import ClubIcon from './ClubIcon'

interface Props {
  submissionId: string
  currentResult: string
}

interface CheckinInfo {
  token: string
  isCheckedIn: boolean
  lockedResult: string | null
  checkedInAt: string | null
}

export default function CheckinQR({ submissionId, currentResult }: Props) {
  const [info, setInfo]         = useState<CheckinInfo | null>(null)
  const [qrUrl, setQrUrl]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/checkin/token?submissionId=${submissionId}`)
      .then(r => r.json())
      .then(async (data: CheckinInfo) => {
        setInfo(data)
        const url = `${window.location.origin}/checkin?id=${submissionId}&t=${data.token}`
        const isLocked = data.isCheckedIn
        const dataUrl = await QRCode.toDataURL(url, {
          width: 240,
          margin: 2,
          color: {
            dark: isLocked ? '#ffd700' : '#00ff88',
            light: '#0d0d18',
          },
        })
        setQrUrl(dataUrl)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [submissionId])

  const isCheckedIn   = info?.isCheckedIn ?? false
  const lockedResult  = info?.lockedResult
  const displayResult = isCheckedIn ? (lockedResult ?? currentResult) : currentResult
  const checkedInAt   = info?.checkedInAt

  return (
    <div className="terminal-card cyber-chamfer fade-in-up" style={{ animationDelay: '.25s' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full terminal-header flex items-center gap-2 text-left"
        style={{ cursor: 'pointer' }}
      >
        <span className="terminal-dot" style={{ background: isCheckedIn ? '#ffd700' : '#ff3366' }} />
        <span className="terminal-dot" style={{ background: isCheckedIn ? '#ffd700' : '#ffd700' }} />
        <span className="terminal-dot" style={{ background: isCheckedIn ? '#ffd700' : '#00ff88' }} />
        <span className="ml-2 text-xs font-orbitron uppercase tracking-widest flex-1"
          style={{ color: isCheckedIn ? '#ffd700' : '#6b7280' }}>
          {isCheckedIn ? '簽到完成 · 結果已鎖定' : 'QR 簽到碼'}
        </span>
        {isCheckedIn && (
          <span className="text-xs font-orbitron tracking-wider px-2 py-0.5 rounded-sm"
            style={{ background: 'rgba(255,215,0,.1)', border: '1px solid rgba(255,215,0,.3)', color: '#ffd700' }}>
            ✓ 已簽到
          </span>
        )}
        {!isCheckedIn && !loading && (
          <span className="text-xs font-orbitron" style={{ color: '#ff3366' }}>
            ◉ 未簽到
          </span>
        )}
        <span className="text-dim text-xs font-orbitron ml-2">{expanded ? '▲ 收合' : '▼ 展開'}</span>
      </button>

      {expanded && (
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-2 h-2 bg-neon rounded-full neon-pulse" />
              <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">生成 QR Code 中</p>
            </div>
          ) : (
            <>
              {/* Description */}
              <p className="text-dim text-xs font-orbitron tracking-wider mb-5 text-center" style={{ letterSpacing: '0.15em' }}>
                {isCheckedIn
                  ? '你的簽到已完成 ── 結果屬性已鎖定，無法再次簽到'
                  : '活動期間，向工作人員出示此 QR Code 掃描簽到，可領取結果貼紙'}
              </p>

              {/* QR Code wrapper */}
              <div className="flex justify-center mb-5">
                <div className="relative qr-frame-wrapper">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-3 rounded-sm pointer-events-none"
                    style={{
                      background: isCheckedIn
                        ? 'radial-gradient(ellipse, rgba(255,215,0,.12) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse, rgba(0,255,136,.12) 0%, transparent 70%)',
                    }} />

                  {/* Corner brackets */}
                  {(['tl','tr','bl','br'] as const).map(pos => (
                    <div key={pos} className="absolute w-6 h-6 pointer-events-none qr-corner"
                      style={{
                        ...(pos === 'tl' ? { top: -2, left: -2, borderTop: '2px solid', borderLeft: '2px solid' } :
                           pos === 'tr' ? { top: -2, right: -2, borderTop: '2px solid', borderRight: '2px solid' } :
                           pos === 'bl' ? { bottom: -2, left: -2, borderBottom: '2px solid', borderLeft: '2px solid' } :
                                          { bottom: -2, right: -2, borderBottom: '2px solid', borderRight: '2px solid' }),
                        borderColor: isCheckedIn ? '#ffd700' : '#00ff88',
                        filter: isCheckedIn ? 'drop-shadow(0 0 4px #ffd700)' : 'drop-shadow(0 0 4px #00ff88)',
                      }}
                    />
                  ))}

                  {/* QR image container */}
                  <div className="relative overflow-hidden" style={{ width: 240, height: 240 }}>
                    {qrUrl && (
                      <img
                        src={qrUrl}
                        alt="Check-in QR Code"
                        className="block"
                        style={{ width: 240, height: 240, imageRendering: 'pixelated' }}
                        draggable={false}
                      />
                    )}

                    {/* Scan beam */}
                    {!isCheckedIn && (
                      <div className="absolute left-0 right-0 pointer-events-none qr-scan-beam"
                        style={{ height: 3 }} />
                    )}

                    {/* Checked-in overlay */}
                    {isCheckedIn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: 'rgba(10,10,15,0.72)', backdropFilter: 'blur(1px)' }}>
                        <div className="text-5xl mb-2" style={{
                          color: '#ffd700',
                          textShadow: '0 0 20px #ffd700, 0 0 40px rgba(255,215,0,.5)',
                          filter: 'drop-shadow(0 0 8px #ffd700)',
                        }}>✓</div>
                        <p className="font-orbitron font-black tracking-widest"
                          style={{ color: '#ffd700', fontSize: 11 }}>已完成簽到</p>
                      </div>
                    )}
                  </div>

                  {/* Bottom glow line */}
                  <div className="mt-1 h-px"
                    style={{
                      background: isCheckedIn
                        ? 'linear-gradient(90deg, transparent, #ffd700, transparent)'
                        : 'linear-gradient(90deg, transparent, #00ff88, transparent)',
                    }} />
                </div>
              </div>

              {/* Result & Status */}
              <div className="border cyber-chamfer-sm p-4 space-y-3"
                style={{
                  borderColor: isCheckedIn ? 'rgba(255,215,0,.25)' : 'rgba(0,255,136,.2)',
                  background:  isCheckedIn ? 'rgba(255,215,0,.03)' : 'rgba(0,255,136,.03)',
                }}>
                <div className="flex items-center gap-3">
                  <ClubIcon category={displayResult} size={20} />
                  <div>
                    <p className="text-dim text-xs font-orbitron tracking-widest mb-0.5">星球屬性</p>
                    <p className="font-orbitron font-black text-sm tracking-wider"
                      style={{ color: isCheckedIn ? '#ffd700' : '#00ff88' }}>
                      {displayResult}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className={isCheckedIn ? 'dot-amber' : 'dot-red'} />
                    <span className="text-xs font-orbitron tracking-wider"
                      style={{ color: isCheckedIn ? '#ffd700' : '#ff3366' }}>
                      {isCheckedIn ? '已鎖定' : '待簽到'}
                    </span>
                  </div>
                </div>

                {isCheckedIn && checkedInAt && (
                  <div className="flex items-center gap-2 pt-2 border-t"
                    style={{ borderColor: 'rgba(255,215,0,.15)' }}>
                    <span className="text-dim text-xs font-orbitron">簽到時間</span>
                    <span className="text-xs font-orbitron ml-auto"
                      style={{ color: '#ffd700' }}>
                      {new Date(checkedInAt).toLocaleString('zh-TW')}
                    </span>
                  </div>
                )}

                {isCheckedIn && lockedResult && lockedResult !== currentResult && (
                  <div className="flex items-center gap-2 pt-2 border-t text-xs font-orbitron"
                    style={{ borderColor: 'rgba(255,215,0,.15)', color: '#ffd700' }}>
                    <span>⚠</span>
                    <span>簽到結果已鎖定為：{lockedResult}（與本次測驗不同）</span>
                  </div>
                )}
              </div>

              {!isCheckedIn && (
                <p className="text-center text-xs font-orbitron tracking-wider mt-4"
                  style={{ color: '#3a3a5a' }}>
                  一經工作人員掃描確認，結果即鎖定不可更改
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
