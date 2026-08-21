import { scrypt, randomBytes, timingSafeEqual, randomInt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key  = await scryptAsync(pin, salt, 32) as Buffer
  return `${salt}:${key.toString('hex')}`
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const key       = await scryptAsync(pin, salt, 32) as Buffer
  const storedKey = Buffer.from(hash, 'hex')
  if (key.length !== storedKey.length) return false
  return timingSafeEqual(key, storedKey)
}

export function generateOTP(): string {
  return randomInt(100000, 1000000).toString()
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`
}
