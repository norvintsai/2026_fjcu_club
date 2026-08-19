'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Question } from '@/lib/database.types'
import SubmitAnimation from '@/components/SubmitAnimation'

function TestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId') ?? ''
  const department = searchParams.get('department') ?? ''
  const nickname = searchParams.get('nickname') ?? ''

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAnim, setShowAnim]     = useState(false)
  const [error, setError]           = useState('')

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
    setShowAnim(true)
    try {
      const [res] = await Promise.all([
        fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, department, answers }),
        }),
        new Promise(r => setTimeout(r, 4000)),
      ])
      const data = await (res as Response).json()
      if (!(res as Response).ok) throw new Error(data.error)
      const resultParams = new URLSearchParams({ id: data.id })
      if (nickname) resultParams.set('nickname', nickname)
      router.push(`/result?${resultParams.toString()}`)
    } catch (e: unknown) {
      setShowAnim(false)
      setError(e instanceof Error ? e.message : '// ERROR: 提交失敗')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <main className="min-h-screen cyber-grid flex items-center justify-center">
      <div className="text-center">
        <div className="w-2 h-2 bg-neon rounded-full inline-block neon-pulse mb-4" />
        <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">載入測驗資料中</p>
      </div>
    </main>
  )

  if (questions.length === 0) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-danger text-sm font-orbitron">{error || '// 找不到測驗題目，請聯絡工作人員'}</p>
    </main>
  )

  const q = questions[current]
  const selectedLabel = answers[String(q.id)]
  const progress = Math.round(((current + 1) / questions.length) * 100)
  const isLast = current === questions.length - 1
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <>
    <SubmitAnimation visible={showAnim} />
    <main className="min-h-screen cyber-grid flex flex-col px-4 py-8 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,.04) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,0,255,.03) 0%, transparent 70%)' }} />

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 relative z-10">

        {/* ── 艦員 HUD ── */}
        <div className="terminal-card cyber-chamfer-sm">
          <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
            {/* Callsign */}
            {nickname && (
              <div className="flex items-center gap-2">
                <span className="dot-green neon-pulse" />
                <span className="text-neon text-xs font-orbitron tracking-wider">{nickname}</span>
              </div>
            )}
            {nickname && <span className="text-border text-xs">│</span>}
            <span className="text-dim text-xs truncate max-w-[160px] sm:max-w-none">{department.split(' ').slice(0, 2).join(' ')}</span>
            <div className="flex-1" />
            {/* Progress */}
            <div className="flex items-center gap-3 min-w-[140px]">
              <div className="flex-1 gauge-track">
                <div className="gauge-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-neon text-xs font-orbitron whitespace-nowrap">{progress}%</span>
            </div>
            <span className="text-xs font-orbitron text-dim whitespace-nowrap">
              <span className="text-fore">{String(current + 1).padStart(2, '0')}</span>
              <span className="mx-1 text-border">/</span>
              <span>{String(questions.length).padStart(2, '0')}</span>
              <span className="ml-1 text-dim">題</span>
            </span>
          </div>
        </div>

        {/* ── 題目卡片 ── */}
        <div className="terminal-card cyber-chamfer fade-in-up panel-scan" key={current}>
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              任務說明 ── 第 {String(current + 1).padStart(2, '0')} 題
            </span>
            <span className="ml-auto text-xs font-orbitron" style={{ color: '#3a3a5a' }}>
              {Object.keys(answers).length}/{questions.length} 已作答
            </span>
          </div>

          <div className="p-6 md:p-8 relative z-10">
            {/* 題目 */}
            <p className="text-fore text-base md:text-lg leading-relaxed mb-8">
              <span className="text-cyan text-xs font-orbitron mr-2 opacity-60">
                [{String(current + 1).padStart(2, '0')}]
              </span>
              {q.content}
            </p>

            {/* 選項 */}
            <div className="space-y-3">
              {q.options.map((option, idx) => {
                const isSelected = selectedLabel === option.label
                return (
                  <button
                    key={option.label}
                    onClick={() => selectOption(option.label)}
                    className="w-full text-left flex items-start gap-4 px-5 py-4 cyber-chamfer-sm border transition-all duration-150"
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
                    <span className="text-sm leading-relaxed flex-1"
                      style={{ color: isSelected ? '#e0e0e0' : '#9a9aaa' }}>
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

        {/* ── 導航按鈕 ── */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrent(c => c - 1)}
            disabled={current === 0}
            className="cyber-btn-ghost cyber-chamfer-sm flex-1 justify-center"
          >
            ◀ 上一題
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="cyber-btn cyber-chamfer-sm flex-1 justify-center"
            >
              {submitting
                ? <span className="cyber-cursor">傳送中</span>
                : <><span>▶▶</span> 送出答案</>
              }
            </button>
          ) : (
            <button
              onClick={() => setCurrent(c => c + 1)}
              disabled={!selectedLabel}
              className="cyber-btn cyber-chamfer-sm flex-1 justify-center"
            >
              下一題 ▶
            </button>
          )}
        </div>

        <p className="text-center text-dim text-xs font-orbitron tracking-wider">
          已作答 {Object.keys(answers).length} / {questions.length} 題
        </p>
      </div>
    </main>
    </>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center cyber-grid">
        <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">初始化中</p>
      </main>
    }>
      <TestContent />
    </Suspense>
  )
}
