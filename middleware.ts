import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { isComercialAppPath, isEstoqueAppPath, isModuleScopedAppPath } from '@/lib/company-modules';
import { isCompanyModuleId, MODULE_COOKIE } from '@/lib/active-module';

async function roleFromToken(token: string): Promise<string | null> {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
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

function isDeveloperOnlyPath(pathname: string): boolean {
  return (
    pathname.startsWith('/developer') ||
    pathname.startsWith('/usuarios') ||
    pathname.startsWith('/produtividade')
  );
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  const role = await resolveRole(token);
  const moduleCookie = request.cookies.get(MODULE_COOKIE)?.value;
  const activeModule = isCompanyModuleId(moduleCookie) ? moduleCookie : null;

  if (pathname === '/login' && token) {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url));
    }
    return NextResponse.redirect(new URL('/inicio', request.url));
  }

  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && pathname === '/') {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url));
    }
    return NextResponse.redirect(new URL('/inicio', request.url));
  }

  if (token && pathname === '/inicio' && role === 'DEVELOPER') {
    return NextResponse.redirect(new URL('/developer', request.url));
  }

  if (token && pathname !== '/login' && isDeveloperOnlyPath(pathname)) {
    if (role === 'ADMIN' && pathname.startsWith('/developer')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (role === 'USER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (role === 'DEVELOPER') {
      return NextResponse.next();
    }
  }

  if (token && pathname !== '/login' && pathname !== '/inicio' && isModuleScopedAppPath(pathname)) {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url));
    }

    const inferred = isEstoqueAppPath(pathname)
      ? 'estoque'
      : isComercialAppPath(pathname)
        ? 'comercial'
        : null;

    if (!activeModule) {
      if (inferred) {
        const res = NextResponse.next();
        res.cookies.set(MODULE_COOKIE, inferred, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
          sameSite: 'lax',
        });
        return res;
      }
      return NextResponse.redirect(new URL('/inicio', request.url));
    }

    if (activeModule === 'comercial' && isEstoqueAppPath(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (activeModule === 'estoque' && isComercialAppPath(pathname)) {
      return NextResponse.redirect(new URL('/estoque/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|logo.png|logoBar.png|sw\\.js|manifest\\.webmanifest).*)',
  ],
};
