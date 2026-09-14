import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { hashPin } from '@/lib/admin-auth'
import { getAdminStudentId } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const studentId = await getAdminStudentId()
    if (!studentId) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 })
    }

    const { pin } = await req.json()
    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: '新密碼必須為 6 位數字' }, { status: 400 })
    }

    const passwordHash = await hashPin(pin)
    const db = createServiceClient()

    await db.from('admin_accounts').update({
      password_hash:        passwordHash,
      must_change_password: false,
    } as any).eq('student_id', studentId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[change-pin]', err)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
