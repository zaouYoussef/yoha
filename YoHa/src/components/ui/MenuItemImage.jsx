'use client';

import React, { useEffect, useState } from 'react';

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

export const FOOD_IMAGE_FALLBACK = UNSPLASH_FALLBACKS[0];
export const RESTAURANT_COVER_FALLBACK = UNSPLASH_FALLBACKS[0];
export const RESTAURANT_LOGO_FALLBACK = '/logo.webp';

export function restaurantCover(url) {
  if (typeof url === 'string' && url.trim()) {
    const trimmed = url.trim();
    if (!trimmed.startsWith('/stores/') && !trimmed.startsWith('/media/')) {
      return trimmed;
    }
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
 * Component pour afficher les images sans aucune erreur "photo introuvable".
 * Si l'URL principale casse ou est 404, elle bascule immédiatement sur une image HD Unsplash valide.
 */
export function MenuItemImage({ src, alt = '', className = '', loading = 'lazy' }) {
  const primary = typeof src === 'string' ? src.trim() : '';
  const [currentSrc, setCurrentSrc] = useState(primary || FOOD_IMAGE_FALLBACK);

  useEffect(() => {
    setCurrentSrc(primary || FOOD_IMAGE_FALLBACK);
  }, [primary]);

  const handleError = () => {
    if (currentSrc !== FOOD_IMAGE_FALLBACK) {
      setCurrentSrc(FOOD_IMAGE_FALLBACK);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      onError={handleError}
      className={className}
    />
  );
}
