import { NextResponse } from 'next/server';

/**
 * Basic password protection for the entire site.
 * Set SITE_PASSWORD as an environment variable in Vercel dashboard.
 *
 * How it works:
 * - First visit: no cookie → redirect to /login
 * - /login page: user enters password → sets a cookie → redirect to /
 * - Subsequent visits: cookie present → pass through
 */

const PUBLIC_PATHS = ['/login', '/api/login'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const auth = request.cookies.get('auth')?.value;
  if (auth === process.env.SITE_PASSWORD) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|css/|js/|data/).*)'],
};
