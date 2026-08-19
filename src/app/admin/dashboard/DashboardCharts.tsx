'use client'

import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LabelList,
} from 'recharts'

/* ─── Types ─────────────────────────────────────────── */
interface Row {
  id: string
  student_id: string
  dept: string
  division: string
  grade: string
  result: string
  created_at: string
}

export interface DashboardData {
  total: number
  todayCount: number
  topClub: string
  deptCount: number
  clubDist: { name: string; value: number; pct: number }[]
  dailyTrend: { date: string; 人數: number }[]
  topDepts: { name: string; 人數: number }[]
  gradeDist: { grade: string; 人數: number }[]
  divisionDist: { name: string; value: number }[]
  recentRows: Row[]
}

/* ─── Constants ──────────────────────────────────────── */
const CLUB_COLORS: Record<string, string> = {
  '學術性社團':    '#00d4ff',
  '休閒聯誼性社團': '#ffd700',
  '服務性社團':    '#00ff88',
  '藝術性社團':    '#ff00ff',
  '音樂性社團':    '#ff9966',
  '體能性社團':    '#ff3366',
  '其他單位':      '#9966ff',
}
const FALLBACK_COLORS = Object.values(CLUB_COLORS)

const AXIS_STYLE  = { fill: '#4a4a6a', fontSize: 11, fontFamily: 'var(--font-jb), monospace' }
const GRID_STROKE = 'rgba(255,255,255,.04)'

/* ─── Sub-components ─────────────────────────────────── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0d0d1a', border: '1px solid #2a2a3a',
      padding: '10px 14px', fontFamily: 'var(--font-jb), monospace', fontSize: 12,
    }}>
      {label && <p style={{ color: '#6a6a8a', marginBottom: 6, fontSize: 10, letterSpacing: '0.1em' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#00ff88', margin: '2px 0' }}>
          {p.name}：<strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function KpiCard({ label, value, sub, color = '#00ff88', icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: string
}) {
  return (
    <div className="terminal-card cyber-chamfer-sm p-5 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-orbitron tracking-[.15em] uppercase" style={{ color: '#4a4a6a' }}>
          {label}
        </p>
        {icon && <span style={{ fontSize: 18, opacity: 0.4 }}>{icon}</span>}
      </div>
      <div>
        <p className="font-orbitron font-black text-3xl leading-none"
          style={{ color, textShadow: `0 0 16px ${color}50` }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs mt-1.5" style={{ color: '#4a4a6a' }}>{sub}</p>}
      </div>
    </div>
  )
}

function SectionCard({ title, dot = '#00ff88', children, action }: {
  title: string; dot?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="terminal-card cyber-chamfer">
      <div className="terminal-header flex items-center">
        <span className="terminal-dot" style={{ background: dot }} />
        <span className="ml-3 text-xs font-orbitron uppercase tracking-widest text-dim flex-1">{title}</span>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

/* ─── Custom Donut label ─────────────────────────────── */
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, pct, name }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; pct: number; name: string;
}) {
  if (pct < 5) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontFamily: 'var(--font-orb), monospace', fontWeight: 700 }}>
      {pct}%
    </text>
  )
}

/* ─── CSV export ─────────────────────────────────────── */
function exportCSV(rows: Row[]) {
  const header = ['學號', '系所', '部別', '年級', '社團屬性', '測驗時間']
  const body = rows.map(r => [
    r.student_id, r.dept, r.division, r.grade, r.result,
    new Date(r.created_at).toLocaleString('zh-TW'),
  ])
  const csv = '﻿' + [header, ...body].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `fju-stellar-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ─── Main component ─────────────────────────────────── */
export default function DashboardCharts({
  total, todayCount, topClub, deptCount,
  clubDist, dailyTrend, topDepts, gradeDist, divisionDist, recentRows,
}: DashboardData) {
  const [showAll, setShowAll] = useState(false)
  const tableRows = showAll ? recentRows : recentRows.slice(0, 20)

  return (
    <div className="space-y-5">

      {/* ── KPI 卡片 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="總參與人數" value={total} sub="自活動開始累計" color="#00ff88" icon="👥" />
        <KpiCard label="今日新增" value={todayCount} sub={new Date().toLocaleDateString('zh-TW')} color="#00d4ff" icon="📅" />
        <KpiCard label="最熱門社團屬性" value={topClub || '—'} sub={clubDist[0] ? `佔 ${clubDist[0].pct}%` : ''} color={CLUB_COLORS[topClub] ?? '#ffd700'} icon="🏆" />
        <KpiCard label="已涵蓋系所" value={deptCount} sub="個不同系所" color="#ff00ff" icon="🎓" />
      </div>

      {/* ── 社團分佈 + 趨勢 ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* 社團屬性分佈 */}
        <SectionCard title="社團屬性分佈" dot="#00ff88">
          {clubDist.length === 0 ? (
            <p className="text-dim text-xs font-orbitron cyber-cursor tracking-widest">尚無資料</p>
          ) : (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={clubDist}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {clubDist.map((entry, i) => (
                      <Cell key={i} fill={CLUB_COLORS[entry.name] ?? FALLBACK_COLORS[i % 7]} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {clubDist.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: CLUB_COLORS[d.name] ?? FALLBACK_COLORS[i % 7] }} />
                    <span style={{ color: '#9a9aaa' }} className="truncate">{d.name}</span>
                    <span className="ml-auto font-orbitron" style={{ color: CLUB_COLORS[d.name] ?? '#00ff88' }}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* 每日測驗趨勢 */}
        <SectionCard title="每日測驗趨勢（近 14 天）" dot="#00d4ff">
          {dailyTrend.every(d => d['人數'] === 0) ? (
            <p className="text-dim text-xs font-orbitron cyber-cursor tracking-widest">尚無資料</p>
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <ReTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="人數"
                  stroke="#00d4ff" strokeWidth={2}
                  fill="url(#trendGrad)"
                  dot={{ fill: '#00d4ff', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#00d4ff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* ── 系所排名 + 年級分佈 ── */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* 系所參與排名 Top 10 */}
        <div className="lg:col-span-3">
          <SectionCard title="系所參與排名 Top 10" dot="#ffd700">
            {topDepts.length === 0 ? (
              <p className="text-dim text-xs font-orbitron cyber-cursor tracking-widest">尚無資料</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, topDepts.length * 36)}>
                <BarChart
                  data={topDepts} layout="vertical"
                  margin={{ top: 0, right: 50, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category" dataKey="name" width={120}
                    tick={{ ...AXIS_STYLE, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.length > 8 ? v.slice(0, 8) + '…' : v}
                  />
                  <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
                  <Bar dataKey="人數" fill="#ffd700" radius={[0, 3, 3, 0]} maxBarSize={18}>
                    <LabelList dataKey="人數" position="right"
                      style={{ fill: '#ffd700', fontSize: 11, fontFamily: 'var(--font-jb), monospace' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>

        {/* 年級 + 部別 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionCard title="年級分佈" dot="#ff00ff">
            {gradeDist.length === 0 ? (
              <p className="text-dim text-xs font-orbitron cyber-cursor tracking-widest">尚無資料</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={gradeDist} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="grade" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
                  <Bar dataKey="人數" fill="#ff00ff" radius={[3, 3, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="部別分佈" dot="#ff9966">
            {divisionDist.length === 0 ? (
              <p className="text-dim text-xs font-orbitron cyber-cursor tracking-widest">尚無資料</p>
            ) : (
              <div className="space-y-3">
                {divisionDist.map((d, i) => {
                  const pct = total > 0 ? Math.round(d.value / total * 100) : 0
                  const col = i === 0 ? '#ff9966' : '#9966ff'
                  return (
                    <div key={d.name}>
                      <div className="flex justify-between text-xs font-orbitron mb-1.5">
                        <span style={{ color: col }}>{d.name}</span>
                        <span style={{ color: '#6a6a8a' }}>{d.value} 人 · {pct}%</span>
                      </div>
                      <div className="gauge-track">
                        <div className="absolute inset-y-0 left-0 transition-all duration-700"
                          style={{ width: `${pct}%`, background: col, boxShadow: `0 0 6px ${col}` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── 測驗紀錄明細 ── */}
      <SectionCard
        title={`測驗紀錄明細（共 ${recentRows.length} 筆）`}
        dot="#9966ff"
        action={
          <button
            onClick={() => exportCSV(recentRows)}
            className="text-xs font-orbitron tracking-wider px-3 py-1 cyber-chamfer-sm transition-colors"
            style={{ border: '1px solid #9966ff', color: '#9966ff' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#9966ff20'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            ↓ 匯出 CSV
          </button>
        }
      >
        {recentRows.length === 0 ? (
          <p className="text-dim text-xs font-orbitron cyber-cursor tracking-widest">尚無測驗紀錄</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                    {['學號', '系所', '部別', '年級', '社團屬性', '測驗時間'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-orbitron uppercase tracking-[.12em]"
                        style={{ color: '#4a4a6a', fontSize: 10 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r, idx) => (
                    <tr key={r.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,.04)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.012)',
                      }}>
                      <td className="px-4 py-2.5 font-orbitron" style={{ color: '#c0c0d0' }}>{r.student_id}</td>
                      <td className="px-4 py-2.5" style={{ color: '#7a7a9a' }}>{r.dept}</td>
                      <td className="px-4 py-2.5" style={{ color: '#5a5a7a' }}>{r.division}</td>
                      <td className="px-4 py-2.5" style={{ color: '#7a7a9a' }}>{r.grade}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-orbitron text-xs px-2 py-0.5 cyber-chamfer-sm"
                          style={{
                            color: CLUB_COLORS[r.result] ?? '#00ff88',
                            border: `1px solid ${(CLUB_COLORS[r.result] ?? '#00ff88')}40`,
                            background: `${(CLUB_COLORS[r.result] ?? '#00ff88')}10`,
                          }}>
                          {r.result}
                        </span>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: '#4a4a6a' }}>
                        {new Date(r.created_at).toLocaleString('zh-TW')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recentRows.length > 20 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="text-xs font-orbitron tracking-wider px-4 py-1.5 cyber-chamfer-sm"
                  style={{ border: '1px solid #3a3a5a', color: '#6a6a8a' }}
                >
                  {showAll ? '▲ 收合' : `▼ 顯示全部 ${recentRows.length} 筆`}
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>

    </div>
  )
}
