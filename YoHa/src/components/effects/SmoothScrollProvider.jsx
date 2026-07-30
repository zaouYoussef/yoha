'use client';

import { useEffect } from 'react';

export function SmoothScrollProvider({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Enable smooth scroll behavior at root level
    document.documentElement.style.scrollBehavior = 'smooth';

    // Safely load Lenis dynamically if available without throwing webpack resolution errors
    const loadLenis = async () => {
      try {
        const moduleName = 'lenis';
        const { default: Lenis } = await import(/* webpackIgnore: true */ moduleName);
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        });
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      } catch {
        // Native fallback smooth scroll is active
      }
    };

    loadLenis();
  }, []);

  return <>{children}</>;
}
