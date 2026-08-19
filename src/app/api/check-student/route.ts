import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ found: false })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('submissions')
    .select('id, result, created_at, department')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return NextResponse.json({ found: false })
  return NextResponse.json({ found: true, submission: data })
}
