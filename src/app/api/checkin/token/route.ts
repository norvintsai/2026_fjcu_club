import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase'

function sign(submissionId: string) {
  const secret = process.env.CHECKIN_HMAC_SECRET ?? 'fju-stellar-checkin-2026'
  return createHmac('sha256', secret).update(submissionId).digest('hex').slice(0, 32)
}

export async function GET(req: NextRequest) {
  const submissionId = req.nextUrl.searchParams.get('submissionId')
  if (!submissionId) return NextResponse.json({ error: '缺少 submissionId' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: submission } = await supabase
    .from('submissions')
    .select('student_id, result')
    .eq('id', submissionId)
    .single()

  if (!submission) return NextResponse.json({ error: '找不到紀錄' }, { status: 404 })

  const { data: checkin } = await supabase
    .from('checkins')
    .select('locked_result, checked_in_at')
    .eq('student_id', submission.student_id)
    .single()

  return NextResponse.json({
    token: sign(submissionId),
    isCheckedIn: !!checkin,
    lockedResult: checkin?.locked_result ?? null,
    checkedInAt: checkin?.checked_in_at ?? null,
  })
}
