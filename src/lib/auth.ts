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
    maxAge: 60 * 60 * 8,
  })
}

export async function setMemberSession(studentId: string) {
  const cookieStore = await cookies()
  const payload = `member:${studentId}:${Date.now()}`
  cookieStore.set(COOKIE_NAME, sign(payload), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

export async function getAdminStudentId(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  const value = verify(raw)
  if (!value?.startsWith('member:')) return null
  return value.split(':')[1] ?? null
}

const OTP_PENDING_COOKIE = 'admin_otp_pending'

export async function setOtpPendingSession(studentId: string) {
  const cookieStore = await cookies()
  const payload = `otp:${studentId}:${Date.now()}`
  cookieStore.set(OTP_PENDING_COOKIE, sign(payload), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })
}

export async function getOtpPendingStudentId(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(OTP_PENDING_COOKIE)?.value
  if (!raw) return null
  const value = verify(raw)
  if (!value?.startsWith('otp:')) return null
  return value.split(':')[1] ?? null
}

export async function clearOtpPendingSession() {
  const cookieStore = await cookies()
  cookieStore.delete(OTP_PENDING_COOKIE)
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
