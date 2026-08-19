const DEPT_MAP: Record<string, string> = {
  '01': '中國文學系',
  '02': '歷史學系',
  '03': '哲學系',
  '04': '圖書資訊學系',
  '05': '影像傳播學系',
  '06': '新聞傳播學系',
  '07': '廣告傳播學系',
  '08': '體育學系',
  '09': '體育學系',
  '10': '體育學系',
  '11': '英國語文學系',
  '12': '法國語文學系',
  '13': '西班牙語文學系',
  '14': '日本語文學系',
  '15': '義大利語文學系',
  '16': '德國語文學系',
  '17': '數學系',
  '18': '數學系',
  '19': '化學系',
  '20': '心理學系',
  '21': '織品服裝學系',
  '22': '織品服裝學系',
  '23': '織品服裝學系',
  '24': '電機工程學系',
  '26': '資訊工程學系',
  '27': '生命科學系',
  '28': '物理學系',
  '29': '物理學系',
  '30': '餐旅管理學系',
  '31': '兒童與家庭學系',
  '32': '法律學系',
  '33': '社會學系',
  '34': '社會工作學系',
  '35': '經濟學系',
  '36': '財經法律學系',
  '37': '學士後法律學系',
  '38': '企業管理學系',
  '39': '會計學系',
  '40': '資訊管理學系',
  '41': '金融與國際企業學系',
  '42': '統計資訊學系',
  '43': '音樂學系',
  '44': '應用美術系',
  '45': '景觀設計系',
  '46': '食品科學系',
  '47': '營養科學系',
  '48': '宗教學系',
  '49': '護理學系',
  '50': '公共衛生學系',
  '51': '醫學系',
  '52': '臨床心理學系',
  '53': '職能治療學系',
  '54': '呼吸治療學系',
  '55': '天主教研修學士學位學程',
  '56': '教育領導與科技發展學士學位學程',
  '57': '醫學資訊與創新應用學士學位學程',
  '58': '人工智慧與資訊安全學士學位學程',
}

const GRADE_CHARS = ['一', '二', '三', '四', '五', '六']

export interface ParsedStudentId {
  division: string
  deptName: string
  grade: string
  label: string
}

export function parseStudentId(id: string): ParsedStudentId | null {
  if (!/^\d{9}$/.test(id)) return null

  const divDigit = id[0]
  const yearStr = id.slice(1, 3)
  const deptCode = id.slice(3, 5)

  const division = divDigit === '4' ? '日間部' : divDigit === '5' ? '進修部' : null
  if (!division) return null

  const enrollmentYear = 100 + parseInt(yearStr, 10)
  const currentROCYear = new Date().getFullYear() - 1911
  const yearsIn = currentROCYear - enrollmentYear + 1

  const maxGrade = deptCode === '51' ? 6 : 4
  if (yearsIn < 1 || yearsIn > maxGrade) return null

  const grade = `大${GRADE_CHARS[yearsIn - 1]}`
  const deptName = DEPT_MAP[deptCode] ?? null
  if (!deptName) return null

  return {
    division,
    deptName,
    grade,
    label: `${deptName} ${division} ${grade}`,
  }
}
