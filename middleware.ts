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

function clearSessionCookie(res: NextResponse): void {
  res.cookies.set('token', '', { path: '/', maxAge: 0 });
  res.cookies.set('crm_csrf', '', { path: '/', maxAge: 0 });
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
  const role = token ? await roleFromToken(token) : null;
  const moduleCookie = request.cookies.get(MODULE_COOKIE)?.value;
  const activeModule = isCompanyModuleId(moduleCookie) ? moduleCookie : null;

  if (token && !role && pathname !== '/login') {
    const res = NextResponse.redirect(new URL('/login', request.url));
    clearSessionCookie(res);
    return res;
  }

  if (pathname === '/login' && token && role) {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url));
    }
    return NextResponse.redirect(new URL('/inicio', request.url));
  }

  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && role && pathname === '/') {
    if (role === 'DEVELOPER') {
      return NextResponse.redirect(new URL('/developer', request.url));
    }
    return NextResponse.redirect(new URL('/inicio', request.url));
  }

  if (token && role && pathname === '/inicio' && role === 'DEVELOPER') {
    return NextResponse.redirect(new URL('/developer', request.url));
  }

  if (token && role && pathname !== '/login' && isDeveloperOnlyPath(pathname)) {
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

  if (token && role && pathname !== '/login' && pathname !== '/inicio' && isModuleScopedAppPath(pathname)) {
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
