import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase'

function sign(submissionId: string) {
  const secret = process.env.CHECKIN_HMAC_SECRET ?? 'fju-stellar-checkin-2026'
  return createHmac('sha256', secret).update(submissionId).digest('hex').slice(0, 32)
}

export async function POST(req: NextRequest) {
  const { submissionId, token, staffCode } = await req.json()

  const validCode = process.env.STAFF_CHECKIN_CODE
  if (!validCode || staffCode !== validCode) {
    return NextResponse.json({ error: '工作人員代碼錯誤' }, { status: 403 })
  }

  if (!submissionId || token !== sign(submissionId)) {
    return NextResponse.json({ error: 'QR Code 無效或已過期' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: submission } = await supabase
    .from('submissions')
    .select('student_id, result')
    .eq('id', submissionId)
    .single()

  if (!submission) return NextResponse.json({ error: '找不到提交紀錄' }, { status: 404 })

  const { data: existing } = await supabase
    .from('checkins')
    .select('locked_result')
    .eq('student_id', submission.student_id)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: '此學生已完成簽到', lockedResult: existing.locked_result },
      { status: 409 },
    )
  }

  const { error } = await supabase
    .from('checkins')
    .insert({ student_id: submission.student_id, locked_result: submission.result })

  if (error) return NextResponse.json({ error: '簽到失敗，請重試' }, { status: 500 })

  return NextResponse.json({ success: true, lockedResult: submission.result })
}
