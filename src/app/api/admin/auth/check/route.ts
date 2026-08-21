import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { maskEmail } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json()

    if (!studentId || !/^\d{9}$/.test(studentId)) {
      return NextResponse.json({ error: '學號格式錯誤' }, { status: 400 })
    }

    const db = createServiceClient()

    const { data: auth } = await db
      .from('authorized_admins')
      .select('student_id, email')
      .eq('student_id', studentId)
      .single()

    if (!auth) {
      return NextResponse.json({ error: '此學號不在授權名單中' }, { status: 403 })
    }

    const { data: account } = await db
      .from('admin_accounts')
      .select('password_hash')
      .eq('student_id', studentId)
      .single()

    const status = account?.password_hash ? 'registered' : 'new'
    return NextResponse.json({ status, maskedEmail: maskEmail(auth.email) })
  } catch (err) {
    console.error('[check]', err)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
