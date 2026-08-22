'use client'

import { useState, useEffect } from 'react'
import type { ParsedStudentId } from '@/lib/student-id'
import {
  ALL_DIVISIONS,
  getCollegesForDivision,
  getDeptsForCollege,
  getGradesForDivision,
  type Division,
} from '@/lib/departments'
import CyberSearchSelect from './ui/cyber-search-select'

interface Props {
  onSave: (p: ParsedStudentId) => void
  onCancel: () => void
}

export default function DepartmentEditor({ onSave, onCancel }: Props) {
  const [division, setDivision] = useState<Division | ''>('')
  const [college,  setCollege]  = useState('')
  const [dept,     setDept]     = useState('')
  const [grade,    setGrade]    = useState('')

  const colleges = division ? getCollegesForDivision(division) : []
  const depts    = division && college ? getDeptsForCollege(division, college) : []
  const grades   = division && dept   ? getGradesForDivision(division, dept)  : []

  useEffect(() => { setCollege(''); setDept(''); setGrade('') }, [division])
  useEffect(() => { setDept('');   setGrade('') },               [college])
  useEffect(() => { setGrade('') },                              [dept])

  function handleSave() {
    if (!division || !dept || !grade) return
    onSave({ division, deptName: dept, grade, label: `${dept} ${division} ${grade}` })
  }

  const canSave = division && college && dept && grade

  return (
    <div className="p-4 space-y-3.5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
        <span className="text-xs font-orbitron tracking-wider" style={{ color: '#00d4ff' }}>
          手動修改科系資訊
        </span>
      </div>

      {/* 部別 */}
      <div>
        <label className="block text-xs text-dim font-orbitron uppercase tracking-[.12em] mb-1.5">▸ 部別</label>
        <CyberSearchSelect
          options={ALL_DIVISIONS}
          value={division}
          onChange={v => setDivision(v as Division)}
          placeholder="— 請選擇部別 —"
        />
      </div>

      {/* 學院 */}
      <div>
        <label className="block text-xs text-dim font-orbitron uppercase tracking-[.12em] mb-1.5">▸ 學院</label>
        <CyberSearchSelect
          options={colleges}
          value={college}
          onChange={setCollege}
          placeholder="— 請選擇學院 —"
          disabled={!division}
        />
      </div>

      {/* 科系 */}
      <div>
        <label className="block text-xs text-dim font-orbitron uppercase tracking-[.12em] mb-1.5">▸ 科系</label>
        <CyberSearchSelect
          options={depts}
          value={dept}
          onChange={setDept}
          placeholder="— 請選擇科系 —"
          disabled={!college}
        />
      </div>

      {/* 年級 */}
      <div>
        <label className="block text-xs text-dim font-orbitron uppercase tracking-[.12em] mb-1.5">▸ 年級</label>
        <CyberSearchSelect
          options={grades}
          value={grade}
          onChange={setGrade}
          placeholder="— 請選擇年級 —"
          disabled={!dept}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="cyber-btn-ghost cyber-chamfer-sm flex-none px-4 text-xs"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="cyber-btn cyber-chamfer-sm flex-1 justify-center text-xs"
          style={canSave ? { borderColor: '#00d4ff', color: '#00d4ff' } : undefined}
        >
          <span>▶</span> 確認儲存
        </button>
      </div>
    </div>
  )
}
