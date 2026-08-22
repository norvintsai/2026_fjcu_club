import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth'
import LogoutButton from '../LogoutButton'
import SuperPanel from './SuperPanel'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  if (!(await isSuperAdmin())) redirect('/admin/dashboard')

  return (
    <main className="min-h-screen cyber-grid px-4 py-8 relative">
      <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,215,0,.04) 0%, transparent 70%)' }} />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="w-2 h-2 rounded-full neon-pulse" style={{ background: '#ffd700' }} />
              <h1 className="font-orbitron font-black text-xl uppercase tracking-widest text-fore">
                系統管理中心
              </h1>
            </div>
            <p className="text-xs font-orbitron tracking-[.15em] ml-5" style={{ color: '#4a4a6a' }}>
              SUPER ADMIN · 413402435 · 最高權限
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/dashboard"
              className="text-xs font-orbitron tracking-wider border cyber-chamfer-sm px-3 py-1.5 transition-all"
              style={{ borderColor: '#2a2a4a', color: '#4a4a6a' }}
            >
              ← 返回儀表板
            </a>
            <LogoutButton />
          </div>
        </div>

        <SuperPanel />
      </div>
    </main>
  )
}
