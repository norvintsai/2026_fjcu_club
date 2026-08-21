import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const revalidate = 30

export async function GET() {
  try {
    const { data } = await createServiceClient()
      .from('submissions')
      .select('student_id, department, result, created_at')
      .order('created_at', { ascending: false })

    if (!data || data.length === 0) {
      return NextResponse.json({ depts: [], categories: [], clubs: [], total: 0 })
    }

    // 一人一票：每個 student_id 只取最新一筆（已按 created_at desc 排序）
    const seen = new Set<string>()
    const unique = data.filter(sub => {
      if (seen.has(sub.student_id)) return false
      seen.add(sub.student_id)
      return true
    })

    const deptCounts: Record<string, number> = {}
    const catCounts:  Record<string, number> = {}
    const clubCounts: Record<string, number> = {}

    for (const sub of unique) {
      // "資訊工程學系 日間部 大三" → "資訊工程學系"
      const deptName = sub.department?.split(' ')[0] ?? sub.department
      deptCounts[deptName] = (deptCounts[deptName] ?? 0) + 1
      catCounts[sub.result] = (catCounts[sub.result]  ?? 0) + 1

      const combo = `${deptName}｜${sub.result}`
      clubCounts[combo] = (clubCounts[combo] ?? 0) + 1
    }

    const depts = Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))

    const categories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))

    const clubs = Object.entries(clubCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))

    return NextResponse.json({ depts, categories, clubs, total: unique.length })
  } catch {
    return NextResponse.json({ depts: [], categories: [], clubs: [], total: 0 })
  }
}
