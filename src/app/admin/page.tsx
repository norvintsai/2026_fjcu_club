'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        setError('// ACCESS DENIED: 密碼錯誤')
      }
    } catch {
      setError('// CONNECTION FAILED: 請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4 relative overflow-hidden">
      {/* Danger glow */}
      <div className="absolute top-0 left-0 w-full h-1"
        style={{ background: 'linear-gradient(90deg, transparent, #ff3366, transparent)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,51,102,.04) 0%, transparent 60%)' }} />

      <div className="w-full max-w-sm relative z-10 fade-in-up">
        <div className="terminal-card cyber-chamfer relative">
          {/* Danger header line */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #ff3366, transparent)' }} />

          {/* Header bar */}
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ff3366', opacity: .5 }} />
            <span className="terminal-dot" style={{ background: '#ff3366', opacity: .25 }} />
            <span className="ml-3 text-danger text-xs tracking-widest font-orbitron uppercase">
              Restricted Access
            </span>
          </div>

          <div className="p-8">
            {/* Icon + title */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">⚠</div>
              <h1 className="font-orbitron font-black text-xl uppercase tracking-widest text-fore mb-2">
                Command Center
              </h1>
              <p className="text-dim text-xs tracking-[.15em] font-orbitron cyber-cursor">
                ENTER AUTHORIZATION CODE
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                  &gt; Auth Code
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-danger text-sm select-none">
                    &gt;
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    className="cyber-input cyber-chamfer-sm pl-8"
                    style={{ color: '#ff3366' }}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 cyber-chamfer-sm font-orbitron text-xs font-bold tracking-[.15em] uppercase transition-all"
                style={{
                  background: 'transparent',
                  border: '2px solid #ff3366',
                  color: '#ff3366',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? .6 : 1,
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#ff3366'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#0a0a0f'
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 10px #ff3366'
                  }
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#ff3366'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                }}
              >
                {loading ? (
                  <span className="cyber-cursor">AUTHENTICATING</span>
                ) : (
                  '▶ AUTHENTICATE'
                )}
              </button>
            </form>

            <p className="text-center text-dim text-xs mt-6 font-orbitron tracking-wider">
              FJU COMMAND CENTER // 2026
            </p>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-danger" />
        <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-danger" />
        <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-danger" />
        <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-danger" />
      </div>
    </main>
  )
}
