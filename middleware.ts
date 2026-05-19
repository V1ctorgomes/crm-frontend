import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

async function roleFromToken(token: string): Promise<string | null> {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] },
    );
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function decodeJwtPayloadUnsafe(token: string): { role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    return JSON.parse(atob(b64)) as { role?: string };
  } catch {
    return null;
  }
}

async function resolveRole(token: string | undefined): Promise<string> {
  if (!token) return 'USER';
  const verified = await roleFromToken(token);
  if (verified) return verified;
  return decodeJwtPayloadUnsafe(token)?.role ?? 'USER';
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
  '/produtividade',
];

function isCrmAppPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return CRM_ROUTES_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  const role = await resolveRole(token);

  if (pathname === '/login' && token) {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && pathname === '/') {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (token && pathname !== '/login' && isCrmAppPath(pathname)) {
    if (role === 'ADMIN' && pathname.startsWith('/developer')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (
      role === 'USER' &&
      (pathname.startsWith('/developer') ||
        pathname.startsWith('/usuarios') ||
        pathname.startsWith('/produtividade'))
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (role === 'DEVELOPER') {
      const allowed =
        pathname.startsWith('/developer') ||
        pathname.startsWith('/usuarios') ||
        pathname.startsWith('/produtividade');
      if (!allowed) {
        return NextResponse.redirect(new URL('/developer', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|logo.png|logoBar.png|sw\\.js|manifest\\.webmanifest).*)',
  ],
};
