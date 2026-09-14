import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { isAdminAuthenticated, getAdminStudentId } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

function sign(submissionId: string) {
  const secret = process.env.CHECKIN_HMAC_SECRET ?? 'fju-stellar-checkin-2026'
  return createHmac('sha256', secret).update(submissionId).digest('hex').slice(0, 32)
}

export async function POST(req: NextRequest) {
  const authed = await isAdminAuthenticated()
  if (!authed) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const adminId = await getAdminStudentId()

  const { submissionId, token } = await req.json()

  if (!submissionId || token !== sign(submissionId)) {
    return NextResponse.json({ error: 'QR Code 無效' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: submission } = await supabase
    .from('submissions')
    .select('student_id, result, department')
    .eq('id', submissionId)
    .single()

  if (!submission) return NextResponse.json({ error: '找不到提交紀錄' }, { status: 404 })

  const { data: existing } = await supabase
    .from('checkins')
    .select('locked_result, checked_in_at')
    .eq('student_id', submission.student_id)
    .single()

  if (existing) {
    return NextResponse.json(
      {
        error:          '此學生已完成簽到',
        alreadyChecked: true,
        lockedResult:   existing.locked_result,
        checkedInAt:    existing.checked_in_at,
        department:     submission.department,
      },
      { status: 409 },
    )
  }

  const { error } = await supabase
    .from('checkins')
    .insert({
      student_id:    submission.student_id,
      locked_result: submission.result,
      scanned_by:    adminId ?? null,
    })

  if (error) return NextResponse.json({ error: '簽到失敗，請重試' }, { status: 500 })

  return NextResponse.json({
    success:      true,
    lockedResult: submission.result,
    department:   submission.department,
    studentId:    submission.student_id,
  })
}
