import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth'
import { getAdminStudentId } from '@/lib/auth'
import { hashPin } from '@/lib/admin-auth'

// GET: list all admin accounts
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  const db = createServiceClient()
  const [{ data: auths }, { data: accounts }] = await Promise.all([
    db.from('authorized_admins').select('student_id, email, display_name, is_active, is_super_admin'),
    db.from('admin_accounts').select('student_id, is_active, last_login, created_at, must_change_password'),
  ])
  return NextResponse.json({ auths: auths ?? [], accounts: accounts ?? [] })
}

// POST: create new admin account
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  const { studentId, displayName, email, phone } = await req.json()

  if (!studentId || !/^\d{9}$/.test(studentId)) {
    return NextResponse.json({ error: '學號格式錯誤（9位數字）' }, { status: 400 })
  }
  if (!displayName) {
    return NextResponse.json({ error: '姓名必填' }, { status: 400 })
  }

  const db = createServiceClient()
  const actualEmail = email?.trim() || `${studentId}@s.fju.edu.tw`

  await db.from('authorized_admins').upsert({
    student_id:     studentId,
    email:          actualEmail,
    display_name:   displayName.trim(),
    is_super_admin: false,
  } as any, { onConflict: 'student_id' })

  const passwordHash = phone ? await hashPin(phone.trim()) : null

  await db.from('admin_accounts').upsert({
    student_id:           studentId,
    password_hash:        passwordHash,
    is_active:            true,
    must_change_password: true,
  } as any, { onConflict: 'student_id' })

  return NextResponse.json({ ok: true })
}

// PATCH: update admin (toggle_active | edit_info | force_reset)
export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  const body = await req.json()
  const { studentId } = body
  if (!studentId) return NextResponse.json({ error: '參數錯誤' }, { status: 400 })

  const db = createServiceClient()

  if (typeof body.is_active === 'boolean') {
    await db.from('admin_accounts').update({ is_active: body.is_active }).eq('student_id', studentId)
  }

  if (body.display_name !== undefined || body.email !== undefined) {
    const update: { display_name?: string | null; email?: string } = {}
    if (body.display_name !== undefined) update.display_name = body.display_name
    if (body.email !== undefined) update.email = body.email
    await db.from('authorized_admins').update(update).eq('student_id', studentId)
  }

  if (body.forceReset) {
    const newHash = body.phone ? await hashPin(body.phone) : null
    await db.from('admin_accounts').update({
      password_hash:        newHash,
      must_change_password: true,
    } as any).eq('student_id', studentId)
  }

  return NextResponse.json({ ok: true })
}

// DELETE: remove admin account
export async function DELETE(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  const { studentId } = await req.json()
  if (!studentId) return NextResponse.json({ error: '參數錯誤' }, { status: 400 })

  const selfId = await getAdminStudentId()
  if (studentId === selfId) {
    return NextResponse.json({ error: '無法刪除自己的帳號' }, { status: 400 })
  }

  const db = createServiceClient()
  await Promise.all([
    db.from('admin_accounts').delete().eq('student_id', studentId),
    db.from('authorized_admins').delete().eq('student_id', studentId),
  ])

  return NextResponse.json({ ok: true })
}
