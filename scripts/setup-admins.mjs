/**
 * 後台人員帳號初始化腳本
 * 執行方式：node scripts/setup-admins.mjs
 *
 * 資料問題警告：
 *   - 劉昌安 (413146067) 電話 090382098 僅 9 碼，可能有誤，請確認後手動更新
 *   - 曾品瑄 & 趙郡妘 電話相同 (0920283158)，可能有誤
 */

import { scrypt, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const scryptAsync = promisify(scrypt)

async function hashPin(pin) {
  const salt = randomBytes(16).toString('hex')
  const key  = await scryptAsync(pin, salt, 32)
  return `${salt}:${key.toString('hex')}`
}

// 讀取 .env.local
function loadEnv() {
  const path = join(__dir, '..', '.env.local')
  const raw  = readFileSync(path, 'utf8')
  const env  = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (!m) continue
    env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env   = loadEnv()
const URL   = env.NEXT_PUBLIC_SUPABASE_URL
const KEY   = env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !KEY) {
  console.error('❌ 找不到 SUPABASE 環境變數，請確認 .env.local')
  process.exit(1)
}

async function sb(path, body) {
  const res = await fetch(`${URL}/rest/v1${path}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${KEY}`,
      'apikey':        KEY,
      'Prefer':        'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Supabase ${res.status}: ${txt}`)
  }
}

// ── 人員資料（去除重複的蕭詠心）──
const ADMINS = [
  { name: '蕭詠心', id: '414401191', phone: '0909107686' },
  { name: '王韻慈', id: '413491151', phone: '0905045562' },
  { name: '梁倢菱', id: '413530141', phone: '0933128538' },
  { name: '林榆昕', id: '413491034', phone: '0921629106' },
  { name: '黃薇',   id: '412120016', phone: '0902355217' },
  { name: '曾品瑄', id: '411421073', phone: '0920283158' },
  { name: '趙郡妘', id: '411330107', phone: '0920283158' }, // ⚠ 與曾品瑄電話相同
  { name: '呂孋庭', id: '413031365', phone: '0983636256' },
  { name: '蔡秉軒', id: '413402435', phone: '0972396129' }, // super admin
  { name: '蔡昇翰', id: '414242193', phone: '0976540729' },
  { name: '陳奕嵐', id: '412421044', phone: '0908780293' },
  { name: '劉昌安', id: '413146067', phone: '090382098'  }, // ⚠ 9碼，可能有誤
  { name: '呂孟倢', id: '412540096', phone: '0968911760' },
  { name: '趙俊吉', id: '413352367', phone: '0979358367' },
  { name: '李承家', id: '413383316', phone: '0972825731' },
  { name: '何智弘', id: '413381576', phone: '0905128234' },
  { name: '侯昱安', id: '413382568', phone: '0906680331' },
  { name: '謝綺澄', id: '413480516', phone: '0921193795' },
  { name: '邱映儒', id: '414050643', phone: '0968853231' },
]

async function main() {
  console.log(`\n🚀 開始設定 ${ADMINS.length} 位後台人員帳號...\n`)

  for (const a of ADMINS) {
    process.stdout.write(`  ${a.name} (${a.id})... `)
    const hash = await hashPin(a.phone)

    await sb('/authorized_admins', {
      student_id:     a.id,
      email:          `${a.id}@s.fju.edu.tw`,
      display_name:   a.name,
      is_super_admin: a.id === '413402435',
    })

    await sb('/admin_accounts', {
      student_id:          a.id,
      password_hash:       hash,
      is_active:           true,
      must_change_password: true,
    })

    console.log('✓')
  }

  console.log('\n✅ 完成！所有帳號已設定，初次登入須強制更改密碼。')
  console.log('\n⚠  資料問題提醒：')
  console.log('   - 劉昌安 電話 090382098（9碼），請確認正確號碼後至 Supabase 手動更新密碼')
  console.log('   - 曾品瑄 & 趙郡妘 電話相同（0920283158），請確認是否正確\n')
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) })
