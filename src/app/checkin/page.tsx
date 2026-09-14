'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CLUB_RESULTS } from '@/lib/results'
import ClubIcon from '@/components/ClubIcon'

interface SubmissionData {
  id: string
  result: string
  department: string
  student_id: string
}

interface CheckinStatus {
  isCheckedIn: boolean
  lockedResult: string | null
  checkedInAt: string | null
}

function CheckinContent() {
  const params       = useSearchParams()
  const submissionId = params.get('id') ?? ''
  const token        = params.get('t') ?? ''

  const [submission, setSubmission]     = useState<SubmissionData | null>(null)
  const [status, setStatus]             = useState<CheckinStatus | null>(null)
  const [loading, setLoading]           = useState(true)
  const [invalid, setInvalid]           = useState(false)
  const [staffCode, setStaffCode]       = useState('')
  const [confirming, setConfirming]     = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [justConfirmed, setJustConfirmed] = useState(false)

  useEffect(() => {
    if (!submissionId || !token) { setInvalid(true); setLoading(false); return }

    Promise.all([
      fetch(`/api/result?id=${submissionId}`).then(r => r.json()),
      fetch(`/api/checkin/token?submissionId=${submissionId}`).then(r => r.json()),
    ]).then(([sub, ci]) => {
      if (sub.error) { setInvalid(true); setLoading(false); return }
      setSubmission(sub)
      setStatus({ isCheckedIn: ci.isCheckedIn, lockedResult: ci.lockedResult, checkedInAt: ci.checkedInAt })
      setLoading(false)
    }).catch(() => { setInvalid(true); setLoading(false) })
  }, [submissionId, token])

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!staffCode.trim()) return
    setConfirming(true)
    setConfirmError('')
    try {
      const res = await fetch('/api/checkin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, token, staffCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setStatus(s => s ? { ...s, isCheckedIn: true, lockedResult: data.lockedResult } : s)
          setConfirmError('此學生已完成簽到')
        } else {
          setConfirmError(data.error ?? '確認失敗，請重試')
        }
      } else {
        setJustConfirmed(true)
        setStatus({ isCheckedIn: true, lockedResult: data.lockedResult, checkedInAt: new Date().toISOString() })
        setStaffCode('')
      }
    } catch {
      setConfirmError('網路錯誤，請重試')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return (
    <main className="min-h-screen cyber-grid flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-2 h-2 bg-neon rounded-full inline-block neon-pulse" />
        <p className="text-neon text-xs font-orbitron tracking-widest cyber-cursor">驗證 QR Code 中</p>
      </div>
    </main>
  )

  if (invalid || !submission) return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4">
      <div className="terminal-card cyber-chamfer max-w-sm w-full p-8 text-center">
        <p className="text-danger text-2xl mb-3">⚠</p>
        <p className="text-danger text-sm font-orbitron tracking-wider mb-6">QR Code 無效或已失效</p>
        <Link href="/" className="cyber-btn cyber-chamfer-sm text-xs w-full justify-center">
          ◀ 返回首頁
        </Link>
      </div>
    </main>
  )

  const isCheckedIn  = status?.isCheckedIn ?? false
  const lockedResult = status?.lockedResult ?? submission.result
  const clubInfo     = CLUB_RESULTS[lockedResult]

  return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 pointer-events-none"
        style={{ background: isCheckedIn
          ? 'radial-gradient(ellipse, rgba(255,215,0,.08) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, rgba(0,255,136,.08) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10 space-y-4 fade-in-up">
        {/* Status header */}
        <div className="terminal-card cyber-chamfer-sm px-5 py-3 flex items-center gap-3">
          <span className={isCheckedIn ? 'dot-amber' : 'dot-green'} style={{ ...(isCheckedIn ? {} : { animation: 'none' }) }} />
          <span className="font-orbitron text-xs tracking-[.2em]"
            style={{ color: isCheckedIn ? '#ffd700' : '#00ff88' }}>
            {isCheckedIn ? '簽到完成' : '掃描驗證成功'}
          </span>
          <span className="ml-auto text-dim text-xs font-orbitron">SYS-OK</span>
        </div>

        {/* Main card */}
        <div className="terminal-card cyber-chamfer panel-scan relative overflow-hidden">
          <div className="h-0.5 w-full"
            style={{ background: isCheckedIn
              ? 'linear-gradient(90deg, transparent, #ffd700, transparent)'
              : 'linear-gradient(90deg, transparent, #00ff88, transparent)' }} />
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: isCheckedIn ? '#ffd700' : '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ffd700' }} />
            <span className="terminal-dot" style={{ background: isCheckedIn ? '#ffd700' : '#00ff88' }} />
            <span className="ml-3 text-dim text-xs font-orbitron uppercase tracking-widest">
              {isCheckedIn ? 'STELLAR-CHECKIN-LOCKED' : 'STELLAR-CHECKIN-VERIFY'}
            </span>
          </div>

          <div className="p-7 space-y-6">
            {/* Result display */}
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full pointer-events-none"
                    style={{ background: isCheckedIn
                      ? 'radial-gradient(circle, rgba(255,215,0,.15) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(0,255,136,.15) 0%, transparent 70%)' }} />
                  <ClubIcon category={lockedResult} size={64} />
                </div>
              </div>
              <p className="text-dim text-xs font-orbitron tracking-[.25em] uppercase mb-2">適性星球</p>
              <h2 className="font-orbitron font-black text-xl tracking-widest mb-1"
                style={{ color: isCheckedIn ? '#ffd700' : '#00ff88',
                         textShadow: isCheckedIn ? '0 0 12px rgba(255,215,0,.7)' : '0 0 12px rgba(0,255,136,.7)' }}>
                {lockedResult}
              </h2>
              <p className="text-dim text-xs leading-relaxed max-w-xs mx-auto">
                {clubInfo?.description?.slice(0, 60)}…
              </p>
            </div>

            {/* Student info */}
            <div className="border cyber-chamfer-sm p-4 space-y-2"
              style={{ borderColor: isCheckedIn ? 'rgba(255,215,0,.2)' : 'rgba(0,255,136,.15)',
                       background: isCheckedIn ? 'rgba(255,215,0,.03)' : 'rgba(0,255,136,.03)' }}>
              <div className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-2 text-xs font-orbitron">
                <span className="text-dim tracking-wider">系所</span>
                <span className="text-fore leading-relaxed">{submission.department}</span>
                <span className="text-dim tracking-wider">學號</span>
                <span className="text-fore">{submission.student_id.slice(0, 3)}••••{submission.student_id.slice(-2)}</span>
              </div>
              {isCheckedIn && status?.checkedInAt && (
                <div className="pt-2 border-t flex justify-between text-xs font-orbitron"
                  style={{ borderColor: 'rgba(255,215,0,.15)', color: '#ffd700' }}>
                  <span className="text-dim">簽到時間</span>
                  <span>{new Date(status.checkedInAt).toLocaleString('zh-TW')}</span>
                </div>
              )}
            </div>

            {/* Already checked in */}
            {isCheckedIn && (
              <div className="text-center space-y-2 py-2">
                <div className="text-4xl" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,.6)' }}>
                  {justConfirmed ? '✓' : '🔒'}
                </div>
                <p className="font-orbitron font-black tracking-widest"
                  style={{ color: '#ffd700' }}>
                  {justConfirmed ? '簽到成功！' : '已完成簽到'}
                </p>
                <p className="text-dim text-xs font-orbitron tracking-wider">
                  {justConfirmed ? '請領取你的結果貼紙 ◈' : '此學生已完成簽到，無法再次掃描'}
                </p>
              </div>
            )}

            {/* Staff confirm form */}
            {!isCheckedIn && (
              <form onSubmit={handleConfirm} className="space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-dim text-xs font-orbitron tracking-widest">工作人員確認</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div>
                  <label className="block text-xs text-dim font-orbitron uppercase tracking-[.15em] mb-2">
                    ▸ 工作人員代碼
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon text-sm select-none">&gt;</span>
                    <input
                      type="password"
                      value={staffCode}
                      onChange={e => { setStaffCode(e.target.value); setConfirmError('') }}
                      placeholder="輸入工作人員代碼..."
                      className="cyber-input cyber-chamfer-sm pl-8"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {confirmError && (
                  <p className="text-danger text-xs font-orbitron tracking-wider">{confirmError}</p>
                )}

                <button
                  type="submit"
                  disabled={!staffCode.trim() || confirming}
                  className="cyber-btn cyber-chamfer-sm w-full justify-center"
                >
                  {confirming
                    ? <span className="cyber-cursor">確認中</span>
                    : <><span>✓</span> 確認簽到</>
                  }
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-dim text-xs font-orbitron tracking-wider hover:text-neon transition-colors">
            ← 返回首頁
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen cyber-grid flex items-center justify-center">
        <p className="text-neon text-xs font-orbitron cyber-cursor">驗證中</p>
      </main>
    }>
      <CheckinContent />
    </Suspense>
  )
}
