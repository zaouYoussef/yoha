'use client';

import { useEffect, useRef } from 'react';
import {
  trackPageView, trackClick, startSession, endSession, initAnalytics, trackEvent,
} from '@/lib/analytics.js';

const TRACKED_TAGS = new Set(['A', 'BUTTON']);
const EXCLUDED_CLASSES = new Set(['no-track', 'analytics-exclude']);

function handleClick(e) {
  try {
    let el = e.target;
    while (el && el !== document.body) {
      if (TRACKED_TAGS.has(el.tagName)) {
        const hasExclude = [...el.classList].some((c) => EXCLUDED_CLASSES.has(c));
        if (hasExclude) return;

        const label = el.getAttribute('aria-label')
          || el.getAttribute('data-track')
          || el.textContent?.trim()?.slice(0, 80)
          || el.href?.split('/').pop()
          || el.tagName;

        const href = el.tagName === 'A' ? el.getAttribute('href') : null;
        const metadata = {};
        if (href) metadata.href = href;

        trackClick(label, metadata);
        return;
      }
      el = el.parentElement;
    }
  } catch {}
}

export function AnalyticsTracker() {
  const lastPath = useRef(null);
  const checkRef = useRef(null);

  useEffect(() => {
    initAnalytics();
    startSession();

    lastPath.current = window.location.pathname;

    if (window.location.pathname.startsWith('/restaurant/')) {
      const slug = window.location.pathname.split('/')[2];
      trackEvent('restaurant_view', { label: slug || 'restaurant' });
    }

    checkRef.current = setInterval(() => {
      const p = window.location.pathname;
      if (p !== lastPath.current) {
        trackPageView(p);
        lastPath.current = p;
        if (p.startsWith('/restaurant/')) {
          const slug = p.split('/')[2];
          trackEvent('restaurant_view', { label: slug || 'restaurant' });
        }
      }
    }, 500);

    document.addEventListener('click', handleClick, { capture: true });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastPath.current = null;
        trackPageView(window.location.pathname);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleBeforeUnload = () => {
      endSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(checkRef.current);
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, []);

  return null;
}
