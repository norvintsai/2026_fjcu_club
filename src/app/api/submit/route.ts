import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { computeResult } from '@/lib/scoring'
import { Question } from '@/lib/database.types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, department, answers } = body

    if (!studentId || !department || !answers || typeof answers !== 'object') {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch questions to compute scores
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .order('order_num')

    if (qErr || !questions) {
      return NextResponse.json({ error: '無法取得題目' }, { status: 500 })
    }

    const { scores, result } = computeResult(questions as unknown as Question[], answers)

    const { data, error } = await supabase
      .from('submissions')
      .insert({ student_id: studentId, department, answers, scores, result })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
