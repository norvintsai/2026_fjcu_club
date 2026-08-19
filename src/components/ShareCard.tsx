'use client'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { ClubResult } from '@/lib/results'

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
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `fju-club-${result.title}.png`
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
            background: '#0a0a0f',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: '"JetBrains Mono", monospace',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Cyber grid bg */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(0,255,136,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,.04) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }} />
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.08) 2px, rgba(0,0,0,.08) 4px)',
          }} />
          {/* Top glow */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 300, height: 180,
            background: 'radial-gradient(ellipse, rgba(0,255,136,.10) 0%, transparent 70%)',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '0 32px', textAlign: 'center' }}>
            {/* Header */}
            <div style={{
              fontSize: 9, letterSpacing: '0.3em', color: '#00ff88', marginBottom: 6,
              fontFamily: '"Orbitron", monospace',
            }}>
              FJU STELLAR · 2026 · 社團適性測驗
            </div>
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, #00ff88, transparent)',
              marginBottom: 28,
            }} />

            {/* Emoji */}
            <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>{result.emoji}</div>

            {/* Category */}
            <div style={{
              fontSize: 10, letterSpacing: '0.2em', color: '#6b7280',
              fontFamily: '"Orbitron", monospace', marginBottom: 8,
            }}>
              我的星球
            </div>
            <div style={{
              fontSize: 22, fontWeight: 900, color: '#00ff88', letterSpacing: '0.05em',
              fontFamily: '"Orbitron", monospace', marginBottom: 24,
              textShadow: '0 0 20px rgba(0,255,136,.6)',
            }}>
              {result.title}
            </div>

            {/* Divider */}
            <div style={{
              height: 1, background: '#2a2a3a', marginBottom: 20,
            }} />

            {/* Nickname + dept */}
            <div style={{ marginBottom: 24 }}>
              {nickname && (
                <div style={{
                  fontSize: 16, color: '#e0e0e0', marginBottom: 6,
                  fontFamily: '"Orbitron", monospace', letterSpacing: '0.1em',
                }}>
                  {nickname}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.05em' }}>
                {department}
              </div>
            </div>

            {/* Description (2 lines) */}
            <div style={{
              fontSize: 11, color: '#9a9aaa', lineHeight: 1.7,
              display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              marginBottom: 28,
            }}>
              {result.description}
            </div>

            {/* Bottom */}
            <div style={{ height: 1, background: '#2a2a3a', marginBottom: 16 }} />
            <div style={{
              fontSize: 11, color: '#00ff88', letterSpacing: '0.1em',
              fontFamily: '"Orbitron", monospace',
            }}>
              @fjcu_club
            </div>
            <div style={{ fontSize: 10, color: '#3a3a5a', marginTop: 6, letterSpacing: '0.05em' }}>
              #輔仁社博 #社團適性測驗 #FJCUCLUB
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
