import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { studentId, page, description } = await req.json()

    if (!description?.trim()) {
      return NextResponse.json({ error: '請填寫問題描述' }, { status: 400 })
    }
    if (description.trim().length > 1000) {
      return NextResponse.json({ error: '描述過長，請在 1000 字以內' }, { status: 400 })
    }

    await createServiceClient()
      .from('bug_reports' as any)
      .insert({
        student_id:  studentId ?? null,
        page:        page ?? 'unknown',
        description: description.trim(),
        status:      'open',
      })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[report]', err)
    return NextResponse.json({ error: '提交失敗，請稍後再試' }, { status: 500 })
  }
}
