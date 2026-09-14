import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  const { checkinId } = await req.json()
  if (!checkinId) return NextResponse.json({ error: '缺少 checkinId' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('checkins').delete().eq('id', checkinId)

  if (error) return NextResponse.json({ error: '取消失敗，請重試' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
