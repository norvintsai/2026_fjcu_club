import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyPin } from '@/lib/admin-auth'
import { setMemberSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { studentId, pin } = await req.json()

    if (!studentId || !pin) {
      return NextResponse.json({ error: '參數不完整' }, { status: 400 })
    }

    const db = createServiceClient()

    const { data: account } = await db
      .from('admin_accounts')
      .select('password_hash, is_active')
      .eq('student_id', studentId)
      .single()

    if (!account || !account.is_active || !account.password_hash) {
      return NextResponse.json({ error: '帳號不存在或已停用' }, { status: 403 })
    }

    const ok = await verifyPin(pin, account.password_hash)
    if (!ok) {
      return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })
    }

    await db.from('admin_accounts')
      .update({ last_login: new Date().toISOString() })
      .eq('student_id', studentId)

    await setMemberSession(studentId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
