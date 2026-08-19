'use client'
import { useEffect, useState } from 'react'

const BOOT_LINES = [
  { tag: 'INIT', text: '系統初始化' },
  { tag: 'LOAD', text: '連線社團資料庫' },
  { tag: 'SCAN', text: '載入適性測驗模組' },
  { tag: 'SYS ', text: '所有系統就緒' },
]

export default function SplashScreen() {
  const [show, setShow]         = useState(false)
  const [lineCount, setLineCount] = useState(0)
  const [progress, setProgress]   = useState(0)
  const [exiting, setExiting]     = useState(false)
  const [blinkReady, setBlinkReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('fju_splash')) return
    setShow(true)

    const t: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => { setLineCount(1); setProgress(22) }, 350),
      setTimeout(() => { setLineCount(2); setProgress(50) }, 750),
      setTimeout(() => { setLineCount(3); setProgress(78) }, 1150),
      setTimeout(() => { setLineCount(4); setProgress(100) }, 1550),
      setTimeout(() => setBlinkReady(true), 1800),
      setTimeout(dismiss, 2800),
    ]
    return () => t.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    setExiting(true)
    setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('fju_splash', '1')
    }, 650)
  }

  if (!show) return null

  return (
    <div
      onClick={() => { if (!exiting) dismiss() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a0f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        animation: exiting ? 'splashFadeOut 0.65s ease forwards' : undefined,
        fontFamily: 'var(--font-jb), "JetBrains Mono", monospace',
      }}
    >
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.12) 2px, rgba(0,0,0,.12) 4px)',
      }} />

      {/* Moving scan beam */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, transparent, rgba(0,255,136,.25), transparent)',
        animation: 'scanBeam 2.4s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Main panel */}
      <div style={{
        width: '100%', maxWidth: 520, padding: '0 28px',
        position: 'relative',
      }}>
        {/* Top border */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ flex: 1, height: 1, background: '#2a2a3a' }} />
          <span style={{ color: '#00ff88', fontSize: 9, letterSpacing: '0.3em', fontFamily: 'var(--font-orb), monospace' }}>
            FJU · STELLAR · 2026
          </span>
          <div style={{ flex: 1, height: 1, background: '#2a2a3a' }} />
        </div>

        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            color: '#e0e0e0', fontSize: 28, fontWeight: 900,
            fontFamily: 'var(--font-orb), monospace',
            letterSpacing: '0.08em', lineHeight: 1.1,
            textShadow: '0 0 20px rgba(0,255,136,.3)',
          }}>
            輔仁大學
          </div>
          <div style={{
            color: '#00ff88', fontSize: 13, letterSpacing: '0.2em',
            marginTop: 6,
            textShadow: '0 0 10px rgba(0,255,136,.5)',
          }}>
            社團適性測驗系統
          </div>
        </div>

        {/* Boot lines */}
        <div style={{ marginBottom: 28, minHeight: 108 }}>
          {BOOT_LINES.slice(0, lineCount).map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 10, animation: 'bootLineIn 0.25s ease',
              }}
            >
              <span style={{
                color: '#00d4ff', fontSize: 10,
                fontFamily: 'var(--font-orb), monospace',
                letterSpacing: '0.1em', minWidth: 50,
              }}>
                [{line.tag}]
              </span>
              <div style={{ flex: 1, height: 1, borderBottom: '1px dashed #2a2a3a' }} />
              <span style={{ color: '#6b7280', fontSize: 12 }}>{line.text}</span>
              <span style={{ color: '#00ff88', fontSize: 12, minWidth: 14, textAlign: 'right' }}>
                {i < lineCount ? '✓' : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            background: '#1c1c2e', height: 4, position: 'relative', overflow: 'hidden',
            clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
              boxShadow: '0 0 8px #00ff88',
              transition: 'width 0.45s ease',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 6, fontSize: 10,
            fontFamily: 'var(--font-orb), monospace',
          }}>
            <span style={{ color: '#3a3a4a' }}>BOOT SEQUENCE</span>
            <span style={{ color: progress === 100 ? '#00ff88' : '#6b7280' }}>{progress}%</span>
          </div>
        </div>

        {/* Bottom border + hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#2a2a3a' }} />
          <span style={{ color: '#00ff88', fontSize: 9, letterSpacing: '0.3em', fontFamily: 'var(--font-orb), monospace' }}>
            SYS
          </span>
          <div style={{ flex: 1, height: 1, background: '#2a2a3a' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{
            color: blinkReady ? '#6b7280' : 'transparent',
            fontSize: 10, letterSpacing: '0.2em',
            animation: blinkReady ? 'blinkText 1.2s step-end infinite' : undefined,
          }}>
            點擊畫面繼續
          </span>
        </div>
      </div>
    </div>
  )
}
