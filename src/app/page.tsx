'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseStudentId, type ParsedStudentId } from '@/lib/student-id'
import { checkProfanity } from '@/lib/profanity'
import Leaderboard from '@/components/Leaderboard'

type Step = 'id' | 'returning' | 'confirm'

interface PrevSub { id: string; result: string; department: string; created_at: string }


export default function HomePage() {
  const router = useRouter()
  const [step, setStep]           = useState<Step>('id')
  const [studentId, setStudentId] = useState('')
  const [parsed, setParsed]       = useState<ParsedStudentId | null>(null)
  const [prevSub, setPrevSub]     = useState<PrevSub | null>(null)
  const [nickname, setNickname]   = useState('')
  const [error, setError]         = useState('')
  const [checking, setChecking]   = useState(false)

  async function handleIdSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = studentId.trim()
    const result = parseStudentId(id)
    if (!result) {
      setError('// 無法辨識學號，請確認是否為 9 位數日間部或進修部學號')
      return
    }
    setParsed(result)
    setError('')
    setChecking(true)
    try {
      const res = await fetch(`/api/check-student?studentId=${id}`)
      const data = await res.json()
      if (data.found) {
        setPrevSub(data.submission)
        setStep('returning')
      } else {
        setStep('confirm')
      }
    } catch {
      setStep('confirm')
    } finally {
      setChecking(false)
    }
  }

  function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('// 請輸入你的暱稱'); return }
    if (checkProfanity(nickname)) { setError('// 暱稱含有不適當字詞，請重新輸入'); return }
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

      <div className="w-full max-w-4xl relative z-10 fade-in-up flex flex-col lg:flex-row items-start gap-6 justify-center">

      {/* ── Leaderboard (right column on desktop) ── */}
      <div className="w-full lg:w-72 lg:order-2 shrink-0">
        <Leaderboard />
      </div>

      <div className="w-full max-w-lg lg:order-1">
        <div className="terminal-card cyber-chamfer panel-scan">
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: '#00ff88' }} />
            <span className="ml-3 text-dim text-xs tracking-widest font-orbitron uppercase flex-1">
              FJU-STELLAR-v2026
            </span>
            <span className="text-neon text-xs font-orbitron tracking-wider">SYS-OK</span>
          </div>

          {/* Cockpit instrument strip */}
          <div className="flex items-center gap-0 px-5 py-2.5 border-b border-border overflow-hidden">
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              {/* Engine output */}
              <div className="flex flex-col gap-0.5 min-w-[72px]">
                <span className="text-dim font-orbitron" style={{ fontSize: 8, letterSpacing: '0.12em' }}>引擎輸出</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-px">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-1.5 h-2.5 rounded-sm"
                        style={{ background: i <= 4 ? '#00ff88' : '#2a2a4a', boxShadow: i <= 4 ? '0 0 4px #00ff88' : 'none' }} />
                    ))}
                  </div>
                  <span className="text-neon font-orbitron" style={{ fontSize: 9 }}>82%</span>
                </div>
              </div>

              <div className="w-px h-6 bg-border shrink-0" />

              {/* Shield */}
              <div className="flex flex-col gap-0.5 min-w-[72px]">
                <span className="text-dim font-orbitron" style={{ fontSize: 8, letterSpacing: '0.12em' }}>護盾強度</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-px">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-1.5 h-2.5 rounded-sm"
                        style={{ background: i <= 5 ? '#00d4ff' : '#2a2a4a', boxShadow: i <= 5 ? '0 0 4px #00d4ff' : 'none' }} />
                    ))}
                  </div>
                  <span className="font-orbitron" style={{ fontSize: 9, color: '#00d4ff' }}>MAX</span>
                </div>
              </div>

              <div className="w-px h-6 bg-border shrink-0" />

              {/* Nav coordinates */}
              <div className="flex flex-col gap-0.5">
                <span className="text-dim font-orbitron" style={{ fontSize: 8, letterSpacing: '0.12em' }}>航行座標</span>
                <span className="font-orbitron" style={{ fontSize: 9, color: '#ffd700', letterSpacing: '0.08em' }}>
                  25°N · 121°E
                </span>
              </div>
            </div>

            {/* Status dot */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="dot-green neon-pulse" />
              <span className="text-neon font-orbitron" style={{ fontSize: 8, letterSpacing: '0.12em' }}>飛行就緒</span>
            </div>
          </div>

          <div className="p-7">
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

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-dim text-xs font-orbitron tracking-widest">
                {step === 'id' ? '第一步' : step === 'returning' ? '歡迎回來' : '第二步'}
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
                    disabled={studentId.length !== 9 || checking}
                    className="cyber-btn cyber-chamfer-sm w-full justify-center text-sm"
                  >
                    {checking
                      ? <span className="cyber-cursor">識別中</span>
                      : <><span>▶</span> 識別學號</>
                    }
                  </button>
                </div>
              </form>
            )}

            {/* ── RETURNING: previous result found ── */}
            {step === 'returning' && prevSub && parsed && (
              <div className="space-y-4">
                <div className="border cyber-chamfer-sm p-4"
                  style={{ borderColor: '#ffd70050', background: 'rgba(255,215,0,.03)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="dot-amber" />
                    <span className="text-xs font-orbitron tracking-wider" style={{ color: '#ffd700' }}>
                      偵測到你的歷史紀錄
                    </span>
                  </div>
                  <div className="grid grid-cols-[70px_1fr] gap-x-3 gap-y-2 text-xs font-orbitron">
                    <span className="text-dim">上次結果</span>
                    <span className="text-neon font-bold">{prevSub.result}</span>
                    <span className="text-dim">系級</span>
                    <span className="text-fore text-xs leading-relaxed">{parsed.deptName} {parsed.grade}</span>
                    <span className="text-dim">日期</span>
                    <span className="text-dim">{new Date(prevSub.created_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/result?id=${prevSub.id}`)}
                    className="cyber-btn-ghost cyber-chamfer-sm flex-1 justify-center text-xs"
                  >
                    查看上次結果
                  </button>
                  <button
                    onClick={() => { setPrevSub(null); setStep('confirm') }}
                    className="cyber-btn cyber-chamfer-sm flex-1 justify-center text-xs"
                    style={{ borderColor: '#ffd700', color: '#ffd700' }}
                  >
                    <span>▶</span> 重新測驗
                  </button>
                </div>

                <button
                  onClick={() => { setStep('id'); setError('') }}
                  className="text-dim text-xs font-orbitron tracking-wider w-full text-center pt-1"
                >
                  ← 重新輸入學號
                </button>
              </div>
            )}

            {/* ── STEP 2: Confirm + Nickname ── */}
            {step === 'confirm' && parsed && (
              <form onSubmit={handleLaunch} className="space-y-5">
                <div className="border cyber-chamfer-sm relative overflow-hidden"
                  style={{ borderColor: '#00ff8850', background: 'rgba(0,255,136,.03)' }}>
                  <div className="flex items-center gap-2 px-4 py-2 border-b"
                    style={{ borderColor: '#00ff8830', background: 'rgba(0,255,136,.05)' }}>
                    <span className="dot-green neon-pulse" />
                    <span className="text-neon text-xs font-orbitron tracking-[.2em] uppercase">訊號確認</span>
                    <span className="ml-auto text-dim text-xs font-orbitron">ID-{studentId}</span>
                  </div>
                  <div className="px-4 py-4 grid grid-cols-[80px_1fr] gap-x-4 gap-y-3 text-xs font-orbitron">
                    <span className="text-dim tracking-wider">部別</span>
                    <span className="text-fore">{parsed.division}</span>
                    <span className="text-dim tracking-wider">系所</span>
                    <span className="text-fore leading-relaxed">{parsed.deptName}</span>
                    <span className="text-dim tracking-wider">年級</span>
                    <span className="text-neon text-neon-glow font-black">{parsed.grade}</span>
                  </div>
                </div>

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

            <div className="mt-7 pt-5 border-t border-border flex items-center justify-between">
              <span className="text-dim text-xs">輔仁大學 ── 社團博覽會 2026</span>
              <div className="flex items-center gap-1.5">
                <span className="dot-green neon-pulse" />
                <span className="text-neon text-xs font-orbitron tracking-wider">就緒</span>
              </div>
            </div>
          </div>

          {/* Student ID lookup link */}
          <div className="px-7 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-dim font-orbitron tracking-widest">學號查詢</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-dim text-xs mb-2">不知道自己的學號？</p>
            <a
              href="https://smis.fju.edu.tw/DepartNew/query.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-btn-ghost cyber-chamfer-sm w-full justify-center text-xs"
            >
              🔍 前往輔大學號查詢系統
            </a>
          </div>
        </div>

        <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-neon" />
        <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-neon" />
        <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-neon" />
        <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-neon" />
      </div>

      </div>
    </main>
  )
}
