import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const revalidate = 30

export async function GET() {
  try {
    const { data } = await supabase
      .from('submissions')
      .select('department, result')

    if (!data || data.length === 0) {
      return NextResponse.json({ depts: [], categories: [], total: 0 })
    }

    const deptCounts: Record<string, number> = {}
    const catCounts:  Record<string, number> = {}

    for (const sub of data) {
      // "資訊工程學系 日間部 大三" → "資訊工程學系"
      const deptName = sub.department?.split(' ')[0] ?? sub.department
      deptCounts[deptName] = (deptCounts[deptName] ?? 0) + 1
      catCounts[sub.result]  = (catCounts[sub.result]  ?? 0) + 1
    }

    const depts = Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))

    const categories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))

    return NextResponse.json({ depts, categories, total: data.length })
  } catch {
    return NextResponse.json({ depts: [], categories: [], total: 0 })
  }
}
