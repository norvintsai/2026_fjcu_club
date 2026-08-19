'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Submission } from '@/lib/database.types'
import { CLUB_RESULTS } from '@/lib/results'

function ResultContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) { setError('找不到測驗紀錄'); setLoading(false); return }
    supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError('// ERROR: 找不到任務紀錄')
        else setSubmission(data as unknown as Submission)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <main className="min-h-screen cyber-grid flex items-center justify-center">
      <div className="text-center">
        <div className="w-2 h-2 bg-neon rounded-full inline-block neon-pulse mb-4" />
        <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">COMPUTING DESTINATION</p>
      </div>
    </main>
  )

  if (error || !submission) return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-danger text-sm font-orbitron mb-4">{error}</p>
        <Link href="/" className="cyber-btn cyber-chamfer-sm text-xs">RETURN TO BASE</Link>
      </div>
    </main>
  )

  const clubInfo = CLUB_RESULTS[submission.result]
  const scoreEntries = Object.entries(submission.scores).sort(([, a], [, b]) => b - a)
  const total = scoreEntries.reduce((sum, [, s]) => sum + s, 0)

  return (
    <main className="min-h-screen cyber-grid flex flex-col px-4 py-10 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,136,.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,0,255,.04) 0%, transparent 70%)' }} />

      <div className="max-w-lg mx-auto w-full relative z-10 space-y-4">

        {/* ── Nav lock header ── */}
        <div className="terminal-card cyber-chamfer-sm px-5 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-neon neon-pulse shrink-0" />
          <span className="text-neon text-xs font-orbitron tracking-[.2em] uppercase">
            Navigation Lock Confirmed
          </span>
          <span className="ml-auto text-dim text-xs">SYS-OK</span>
        </div>

        {/* ── Result Card ── */}
        <div className="terminal-card cyber-chamfer fade-in-up relative overflow-hidden">
          {/* Decorative top line */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #00ff88, transparent)' }} />

          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              Destination Planet
            </span>
          </div>

          <div className="p-8 text-center">
            {/* Emoji */}
            <div className="text-5xl mb-4">{clubInfo?.emoji ?? '🌌'}</div>

            {/* Label */}
            <p className="text-dim text-xs font-orbitron tracking-[.25em] uppercase mb-3">
              Your Planet
            </p>

            {/* Club Name */}
            <div className="relative inline-block mb-6">
              <h2 className="font-orbitron font-black text-2xl md:text-3xl uppercase tracking-widest text-neon text-neon-glow">
                {submission.result}
              </h2>
            </div>

            {/* Description */}
            <p className="text-sm text-fore leading-relaxed max-w-sm mx-auto mb-8">
              {clubInfo?.description}
            </p>

            {/* Crew info */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-dim font-orbitron">
                {submission.department}
              </span>
              <span className="text-border">|</span>
              <span className="text-xs text-dim font-orbitron">
                ID: {submission.student_id}
              </span>
            </div>
          </div>
        </div>

        {/* ── Signal Analysis ── */}
        <div className="terminal-card cyber-chamfer fade-in-up" style={{ animationDelay: '.15s' }}>
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#00d4ff' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              Signal Analysis
            </span>
          </div>
          <div className="p-6 space-y-4">
            {scoreEntries.map(([category, score], idx) => {
              const pct = total > 0 ? Math.round((score / total) * 100) : 0
              const isTop = category === submission.result
              const clubData = CLUB_RESULTS[category]
              return (
                <div key={category} style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-orbitron tracking-wider ${isTop ? 'text-neon' : 'text-dim'}`}>
                      {clubData?.emoji} {category}
                    </span>
                    <span className={`text-xs font-orbitron ${isTop ? 'text-neon' : 'text-dim'}`}>
                      {String(score).padStart(2, '0')} / {String(total).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border relative overflow-hidden cyber-chamfer-sm">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isTop ? '#00ff88' : '#2a2a4a',
                        boxShadow: isTop ? '0 0 6px #00ff88' : 'none',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Return button ── */}
        <div className="text-center pt-2">
          <Link href="/" className="cyber-btn-ghost cyber-chamfer-sm inline-flex items-center gap-2 text-xs">
            ◀ RETURN TO BASE
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen cyber-grid flex items-center justify-center">
        <p className="text-neon text-xs font-orbitron cyber-cursor">LOADING</p>
      </main>
    }>
      <ResultContent />
    </Suspense>
  )
}
