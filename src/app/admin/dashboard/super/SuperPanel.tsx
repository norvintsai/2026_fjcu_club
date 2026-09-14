'use client'

import { useState, useEffect, useCallback } from 'react'

interface AuthRow {
  student_id:     string
  email:          string
  display_name:   string | null
  is_super_admin: boolean
}
interface AccountRow {
  student_id:           string
  is_active:            boolean
  last_login:           string | null
  created_at:           string
  must_change_password: boolean
}
interface MergedRow extends AuthRow {
  account?: AccountRow
}
interface Report {
  id:          string
  description: string
  status:      string
  created_at:  string
}

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

const FIELD_STYLE = {
  background:  'rgba(0,212,255,.05)',
  border:      '1px solid #00d4ff30',
  borderRadius: 4,
  color:       '#e0e0ff',
  padding:     '4px 8px',
  fontSize:    12,
  fontFamily:  'var(--font-orbitron, monospace)',
  width:       '100%',
  outline:     'none',
}

export default function SuperPanel() {
  const [tab, setTab]         = useState<'admins' | 'reports'>('admins')
  const [auths, setAuths]     = useState<AuthRow[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')

  // Add-admin form
  const [showAdd, setShowAdd]   = useState(false)
  const [addForm, setAddForm]   = useState({ studentId: '', displayName: '', email: '', phone: '' })
  const [addBusy, setAddBusy]   = useState(false)

  // Edit-admin inline state
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editForm, setEditForm]     = useState({ display_name: '', email: '' })
  const [editBusy, setEditBusy]     = useState(false)

  // Delete confirmation
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  // Force-reset phone input
  const [resetId, setResetId]     = useState<string | null>(null)
  const [resetPhone, setResetPhone] = useState('')

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/super/accounts')
    const data = await res.json()
    setAuths(data.auths ?? [])
    setAccounts(data.accounts ?? [])
    setLoading(false)
  }, [])

  const loadReports = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/super/reports')
    const data = await res.json()
    setReports(data.reports ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])
  useEffect(() => { if (tab === 'reports') loadReports() }, [tab, loadReports])

  // ── Actions ──────────────────────────────────────────────

  async function toggleActive(studentId: string, current: boolean) {
    await fetch('/api/admin/super/accounts', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId, is_active: !current }),
    })
    flash(!current ? `✓ 已啟用 ${studentId}` : `✓ 已停用 ${studentId}`)
    loadAccounts()
  }

  async function sendReset(studentId: string) {
    const res  = await fetch('/api/admin/super/reset-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId }),
    })
    const data = await res.json()
    if (data.ok) flash(`✓ 已發送重置信件至 ${data.email}`)
    else         flash(`✗ ${data.error}`)
  }

  async function handleForceReset(studentId: string) {
    const res  = await fetch('/api/admin/super/accounts', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId, forceReset: true, phone: resetPhone || undefined }),
    })
    const data = await res.json()
    if (data.ok) { flash(`✓ 已強制重設 ${studentId} 密碼`); setResetId(null); setResetPhone('') }
    else          flash(`✗ ${data.error}`)
    loadAccounts()
  }

  async function handleEditSave(studentId: string) {
    setEditBusy(true)
    await fetch('/api/admin/super/accounts', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId, ...editForm }),
    })
    flash(`✓ 已更新 ${studentId} 資料`)
    setEditingId(null)
    setEditBusy(false)
    loadAccounts()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddBusy(true)
    const res  = await fetch('/api/admin/super/accounts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        studentId:   addForm.studentId,
        displayName: addForm.displayName,
        email:       addForm.email || undefined,
        phone:       addForm.phone || undefined,
      }),
    })
    const data = await res.json()
    if (data.ok) {
      flash(`✓ 已新增帳號 ${addForm.studentId}`)
      setAddForm({ studentId: '', displayName: '', email: '', phone: '' })
      setShowAdd(false)
      loadAccounts()
    } else {
      flash(`✗ ${data.error}`)
    }
    setAddBusy(false)
  }

  async function handleDelete(studentId: string) {
    const res  = await fetch('/api/admin/super/accounts', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId }),
    })
    const data = await res.json()
    if (data.ok) { flash(`✓ 已刪除 ${studentId}`); loadAccounts() }
    else          flash(`✗ ${data.error}`)
    setConfirmDel(null)
  }

  async function updateReportStatus(id: string, status: string) {
    await fetch('/api/admin/super/reports', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status }),
    })
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const merged: MergedRow[] = auths.map(a => ({
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
          { id: 'admins',  label: `管理員帳號 (${auths.length})` },
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
            {/* Add admin button */}
            <button
              onClick={() => setShowAdd(v => !v)}
              className="w-full py-2 text-xs font-orbitron border cyber-chamfer-sm transition-all hover:opacity-80"
              style={{ borderColor: '#ffd70040', color: '#ffd700', background: 'rgba(255,215,0,.04)' }}
            >
              {showAdd ? '✕ 取消新增' : '+ 新增管理員帳號'}
            </button>

            {/* Add admin form */}
            {showAdd && (
              <form
                onSubmit={handleAdd}
                className="border cyber-chamfer-sm p-4 space-y-3"
                style={{ borderColor: '#ffd70030', background: 'rgba(255,215,0,.03)' }}
              >
                <p className="text-xs font-orbitron" style={{ color: '#ffd700' }}>新增帳號</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-orbitron mb-1 block" style={{ color: '#4a4a6a' }}>學號 *</label>
                    <input
                      style={FIELD_STYLE}
                      placeholder="9位數字"
                      value={addForm.studentId}
                      onChange={e => setAddForm(f => ({ ...f, studentId: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-orbitron mb-1 block" style={{ color: '#4a4a6a' }}>姓名 *</label>
                    <input
                      style={FIELD_STYLE}
                      placeholder="顯示名稱"
                      value={addForm.displayName}
                      onChange={e => setAddForm(f => ({ ...f, displayName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-orbitron mb-1 block" style={{ color: '#4a4a6a' }}>Email（選填）</label>
                    <input
                      style={FIELD_STYLE}
                      type="email"
                      placeholder="留空自動填入學校信箱"
                      value={addForm.email}
                      onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-orbitron mb-1 block" style={{ color: '#4a4a6a' }}>電話（初始密碼）</label>
                    <input
                      style={FIELD_STYLE}
                      placeholder="電話號碼（選填）"
                      value={addForm.phone}
                      onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addBusy}
                  className="w-full py-1.5 text-xs font-orbitron border cyber-chamfer-sm transition-all hover:opacity-80"
                  style={{ borderColor: '#ffd70060', color: '#ffd700', background: 'rgba(255,215,0,.08)' }}
                >
                  {addBusy ? '新增中…' : '確認新增'}
                </button>
              </form>
            )}

            {merged.length === 0 && (
              <p className="text-xs font-orbitron text-center" style={{ color: '#3a3a5a' }}>尚無資料</p>
            )}

            {merged.map(row => {
              const active      = row.account?.is_active ?? true
              const mustChange  = row.account?.must_change_password ?? false
              const isEditing   = editingId === row.student_id
              const isResetting = resetId   === row.student_id
              const isDeleting  = confirmDel === row.student_id

              return (
                <div
                  key={row.student_id}
                  className="border cyber-chamfer-sm p-4"
                  style={{
                    borderColor: active ? '#00ff8820' : '#ff336620',
                    background:  active ? 'rgba(0,255,136,.02)' : 'rgba(255,51,102,.02)',
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background:  active ? '#00ff88' : '#ff3366',
                            boxShadow:   active ? '0 0 4px #00ff88' : '0 0 4px #ff3366',
                          }}
                        />
                        <span className="text-xs font-orbitron font-bold text-fore">{row.student_id}</span>
                        {row.is_super_admin && (
                          <span className="text-xs font-orbitron px-1.5 py-0.5 rounded" style={{ color: '#ffd700', background: 'rgba(255,215,0,.1)', border: '1px solid #ffd70030' }}>
                            SUPER
                          </span>
                        )}
                        {mustChange && (
                          <span className="text-xs font-orbitron px-1.5 py-0.5 rounded" style={{ color: '#ff9900', background: 'rgba(255,153,0,.1)', border: '1px solid #ff990030' }}>
                            待改密碼
                          </span>
                        )}
                      </div>
                      {!isEditing && (
                        <>
                          <p className="text-xs font-orbitron ml-3.5 mt-0.5" style={{ color: '#8080a0' }}>
                            {row.display_name ?? '—'}
                          </p>
                          <p className="text-xs font-orbitron ml-3.5" style={{ color: '#4a4a6a' }}>{row.email}</p>
                        </>
                      )}
                      {row.account?.last_login && !isEditing && (
                        <p className="text-xs font-orbitron ml-3.5 mt-0.5" style={{ color: '#2a2a4a' }}>
                          上次登入：{new Date(row.account.last_login).toLocaleString('zh-TW')}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    {!isEditing && !isResetting && !isDeleting && (
                      <div className="flex flex-wrap gap-1.5 shrink-0 justify-end">
                        <button
                          onClick={() => { setEditingId(row.student_id); setEditForm({ display_name: row.display_name ?? '', email: row.email }) }}
                          className="text-xs font-orbitron px-2 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#ffd70040', color: '#ffd700', background: 'rgba(255,215,0,.05)' }}
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => { setResetId(row.student_id); setResetPhone('') }}
                          className="text-xs font-orbitron px-2 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#ff990040', color: '#ff9900', background: 'rgba(255,153,0,.05)' }}
                        >
                          強制重設
                        </button>
                        <button
                          onClick={() => sendReset(row.student_id)}
                          className="text-xs font-orbitron px-2 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#00d4ff40', color: '#00d4ff', background: 'rgba(0,212,255,.05)' }}
                        >
                          發送OTP
                        </button>
                        <button
                          onClick={() => toggleActive(row.student_id, active)}
                          className="text-xs font-orbitron px-2 py-1 border cyber-chamfer-sm"
                          style={{
                            borderColor: active ? '#ff336640' : '#00ff8840',
                            color:       active ? '#ff3366'   : '#00ff88',
                            background:  active ? 'rgba(255,51,102,.05)' : 'rgba(0,255,136,.05)',
                          }}
                        >
                          {active ? '停用' : '啟用'}
                        </button>
                        {!row.is_super_admin && (
                          <button
                            onClick={() => setConfirmDel(row.student_id)}
                            className="text-xs font-orbitron px-2 py-1 border cyber-chamfer-sm"
                            style={{ borderColor: '#ff336620', color: '#ff3366', background: 'rgba(255,51,102,.03)' }}
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-orbitron mb-1 block" style={{ color: '#4a4a6a' }}>姓名</label>
                          <input
                            style={FIELD_STYLE}
                            value={editForm.display_name}
                            onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-orbitron mb-1 block" style={{ color: '#4a4a6a' }}>Email</label>
                          <input
                            style={FIELD_STYLE}
                            type="email"
                            value={editForm.email}
                            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(row.student_id)}
                          disabled={editBusy}
                          className="text-xs font-orbitron px-3 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#00ff8840', color: '#00ff88', background: 'rgba(0,255,136,.05)' }}
                        >
                          {editBusy ? '儲存中…' : '儲存'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs font-orbitron px-3 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#3a3a5a', color: '#4a4a6a', background: 'transparent' }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Force reset form */}
                  {isResetting && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-orbitron" style={{ color: '#ff9900' }}>
                        強制重設密碼：下次登入須重新設定 PIN
                      </p>
                      <div>
                        <label className="text-xs font-orbitron mb-1 block" style={{ color: '#4a4a6a' }}>新初始密碼（電話，留空則須透過 OTP 驗證）</label>
                        <input
                          style={FIELD_STYLE}
                          placeholder="電話號碼（選填）"
                          value={resetPhone}
                          onChange={e => setResetPhone(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleForceReset(row.student_id)}
                          className="text-xs font-orbitron px-3 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#ff990040', color: '#ff9900', background: 'rgba(255,153,0,.05)' }}
                        >
                          確認重設
                        </button>
                        <button
                          onClick={() => setResetId(null)}
                          className="text-xs font-orbitron px-3 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#3a3a5a', color: '#4a4a6a', background: 'transparent' }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {isDeleting && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-orbitron" style={{ color: '#ff3366' }}>
                        確定要刪除 {row.display_name ?? row.student_id} 的帳號？此操作不可還原。
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(row.student_id)}
                          className="text-xs font-orbitron px-3 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#ff336640', color: '#ff3366', background: 'rgba(255,51,102,.08)' }}
                        >
                          確認刪除
                        </button>
                        <button
                          onClick={() => setConfirmDel(null)}
                          className="text-xs font-orbitron px-3 py-1 border cyber-chamfer-sm"
                          style={{ borderColor: '#3a3a5a', color: '#4a4a6a', background: 'transparent' }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
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
                  <span
                    className="text-xs font-orbitron px-1.5 py-0.5 rounded"
                    style={{ color: STATUS_COLOR[r.status], background: `${STATUS_COLOR[r.status]}15`, border: `1px solid ${STATUS_COLOR[r.status]}30` }}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
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
