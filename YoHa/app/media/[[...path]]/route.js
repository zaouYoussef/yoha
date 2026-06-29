import { NextResponse } from 'next/server';

const BACKEND = (process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function proxyMedia(request, context) {
  try {
    const params = await context.params;
    const segments = params.path || [];
    const joined = segments.filter(Boolean).join('/');
    const { search } = new URL(request.url);
    const target = `${BACKEND}/media/${joined}${search || ''}`;

    const upstream = await fetch(target, {
      method: request.method,
      headers: request.method !== 'GET' && request.method !== 'HEAD'
        ? { 'Content-Type': request.headers.get('content-type') || 'application/octet-stream' }
        : undefined,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.arrayBuffer()
        : undefined,
      redirect: 'manual',
    });

    const body = await upstream.arrayBuffer();
    const headers = new Headers();
    const contentType = upstream.headers.get('content-type');
    const cacheControl = upstream.headers.get('cache-control');
    if (contentType) headers.set('Content-Type', contentType);
    headers.set('Cache-Control', cacheControl || 'public, max-age=31536000, immutable');

    return new NextResponse(body, { status: upstream.status, headers });
  } catch (error) {
    console.error('Media proxy error:', error);
    return new NextResponse(null, { status: 404 });
  }
}

export const GET = proxyMedia;
export const HEAD = proxyMedia;
