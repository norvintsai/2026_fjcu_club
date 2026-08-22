import { redirect } from 'next/navigation'
import { isAdminAuthenticated, isSuperAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { Submission } from '@/lib/database.types'
import LogoutButton from './LogoutButton'
import DashboardCharts from './DashboardCharts'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const authed = await isAdminAuthenticated()
  if (!authed) redirect('/admin')

  const superAdmin = await isSuperAdmin()

  const supabase = createServiceClient()
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (submissions ?? []) as Submission[]

  // ── KPI ──────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = rows.filter(r => r.created_at.slice(0, 10) === today).length

  // ── 社團屬性分佈 ──────────────────────────────────────
  const clubMap: Record<string, number> = {}
  for (const s of rows) clubMap[s.result] = (clubMap[s.result] ?? 0) + 1
  const clubDist = Object.entries(clubMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name,
      value,
      pct: rows.length > 0 ? Math.round(value / rows.length * 100) : 0,
    }))

  // ── 每日趨勢（近 14 天）──────────────────────────────
  const dailyMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dailyMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const s of rows) {
    const date = s.created_at.slice(0, 10)
    if (date in dailyMap) dailyMap[date] = (dailyMap[date] ?? 0) + 1
  }
  const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({
    date: date.slice(5),
    人數: count,
  }))

  // ── 系所排名 ─────────────────────────────────────────
  // department format: "系所名 部別 年級"  e.g. "資訊工程學系 日間部 大三"
  const deptMap: Record<string, number> = {}
  const gradeMap: Record<string, number> = {}
  const divMap: Record<string, number> = {}

  for (const s of rows) {
    const parts = s.department.split(' ')
    const dept  = parts[0] ?? s.department
    const div   = parts.length >= 3 ? parts[1] : (parts.length === 2 ? parts[0] : '其他')
    const grade = parts[parts.length - 1]

    deptMap[dept]   = (deptMap[dept] ?? 0) + 1
    gradeMap[grade] = (gradeMap[grade] ?? 0) + 1
    divMap[div]     = (divMap[div] ?? 0) + 1
  }

  const topDepts = Object.entries(deptMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, 人數: value }))

  const gradeOrder = ['大一', '大二', '大三', '大四', '大五', '大六']
  const gradeDist = gradeOrder
    .filter(g => g in gradeMap)
    .map(g => ({ grade: g, 人數: gradeMap[g] }))

  const divisionDist = Object.entries(divMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }))

  // ── 結果表格 ─────────────────────────────────────────
  const recentRows = rows.map(s => {
    const parts = s.department.split(' ')
    return {
      id:         s.id,
      student_id: s.student_id,
      dept:       parts[0] ?? s.department,
      division:   parts.length >= 3 ? parts[1] : '',
      grade:      parts[parts.length - 1] ?? '',
      result:     s.result,
      created_at: s.created_at,
    }
  })

  return (
    <main className="min-h-screen cyber-grid px-4 py-8 relative">
      <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,.04) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,0,255,.03) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* ── 頂部 header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-neon neon-pulse" />
              <h1 className="font-orbitron font-black text-xl uppercase tracking-widest text-fore">
                資料分析中心
              </h1>
            </div>
            <p className="text-xs font-orbitron tracking-[.15em] ml-5" style={{ color: '#4a4a6a' }}>
              FJU STELLAR · 社團適性測驗 · 即時數據儀表板
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-orbitron tracking-wider" style={{ color: '#4a4a6a' }}>
                更新時間
              </p>
              <p className="text-xs font-orbitron text-neon">
                {new Date().toLocaleString('zh-TW')}
              </p>
            </div>
            {superAdmin && (
              <a
                href="/admin/dashboard/super"
                className="text-xs font-orbitron tracking-wider border cyber-chamfer-sm px-3 py-1.5 transition-all hover:opacity-80"
                style={{ borderColor: '#ffd70040', color: '#ffd700', background: 'rgba(255,215,0,.05)' }}
              >
                ⚙ 系統管理
              </a>
            )}
            <LogoutButton />
          </div>
        </div>

        <DashboardCharts
          total={rows.length}
          todayCount={todayCount}
          topClub={clubDist[0]?.name ?? ''}
          deptCount={Object.keys(deptMap).length}
          clubDist={clubDist}
          dailyTrend={dailyTrend}
          topDepts={topDepts}
          gradeDist={gradeDist}
          divisionDist={divisionDist}
          recentRows={recentRows}
        />
      </div>
    </main>
  )
}
