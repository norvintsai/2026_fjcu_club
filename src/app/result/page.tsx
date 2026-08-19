'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Submission } from '@/lib/database.types'
import { CLUB_RESULTS } from '@/lib/results'

function ResultContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const nickname = searchParams.get('nickname') ?? ''
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) { setError('找不到測驗紀錄'); setLoading(false); return }
    fetch(`/api/result?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError('// ERROR: 找不到任務紀錄')
        else setSubmission(data as Submission)
        setLoading(false)
      })
      .catch(() => { setError('// ERROR: 找不到任務紀錄'); setLoading(false) })
  }, [id])

  if (loading) return (
    <main className="min-h-screen cyber-grid flex items-center justify-center">
      <div className="text-center">
        <div className="w-2 h-2 bg-neon rounded-full inline-block neon-pulse mb-4" />
        <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">計算適性結果中</p>
      </div>
    </main>
  )

  if (error || !submission) return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-danger text-sm font-orbitron mb-4">{error}</p>
        <Link href="/" className="cyber-btn cyber-chamfer-sm text-xs">返回首頁</Link>
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

        {/* ── 確認 header ── */}
        <div className="terminal-card cyber-chamfer-sm px-5 py-3 flex items-center gap-3">
          <span className="dot-green neon-pulse shrink-0" />
          <span className="text-neon text-xs font-orbitron tracking-[.2em]">
            目標星球確認
          </span>
          <span className="ml-auto text-dim text-xs">SYS-OK</span>
        </div>

        {/* ── 結果卡片 ── */}
        <div className="terminal-card cyber-chamfer fade-in-up relative overflow-hidden panel-scan">
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #00ff88, transparent)' }} />

          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              目標星球
            </span>
          </div>

          <div className="p-8 text-center relative z-10">
            <div className="text-5xl mb-4">{clubInfo?.emoji ?? '🌌'}</div>

            <p className="text-dim text-xs font-orbitron tracking-[.25em] uppercase mb-3">
              你的星球
            </p>

            <div className="relative inline-block mb-6">
              <h2 className="font-orbitron font-black text-2xl md:text-3xl tracking-widest text-neon text-neon-glow">
                {submission.result}
              </h2>
            </div>

            <p className="text-sm text-fore leading-relaxed max-w-sm mx-auto mb-8">
              {clubInfo?.description}
            </p>

            {/* 艦員資訊 */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {nickname && (
                <>
                  <span className="text-xs text-neon font-orbitron">{nickname}</span>
                  <span className="text-border">│</span>
                </>
              )}
              <span className="text-xs text-dim font-orbitron">
                {submission.department}
              </span>
            </div>
          </div>
        </div>

        {/* ── 適性分析 ── */}
        <div className="terminal-card cyber-chamfer fade-in-up" style={{ animationDelay: '.15s' }}>
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#00d4ff' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              適性分析
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
                      {score} / {total} 分
                    </span>
                  </div>
                  <div className="gauge-track">
                    <div
                      className="h-full transition-all duration-700 absolute inset-y-0 left-0"
                      style={{
                        width: `${pct}%`,
                        background: isTop ? 'linear-gradient(90deg, #00ff88, #00d4ff)' : '#2a2a4a',
                        boxShadow: isTop ? '0 0 6px #00ff88' : 'none',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 返回按鈕 ── */}
        <div className="text-center pt-2">
          <Link href="/" className="cyber-btn-ghost cyber-chamfer-sm inline-flex items-center gap-2 text-xs">
            ◀ 返回首頁
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
        <p className="text-neon text-xs font-orbitron cyber-cursor">載入中</p>
      </main>
    }>
      <ResultContent />
    </Suspense>
  )
}
