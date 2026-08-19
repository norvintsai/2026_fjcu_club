'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('')
  const [error, setError] = useState('')

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId.trim() || !department.trim()) {
      setError('請填寫學號與系級')
      return
    }
    const params = new URLSearchParams({ studentId: studentId.trim(), department: department.trim() })
    router.push(`/test?${params.toString()}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">社團適性測驗</h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          請填寫基本資料後開始測驗
        </p>

        <form onSubmit={handleStart} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              學號
            </label>
            <input
              type="text"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              placeholder="請輸入學號"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              系級
            </label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="例：資工系一年級"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            開始測驗
          </button>
        </form>
      </div>
    </main>
  )
}
