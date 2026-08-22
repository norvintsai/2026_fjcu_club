'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Search } from 'lucide-react'

interface Props {
  options: string[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
}

export default function CyberSearchSelect({ options, value, onChange, placeholder = '— 請選擇 —', disabled = false, label }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
    else setQuery('')
  }, [open])

  function select(opt: string) {
    onChange(opt)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-orbitron tracking-wider border cyber-chamfer-sm transition-all"
        style={{
          background: '#0a0a12',
          borderColor: open ? '#00d4ff60' : '#1a1a2e',
          color: value ? '#c0c0d0' : '#3a3a4a',
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: open ? '0 0 12px rgba(0,212,255,0.12)' : 'none',
        }}
      >
        <span className="truncate">{value || placeholder}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2 shrink-0"
        >
          <ChevronDown size={14} style={{ color: open ? '#00d4ff' : '#3a3a5a' }} />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden"
            style={{
              border: '1px solid #00d4ff30',
              background: '#07071a',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,212,255,0.08)',
            }}
          >
            {/* Search bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#1a1a3a' }}>
              <Search size={12} style={{ color: '#00d4ff', flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜尋..."
                className="flex-1 bg-transparent text-xs font-orbitron tracking-wider outline-none"
                style={{ color: '#c0c0d0' }}
              />
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a4a transparent' }}>
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-xs font-orbitron text-center" style={{ color: '#3a3a5a' }}>
                  無符合選項
                </div>
              ) : (
                filtered.map((opt, i) => (
                  <motion.button
                    key={opt}
                    type="button"
                    onClick={() => select(opt)}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.15) }}
                    className="w-full text-left px-3 py-2 text-xs font-orbitron tracking-wider transition-all"
                    style={{
                      color: opt === value ? '#00d4ff' : '#9a9aaa',
                      background: opt === value ? 'rgba(0,212,255,0.08)' : 'transparent',
                      borderLeft: opt === value ? '2px solid #00d4ff' : '2px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (opt !== value) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = '#e0e0f0'
                      }
                    }}
                    onMouseLeave={e => {
                      if (opt !== value) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLButtonElement).style.color = '#9a9aaa'
                      }
                    }}
                  >
                    {opt}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
