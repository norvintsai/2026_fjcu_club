import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth'
import { generateOTP } from '@/lib/admin-auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  try {
    const { studentId } = await req.json()
    if (!studentId) return NextResponse.json({ error: '參數錯誤' }, { status: 400 })

    const db = createServiceClient()

    // Get email from authorized_admins
    const { data: auth } = await db
      .from('authorized_admins')
      .select('email')
      .eq('student_id', studentId)
      .single()

    if (!auth?.email) {
      return NextResponse.json({ error: '找不到此帳號' }, { status: 404 })
    }

    // Invalidate old password hash so they must re-verify via OTP
    await db.from('admin_accounts')
      .update({ password_hash: null })
      .eq('student_id', studentId)

    // Send OTP so they can set a new PIN
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    await db.from('admin_otps').insert({ student_id: studentId, code, expires_at: expiresAt })
    await sendOTPEmail(auth.email, code, studentId)

    return NextResponse.json({ ok: true, email: auth.email })
  } catch (err) {
    console.error('[super/reset-otp]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
