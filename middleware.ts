import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad) b64 += '='.repeat(4 - pad)
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

function roleFromToken(token: string | undefined): string {
  if (!token) return 'USER'
  return decodeJwtPayload(token)?.role ?? 'USER'
}

const CRM_ROUTES_PREFIXES = [
  '/dashboard',
  '/contacts',
  '/solicitacoes',
  '/whatsapp',
  '/arquivos',
  '/configuracoes',
  '/usuarios',
  '/developer',
]

function isCrmAppPath(pathname: string): boolean {
  if (pathname === '/') return true
  return CRM_ROUTES_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl
  const role = roleFromToken(token)

  if (pathname === '/login' && token) {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && pathname === '/') {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (token && pathname !== '/login' && isCrmAppPath(pathname)) {
    if (role === 'ADMIN' && pathname.startsWith('/developer')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (role === 'USER' && (pathname.startsWith('/developer') || pathname.startsWith('/usuarios'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (role === 'DEVELOPER') {
      const allowed =
        pathname.startsWith('/developer') ||
        pathname.startsWith('/usuarios')
      if (!allowed) {
        return NextResponse.redirect(new URL('/developer', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  // Excluir estáticos do public — senão pedidos como /icon.png são redirecionados para /login sem cookie
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|logo.png|logoBar.png).*)',
  ],
}
