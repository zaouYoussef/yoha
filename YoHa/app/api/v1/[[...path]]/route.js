import { NextResponse } from 'next/server';

const BACKEND = (process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

function buildBackendUrl(segments, search) {
  const joined = (segments || []).filter(Boolean).join('/');
  const path = joined ? `${joined}/` : '';
  return `${BACKEND}/api/v1/${path}${search || ''}`;
}

function isSameBackend(url) {
  try {
    const u = new URL(url, BACKEND);
    const b = new URL(BACKEND);
    return u.origin === b.origin && u.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

async function proxy(request, context) {
  try {
    const params = await context.params;
    const segments = params.path || [];
    const { search } = new URL(request.url);
    let target = buildBackendUrl(segments, search);

    if (!target.split('?')[0].endsWith('/')) {
      target = target.replace(/(\?|$)/, '/$1');
    }

    const headers = new Headers();
    const auth = request.headers.get('authorization');
    const contentType = request.headers.get('content-type');
    if (auth) headers.set('Authorization', auth);
    if (contentType) headers.set('Content-Type', contentType);
    // Ne pas forger Proto : laisser nginx / l'origine réelle
    const fwdProto = request.headers.get('x-forwarded-proto');
    if (fwdProto) headers.set('X-Forwarded-Proto', fwdProto);
    headers.set('X-Forwarded-Host', request.headers.get('host') || 'yoha.ma');

    const init = {
      method: request.method,
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(25000),
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer();
    }

    let upstream = await fetch(target, init);

    // Ne suivre qu'une redirection vers le même backend API (anti-SSRF)
    if ([301, 302, 307, 308].includes(upstream.status)) {
      const location = upstream.headers.get('location');
      if (location) {
        const nextUrl = location.startsWith('http')
          ? location
          : `${BACKEND}${location.startsWith('/') ? location : `/${location}`}`;
        if (isSameBackend(nextUrl)) {
          upstream = await fetch(nextUrl, init);
        }
      }
    }

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: true, detail: 'Service temporairement indisponible.' },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
