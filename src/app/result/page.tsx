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
    if (!id) {
      setError('找不到測驗紀錄')
      setLoading(false)
      return
    }
    supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError('找不到測驗紀錄')
        else setSubmission(data as unknown as Submission)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">載入結果中…</p>
      </main>
    )
  }

  if (error || !submission) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 underline text-sm">回到首頁</Link>
        </div>
      </main>
    )
  }

  const clubInfo = CLUB_RESULTS[submission.result]
  const scoreEntries = Object.entries(submission.scores).sort(([, a], [, b]) => b - a)
  const total = scoreEntries.reduce((sum, [, s]) => sum + s, 0)

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Result Card */}
        <div className="bg-white rounded-2xl shadow p-8 text-center mb-4">
          <p className="text-4xl mb-3">{clubInfo?.emoji ?? '🌌'}</p>
          <p className="text-xs text-gray-400 mb-1">你的社團適性結果</p>
          <h2 className="text-2xl font-bold text-blue-600 mb-4">
            {submission.result}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {clubInfo?.description ?? submission.result}
          </p>
          <hr className="my-5 border-gray-100" />
          <p className="text-xs text-gray-400">
            {submission.department}・{submission.student_id}
          </p>
        </div>

        {/* Score breakdown */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">各類別得分</h3>
          <div className="space-y-3">
            {scoreEntries.map(([category, score]) => {
              const pct = total > 0 ? Math.round((score / total) * 100) : 0
              const isTop = category === submission.result
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isTop ? 'font-semibold text-blue-600' : 'text-gray-600'}>
                      {CLUB_RESULTS[category]?.emoji} {category}
                    </span>
                    <span className={isTop ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
                      {score} 題（{pct}%）
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isTop ? 'bg-blue-500' : 'bg-gray-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Link
          href="/"
          className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          回到首頁
        </Link>
      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">載入中…</p>
      </main>
    }>
      <ResultContent />
    </Suspense>
  )
}
