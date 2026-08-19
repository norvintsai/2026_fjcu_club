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
      setError('// ERROR: 請填寫學號與系級')
      return
    }
    const params = new URLSearchParams({
      studentId: studentId.trim(),
      department: department.trim(),
    })
    router.push(`/test?${params.toString()}`)
  }

  return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Corner ambient glows */}
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-lg relative z-10 fade-in-up">
        {/* Terminal Window */}
        <div className="terminal-card cyber-chamfer">
          {/* Header bar */}
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs tracking-widest font-orbitron uppercase">
              FJU-STELLAR-v2026
            </span>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-neon neon-pulse inline-block" />
              <span className="text-neon text-xs tracking-[.2em] font-orbitron uppercase">
                System Online
              </span>
              <span className="ml-auto text-dim text-xs">// 2026.FJU.EDU</span>
            </div>

            {/* Title */}
            <h1 className="font-orbitron font-black text-2xl md:text-3xl uppercase tracking-widest text-fore mb-2 cyber-glitch leading-tight">
              STELLAR<br />
              <span className="text-neon text-neon-glow">APTITUDE</span><br />
              TERMINAL
            </h1>
            <p className="text-dim text-xs tracking-[.15em] mb-8 cyber-cursor">
              CREW IDENTIFICATION REQUIRED
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-border" />
              <span className="text-dim text-xs font-orbitron tracking-widest">INIT</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleStart} className="space-y-5">
              <div>
                <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                  &gt; Student ID
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon text-sm select-none">
                    &gt;
                  </span>
                  <input
                    type="text"
                    value={studentId}
                    onChange={e => { setStudentId(e.target.value); setError('') }}
                    placeholder="輸入學號 ..."
                    className="cyber-input cyber-chamfer-sm pl-8"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                  &gt; Department
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon text-sm select-none">
                    &gt;
                  </span>
                  <input
                    type="text"
                    value={department}
                    onChange={e => { setDepartment(e.target.value); setError('') }}
                    placeholder="例：資工系一年級 ..."
                    className="cyber-input cyber-chamfer-sm pl-8"
                    autoComplete="off"
                  />
                </div>
              </div>

              {error && (
                <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="cyber-btn cyber-chamfer-sm w-full justify-center text-sm"
                >
                  <span>▶</span>
                  LAUNCH SEQUENCE
                </button>
              </div>
            </form>

            {/* Footer status */}
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <span className="text-dim text-xs">輔仁大學 // 社團博覽會</span>
              <span className="text-xs text-neon tracking-widest">[ READY ]</span>
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-neon" />
        <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-neon" />
        <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-neon" />
        <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-neon" />
      </div>
    </main>
  )
}
