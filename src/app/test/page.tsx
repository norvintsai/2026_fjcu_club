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
    if (!studentId || !department) {
      router.replace('/')
      return
    }
    supabase
      .from('questions')
      .select('*')
      .order('order_num')
      .then(({ data, error }) => {
        if (error || !data) {
          setError('載入題目失敗，請重新整理')
        } else {
          setQuestions(data as unknown as Question[])
        }
        setLoading(false)
      })
  }, [studentId, department, router])

  function selectOption(label: string) {
    const qId = String(questions[current].id)
    setAnswers(prev => ({ ...prev, [qId]: label }))
  }

  function goNext() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
    }
  }

  function goPrev() {
    if (current > 0) setCurrent(c => c - 1)
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError('請回答所有題目後再提交')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, department, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '提交失敗')
      router.push(`/result?id=${data.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '提交失敗，請重試')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">載入題目中…</p>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{error || '尚未有題目'}</p>
      </main>
    )
  }

  const q = questions[current]
  const selectedLabel = answers[String(q.id)]
  const progress = Math.round(((current + 1) / questions.length) * 100)
  const isLast = current === questions.length - 1
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>第 {current + 1} 題 / 共 {questions.length} 題</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <p className="text-base font-medium text-gray-800 mb-6 leading-relaxed">
            {current + 1}. {q.content}
          </p>

          <div className="space-y-3">
            {q.options.map(option => (
              <button
                key={option.label}
                onClick={() => selectOption(option.label)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  selectedLabel === option.label
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-semibold mr-2">{option.label}.</span>
                {option.text}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            上一題
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '提交中…' : '提交測驗'}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!selectedLabel}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              下一題
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">載入中…</p>
      </main>
    }>
      <TestContent />
    </Suspense>
  )
}
