import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { Submission } from '@/lib/database.types'
import { CLUB_RESULTS } from '@/lib/results'
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

  const resultDist: Record<string, number> = {}
  for (const s of rows) {
    resultDist[s.result] = (resultDist[s.result] ?? 0) + 1
  }
  const resultEntries = Object.entries(resultDist).sort(([, a], [, b]) => b - a)

  return (
    <main className="min-h-screen cyber-grid px-4 py-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,.05) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="w-2 h-2 rounded-full bg-neon neon-pulse" />
              <h1 className="font-orbitron font-black text-lg uppercase tracking-widest text-fore">
                Command Center
              </h1>
            </div>
            <p className="text-dim text-xs font-orbitron tracking-wider ml-5">
              // TOTAL CREW SCANNED: {String(rows.length).padStart(4, '0')}
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Scans', value: rows.length, color: '#00ff88' },
            { label: 'Club Types', value: resultEntries.length, color: '#00d4ff' },
            { label: 'Top Planet', value: resultEntries[0]?.[0] ?? '—', color: '#ff00ff', small: true },
            { label: 'Latest', value: rows[0] ? new Date(rows[0].created_at).toLocaleDateString('zh-TW') : '—', color: '#ffd700', small: true },
          ].map(stat => (
            <div key={stat.label} className="terminal-card cyber-chamfer-sm p-4">
              <p className="text-dim text-xs font-orbitron tracking-widest uppercase mb-2">{stat.label}</p>
              <p
                className={`font-orbitron font-bold ${stat.small ? 'text-sm' : 'text-2xl'} leading-tight`}
                style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}60` }}
              >
                {String(stat.value)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Result distribution ── */}
        <div className="terminal-card cyber-chamfer mb-6">
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              Planet Distribution
            </span>
            <span className="ml-auto text-dim text-xs">{rows.length} records</span>
          </div>
          <div className="p-6">
            {resultEntries.length === 0 ? (
              <p className="text-dim text-xs font-orbitron tracking-wider cyber-cursor">AWAITING DATA</p>
            ) : (
              <div className="space-y-4">
                {resultEntries.map(([result, count], idx) => {
                  const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0
                  const clubInfo = CLUB_RESULTS[result]
                  const isTop = idx === 0
                  return (
                    <div key={result}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{clubInfo?.emoji}</span>
                          <span className={`text-xs font-orbitron tracking-wider ${isTop ? 'text-neon' : 'text-dim'}`}>
                            {result}
                          </span>
                          {isTop && (
                            <span className="text-[10px] font-orbitron text-neon border border-neon px-1 py-0.5 cyber-chamfer-sm">
                              TOP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-orbitron">
                          <span className="text-dim">{count} CREW</span>
                          <span className={isTop ? 'text-neon' : 'text-dim'}>{pct}%</span>
                        </div>
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
            )}
          </div>
        </div>

        {/* ── Crew log table ── */}
        <div className="terminal-card cyber-chamfer overflow-hidden">
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#00d4ff' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              Crew Scan Log
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="text-dim text-xs font-orbitron tracking-wider px-6 py-8 cyber-cursor">
              AWAITING CREW DATA
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Student ID', 'Department', 'Destination', 'Timestamp'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-dim font-orbitron uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="border-b border-border transition-colors"
                      style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)' }}
                    >
                      <td className="px-5 py-3 text-fore font-orbitron">{s.student_id}</td>
                      <td className="px-5 py-3 text-dim">{s.department}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-neon font-orbitron">
                          <span>{CLUB_RESULTS[s.result]?.emoji}</span>
                          <span>{s.result}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-dim">
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
