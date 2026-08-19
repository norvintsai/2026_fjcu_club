'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  return (
    <button onClick={handleLogout} className="cyber-btn-danger cyber-chamfer-sm">
      ✕ LOGOUT
    </button>
  )
}
