'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const COLORS = ['#00ff88', '#00d4ff', '#ff00ff', '#ffd700', '#ff9966']

interface FlyMsg { key: number; text: string; color: string; top: number; duration: number }

interface Props { category: string; enabled: boolean; onClose: () => void }

let keyCounter = 0

export default function Danmaku({ category, enabled, onClose }: Props) {
  const [flying, setFlying]   = useState<FlyMsg[]>([])
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const queueRef              = useRef<string[]>([])
  const seenIds               = useRef<Set<string>>(new Set())

  const launch = useCallback((text: string) => {
    const msg: FlyMsg = {
      key: keyCounter++,
      text,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      top: 5 + Math.random() * 80,
      duration: 7 + Math.random() * 6,
    }
    setFlying(prev => [...prev.slice(-20), msg])
    setTimeout(() => setFlying(prev => prev.filter(m => m.key !== msg.key)), (msg.duration + 1) * 1000)
  }, [])

  // Drain one from queue every 600ms
  useEffect(() => {
    if (!enabled) return
    const iv = setInterval(() => {
      const next = queueRef.current.shift()
      if (next) launch(next)
    }, 600)
    return () => clearInterval(iv)
  }, [enabled, launch])

  // Poll for new messages every 4s
  useEffect(() => {
    if (!enabled) return
    let lastFetch = new Date(Date.now() - 8000).toISOString()

    async function poll() {
      const { data } = await supabase
        .from('messages')
        .select('id, content')
        .gte('created_at', lastFetch)
        .order('created_at')
        .limit(20)

      if (data?.length) {
        lastFetch = new Date().toISOString()
        data.forEach(m => {
          if (!seenIds.current.has(m.id)) {
            seenIds.current.add(m.id)
            queueRef.current.push(m.content)
          }
        })
      }
    }

    poll()
    const iv = setInterval(poll, 4000)
    return () => clearInterval(iv)
  }, [enabled])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    launch(text)
    await supabase.from('messages').insert({ content: text, result_category: category })
    setInput('')
    setSending(false)
  }

  if (!enabled) return null

  return (
    <>
      {/* Flying messages overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
        {flying.map(msg => (
          <div
            key={msg.key}
            style={{
              position: 'absolute',
              top: `${msg.top}%`,
              left: '105%',
              whiteSpace: 'nowrap',
              color: msg.color,
              fontSize: 14,
              fontFamily: 'var(--font-jb), monospace',
              textShadow: `0 0 8px ${msg.color}`,
              animation: `danmakuFly ${msg.duration}s linear forwards`,
              opacity: 0.9,
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input bar (fixed bottom) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
        background: 'rgba(10,10,15,.95)',
        borderTop: '1px solid #2a2a3a',
        padding: '10px 16px',
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <span style={{ color: '#00ff88', fontSize: 10, fontFamily: 'var(--font-orb), monospace', whiteSpace: 'nowrap' }}>
          ▸ 留言
        </span>
        <form onSubmit={handleSend} style={{ display: 'flex', flex: 1, gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 20))}
            placeholder="輸入彈幕留言（20字內）..."
            maxLength={20}
            style={{
              flex: 1, background: '#0a0a0f', border: '1px solid #2a2a3a',
              color: '#00ff88', fontFamily: 'var(--font-jb), monospace',
              fontSize: 12, padding: '6px 12px', outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            style={{
              background: 'transparent', border: '1px solid #00ff88',
              color: '#00ff88', fontFamily: 'var(--font-orb), monospace',
              fontSize: 10, padding: '6px 14px', cursor: 'pointer',
              letterSpacing: '0.1em',
              opacity: !input.trim() || sending ? 0.4 : 1,
            }}
          >
            發送
          </button>
        </form>
        <button
          onClick={onClose}
          title="關閉彈幕"
          style={{
            background: 'transparent', border: '1px solid #ff3366',
            color: '#ff3366', fontFamily: 'var(--font-orb), monospace',
            fontSize: 12, padding: '6px 12px', cursor: 'pointer',
            letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes danmakuFly {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-105vw - 200px)); }
        }
      `}</style>
    </>
  )
}
