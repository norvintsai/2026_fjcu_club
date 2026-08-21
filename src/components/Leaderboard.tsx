'use client'

import { useEffect, useState, useCallback } from 'react'

type Entry = { name: string; count: number }
type Data  = { depts: Entry[]; categories: Entry[]; clubs: Entry[]; total: number }

const RANK_COLORS = ['#ffd700', '#00d4ff', '#00ff88'] as const
const RANK_LABELS = ['01', '02', '03'] as const
const POLL_MS = 30_000

type Tab = 'dept' | 'attr' | 'club'

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-20">
      <span className="text-xs font-orbitron tracking-wider" style={{ color: '#2a2a4a' }}>
        尚無資料
      </span>
    </div>
  )
}

function RankList({ items, max }: { items: Entry[]; max: number }) {
  if (items.length === 0) return <EmptyState />
  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const pct   = max > 0 ? (item.count / max) * 100 : 0
        const color = RANK_COLORS[i]
        // For club combos "系名｜屬性" split into two lines
        const [line1, line2] = item.name.includes('｜')
          ? item.name.split('｜')
          : [item.name, null]

        return (
          <div key={item.name}>
            <div className="flex items-start gap-2 mb-1.5">
              <span
                className="font-orbitron font-black text-xs tabular-nums w-5 shrink-0 mt-0.5"
                style={{ color }}
              >
                {RANK_LABELS[i]}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-orbitron tracking-wider truncate leading-snug"
                  style={{ color: i === 0 ? '#e0e0f0' : '#9a9aaa' }}
                  title={line1}
                >
                  {line1}
                </p>
                {line2 && (
                  <p
                    className="text-xs font-orbitron tracking-wider truncate leading-snug"
                    style={{ color, opacity: 0.8 }}
                    title={line2}
                  >
                    {line2}
                  </p>
                )}
              </div>
              <span
                className="font-orbitron font-bold text-xs tabular-nums shrink-0 mt-0.5"
                style={{ color }}
              >
                {item.count}人
              </span>
            </div>
            <div className="h-px w-full ml-7" style={{ background: '#0f0f1a' }}>
              <div
                className="h-px transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: color,
                  boxShadow: `0 0 6px ${color}80`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'dept', label: '科系',   color: '#ffd700' },
  { id: 'attr', label: '屬性',   color: '#00d4ff' },
  { id: 'club', label: '社團總', color: '#00ff88' },
]

export default function Leaderboard() {
  const [data, setData]     = useState<Data | null>(null)
  const [tick, setTick]     = useState(POLL_MS / 1000)
  const [pulse, setPulse]   = useState(false)
  const [tab, setTab]       = useState<Tab>('dept')

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch('/api/leaderboard', { cache: 'no-store' })
      const json = await res.json() as Data
      setData(json)
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
      setTick(POLL_MS / 1000)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchData()
    const poll = setInterval(fetchData, POLL_MS)
    return () => clearInterval(poll)
  }, [fetchData])

  useEffect(() => {
    const t = setInterval(() => setTick(s => (s <= 1 ? POLL_MS / 1000 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const current = tab === 'dept'
    ? data?.depts ?? []
    : tab === 'attr'
      ? data?.categories ?? []
      : data?.clubs ?? []

  const max = current[0]?.count ?? 0

  return (
    <div className="terminal-card cyber-chamfer flex flex-col gap-0 h-fit">
      {/* Header */}
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: '#ffd700' }} />
        <span className="terminal-dot" style={{ background: '#ffd700', opacity: .5 }} />
        <span className="terminal-dot" style={{ background: '#ffd700', opacity: .25 }} />
        <span className="ml-3 text-xs tracking-widest font-orbitron uppercase flex-1"
          style={{ color: '#ffd700' }}>
          LIVE · 即時排行
        </span>
        <span
          className="text-xs font-orbitron transition-colors duration-300"
          style={{ color: pulse ? '#00ff88' : '#3a3a5a' }}
        >
          ●
        </span>
      </div>

      {/* Total count */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-orbitron tracking-widest" style={{ color: '#4a4a6a' }}>
          總填寫人次
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-orbitron font-black text-xl text-neon text-neon-glow tabular-nums">
            {data?.total ?? '—'}
          </span>
          <span className="text-xs font-orbitron" style={{ color: '#4a4a6a' }}>人</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 text-xs font-orbitron tracking-wider transition-all"
            style={{
              color: tab === t.id ? t.color : '#3a3a5a',
              borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
              background: tab === t.id ? `${t.color}08` : 'transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1" style={{ background: `${TABS.find(t => t.id === tab)?.color}30` }} />
          <span className="text-xs font-orbitron tracking-[.2em] uppercase"
            style={{ color: TABS.find(t => t.id === tab)?.color }}>
            前三名
          </span>
          <div className="h-px flex-1" style={{ background: `${TABS.find(t => t.id === tab)?.color}30` }} />
        </div>
        <RankList items={current} max={max} />
      </div>

      {/* Footer: countdown */}
      <div className="px-5 py-2.5 border-t border-border flex items-center justify-between">
        <span className="text-xs font-orbitron" style={{ color: '#2a2a4a' }}>下次更新</span>
        <span className="text-xs font-orbitron tabular-nums" style={{ color: '#3a3a5a' }}>{tick}s</span>
      </div>
    </div>
  )
}
