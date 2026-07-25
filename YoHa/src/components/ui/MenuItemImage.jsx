'use client';

import React, { useEffect, useMemo, useState } from 'react';

export const UNSPLASH_FALLBACKS = [
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1558961309-dbdf0f0237fa?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&auto=format&fit=crop&q=80',
];

/** Image de remplacement si l’URL du plat est invalide ou inaccessible */
export const FOOD_IMAGE_FALLBACK = UNSPLASH_FALLBACKS[0];
export const RESTAURANT_COVER_FALLBACK = UNSPLASH_FALLBACKS[0];
export const RESTAURANT_LOGO_FALLBACK = '/logo.webp';

export function restaurantCover(url) {
  if (typeof url === 'string' && url.trim()) {
    return url.trim();
  }
  return RESTAURANT_COVER_FALLBACK;
}

export function restaurantLogo(url) {
  if (typeof url === 'string' && url.trim()) {
    return url.trim();
  }
  return RESTAURANT_LOGO_FALLBACK;
}

/**
 * Image plat : secours CDN si l’URL casse, puis placeholder 🍽️ si besoin.
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
    setPhase((p) => Math.min(p + 1, 2));
  };

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-slate-200 dark:bg-ink-800 text-ink-400 ${className}`}>
        🍽️
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading={loading}
      onError={onError}
      className={className}
    />
  );
}
