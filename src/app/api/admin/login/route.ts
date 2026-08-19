import { NextRequest, NextResponse } from 'next/server'
import { setAdminSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })
  }

  await setAdminSession()
  return NextResponse.json({ ok: true })
}
