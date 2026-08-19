'use client'
import { useEffect, useState } from 'react'

const PHASES = [
  '分析您的星系屬性中',
  '比對社團類型資料庫',
  '鎖定目標星球',
  '即將抵達目的地',
]

// Hexagon helper
function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

interface Props { visible: boolean }

export default function SubmitAnimation({ visible }: Props) {
  const [phase, setPhase]       = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!visible) { setPhase(0); setProgress(0); return }

    const iv = setInterval(() => {
      setProgress(p => Math.min(p + 1.2, 100))
    }, 60)

    const phaseTimers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 2400),
      setTimeout(() => setPhase(3), 3400),
    ]

    return () => {
      clearInterval(iv)
      phaseTimers.forEach(clearTimeout)
    }
  }, [visible])

  if (!visible) return null

  const cx = 100, cy = 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(10,10,15,.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-jb), monospace',
    }}>
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.1) 2px, rgba(0,0,0,.1) 4px)',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,136,.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Title */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          color: '#00ff88', fontSize: 10, letterSpacing: '0.3em',
          fontFamily: 'var(--font-orb), monospace', marginBottom: 8,
          textShadow: '0 0 10px #00ff88',
        }}>
          FJU STELLAR · 適性分析系統
        </div>
      </div>

      {/* Radar SVG */}
      <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 32 }}>
        <svg viewBox="0 0 200 200" width="220" height="220">
          {/* Grid rings */}
          {[72, 52, 34, 18].map((r, i) => (
            <polygon
              key={r}
              points={hexPoints(cx, cy, r)}
              fill="none"
              stroke={`rgba(0,255,136,${0.08 + i * 0.04})`}
              strokeWidth="1"
            />
          ))}
          {/* Axis lines */}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            return (
              <line key={i}
                x1={cx} y1={cy}
                x2={cx + 72 * Math.cos(angle)}
                y2={cy + 72 * Math.sin(angle)}
                stroke="rgba(0,255,136,0.1)"
                strokeWidth="1"
              />
            )
          })}
          {/* Rotating sweep sector */}
          <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'radarSweep 2s linear infinite' }}>
            <path
              d={`M${cx},${cy} L${cx + 72},${cy} A72,72 0 0,1 ${cx + 72 * Math.cos(Math.PI / 3 - Math.PI / 6)},${cy + 72 * Math.sin(Math.PI / 3 - Math.PI / 6)} Z`}
              fill="rgba(0,255,136,0.07)"
            />
            <line x1={cx} y1={cy} x2={cx + 72} y2={cy}
              stroke="rgba(0,255,136,0.5)" strokeWidth="1.5"
              style={{ filter: 'drop-shadow(0 0 3px #00ff88)' }}
            />
          </g>
          {/* Outer ring */}
          <polygon
            points={hexPoints(cx, cy, 72)}
            fill="none"
            stroke="rgba(0,255,136,0.25)"
            strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,136,0.4))' }}
          />
          {/* Blinking data points */}
          {[0, 1, 2, 3, 4, 5].map(i => {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            const r = [55, 40, 60, 35, 50, 45][i]
            return (
              <circle key={i}
                cx={cx + r * Math.cos(angle)}
                cy={cy + r * Math.sin(angle)}
                r="2.5"
                fill="#00ff88"
                style={{
                  animation: `blink ${0.8 + i * 0.15}s step-end infinite`,
                  filter: 'drop-shadow(0 0 3px #00ff88)',
                }}
              />
            )
          })}
          {/* Center dot */}
          <circle cx={cx} cy={cy} r="3" fill="#00ff88"
            style={{ filter: 'drop-shadow(0 0 6px #00ff88)', animation: 'pulse-neon 1.5s ease-in-out infinite' }} />
        </svg>

        {/* Rotating outer ring div */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '1px dashed rgba(0,255,136,.15)',
          borderRadius: '50%',
          animation: 'spin 8s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8,
          border: '1px solid rgba(0,212,255,.1)',
          borderRadius: '50%',
          animation: 'spinReverse 5s linear infinite',
        }} />
      </div>

      {/* Phase text */}
      <div style={{ textAlign: 'center', marginBottom: 24, minHeight: 40 }}>
        <p style={{
          color: '#00ff88', fontSize: 13, letterSpacing: '0.15em',
          fontFamily: 'var(--font-orb), monospace',
          textShadow: '0 0 10px rgba(0,255,136,.5)',
          animation: 'fadeInUp 0.4s ease',
          key: phase,
        } as React.CSSProperties}>
          {PHASES[phase]}
          <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
        </p>
      </div>

      {/* Progress */}
      <div style={{ width: 280 }}>
        <div style={{
          background: '#1c1c2e', height: 4, overflow: 'hidden',
          clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
            boxShadow: '0 0 8px #00ff88',
            transition: 'width 0.1s linear',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 6,
          fontSize: 10, fontFamily: 'var(--font-orb), monospace',
          color: '#3a3a5a',
        }}>
          <span>APTITUDE ANALYSIS</span>
          <span style={{ color: '#00ff88' }}>{Math.round(progress)}%</span>
        </div>
      </div>

      <style>{`
        @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin        { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes fadeInUp    { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}
