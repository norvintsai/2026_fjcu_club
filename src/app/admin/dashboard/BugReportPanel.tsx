'use client'

import { useState, useEffect, useCallback } from 'react'

interface BugReport {
  id: string
  student_id: string | null
  page: string
  description: string
  status: string
  category: string
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  general:       '一般問題',
  ui_bug:        '介面顯示',
  data_error:    '資料錯誤',
  auth_issue:    '登入/認證',
  qr_scan_error: 'QR 掃描',
  other:         '其他',
}

const CATEGORY_COLORS: Record<string, string> = {
  general:       '#6b7280',
  ui_bug:        '#00d4ff',
  data_error:    '#ff9966',
  auth_issue:    '#ff3366',
  qr_scan_error: '#ffd700',
  other:         '#9966ff',
}

const PAGE_LABELS: Record<string, string> = {
  result:        '結果頁',
  test:          '測驗頁',
  home:          '首頁',
  admin_checkin: '掃碼簽到',
  unknown:       '未知',
}

export default function BugReportPanel() {
  const [reports, setReports]       = useState<BugReport[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterStatus, setFilterStatus]   = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [search, setSearch]         = useState('')
  const [updating, setUpdating]     = useState<string | null>(null)

  const fetchReports = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'all')   params.set('status', filterStatus)
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (search.trim())            params.set('search', search.trim())
    fetch(`/api/admin/reports?${params}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setReports(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filterStatus, filterCategory, search])

  useEffect(() => { fetchReports() }, [fetchReports])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setUpdating(null)
  }

  const openCount = reports.filter(r => r.status === 'open').length

  return (
    <div className="terminal-card cyber-chamfer">
      <div className="terminal-header flex items-center gap-2">
        <span className="terminal-dot" style={{ background: '#ff3366' }} />
        <span className="ml-2 text-xs font-orbitron uppercase tracking-widest text-dim flex-1">
          錯誤回報
        </span>
        {openCount > 0 && (
          <span className="text-xs font-orbitron px-2 py-0.5 cyber-chamfer-sm"
            style={{ background: 'rgba(255,51,102,.15)', border: '1px solid rgba(255,51,102,.3)', color: '#ff3366' }}>
            {openCount} 未處理
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 py-3 border-b flex flex-wrap gap-2 items-center" style={{ borderColor: '#2a2a3a' }}>
        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="cyber-input cyber-chamfer-sm text-xs py-1.5 px-2"
          style={{ width: 'auto', minWidth: 90 }}
        >
          <option value="all">全部狀態</option>
          <option value="open">未處理</option>
          <option value="resolved">已解決</option>
        </select>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="cyber-input cyber-chamfer-sm text-xs py-1.5 px-2"
          style={{ width: 'auto', minWidth: 110 }}
        >
          <option value="all">全部分類</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim text-xs select-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋描述內容..."
            className="cyber-input cyber-chamfer-sm text-xs py-1.5 pl-7 w-full"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <p className="text-dim text-xs font-orbitron cyber-cursor tracking-widest text-center py-6">載入中</p>
        ) : reports.length === 0 ? (
          <p className="text-dim text-xs font-orbitron tracking-widest text-center py-6">
            {filterStatus !== 'all' || filterCategory !== 'all' || search ? '找不到符合的紀錄' : '尚無錯誤回報'}
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map(r => {
              const catColor = CATEGORY_COLORS[r.category] ?? '#6b7280'
              return (
                <div key={r.id} className="border cyber-chamfer-sm p-3 sm:p-4 space-y-2"
                  style={{
                    borderColor: r.status === 'open' ? 'rgba(255,51,102,.2)' : 'rgba(42,42,58,.8)',
                    background: r.status === 'open' ? 'rgba(255,51,102,.02)' : 'transparent',
                  }}>
                  <div className="flex items-start gap-2 flex-wrap">
                    {/* Category badge */}
                    <span className="text-xs font-orbitron px-2 py-0.5 cyber-chamfer-sm shrink-0"
                      style={{ background: `${catColor}18`, border: `1px solid ${catColor}40`, color: catColor, fontSize: 10 }}>
                      {CATEGORY_LABELS[r.category] ?? r.category}
                    </span>
                    {/* Page badge */}
                    <span className="text-xs font-orbitron px-2 py-0.5 cyber-chamfer-sm shrink-0"
                      style={{ background: 'rgba(42,42,58,.8)', border: '1px solid #3a3a5a', color: '#6b7280', fontSize: 10 }}>
                      {PAGE_LABELS[r.page] ?? r.page}
                    </span>
                    {/* Status badge */}
                    <span className="text-xs font-orbitron px-2 py-0.5 cyber-chamfer-sm shrink-0 ml-auto"
                      style={{
                        background: r.status === 'open' ? 'rgba(255,51,102,.12)' : 'rgba(0,255,136,.08)',
                        border: `1px solid ${r.status === 'open' ? 'rgba(255,51,102,.3)' : 'rgba(0,255,136,.2)'}`,
                        color: r.status === 'open' ? '#ff3366' : '#00ff88',
                        fontSize: 10,
                      }}>
                      {r.status === 'open' ? '● 未處理' : '✓ 已解決'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs leading-relaxed" style={{ color: '#c0c0d0' }}>
                    {r.description}
                  </p>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 text-xs font-orbitron" style={{ color: '#4a4a6a' }}>
                      {r.student_id && <span>{r.student_id.slice(0,3)}••{r.student_id.slice(-2)}</span>}
                      <span>{new Date(r.created_at).toLocaleString('zh-TW')}</span>
                    </div>
                    {/* Action */}
                    {r.status === 'open' ? (
                      <button
                        onClick={() => updateStatus(r.id, 'resolved')}
                        disabled={updating === r.id}
                        className="text-xs font-orbitron px-3 py-1 cyber-chamfer-sm transition-colors"
                        style={{ border: '1px solid rgba(0,255,136,.3)', color: '#00ff88' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,136,.08)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                      >
                        {updating === r.id ? '...' : '✓ 標記已解決'}
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(r.id, 'open')}
                        disabled={updating === r.id}
                        className="text-xs font-orbitron px-3 py-1 cyber-chamfer-sm transition-colors"
                        style={{ border: '1px solid #3a3a5a', color: '#4a4a6a' }}
                      >
                        {updating === r.id ? '...' : '重新開啟'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
