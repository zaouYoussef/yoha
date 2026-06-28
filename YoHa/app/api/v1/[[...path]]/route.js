import { NextResponse } from 'next/server';

const BACKEND = (process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

function buildBackendUrl(segments, search) {
  const joined = (segments || []).filter(Boolean).join('/');
  const path = joined ? `${joined}/` : '';
  return `${BACKEND}/api/v1/${path}${search || ''}`;
}

function isFrontendUrl(url) {
  return /:300[0-9]\b/.test(url) || url.includes('localhost:300');
}

async function proxy(request, context) {
  const params = await context.params;
  const segments = params.path || [];
  const { search } = new URL(request.url);
  let target = buildBackendUrl(segments, search);

  // Sécurité : s'assurer que l'URL cible se termine par un slash (Django APPEND_SLASH)
  if (!target.split('?')[0].endsWith('/')) {
    target = target.replace(/(\?|$)/, '/$1');
  }

  const headers = new Headers();
  const auth = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  if (auth) headers.set('Authorization', auth);
  if (contentType) headers.set('Content-Type', contentType);

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  let upstream = await fetch(target, init);

  if ([301, 302, 307, 308].includes(upstream.status)) {
    const location = upstream.headers.get('location');
    if (location && !isFrontendUrl(location)) {
      const nextUrl = location.startsWith('http')
        ? location
        : `${BACKEND}${location.startsWith('/') ? location : `/${location}`}`;
      upstream = await fetch(nextUrl, init);
    }
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
