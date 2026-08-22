'use client'

import { useState, useEffect, useCallback } from 'react'

interface AuthRow    { student_id: string; email: string; display_name: string | null; is_active?: boolean }
interface AccountRow { student_id: string; is_active: boolean; last_login: string | null; created_at: string }
interface Report     { id: string; student_id: string | null; page: string; description: string; status: string; created_at: string }

const STATUS_COLOR: Record<string, string> = {
  open:      '#ff3366',
  resolved:  '#00ff88',
  dismissed: '#3a3a5a',
}

const STATUS_LABEL: Record<string, string> = {
  open:      '待處理',
  resolved:  '已解決',
  dismissed: '已忽略',
}

export default function SuperPanel() {
  const [tab, setTab] = useState<'admins' | 'reports'>('admins')

  const [auths, setAuths]       = useState<AuthRow[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [reports, setReports]   = useState<Report[]>([])
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState('')

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/super/accounts')
    const data = await res.json()
    setAuths(data.auths ?? [])
    setAccounts(data.accounts ?? [])
    setLoading(false)
  }, [])

  const loadReports = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/super/reports')
    const data = await res.json()
    setReports(data.reports ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  useEffect(() => {
    if (tab === 'reports') loadReports()
  }, [tab, loadReports])

  async function toggleActive(studentId: string, current: boolean) {
    await fetch('/api/admin/super/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, is_active: !current }),
    })
    flash(!current ? `✓ 已啟用 ${studentId}` : `✓ 已停用 ${studentId}`)
    loadAccounts()
  }

  async function sendReset(studentId: string) {
    const res = await fetch('/api/admin/super/reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
    const data = await res.json()
    if (data.ok) flash(`✓ 已發送重置信件至 ${data.email}`)
    else flash(`✗ ${data.error}`)
  }

  async function updateReportStatus(id: string, status: string) {
    await fetch('/api/admin/super/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const merged = auths.map(a => ({
    ...a,
    account: accounts.find(ac => ac.student_id === a.student_id),
  }))

  const openCount = reports.filter(r => r.status === 'open').length

  return (
    <div className="terminal-card cyber-chamfer">
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: '#ffd700' }} />
        <span className="terminal-dot" style={{ background: '#ffd700', opacity: .5 }} />
        <span className="terminal-dot" style={{ background: '#ffd700', opacity: .25 }} />
        <span className="ml-3 text-xs font-orbitron tracking-widest flex-1" style={{ color: '#ffd700' }}>
          SUPER ADMIN · 系統管理
        </span>
        {msg && <span className="text-xs font-orbitron" style={{ color: '#00ff88' }}>{msg}</span>}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          { id: 'admins',  label: '管理員帳號' },
          { id: 'reports', label: `問題回報${openCount > 0 ? ` (${openCount})` : ''}` },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 text-xs font-orbitron tracking-wider transition-all"
            style={{
              color:        tab === t.id ? '#ffd700' : '#3a3a5a',
              borderBottom: tab === t.id ? '2px solid #ffd700' : '2px solid transparent',
              background:   tab === t.id ? 'rgba(255,215,0,.05)' : 'transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {loading && (
          <p className="text-center text-xs font-orbitron" style={{ color: '#3a3a5a' }}>
            <span className="cyber-cursor">載入中</span>
          </p>
        )}

        {/* ── Admin accounts tab ── */}
        {tab === 'admins' && !loading && (
          <div className="space-y-3">
            {merged.length === 0 && (
              <p className="text-xs font-orbitron text-center" style={{ color: '#3a3a5a' }}>尚無資料</p>
            )}
            {merged.map(row => {
              const active = row.account?.is_active ?? true
              return (
                <div
                  key={row.student_id}
                  className="border cyber-chamfer-sm p-4"
                  style={{ borderColor: active ? '#00ff8820' : '#ff336620', background: active ? 'rgba(0,255,136,.02)' : 'rgba(255,51,102,.02)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: active ? '#00ff88' : '#ff3366', boxShadow: active ? '0 0 4px #00ff88' : '0 0 4px #ff3366' }}
                        />
                        <span className="text-xs font-orbitron font-bold text-fore">{row.student_id}</span>
                        {row.display_name && (
                          <span className="text-xs font-orbitron" style={{ color: '#4a4a6a' }}>· {row.display_name}</span>
                        )}
                      </div>
                      <p className="text-xs font-orbitron ml-3.5" style={{ color: '#4a4a6a' }}>{row.email}</p>
                      {row.account?.last_login && (
                        <p className="text-xs font-orbitron ml-3.5 mt-0.5" style={{ color: '#2a2a4a' }}>
                          上次登入：{new Date(row.account.last_login).toLocaleString('zh-TW')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => sendReset(row.student_id)}
                        className="text-xs font-orbitron px-2.5 py-1 border cyber-chamfer-sm transition-all hover:opacity-80"
                        style={{ borderColor: '#00d4ff40', color: '#00d4ff', background: 'rgba(0,212,255,.05)' }}
                      >
                        重置密碼
                      </button>
                      <button
                        onClick={() => toggleActive(row.student_id, active)}
                        className="text-xs font-orbitron px-2.5 py-1 border cyber-chamfer-sm transition-all hover:opacity-80"
                        style={{
                          borderColor: active ? '#ff336640' : '#00ff8840',
                          color:       active ? '#ff3366'   : '#00ff88',
                          background:  active ? 'rgba(255,51,102,.05)' : 'rgba(0,255,136,.05)',
                        }}
                      >
                        {active ? '停用' : '啟用'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Reports tab ── */}
        {tab === 'reports' && !loading && (
          <div className="space-y-3">
            {reports.length === 0 && (
              <p className="text-xs font-orbitron text-center" style={{ color: '#3a3a5a' }}>尚無回報</p>
            )}
            {reports.map(r => (
              <div
                key={r.id}
                className="border cyber-chamfer-sm p-4"
                style={{ borderColor: `${STATUS_COLOR[r.status]}20`, background: `${STATUS_COLOR[r.status]}05` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-orbitron px-1.5 py-0.5 rounded"
                      style={{ color: STATUS_COLOR[r.status], background: `${STATUS_COLOR[r.status]}15`, border: `1px solid ${STATUS_COLOR[r.status]}30` }}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                    <span className="text-xs font-orbitron" style={{ color: '#4a4a6a' }}>
                      {r.page} · {r.student_id ?? '匿名'}
                    </span>
                  </div>
                  <span className="text-xs font-orbitron shrink-0" style={{ color: '#2a2a4a' }}>
                    {new Date(r.created_at).toLocaleString('zh-TW')}
                  </span>
                </div>
                <p className="text-xs font-orbitron leading-relaxed mb-3" style={{ color: '#9a9aaa' }}>
                  {r.description}
                </p>
                {r.status === 'open' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateReportStatus(r.id, 'resolved')}
                      className="text-xs font-orbitron px-2.5 py-1 border cyber-chamfer-sm"
                      style={{ borderColor: '#00ff8840', color: '#00ff88', background: 'rgba(0,255,136,.05)' }}
                    >
                      標記已解決
                    </button>
                    <button
                      onClick={() => updateReportStatus(r.id, 'dismissed')}
                      className="text-xs font-orbitron px-2.5 py-1 border cyber-chamfer-sm"
                      style={{ borderColor: '#3a3a5a', color: '#4a4a6a', background: 'transparent' }}
                    >
                      忽略
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
