'use client';

import { useEffect } from 'react';

function isChunkLoadError(error) {
  const name = String(error?.name || '');
  const msg = String(error?.message || '');
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled global runtime error:', error);
    if (!isChunkLoadError(error) || typeof window === 'undefined') return;
    try {
      const key = 'yoha_chunk_reload';
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
      window.location.reload();
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: 'linear-gradient(180deg, #fff7ed 0%, #ffffff 55%, #faf5ff 100%)',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 24,
            padding: '28px 22px',
            boxShadow: '0 18px 40px -24px rgba(15, 23, 42, 0.35)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.45rem', lineHeight: 1.25 }}>
            Une erreur est survenue
          </h2>
          <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.55 }}>
            L&apos;application a rencontré un problème. Sur un téléphone ancien, essayez Chrome
            à jour, ou videz le cache du navigateur.
          </p>
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem('yoha_chunk_reload');
                } catch {
                  // ignore
                }
                reset();
              }}
              style={{
                minHeight: 48,
                border: 0,
                borderRadius: 999,
                background: '#f97316',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
            <a
              href="/browser-update.html"
              style={{
                minHeight: 48,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                background: '#f1f5f9',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
              }}
            >
              Aide navigateur
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
