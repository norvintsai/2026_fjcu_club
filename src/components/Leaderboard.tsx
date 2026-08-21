'use client'

import { useEffect, useState, useCallback } from 'react'

type Entry = { name: string; count: number }
type Data  = { depts: Entry[]; categories: Entry[]; total: number }

const RANK_COLORS = ['#ffd700', '#00d4ff', '#00ff88'] as const
const RANK_LABELS = ['01', '02', '03'] as const
const POLL_MS = 30_000

function RankList({ items, max }: { items: Entry[]; max: number }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-16">
        <span className="text-xs font-orbitron tracking-wider" style={{ color: '#2a2a4a' }}>
          尚無資料
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const pct = max > 0 ? (item.count / max) * 100 : 0
        const color = RANK_COLORS[i]
        return (
          <div key={item.name}>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-orbitron font-black text-xs tabular-nums w-5 shrink-0"
                style={{ color }}
              >
                {RANK_LABELS[i]}
              </span>
              <span
                className="flex-1 text-xs font-orbitron tracking-wider truncate"
                style={{ color: i === 0 ? '#e0e0f0' : '#9a9aaa' }}
                title={item.name}
              >
                {item.name}
              </span>
              <span
                className="font-orbitron font-bold text-xs tabular-nums shrink-0"
                style={{ color }}
              >
                {item.count}
              </span>
            </div>
            <div className="h-px w-full" style={{ background: '#0f0f1a' }}>
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

export default function Leaderboard() {
  const [data, setData]       = useState<Data | null>(null)
  const [tick, setTick]       = useState(POLL_MS / 1000)
  const [pulse, setPulse]     = useState(false)

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

  // Countdown
  useEffect(() => {
    const t = setInterval(() => setTick(s => (s <= 1 ? POLL_MS / 1000 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const deptMax = data?.depts[0]?.count ?? 0
  const catMax  = data?.categories[0]?.count ?? 0

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
          className="text-xs font-orbitron tracking-wider transition-colors duration-300"
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

      <div className="p-5 space-y-6">
        {/* Department ranking */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1" style={{ background: '#ffd70030' }} />
            <span className="text-xs font-orbitron tracking-[.2em] uppercase" style={{ color: '#ffd700' }}>
              科系排行
            </span>
            <div className="h-px flex-1" style={{ background: '#ffd70030' }} />
          </div>
          <RankList items={data?.depts ?? []} max={deptMax} />
        </div>

        {/* Category ranking */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1" style={{ background: '#00d4ff30' }} />
            <span className="text-xs font-orbitron tracking-[.2em] uppercase" style={{ color: '#00d4ff' }}>
              屬性排行
            </span>
            <div className="h-px flex-1" style={{ background: '#00d4ff30' }} />
          </div>
          <RankList items={data?.categories ?? []} max={catMax} />
        </div>
      </div>

      {/* Footer: countdown */}
      <div className="px-5 py-2.5 border-t border-border flex items-center justify-between">
        <span className="text-xs font-orbitron" style={{ color: '#2a2a4a' }}>
          下次更新
        </span>
        <span className="text-xs font-orbitron tabular-nums" style={{ color: '#3a3a5a' }}>
          {tick}s
        </span>
      </div>
    </div>
  )
}
