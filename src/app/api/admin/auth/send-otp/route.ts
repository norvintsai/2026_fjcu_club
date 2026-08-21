import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateOTP, maskEmail } from '@/lib/admin-auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json()

    if (!studentId || !/^\d{9}$/.test(studentId)) {
      return NextResponse.json({ error: '學號格式錯誤' }, { status: 400 })
    }

    const db = createServiceClient()

    const { data: auth } = await db
      .from('authorized_admins')
      .select('email')
      .eq('student_id', studentId)
      .single()

    if (!auth) {
      return NextResponse.json({ error: '未授權' }, { status: 403 })
    }

    // Rate limit: one OTP per 60 seconds
    const { data: recent } = await db
      .from('admin_otps')
      .select('created_at')
      .eq('student_id', studentId)
      .eq('used', false)
      .gte('created_at', new Date(Date.now() - 60_000).toISOString())
      .limit(1)
      .single()

    if (recent) {
      const retryAfter = Math.ceil(
        (new Date(recent.created_at).getTime() + 60_000 - Date.now()) / 1000
      )
      return NextResponse.json(
        { error: `請等待 ${retryAfter} 秒後再重新寄送` },
        { status: 429 }
      )
    }

    const code      = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()

    await db.from('admin_otps').insert({ student_id: studentId, code, expires_at: expiresAt })
    await sendOTPEmail(auth.email, code, studentId)

    return NextResponse.json({ ok: true, maskedEmail: maskEmail(auth.email) })
  } catch (err) {
    console.error('[send-otp]', err)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
