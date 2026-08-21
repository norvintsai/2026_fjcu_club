'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OtpInput, type OtpInputHandle, type OtpStatus } from '@/components/ui/otp-input'

type Step = 'id' | 'otp' | 'set-pin' | 'pin'

export default function AdminLoginPage() {
  const router = useRouter()

  const [step, setStep]           = useState<Step>('id')
  const [studentId, setStudentId] = useState('')
  const [maskedEmail, setMasked]  = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [countdown, setCountdown] = useState(0)

  // OTP step
  const otpRef    = useRef<OtpInputHandle>(null)
  const [otpVal, setOtpVal]     = useState('')
  const [otpStatus, setOtpStatus] = useState<OtpStatus>('idle')

  // PIN step (login)
  const pinRef    = useRef<OtpInputHandle>(null)
  const [pinStatus, setPinStatus] = useState<OtpStatus>('idle')

  // Set-PIN step
  const setPinRef    = useRef<OtpInputHandle>(null)
  const setPinCfmRef = useRef<OtpInputHandle>(null)
  const [newPin, setNewPin]   = useState('')
  const [cfmPin, setCfmPin]   = useState('')
  const [setPinStatus, setSetPinStatus] = useState<OtpStatus>('idle')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startCountdown(s = 60) {
    setCountdown(s)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  /* ── Step 1: Check student ID ── */
  async function handleCheckId(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      setMasked(data.maskedEmail)

      if (data.status === 'registered') {
        setStep('pin')
      } else {
        await doSendOtp()
        setStep('otp')
      }
    } catch {
      setError('連線失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  /* ── Send / Resend OTP ── */
  async function doSendOtp() {
    const res  = await fetch('/api/admin/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    if (data.maskedEmail) setMasked(data.maskedEmail)
    startCountdown(60)
  }

  async function handleResendOtp() {
    setError('')
    setLoading(true)
    otpRef.current?.clear()
    setOtpStatus('idle')
    try {
      await doSendOtp()
    } catch (err) {
      setError(err instanceof Error ? err.message : '寄送失敗')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2A: Verify OTP (auto on complete) ── */
  async function handleVerifyOtp(code: string) {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOtpStatus('error')
        setTimeout(() => { otpRef.current?.clear(); setOtpStatus('idle') }, 1400)
        setError(data.error)
        return
      }
      setOtpStatus('success')
      setTimeout(() => setStep('set-pin'), 600)
    } catch {
      setOtpStatus('error')
      setTimeout(() => { otpRef.current?.clear(); setOtpStatus('idle') }, 1400)
      setError('連線失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 3: Set PIN ── */
  async function handleSetPin() {
    if (newPin.length !== 6) return
    if (newPin !== cfmPin) {
      setSetPinStatus('error')
      setTimeout(() => { setPinCfmRef.current?.clear(); setCfmPin(''); setSetPinStatus('idle') }, 1400)
      setError('兩次輸入的密碼不一致')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSetPinStatus('error')
        setTimeout(() => setSetPinStatus('idle'), 1400)
        setError(data.error)
        return
      }
      setSetPinStatus('success')
      setTimeout(() => router.push('/admin/dashboard'), 500)
    } catch {
      setError('連線失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2B: Login with PIN (auto on complete) ── */
  async function handleLogin(pin: string) {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPinStatus('error')
        setTimeout(() => { pinRef.current?.clear(); setPinStatus('idle') }, 1400)
        setError(data.error)
        return
      }
      setPinStatus('success')
      setTimeout(() => router.push('/admin/dashboard'), 500)
    } catch {
      setPinStatus('error')
      setTimeout(() => { pinRef.current?.clear(); setPinStatus('idle') }, 1400)
      setError('連線失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  const stepLabel = {
    'id':      '身份確認',
    'otp':     '電子信驗證',
    'set-pin': '設定登入密碼',
    'pin':     '密碼登入',
  }[step]

  return (
    <main className="min-h-screen cyber-grid flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5"
        style={{ background: 'linear-gradient(90deg, transparent, #ff3366, transparent)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,51,102,.04) 0%, transparent 60%)' }} />

      <div className="w-full max-w-sm relative z-10 fade-in-up">
        <div className="terminal-card cyber-chamfer relative">
          <div className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #ff3366, transparent)' }} />

          {/* Terminal header */}
          <div className="terminal-header">
            <span className="terminal-dot" style={{ background: '#ff3366' }} />
            <span className="terminal-dot" style={{ background: '#ff3366', opacity: .5 }} />
            <span className="terminal-dot" style={{ background: '#ff3366', opacity: .25 }} />
            <span className="ml-3 text-danger text-xs tracking-widest font-orbitron uppercase flex-1">
              Command Center
            </span>
            <span className="text-xs font-orbitron tracking-wider" style={{ color: '#4a4a6a' }}>
              {stepLabel}
            </span>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="mb-4 flex justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <polygon points="20,2 38,11 38,29 20,38 2,29 2,11"
                    stroke="#ff3366" strokeWidth="1.2" fill="none"/>
                  <polygon points="20,8 32,14.5 32,25.5 20,32 8,25.5 8,14.5"
                    stroke="#ff3366" strokeWidth="0.7" opacity="0.4" fill="none"/>
                  <circle cx="20" cy="20" r="4" fill="#ff3366" opacity="0.9"/>
                </svg>
              </div>
              <h1 className="font-orbitron font-black text-lg uppercase tracking-widest text-fore mb-1.5">
                資料分析中心
              </h1>
              <p className="text-xs font-orbitron tracking-[.15em]" style={{ color: '#4a4a6a' }}>
                FJU STELLAR · 籌備人員專用
              </p>
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-1 mb-8">
              {(['id', 'otp', 'set-pin'] as const).map((s, i) => {
                const steps: Step[] = ['id', 'otp', 'set-pin', 'pin']
                const current = steps.indexOf(step)
                const thisIdx = ['id', 'otp', 'set-pin'].indexOf(s)
                const done    = current > thisIdx && step !== 'pin'
                const active  = s === step
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ background: done || active ? '#ff3366' : '#2a2a3a',
                               boxShadow: active ? '0 0 6px #ff3366' : 'none' }} />
                    {i < 2 && <div className="flex-1 h-px" style={{ background: done ? '#ff3366' : '#2a2a3a' }} />}
                  </div>
                )
              })}
            </div>

            {/* ── STEP ID ── */}
            {step === 'id' && (
              <form onSubmit={handleCheckId} className="space-y-5">
                <div>
                  <label className="block text-xs font-orbitron uppercase tracking-[.15em] mb-2"
                    style={{ color: '#4a4a6a' }}>
                    ▸ 學號
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none"
                      style={{ color: '#ff3366' }}>&gt;</span>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => { setStudentId(e.target.value.replace(/\D/g, '').slice(0, 9)); setError('') }}
                      placeholder="輸入 9 位數學號..."
                      className="cyber-input cyber-chamfer-sm pl-8"
                      style={{ color: '#ff9999' }}
                      inputMode="numeric" maxLength={9} autoFocus
                    />
                  </div>
                </div>
                {error && <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>}
                <button
                  type="submit"
                  disabled={studentId.length !== 9 || loading}
                  className="w-full py-3 font-orbitron text-xs font-bold tracking-[.15em] uppercase cyber-chamfer-sm transition-all"
                  style={{
                    background: 'transparent', border: '2px solid #ff3366', color: '#ff3366',
                    opacity: studentId.length !== 9 || loading ? .5 : 1,
                    cursor:  studentId.length !== 9 || loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? <span className="cyber-cursor">驗證中</span> : '▶ 確認身份'}
                </button>
              </form>
            )}

            {/* ── STEP OTP ── */}
            {step === 'otp' && (
              <div className="space-y-5">
                <div className="border cyber-chamfer-sm p-3 text-xs font-orbitron"
                  style={{ borderColor: '#ff336640', background: 'rgba(255,51,102,.03)', color: '#4a4a6a' }}>
                  <span className="block mb-1" style={{ color: '#ff3366' }}>▸ 驗證碼已寄送至</span>
                  <span style={{ color: '#c0c0d0' }}>{maskedEmail}</span>
                </div>

                <div>
                  <label className="block text-xs font-orbitron uppercase tracking-[.15em] mb-4"
                    style={{ color: '#4a4a6a' }}>
                    ▸ 輸入 6 位驗證碼
                  </label>
                  <div className="flex justify-center">
                    <OtpInput
                      ref={otpRef}
                      length={6}
                      status={otpStatus}
                      autoFocus
                      disabled={loading}
                      onChange={setOtpVal}
                      onComplete={handleVerifyOtp}
                      errorMessage="驗證碼錯誤或已過期"
                      successMessage="驗證成功 ✓"
                      hint={loading ? "驗證中..." : "輸入後自動送出"}
                    />
                  </div>
                </div>

                {error && <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('id'); setOtpVal(''); setError(''); setOtpStatus('idle') }}
                    className="text-xs font-orbitron tracking-wider"
                    style={{ color: '#4a4a6a' }}
                  >
                    ← 重新輸入學號
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className="text-xs font-orbitron tracking-wider"
                    style={{ color: countdown > 0 ? '#4a4a6a' : '#ff3366', cursor: countdown > 0 ? 'default' : 'pointer' }}
                  >
                    {countdown > 0 ? `重新寄送 (${countdown}s)` : '重新寄送驗證碼'}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP SET-PIN ── */}
            {step === 'set-pin' && (
              <div className="space-y-6">
                <p className="text-xs font-orbitron tracking-wider" style={{ color: '#6a6a8a' }}>
                  驗證成功。請設定你的 6 位數字登入密碼，之後登入時使用。
                </p>

                <div>
                  <label className="block text-xs font-orbitron uppercase tracking-[.15em] mb-4"
                    style={{ color: '#4a4a6a' }}>▸ 設定密碼</label>
                  <div className="flex justify-center">
                    <OtpInput
                      ref={setPinRef}
                      length={6}
                      mask
                      autoFocus
                      disabled={loading}
                      onChange={setNewPin}
                      onComplete={() => setPinCfmRef.current?.focus()}
                      hint="輸入後請繼續確認密碼"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-orbitron uppercase tracking-[.15em] mb-4"
                    style={{ color: '#4a4a6a' }}>▸ 確認密碼</label>
                  <div className="flex justify-center">
                    <OtpInput
                      ref={setPinCfmRef}
                      length={6}
                      mask
                      status={setPinStatus}
                      disabled={loading}
                      onChange={setCfmPin}
                      onComplete={handleSetPin}
                      errorMessage="兩次密碼不一致"
                      successMessage="設定成功，正在登入..."
                      hint="輸入後自動完成設定"
                    />
                  </div>
                </div>

                {error && <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>}
              </div>
            )}

            {/* ── STEP PIN (returning user) ── */}
            {step === 'pin' && (
              <div className="space-y-5">
                <div className="border cyber-chamfer-sm p-3 text-xs font-orbitron"
                  style={{ borderColor: '#ff336640', background: 'rgba(255,51,102,.03)' }}>
                  <span style={{ color: '#4a4a6a' }}>學號：</span>
                  <span style={{ color: '#c0c0d0' }}>{studentId}</span>
                </div>

                <div>
                  <label className="block text-xs font-orbitron uppercase tracking-[.15em] mb-4"
                    style={{ color: '#4a4a6a' }}>▸ 6 位數字密碼</label>
                  <div className="flex justify-center">
                    <OtpInput
                      ref={pinRef}
                      length={6}
                      mask
                      status={pinStatus}
                      autoFocus
                      disabled={loading}
                      onComplete={handleLogin}
                      errorMessage="密碼錯誤"
                      successMessage="登入成功 ✓"
                      hint={loading ? "驗證中..." : "輸入後自動登入"}
                    />
                  </div>
                </div>

                {error && <p className="text-danger text-xs font-orbitron tracking-wider">{error}</p>}

                <button
                  type="button"
                  onClick={() => { setStep('id'); setPinStatus('idle'); setError('') }}
                  className="w-full text-xs font-orbitron tracking-wider text-center"
                  style={{ color: '#4a4a6a' }}
                >
                  ← 重新輸入學號
                </button>
              </div>
            )}

            <p className="text-center text-xs mt-8 font-orbitron tracking-wider" style={{ color: '#2a2a4a' }}>
              FJU STELLAR · 2026 · 籌備團隊專用
            </p>
          </div>
        </div>

        <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-danger" />
        <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-danger" />
        <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-danger" />
        <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-danger" />
      </div>
    </main>
  )
}
