import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const SECRET = process.env.ADMIN_SECRET ?? 'dev-secret'
const COOKIE_NAME = 'admin_session'

function verify(signed: string): boolean {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return false
  const value = signed.slice(0, lastDot)
  const hash = signed.slice(lastDot + 1)
  const expected = createHmac('sha256', SECRET).update(value).digest('hex')
  return expected === hash
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin/dashboard')) {
    const raw = req.cookies.get(COOKIE_NAME)?.value
    if (!raw || !verify(raw)) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
}
