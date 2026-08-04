import { NextResponse } from 'next/server';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
};

export function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host');

  if (host && host.startsWith('www.')) {
    const newHost = host.slice(4);
    const newUrl = `https://${newHost}${url.pathname}${url.search}`;
    const res = NextResponse.redirect(newUrl, 301);
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const res = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.woff|.*\\.woff2|.*\\.webp).*)',
  ],
};
