'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseStudentId, type ParsedStudentId } from '@/lib/student-id'

type Step = 'id' | 'confirm'

const STATUS_METRICS = [
  { label: '網路', value: '已連線' },
  { label: '資料庫', value: '上線' },
  { label: '測驗模組', value: '就緒' },
  { label: '系統', value: '正常' },
]

export default function HomePage() {
  const router = useRouter()
  const [step, setStep]           = useState<Step>('id')
  const [studentId, setStudentId] = useState('')
  const [parsed, setParsed]       = useState<ParsedStudentId | null>(null)
  const [nickname, setNickname]   = useState('')
  const [error, setError]         = useState('')

  function handleIdSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = studentId.trim()
    const result = parseStudentId(id)
    if (!result) {
      setError('// 無法辨識學號，請確認是否為 9 位數日間部或進修部學號')
      return
    }
    setParsed(result)
    setError('')
    setStep('confirm')
  }

  function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('// 請輸入你的暱稱'); return }
    const params = new URLSearchParams({
      studentId: studentId.trim(),
      department: parsed!.label,
      nickname: nickname.trim(),
    })
    router.push(`/test?${params.toString()}`)
  }

  return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-lg relative z-10 fade-in-up">

        {/* ── Main terminal card ── */}
        <div className="terminal-card cyber-chamfer panel-scan">

          {/* Window chrome */}
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs tracking-widest font-orbitron uppercase flex-1">
              FJU-STELLAR-v2026
            </span>
            <span className="text-neon text-xs font-orbitron tracking-wider">SYS-OK</span>
          </div>

          {/* System metrics bar */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border flex-wrap">
            {STATUS_METRICS.map(m => (
              <div key={m.label} className="flex items-center gap-1.5 metric-badge cyber-chamfer-sm">
                <span className="dot-green neon-pulse" />
                <span className="text-dim">{m.label}</span>
                <span className="text-neon">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-7">

            {/* Title block */}
            <div className="mb-7">
              <h1 className="font-orbitron font-black text-2xl md:text-3xl uppercase tracking-widest text-fore cyber-glitch leading-snug mb-2">
                STELLAR<br />
                <span className="text-neon text-neon-glow">適性測驗</span><br />
                終端系統
              </h1>
              <p className="text-dim text-xs tracking-[.15em] cyber-cursor">
                請輸入艦員身份以啟動測驗
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-dim text-xs font-orbitron tracking-widest">
                {step === 'id' ? '第一步' : '第二步'}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ── STEP 1: Student ID ── */}
            {step === 'id' && (
              <form onSubmit={handleIdSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                    ▸ 學號
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon text-sm select-none">&gt;</span>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => { setStudentId(e.target.value.replace(/\D/g, '').slice(0, 9)); setError('') }}
                      placeholder="輸入 9 位數學號..."
                      className="cyber-input cyber-chamfer-sm pl-8"
                      autoComplete="off"
                      maxLength={9}
                      inputMode="numeric"
                    />
                  </div>
                  <p className="text-xs mt-2 font-orbitron tracking-wider flex items-center gap-2"
                    style={{ color: '#3a3a5a' }}>
                    <span className="dot-green" style={{ width: 4, height: 4 }} />
                    系所與年級將從學號自動識別
                  </p>
                </div>

                {error && <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>}

                {/* Gauge showing input progress */}
                <div>
                  <div className="gauge-track">
                    <div className="gauge-fill" style={{ width: `${(studentId.length / 9) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-xs font-orbitron" style={{ color: '#3a3a5a' }}>
                    <span>學號長度</span>
                    <span style={{ color: studentId.length === 9 ? '#00ff88' : '#3a3a5a' }}>{studentId.length} / 9</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={studentId.length !== 9}
                    className="cyber-btn cyber-chamfer-sm w-full justify-center text-sm"
                  >
                    <span>▶</span> 識別學號
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 2: Confirm + Nickname ── */}
            {step === 'confirm' && parsed && (
              <form onSubmit={handleLaunch} className="space-y-5">

                {/* Detected info panel */}
                <div className="border cyber-chamfer-sm relative overflow-hidden"
                  style={{ borderColor: '#00ff8850', background: 'rgba(0,255,136,.03)' }}>

                  {/* Panel header */}
                  <div className="flex items-center gap-2 px-4 py-2 border-b"
                    style={{ borderColor: '#00ff8830', background: 'rgba(0,255,136,.05)' }}>
                    <span className="dot-green neon-pulse" />
                    <span className="text-neon text-xs font-orbitron tracking-[.2em] uppercase">訊號確認</span>
                    <span className="ml-auto text-dim text-xs font-orbitron">ID-{studentId}</span>
                  </div>

                  {/* Info grid */}
                  <div className="px-4 py-4 grid grid-cols-[80px_1fr] gap-x-4 gap-y-3 text-xs font-orbitron">
                    <span className="text-dim tracking-wider">部別</span>
                    <span className="text-fore">{parsed.division}</span>
                    <span className="text-dim tracking-wider">系所</span>
                    <span className="text-fore leading-relaxed">{parsed.deptName}</span>
                    <span className="text-dim tracking-wider">年級</span>
                    <span className="text-neon text-neon-glow font-black">{parsed.grade}</span>
                  </div>
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                    ▸ 艦員代號（暱稱）
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon text-sm select-none">&gt;</span>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => { setNickname(e.target.value); setError('') }}
                      placeholder="輸入你的暱稱..."
                      className="cyber-input cyber-chamfer-sm pl-8"
                      autoComplete="off"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                </div>

                {error && <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('id'); setError('') }}
                    className="cyber-btn-ghost cyber-chamfer-sm flex-none px-5"
                  >
                    ◀ 返回
                  </button>
                  <button
                    type="submit"
                    disabled={!nickname.trim()}
                    className="cyber-btn cyber-chamfer-sm flex-1 justify-center text-sm"
                  >
                    <span>▶▶</span> 開始測驗
                  </button>
                </div>
              </form>
            )}

            {/* Footer status */}
            <div className="mt-7 pt-5 border-t border-border flex items-center justify-between">
              <span className="text-dim text-xs">輔仁大學 ── 社團博覽會 2026</span>
              <div className="flex items-center gap-1.5">
                <span className="dot-green neon-pulse" />
                <span className="text-neon text-xs font-orbitron tracking-wider">就緒</span>
              </div>
            </div>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-neon" />
        <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-neon" />
        <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-neon" />
        <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-neon" />
      </div>
    </main>
  )
}
