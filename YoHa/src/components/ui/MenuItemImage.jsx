'use client';

import React, { useEffect, useMemo, useState } from 'react';

/** Image de remplacement si l’URL du plat est invalide ou inaccessible */
export const FOOD_IMAGE_FALLBACK = '/custom_order_card.webp';

export const RESTAURANT_COVER_FALLBACK = '/custom_order_card.webp';

export const RESTAURANT_LOGO_FALLBACK = '/logo.webp';

export function restaurantCover(url) {
  if (typeof url === 'string' && url.trim()) {
    const trimmed = url.trim();
    if (trimmed.includes('custom-pharmacy')) return '/media/restaurants/custom-pharmacy.webp';
    if (trimmed.includes('custom-supermarket')) return '/media/restaurants/custom-supermarket.webp';
    if (trimmed.includes('custom-parapharmacy')) return '/media/restaurants/custom-parapharmacy.webp';
    if (trimmed.includes('custom-shop')) return '/media/restaurants/custom-shop.webp';
    if (trimmed.includes('custom-patisserie')) return '/media/restaurants/custom-patisserie.webp';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return '/custom_order_card.webp';
    }
    return trimmed;
  }
  return RESTAURANT_COVER_FALLBACK;
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
      return FOOD_IMAGE_FALLBACK;
    }
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
