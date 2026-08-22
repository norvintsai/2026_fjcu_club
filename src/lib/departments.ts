export type Division = '日間部' | '進修部' | '碩士班' | '碩士在職專班' | '博士班' | '學士後學系'

export const ALL_DIVISIONS: Division[] = [
  '日間部', '進修部', '碩士班', '碩士在職專班', '博士班', '學士後學系',
]

interface DeptData {
  name: string
  divs: Division[]
  sixYears?: true
}

interface CollegeData {
  name: string
  depts: DeptData[]
}

const COLLEGES_DATA: CollegeData[] = [
  {
    name: '文學院',
    depts: [
      { name: '中國文學系', divs: ['日間部', '進修部', '碩士班', '博士班'] },
      { name: '歷史學系',   divs: ['日間部', '進修部', '碩士班', '博士班'] },
      { name: '哲學系',     divs: ['日間部', '進修部', '碩士班', '博士班'] },
    ],
  },
  {
    name: '藝術學院',
    depts: [
      { name: '音樂學系',                     divs: ['日間部', '碩士班'] },
      { name: '應用美術學系',                  divs: ['日間部', '進修部', '碩士班'] },
      { name: '景觀設計學系',                  divs: ['日間部', '碩士班'] },
      { name: '藝術與文化創意學士學位學程',    divs: ['日間部', '進修部'] },
    ],
  },
  {
    name: '傳播學院',
    depts: [
      { name: '影像傳播學系',         divs: ['日間部'] },
      { name: '新聞傳播學系',         divs: ['日間部'] },
      { name: '廣告傳播學系',         divs: ['日間部'] },
      { name: '大眾傳播學研究所',     divs: ['碩士班'] },
      { name: '大眾傳播學士學位學程', divs: ['日間部', '進修部'] },
    ],
  },
  {
    name: '教育與運動健康學院',
    depts: [
      { name: '體育學系',                       divs: ['日間部', '碩士班'] },
      { name: '圖書資訊學系',                   divs: ['日間部', '進修部', '碩士班'] },
      { name: '教育領導與發展研究所',           divs: ['碩士班', '博士班'] },
      { name: '教育領導與科技發展學士學位學程', divs: ['日間部'] },
      { name: '運動休閒管理學士學位學程',       divs: ['日間部', '進修部'] },
    ],
  },
  {
    name: '醫學院',
    depts: [
      { name: '醫學系（六年制）',                 divs: ['日間部'], sixYears: true },
      { name: '護理學系',                         divs: ['日間部', '碩士班', '博士班'] },
      { name: '公共衛生學系',                     divs: ['日間部', '碩士班'] },
      { name: '臨床心理學系',                     divs: ['日間部', '碩士班'] },
      { name: '職能治療學系',                     divs: ['日間部'] },
      { name: '呼吸治療學系',                     divs: ['日間部'] },
      { name: '生物醫學暨藥學研究所',             divs: ['碩士班'] },
      { name: '跨專業長期照護碩士學位學程',       divs: ['碩士班'] },
      { name: '生物醫學海量資料分析碩士學位學程', divs: ['碩士班'] },
      { name: '生技醫藥博士學位學程',             divs: ['博士班'] },
    ],
  },
  {
    name: '理工學院',
    depts: [
      { name: '數學系',                               divs: ['日間部', '碩士班'] },
      { name: '物理學系',                             divs: ['日間部', '碩士班'] },
      { name: '化學系',                               divs: ['日間部', '碩士班'] },
      { name: '生命科學系',                           divs: ['日間部', '碩士班', '博士班'] },
      { name: '資訊工程學系',                         divs: ['日間部', '碩士班'] },
      { name: '電機工程學系',                         divs: ['日間部', '碩士班'] },
      { name: '醫學資訊與創新應用學士學位學程',       divs: ['日間部'] },
      { name: '醫學資訊與健康科技進修學士學位學程',   divs: ['進修部'] },
      { name: '軟體工程與數位創意學士學位學程',       divs: ['日間部', '進修部'] },
      { name: '應用科學與工程研究所',                 divs: ['博士班'] },
    ],
  },
  {
    name: '外國語文學院',
    depts: [
      { name: '英國語文學系',   divs: ['日間部', '進修部', '碩士班'] },
      { name: '德語語文學系',   divs: ['日間部', '碩士班'] },
      { name: '法國語文學系',   divs: ['日間部', '碩士班'] },
      { name: '西班牙語文學系', divs: ['日間部', '碩士班'] },
      { name: '日本語文學系',   divs: ['日間部', '進修部', '碩士班'] },
      { name: '義大利語文學系', divs: ['日間部', '碩士班'] },
      { name: '跨文化研究所',   divs: ['碩士班', '博士班'] },
    ],
  },
  {
    name: '民生學院',
    depts: [
      { name: '兒童與家庭學系',     divs: ['日間部', '碩士班'] },
      { name: '餐旅管理學系',       divs: ['日間部', '進修部', '碩士班'] },
      { name: '食品科學系',         divs: ['日間部', '碩士班'] },
      { name: '營養科學系',         divs: ['日間部', '碩士班'] },
      { name: '食品營養博士學位學程', divs: ['博士班'] },
    ],
  },
  {
    name: '法律學院',
    depts: [
      { name: '法律學系',     divs: ['日間部', '進修部', '碩士班', '博士班'] },
      { name: '財經法律學系', divs: ['日間部', '碩士班'] },
      { name: '學士後法律學系', divs: ['學士後學系'] },
    ],
  },
  {
    name: '社會科學院',
    depts: [
      { name: '社會學系',                   divs: ['日間部', '碩士班', '博士班'] },
      { name: '社會工作學系',               divs: ['日間部', '碩士班'] },
      { name: '經濟學系',                   divs: ['日間部', '進修部', '碩士班'] },
      { name: '宗教學系',                   divs: ['日間部', '進修部', '碩士班', '博士班'] },
      { name: '心理學系',                   divs: ['日間部', '碩士班', '博士班'] },
      { name: '天主教研修學士學位學程',     divs: ['日間部'] },
      { name: '非營利組織管理碩士學位學程', divs: ['碩士在職專班'] },
    ],
  },
  {
    name: '管理學院',
    depts: [
      { name: '企業管理學系',                   divs: ['日間部', '碩士班', '碩士在職專班'] },
      { name: '會計學系',                       divs: ['日間部', '碩士班', '碩士在職專班'] },
      { name: '統計資訊學系',                   divs: ['日間部', '碩士班', '碩士在職專班'] },
      { name: '金融與國際企業學系',             divs: ['日間部', '碩士班', '碩士在職專班'] },
      { name: '資訊管理學系',                   divs: ['日間部', '碩士班', '碩士在職專班'] },
      { name: '商業管理學士學位學程',           divs: ['日間部', '進修部'] },
      { name: '科技管理碩士學位學程',           divs: ['碩士在職專班'] },
      { name: '國際創業與經營管理碩士學位學程', divs: ['碩士在職專班'] },
      { name: '國際經營管理碩士班（imMBA）',    divs: ['碩士班'] },
      { name: '社會企業碩士學位學程',           divs: ['碩士班', '碩士在職專班'] },
      { name: '商學研究所',                     divs: ['博士班'] },
    ],
  },
  {
    name: '織品服裝學院',
    depts: [
      { name: '織品服裝學系',               divs: ['日間部', '碩士班'] },
      { name: '博物館學研究所',             divs: ['碩士班'] },
      { name: '品牌與時尚經營管理碩士學位學程', divs: ['碩士班'] },
    ],
  },
  {
    name: '進修部（獨立學程）',
    depts: [
      { name: '人文社會服務進修學士學位學程',         divs: ['進修部'] },
      { name: '長期照護與健康管理進修學士學位學程',   divs: ['進修部'] },
      { name: '資訊創新與數位生活進修學士學位學程',   divs: ['進修部'] },
      { name: '室內設計進修學士學位學程',             divs: ['進修部'] },
    ],
  },
]

export function getCollegesForDivision(division: Division): string[] {
  return COLLEGES_DATA
    .filter(c => c.depts.some(d => d.divs.includes(division)))
    .map(c => c.name)
}

export function getDeptsForCollege(division: Division, college: string): string[] {
  return (COLLEGES_DATA.find(c => c.name === college)?.depts ?? [])
    .filter(d => d.divs.includes(division))
    .map(d => d.name)
}

export function getGradesForDivision(division: Division, deptName: string): string[] {
  switch (division) {
    case '日間部':
    case '進修部':
    case '學士後學系': {
      const isSixYear = COLLEGES_DATA
        .flatMap(c => c.depts)
        .find(d => d.name === deptName)?.sixYears
      return isSixYear
        ? ['大一', '大二', '大三', '大四', '大五', '大六']
        : ['大一', '大二', '大三', '大四']
    }
    case '碩士班':
    case '碩士在職專班':
      return ['碩一', '碩二', '碩三']
    case '博士班':
      return ['博一', '博二', '博三', '博四以上']
  }
}
