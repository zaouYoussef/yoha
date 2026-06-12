'use client';

import React, { useEffect, useMemo, useState } from 'react';

/** Image de remplacement si l’URL du plat est invalide ou inaccessible */
export const FOOD_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop';

export const RESTAURANT_COVER_FALLBACK =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80&auto=format&fit=crop';

export const RESTAURANT_LOGO_FALLBACK =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&q=80&auto=format&fit=crop';

export function restaurantCover(url) {
  return (typeof url === 'string' && url.trim()) ? url.trim() : RESTAURANT_COVER_FALLBACK;
}

export function restaurantLogo(url) {
  return (typeof url === 'string' && url.trim()) ? url.trim() : RESTAURANT_LOGO_FALLBACK;
}

/**
 * Image plat : secours Unsplash si l’URL casse, puis placeholder 🍽️ si besoin.
 */
export function MenuItemImage({ src, alt = '', className = '', loading = 'lazy' }) {
  const primary = typeof src === 'string' ? src.trim() : '';
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
  }, [primary]);

  const url = useMemo(() => {
    if (phase === 0) return primary || FOOD_IMAGE_FALLBACK;
    if (phase === 1) return FOOD_IMAGE_FALLBACK;
    return null;
  }, [primary, phase]);

  const onError = () => {
    setPhase((p) => {
      if (p === 0) {
        if (!primary) return 2;
        return 1;
      }
      if (p === 1) return 2;
      return p;
    });
  };

  if (phase >= 2 || url == null) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-brand-100/90 to-ink-200/90 dark:from-ink-800 dark:to-ink-900 text-4xl select-none ${className}`}
        role="img"
        aria-label={alt || 'Illustration plat'}
      >
        🍽️
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={onError}
    />
  );
}
