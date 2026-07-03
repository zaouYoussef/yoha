import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host');

  // Enforce non-www canonical domain
  if (host && host.startsWith('www.')) {
    const newHost = host.slice(4); // Remove 'www.'
    const newUrl = `https://${newHost}${url.pathname}${url.search}`;
    return NextResponse.redirect(newUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static asset files (png, jpg, jpeg, svg, gif, woff, woff2)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.woff|.*\\.woff2).*)',
  ],
};
