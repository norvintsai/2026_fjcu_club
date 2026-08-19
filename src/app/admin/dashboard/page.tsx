import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { Submission } from '@/lib/database.types'
import LogoutButton from './LogoutButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const authed = await isAdminAuthenticated()
  if (!authed) redirect('/admin')

  const supabase = createServiceClient()
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (submissions ?? []) as Submission[]

  // Aggregate category scores
  const categoryTotals: Record<string, number> = {}
  for (const s of rows) {
    for (const [cat, count] of Object.entries(s.scores ?? {})) {
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + (count as number)
    }
  }

  // Result distribution
  const resultDist: Record<string, number> = {}
  for (const s of rows) {
    resultDist[s.result] = (resultDist[s.result] ?? 0) + 1
  }
  const resultEntries = Object.entries(resultDist).sort(([, a], [, b]) => b - a)

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">統計後台</h1>
            <p className="text-sm text-gray-500 mt-1">共 {rows.length} 筆作答紀錄</p>
          </div>
          <LogoutButton />
        </div>

        {/* Result Distribution */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">結果分佈</h2>
          {resultEntries.length === 0 ? (
            <p className="text-gray-400 text-sm">尚無資料</p>
          ) : (
            <div className="space-y-3">
              {resultEntries.map(([result, count]) => {
                const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0
                return (
                  <div key={result}>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{result}</span>
                      <span>{count} 人（{pct}%）</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">作答紀錄</h2>
          </div>
          {rows.length === 0 ? (
            <p className="text-gray-400 text-sm px-6 py-8">尚無資料</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">學號</th>
                    <th className="px-6 py-3">系級</th>
                    <th className="px-6 py-3">結果</th>
                    <th className="px-6 py-3">時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-700">{s.student_id}</td>
                      <td className="px-6 py-3 text-gray-700">{s.department}</td>
                      <td className="px-6 py-3">
                        <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                          {s.result}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-400">
                        {new Date(s.created_at).toLocaleString('zh-TW')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
