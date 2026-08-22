'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface Props {
  studentId?: string
  page?: string
}

export default function ReportButton({ studentId, page = 'unknown' }: Props) {
  const [open, setOpen]         = useState(false)
  const [text, setText]         = useState('')
  const [status, setStatus]     = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit() {
    if (!text.trim() || status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId, page, description: text }),
      })
      if (res.ok) {
        setStatus('done')
        setTimeout(() => { setOpen(false); setStatus('idle'); setText('') }, 1800)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => { setOpen(true); setStatus('idle') }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 px-3 py-1.5 text-xs font-orbitron tracking-wider border cyber-chamfer-sm transition-all"
        style={{
          background:  'rgba(7,7,26,0.92)',
          borderColor: '#ff336640',
          color:       '#ff3366',
          boxShadow:   '0 0 16px rgba(255,51,102,0.15)',
        }}
        title="回報問題"
      >
        <span style={{ fontSize: 10 }}>⚠</span> 回報問題
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            <motion.div
              className="w-full max-w-md terminal-card cyber-chamfer"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              {/* Header */}
              <div className="terminal-header">
                <span className="terminal-dot" style={{ background: '#ff3366' }} />
                <span className="terminal-dot" style={{ background: '#ff3366', opacity: 0.5 }} />
                <span className="terminal-dot" style={{ background: '#ff3366', opacity: 0.25 }} />
                <span className="ml-3 text-xs font-orbitron tracking-widest flex-1" style={{ color: '#ff3366' }}>
                  REPORT · 問題回報
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-dim text-xs font-orbitron hover:text-fore transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                {status === 'done' ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <span className="text-2xl">✓</span>
                    <p className="text-neon text-sm font-orbitron tracking-wider">已收到回報，謝謝！</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                        ▸ 問題描述
                      </label>
                      <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="請描述你遇到的問題或錯誤..."
                        rows={4}
                        maxLength={1000}
                        className="cyber-input cyber-chamfer-sm w-full resize-none leading-relaxed"
                        style={{ fontFamily: 'inherit', fontSize: 12 }}
                        autoFocus
                      />
                      <p className="text-right mt-1 text-xs font-orbitron" style={{ color: '#3a3a5a' }}>
                        {text.length} / 1000
                      </p>
                    </div>

                    {status === 'error' && (
                      <p className="text-danger text-xs font-orbitron tracking-wider">
                        // 提交失敗，請稍後再試
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="cyber-btn-ghost cyber-chamfer-sm flex-none px-4 text-xs"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={submit}
                        disabled={!text.trim() || status === 'sending'}
                        className="cyber-btn cyber-chamfer-sm flex-1 justify-center text-xs"
                        style={{ borderColor: '#ff3366', color: '#ff3366' }}
                      >
                        {status === 'sending'
                          ? <span className="cyber-cursor">傳送中</span>
                          : <><span>▶</span> 送出回報</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
