import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

const SECRET = process.env.ADMIN_SECRET ?? 'dev-secret'
const COOKIE_NAME = 'admin_session'

function sign(value: string): string {
  const hmac = createHmac('sha256', SECRET)
  hmac.update(value)
  return `${value}.${hmac.digest('hex')}`
}

function verify(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value)
  return expected === signed ? value : null
}

export async function setAdminSession() {
  const cookieStore = await cookies()
  const payload = `admin:${Date.now()}`
  cookieStore.set(COOKIE_NAME, sign(payload), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return false
  return verify(raw) !== null
}
