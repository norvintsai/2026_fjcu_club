import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const authed = await isAdminAuthenticated()
  if (!authed) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .order('checked_in_at', { ascending: false })

  if (!checkins || checkins.length === 0) return NextResponse.json([])

  const studentIds = checkins.map(c => c.student_id)

  const { data: submissions } = await supabase
    .from('submissions')
    .select('student_id, department')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false })

  const subMap = new Map<string, string>()
  for (const s of submissions ?? []) {
    if (!subMap.has(s.student_id)) subMap.set(s.student_id, s.department)
  }

  const records = checkins.map(c => ({
    id:            c.id,
    student_id:    c.student_id,
    locked_result: c.locked_result,
    checked_in_at: c.checked_in_at,
    scanned_by:    c.scanned_by ?? null,
    department:    subMap.get(c.student_id) ?? '',
  }))

  return NextResponse.json(records)
}
