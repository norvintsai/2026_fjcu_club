'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseStudentId, type ParsedStudentId } from '@/lib/student-id'

type Step = 'id' | 'confirm'

export default function HomePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('id')
  const [studentId, setStudentId] = useState('')
  const [parsed, setParsed] = useState<ParsedStudentId | null>(null)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  function handleIdSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = studentId.trim()
    const result = parseStudentId(id)
    if (!result) {
      setError('// ERROR: 無法辨識學號，請確認是否為 9 位數日間部/進修部學號')
      return
    }
    setParsed(result)
    setError('')
    setStep('confirm')
  }

  function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) {
      setError('// ERROR: 請輸入暱稱')
      return
    }
    const params = new URLSearchParams({
      studentId: studentId.trim(),
      department: parsed!.label,
      nickname: nickname.trim(),
    })
    router.push(`/test?${params.toString()}`)
  }

  return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-lg relative z-10 fade-in-up">
        <div className="terminal-card cyber-chamfer">
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs tracking-widest font-orbitron uppercase">
              FJU-STELLAR-v2026
            </span>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-neon neon-pulse inline-block" />
              <span className="text-neon text-xs tracking-[.2em] font-orbitron uppercase">
                System Online
              </span>
              <span className="ml-auto text-dim text-xs">// 2026.FJU.EDU</span>
            </div>

            <h1 className="font-orbitron font-black text-2xl md:text-3xl uppercase tracking-widest text-fore mb-2 cyber-glitch leading-tight">
              STELLAR<br />
              <span className="text-neon text-neon-glow">APTITUDE</span><br />
              TERMINAL
            </h1>
            <p className="text-dim text-xs tracking-[.15em] mb-8 cyber-cursor">
              CREW IDENTIFICATION REQUIRED
            </p>

            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-border" />
              <span className="text-dim text-xs font-orbitron tracking-widest">
                {step === 'id' ? 'STEP 01' : 'STEP 02'}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {step === 'id' && (
              <form onSubmit={handleIdSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                    &gt; Student ID（學號）
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon text-sm select-none">&gt;</span>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => { setStudentId(e.target.value.replace(/\D/g, '').slice(0, 9)); setError('') }}
                      placeholder="輸入 9 位數學號 ..."
                      className="cyber-input cyber-chamfer-sm pl-8"
                      autoComplete="off"
                      maxLength={9}
                      inputMode="numeric"
                    />
                  </div>
                  <p className="text-dim text-xs mt-2 font-orbitron tracking-wider">
                    系級將自動從學號解析
                  </p>
                </div>

                {error && (
                  <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={studentId.length !== 9}
                    className="cyber-btn cyber-chamfer-sm w-full justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>▶</span> SCAN IDENTITY
                  </button>
                </div>
              </form>
            )}

            {step === 'confirm' && parsed && (
              <form onSubmit={handleLaunch} className="space-y-5">
                {/* Detected info card */}
                <div className="border border-neon cyber-chamfer-sm p-5 space-y-3"
                  style={{ background: 'rgba(0,255,136,.04)', boxShadow: '0 0 12px rgba(0,255,136,.08)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon neon-pulse" />
                    <span className="text-neon text-xs font-orbitron tracking-[.2em] uppercase">Signal Acquired</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-orbitron">
                    <span className="text-dim tracking-wider uppercase">部別</span>
                    <span className="text-fore">{parsed.division}</span>
                    <span className="text-dim tracking-wider uppercase">系所</span>
                    <span className="text-fore">{parsed.deptName}</span>
                    <span className="text-dim tracking-wider uppercase">年級</span>
                    <span className="text-neon">{parsed.grade}</span>
                  </div>
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                    &gt; Callsign（暱稱）
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon text-sm select-none">&gt;</span>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => { setNickname(e.target.value); setError('') }}
                      placeholder="輸入你的暱稱 ..."
                      className="cyber-input cyber-chamfer-sm pl-8"
                      autoComplete="off"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep('id'); setError('') }}
                    className="cyber-btn-ghost cyber-chamfer-sm flex-none px-5 text-sm"
                  >
                    ◀ BACK
                  </button>
                  <button
                    type="submit"
                    disabled={!nickname.trim()}
                    className="cyber-btn cyber-chamfer-sm flex-1 justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>▶▶</span> LAUNCH SEQUENCE
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <span className="text-dim text-xs">輔仁大學 // 社團博覽會</span>
              <span className="text-xs text-neon tracking-widest">[ READY ]</span>
            </div>
          </div>
        </div>

        <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-neon" />
        <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-neon" />
        <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-neon" />
        <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-neon" />
      </div>
    </main>
  )
}
