'use client';

import React, { useEffect, useState } from 'react';

export const UNSPLASH_FALLBACKS = [
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=75',
];

export const FOOD_IMAGE_FALLBACK = UNSPLASH_FALLBACKS[0];
export const RESTAURANT_COVER_FALLBACK = UNSPLASH_FALLBACKS[0];
export const RESTAURANT_LOGO_FALLBACK = '/logo.webp';

export function restaurantCover(url) {
  if (typeof url === 'string' && url.trim()) {
    let trimmed = url.trim();
    if (!trimmed.startsWith('/stores/') && !trimmed.startsWith('/media/')) {
      if (trimmed.includes('unsplash.com')) {
        trimmed = trimmed.replace(/w=\d+/g, 'w=500').replace(/q=\d+/g, 'q=75');
      }
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

export function MenuItemImage({ src, alt = '', className = '', loading = 'lazy' }) {
  const primary = typeof src === 'string' ? src.trim() : '';

  const getSmartFallback = () => {
    const text = `${alt} ${primary}`.toLowerCase();
    if (text.includes('asian') || text.includes('sushi') || text.includes('ramen') || text.includes('wok')) {
      return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=75';
    }
    if (text.includes('burger')) {
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=75';
    }
    if (text.includes('tacos') || text.includes('wrap')) {
      return 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop&q=75';
    }
    if (text.includes('kebab') || text.includes('shawarma')) {
      return 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500&auto=format&fit=crop&q=75';
    }
    if (text.includes('healthy') || text.includes('salad') || text.includes('bowl')) {
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=75';
    }
    if (text.includes('patisserie') || text.includes('dessert') || text.includes('sweets') || text.includes('bakery')) {
      return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75';
    }
    return FOOD_IMAGE_FALLBACK;
  };

  const initialSource = () => {
    let source = primary || getSmartFallback();
    if (source.includes('unsplash.com')) {
      source = source.replace(/w=\d+/g, 'w=500').replace(/q=\d+/g, 'q=75');
    }
    return source;
  };

  const [currentSrc, setCurrentSrc] = useState(initialSource);

  useEffect(() => {
    setCurrentSrc(initialSource());
  }, [primary, alt]);

  const handleError = () => {
    const fallback = getSmartFallback();
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
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
