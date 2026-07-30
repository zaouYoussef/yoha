'use client';

import { useEffect } from 'react';

export function SmoothScrollProvider({ children }) {
  useEffect(() => {
    let lenisInstance = null;
    let animId = null;

    import('lenis')
      .then(({ default: Lenis }) => {
        lenisInstance = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 1.0,
          touchMultiplier: 1.5,
        });

        function raf(time) {
          if (lenisInstance) {
            lenisInstance.raf(time);
            animId = requestAnimationFrame(raf);
          }
        }
        animId = requestAnimationFrame(raf);
      })
      .catch(() => {
        // Fallback optionnel si Lenis est absent du serveur
      });

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (lenisInstance) lenisInstance.destroy();
    };
  }, []);

  return <>{children}</>;
}

