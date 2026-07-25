'use client';

import React, { useEffect, useMemo, useState } from 'react';

const DISTINCT_COVERS = [
  '/pizza-img/section_1_01.webp',
  '/burger-img/df23088ac8117ca6618f0f5a4e8097679a10d00d.webp',
  '/pizza-img/section_1_05.webp',
  '/pizza-img/section_2_03.webp',
  '/pizza-img/section_2_04.webp',
  '/pizza-img/section_4_03.webp',
  '/pizza-img/section_1_07.webp',
  '/pizza-img/section_2_02.webp',
  '/burger-img/df23088ac8117ca6618f0f5a4e8097679a10d00d_1.webp',
  '/burger-img/df23088ac8117ca6618f0f5a4e8097679a10d00d_2.webp',
  '/burger-img/df23088ac8117ca6618f0f5a4e8097679a10d00d_3.webp',
  '/burger-img/df23088ac8117ca6618f0f5a4e8097679a10d00d_4.webp',
  '/pizza-img/section_2_01.webp',
  '/pizza-img/section_2_06.webp',
  '/pizza-img/section_2_07.webp',
  '/pizza-img/section_4_01.webp',
  '/pizza-img/section_4_04.webp',
];

/** Image de remplacement si l’URL du plat est invalide ou inaccessible */
export const FOOD_IMAGE_FALLBACK = DISTINCT_COVERS[0];

export const RESTAURANT_COVER_FALLBACK = DISTINCT_COVERS[0];

export const RESTAURANT_LOGO_FALLBACK = '/logo.webp';

export function restaurantCover(url) {
  if (typeof url === 'string' && url.trim()) {
    const trimmed = url.trim();
    if (trimmed.includes('custom-pharmacy')) return '/media/restaurants/custom-pharmacy.webp';
    if (trimmed.includes('custom-supermarket')) return '/media/restaurants/custom-supermarket.webp';
    if (trimmed.includes('custom-parapharmacy')) return '/media/restaurants/custom-parapharmacy.webp';
    if (trimmed.includes('custom-shop')) return '/media/restaurants/custom-shop.webp';
    if (trimmed.includes('custom-patisserie')) return '/media/restaurants/custom-patisserie.webp';

    // If local path, return directly
    if (trimmed.startsWith('/') && !trimmed.includes('custom_order_card')) {
      return trimmed;
    }

    // Deterministic hash so every food restaurant gets its OWN unique distinct image
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = (hash << 5) - hash + trimmed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % DISTINCT_COVERS.length;
    return DISTINCT_COVERS[index];
  }
  return DISTINCT_COVERS[0];
}

export function restaurantLogo(url) {
  if (typeof url === 'string' && url.trim()) {
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return '/logo.webp';
    }
    return trimmed;
  }
  return RESTAURANT_LOGO_FALLBACK;
}

/**
 * Image plat : secours local si l’URL casse, puis placeholder 🍽️ si besoin.
 */
export function MenuItemImage({ src, alt = '', className = '', loading = 'lazy' }) {
  const primary = typeof src === 'string' ? src.trim() : '';
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
  }, [primary]);

  const url = useMemo(() => {
    if (primary.startsWith('http://') || primary.startsWith('https://')) {
      let hash = 0;
      for (let i = 0; i < primary.length; i++) {
        hash = (hash << 5) - hash + primary.charCodeAt(i);
        hash |= 0;
      }
      return DISTINCT_COVERS[Math.abs(hash) % DISTINCT_COVERS.length];
    }
    if (phase === 0) return primary || DISTINCT_COVERS[0];
    if (phase === 1) return DISTINCT_COVERS[0];
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
