import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { searchParams } = req.nextUrl
  const status   = searchParams.get('status')   // 'open' | 'resolved' | null (all)
  const category = searchParams.get('category') // filter by category or null
  const search   = searchParams.get('search')   // text search in description
  const supabase = createServiceClient()
  let query = supabase.from('bug_reports').select('*').order('created_at', { ascending: false })
  if (status)   query = query.eq('status', status)
  if (category) query = query.eq('category', category)
  if (search)   query = query.ilike('description', `%${search}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: '缺少參數' }, { status: 400 })
  const supabase = createServiceClient()
  const { error } = await supabase.from('bug_reports').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
