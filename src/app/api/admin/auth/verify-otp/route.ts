import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { setOtpPendingSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { studentId, code } = await req.json()

    if (!studentId || !code) {
      return NextResponse.json({ error: '參數不完整' }, { status: 400 })
    }

    const db = createServiceClient()

    const { data: otp } = await db
      .from('admin_otps')
      .select('id, used, expires_at')
      .eq('student_id', studentId)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otp) {
      return NextResponse.json({ error: '驗證碼錯誤或已過期' }, { status: 401 })
    }

    await db.from('admin_otps').update({ used: true }).eq('id', otp.id)
    await setOtpPendingSession(studentId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
