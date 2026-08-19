'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Question } from '@/lib/database.types'

function TestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId') ?? ''
  const department = searchParams.get('department') ?? ''

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId || !department) { router.replace('/'); return }
    supabase
      .from('questions')
      .select('*')
      .order('order_num')
      .then(({ data, error }) => {
        if (error || !data) setError('// ERROR: 無法載入任務資料')
        else setQuestions(data as unknown as Question[])
        setLoading(false)
      })
  }, [studentId, department, router])

  function selectOption(label: string) {
    setAnswers(prev => ({ ...prev, [String(questions[current].id)]: label }))
    setError('')
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError('// ERROR: 請完成所有題目')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, department, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/result?id=${data.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '// ERROR: 提交失敗')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <main className="min-h-screen cyber-grid flex items-center justify-center">
      <div className="text-center">
        <div className="w-2 h-2 bg-neon rounded-full inline-block neon-pulse mb-4" />
        <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">LOADING MISSION DATA</p>
      </div>
    </main>
  )

  if (questions.length === 0) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-danger text-sm font-orbitron">{error || '// NO MISSION DATA FOUND'}</p>
    </main>
  )

  const q = questions[current]
  const selectedLabel = answers[String(q.id)]
  const progress = Math.round(((current + 1) / questions.length) * 100)
  const isLast = current === questions.length - 1
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <main className="min-h-screen cyber-grid flex flex-col px-4 py-8 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,.04) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,0,255,.03) 0%, transparent 70%)' }} />

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 relative z-10">

        {/* ── Top HUD bar ── */}
        <div className="terminal-card cyber-chamfer-sm px-5 py-3 flex items-center gap-4">
          <span className="text-dim text-xs font-orbitron tracking-widest uppercase hidden sm:block">
            Assessment
          </span>
          <div className="flex-1">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-border relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-neon transition-all duration-500"
                  style={{ width: `${progress}%`, boxShadow: '0 0 6px #00ff88' }}
                />
              </div>
              <span className="text-neon text-xs font-orbitron tracking-wider whitespace-nowrap">
                {progress}%
              </span>
            </div>
          </div>
          <div className="text-xs font-orbitron text-dim tracking-wider whitespace-nowrap">
            <span className="text-fore">{String(current + 1).padStart(2, '0')}</span>
            <span className="mx-1">/</span>
            <span>{String(questions.length).padStart(2, '0')}</span>
          </div>
        </div>

        {/* ── Question Card ── */}
        <div className="terminal-card cyber-chamfer fade-in-up" key={current}>
          {/* Header */}
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              Mission Brief // Q-{String(current + 1).padStart(2, '0')}
            </span>
          </div>

          <div className="p-6 md:p-8">
            {/* Question */}
            <p className="text-fore text-base md:text-lg leading-relaxed mb-8">
              <span className="text-cyan text-xs font-orbitron mr-2 opacity-60">
                [{String(current + 1).padStart(2, '0')}]
              </span>
              {q.content}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((option, idx) => {
                const isSelected = selectedLabel === option.label
                return (
                  <button
                    key={option.label}
                    onClick={() => selectOption(option.label)}
                    className="w-full text-left flex items-start gap-4 px-5 py-4 cyber-chamfer-sm border transition-all duration-150 group"
                    style={{
                      background: isSelected ? 'rgba(0,255,136,.08)' : '#0a0a0f',
                      borderColor: isSelected ? '#00ff88' : '#2a2a3a',
                      boxShadow: isSelected ? '0 0 8px #00ff8840' : 'none',
                      animationDelay: `${idx * 60}ms`,
                    }}
                  >
                    <span
                      className="shrink-0 w-7 h-7 flex items-center justify-center text-xs font-orbitron font-bold border cyber-chamfer-sm mt-0.5"
                      style={{
                        color: isSelected ? '#0a0a0f' : '#00ff88',
                        borderColor: isSelected ? '#00ff88' : '#2a2a3a',
                        background: isSelected ? '#00ff88' : 'transparent',
                      }}
                    >
                      {option.label}
                    </span>
                    <span
                      className="text-sm leading-relaxed flex-1"
                      style={{ color: isSelected ? '#e0e0e0' : '#9a9aaa' }}
                    >
                      {option.text}
                    </span>
                    {isSelected && (
                      <span className="shrink-0 text-neon text-xs font-orbitron self-center">▶</span>
                    )}
                  </button>
                )
              })}
            </div>

            {error && (
              <p className="text-danger text-xs font-orbitron tracking-wider mt-4">{error}</p>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrent(c => c - 1)}
            disabled={current === 0}
            className="cyber-btn-ghost cyber-chamfer-sm flex-1 justify-center"
          >
            ◀ PREV
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="cyber-btn cyber-chamfer-sm flex-1 justify-center"
            >
              {submitting ? (
                <span className="cyber-cursor">TRANSMITTING</span>
              ) : (
                <><span>▶▶</span> SUBMIT MISSION</>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrent(c => c + 1)}
              disabled={!selectedLabel}
              className="cyber-btn cyber-chamfer-sm flex-1 justify-center"
            >
              NEXT ▶
            </button>
          )}
        </div>

        {/* Answered count */}
        <p className="text-center text-dim text-xs font-orbitron tracking-wider">
          LOGGED: {Object.keys(answers).length} / {questions.length} RESPONSES
        </p>
      </div>
    </main>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center cyber-grid">
        <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">INITIALIZING</p>
      </main>
    }>
      <TestContent />
    </Suspense>
  )
}
