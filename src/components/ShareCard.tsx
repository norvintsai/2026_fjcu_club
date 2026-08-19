'use client'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { ClubResult } from '@/lib/results'
import ClubIcon from '@/components/ClubIcon'

interface Props {
  result: ClubResult
  nickname: string
  department: string
}

export default function ShareCard({ result, nickname, department }: Props) {
  const cardRef   = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  async function download() {
    if (!cardRef.current || busy) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      const blob = await fetch(dataUrl).then(r => r.blob())
      const file = new File([blob], `fju-club-${result.title}.png`, { type: 'image/png' })

      // Mobile: use native share sheet (iOS/Android) — allows "Save to Photos"
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'FJU STELLAR 社團適性測驗結果' })
        return
      }

      // Desktop fallback: direct download
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = file.name
      a.click()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* Trigger button */}
      <button
        onClick={download}
        disabled={busy}
        className="cyber-btn cyber-chamfer-sm w-full justify-center text-sm"
        style={{ borderColor: '#ff00ff', color: '#ff00ff' }}
      >
        {busy
          ? <span className="cyber-cursor">生成中</span>
          : <><span>📸</span> 一鍵儲存分享圖</>
        }
      </button>

      {/* Hidden card — captured as PNG */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div
          ref={cardRef}
          style={{
            width: 360, height: 640,
            background: '#080810',
            display: 'flex', flexDirection: 'column',
            fontFamily: '"JetBrains Mono", monospace',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(0,255,136,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          {/* Center planet glow */}
          <div style={{
            position: 'absolute', top: '38%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 340, height: 340,
            background: 'radial-gradient(circle, rgba(0,255,136,.14) 0%, rgba(0,212,255,.07) 45%, transparent 70%)',
            borderRadius: '50%',
          }} />
          {/* Bottom accent glow */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: 260, height: 140,
            background: 'radial-gradient(ellipse, rgba(255,0,255,.07) 0%, transparent 70%)',
          }} />
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.06) 3px, rgba(0,0,0,.06) 4px)',
          }} />
          {/* Side accent lines */}
          <div style={{ position: 'absolute', left: 36, top: 100, bottom: 100, width: 1, background: 'linear-gradient(180deg, transparent, rgba(0,255,136,.3), transparent)' }} />
          <div style={{ position: 'absolute', right: 36, top: 100, bottom: 100, width: 1, background: 'linear-gradient(180deg, transparent, rgba(0,255,136,.3), transparent)' }} />

          {/* Corner brackets */}
          <div style={{ position: 'absolute', top: 14, left: 14, width: 18, height: 18, borderTop: '2px solid #00ff88', borderLeft: '2px solid #00ff88' }} />
          <div style={{ position: 'absolute', top: 14, right: 14, width: 18, height: 18, borderTop: '2px solid #00ff88', borderRight: '2px solid #00ff88' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 14, width: 18, height: 18, borderBottom: '2px solid #00ff88', borderLeft: '2px solid #00ff88' }} />
          <div style={{ position: 'absolute', bottom: 14, right: 14, width: 18, height: 18, borderBottom: '2px solid #00ff88', borderRight: '2px solid #00ff88' }} />

          {/* === HEADER BAR === */}
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff3366' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffd700' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff88' }} />
              </div>
              <div style={{ fontSize: 8, color: '#00ff88', letterSpacing: '0.25em', fontFamily: '"Orbitron", monospace' }}>
                FJU-STELLAR-v2026
              </div>
              <div style={{ fontSize: 8, color: '#3a3a5a', letterSpacing: '0.08em' }}>SYS-OK</div>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00ff8870, transparent)' }} />
          </div>

          {/* === MAIN CONTENT === */}
          <div style={{
            position: 'relative', zIndex: 1,
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '0 44px',
          }}>
            <div style={{ fontSize: 8, letterSpacing: '0.28em', color: '#4a4a6a', fontFamily: '"Orbitron", monospace', marginBottom: 18 }}>
              ▸ 星際任務報告
            </div>

            {/* Club icon with orbital rings */}
            <div style={{ position: 'relative', marginBottom: 22, width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '1px solid rgba(0,255,136,.28)',
                boxShadow: '0 0 24px rgba(0,255,136,.12), inset 0 0 24px rgba(0,255,136,.06)',
              }} />
              <div style={{
                position: 'absolute', width: 96, height: 96, borderRadius: '50%',
                border: '1px solid rgba(0,212,255,.18)',
              }} />
              <div style={{
                position: 'absolute', width: 66, height: 66, borderRadius: '50%',
                border: '1px dashed rgba(0,255,136,.10)',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <ClubIcon category={result.title} size={62} />
              </div>
            </div>

            <div style={{ fontSize: 9, color: '#4a4a6a', letterSpacing: '0.22em', fontFamily: '"Orbitron", monospace', marginBottom: 8 }}>
              我的星球 DESTINATION
            </div>
            <div style={{
              fontSize: 24, fontWeight: 900, color: '#00ff88',
              fontFamily: '"Orbitron", monospace', letterSpacing: '0.04em',
              textAlign: 'center', lineHeight: 1.2,
              textShadow: '0 0 28px rgba(0,255,136,.7), 0 0 56px rgba(0,255,136,.3)',
              marginBottom: 22,
            }}>
              {result.title}
            </div>

            {/* Data row */}
            <div style={{
              width: '100%', display: 'flex', alignItems: 'stretch', gap: 0,
              border: '1px solid #1e1e32', marginBottom: 18,
              background: 'rgba(0,255,136,.02)',
            }}>
              <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, color: '#3a3a5a', letterSpacing: '0.12em', marginBottom: 4, fontFamily: '"Orbitron", monospace' }}>艦員代號</div>
                <div style={{ fontSize: 13, color: '#e0e0e0', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nickname || '─'}
                </div>
              </div>
              <div style={{ width: 1, background: '#1e1e32' }} />
              <div style={{ flex: 2, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, color: '#3a3a5a', letterSpacing: '0.12em', marginBottom: 4, fontFamily: '"Orbitron", monospace' }}>所屬部門</div>
                <div style={{ fontSize: 10, color: '#9a9aaa', lineHeight: 1.4 }}>{department}</div>
              </div>
            </div>

            {/* Description */}
            <div style={{
              fontSize: 11, color: '#6a6a8a', lineHeight: 1.8, textAlign: 'center',
              display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {result.description}
            </div>
          </div>

          {/* === FOOTER === */}
          <div style={{ position: 'relative', zIndex: 1, padding: '0 28px 22px' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00ff8850, transparent)', marginBottom: 12 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 9, color: '#3a3a5a', letterSpacing: '0.06em' }}>#輔仁社博 #FJCUCLUB</div>
              <div style={{ fontSize: 9, color: '#00ff88', letterSpacing: '0.14em', fontFamily: '"Orbitron", monospace' }}>@fjcu_club</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
