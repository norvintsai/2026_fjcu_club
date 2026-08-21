import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { hashPin } from '@/lib/admin-auth'
import { getOtpPendingStudentId, clearOtpPendingSession, setMemberSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()

  if (!pin || !/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: '密碼必須為 6 位數字' }, { status: 400 })
  }

  const studentId = await getOtpPendingStudentId()
  if (!studentId) {
    return NextResponse.json({ error: '驗證已過期，請重新驗證' }, { status: 401 })
  }

  const passwordHash = await hashPin(pin)
  const db = createServiceClient()

  await db.from('admin_accounts').upsert({
    student_id:    studentId,
    password_hash: passwordHash,
    is_active:     true,
  })

  await clearOtpPendingSession()
  await setMemberSession(studentId)

  return NextResponse.json({ ok: true })
}
