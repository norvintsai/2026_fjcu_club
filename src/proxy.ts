import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.ADMIN_SECRET ?? 'dev-secret'
const COOKIE_NAME = 'admin_session'

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes.buffer as ArrayBuffer
}

async function verify(signed: string): Promise<boolean> {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return false
  const value = signed.slice(0, lastDot)
  const hexSig = signed.slice(lastDot + 1)
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    return await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(hexSig),
      new TextEncoder().encode(value)
    )
  } catch {
    return false
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/admin/dashboard')) {
    const raw = req.cookies.get(COOKIE_NAME)?.value
    if (!raw || !(await verify(raw))) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
}
