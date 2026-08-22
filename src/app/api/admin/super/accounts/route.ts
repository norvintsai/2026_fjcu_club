import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth'

// GET: list all admin accounts with their authorized info
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  const db = createServiceClient()
  const [{ data: auths }, { data: accounts }] = await Promise.all([
    db.from('authorized_admins').select('student_id, email, display_name, is_active'),
    db.from('admin_accounts').select('student_id, is_active, last_login, created_at'),
  ])
  return NextResponse.json({ auths: auths ?? [], accounts: accounts ?? [] })
}

// PATCH: toggle active status
export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  const { studentId, is_active } = await req.json()
  if (!studentId || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
  }
  const db = createServiceClient()
  await db.from('admin_accounts').update({ is_active }).eq('student_id', studentId)
  return NextResponse.json({ ok: true })
}
