import { startTransition } from 'react';

/**
 * Navigation douce : View Transitions API + React startTransition.
 * Fallback immédiat si le navigateur ne support pas.
 */
export function softNavigate(router, href, { method = 'push' } = {}) {
  if (!router || !href) return;

  const run = () => {
    startTransition(() => {
      if (method === 'replace') router.replace(href);
      else router.push(href);
    });
  };

  if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
    try {
      document.startViewTransition(run);
      return;
    } catch {
      /* ignore — fallback below */
    }
  }
  run();
}
