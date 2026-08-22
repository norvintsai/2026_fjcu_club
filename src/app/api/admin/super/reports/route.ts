import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth'

// GET: list all bug reports
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  const { data } = await createServiceClient()
    .from('bug_reports' as any)
    .select('*')
    .order('created_at', { ascending: false })
  return NextResponse.json({ reports: data ?? [] })
}

// PATCH: update report status
export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  const { id, status } = await req.json()
  if (!id || !['open', 'resolved', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
  }
  await createServiceClient()
    .from('bug_reports' as any)
    .update({ status })
    .eq('id', id)
  return NextResponse.json({ ok: true })
}
