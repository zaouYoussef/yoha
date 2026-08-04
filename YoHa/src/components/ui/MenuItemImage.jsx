'use client';

import React, { useEffect, useState } from 'react';

export const UNSPLASH_FALLBACKS = [
  // 0 = placeholder « image introuvable » (assets locaux)
  '/images.png',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=75',
];

export const FOOD_IMAGE_FALLBACK = '/images.png';
/** Cover resto : ambiance food (pas le placeholder générique). */
export const RESTAURANT_COVER_FALLBACK =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=75';
export const RESTAURANT_LOGO_FALLBACK = '/logo.webp';

/** Transforms Glovo dhmedia — plats petits, cover/logo haute qualité. */
const GLOVO_MENU_TRANSFORM =
  'W3sicmVzaXplIjp7Im1vZGUiOiJmaXQiLCJ3aWR0aCI6MzIwLCJoZWlnaHQiOjMyMH19LHsid2VicCI6e319XQ==';
const GLOVO_COVER_TRANSFORM =
  'W3sicmVzaXplIjp7Im1vZGUiOiJmaXQiLCJ3aWR0aCI6MTIwMCwiaGVpZ2h0Ijo4MDB9fSx7IndlYnAiOnt9fV0=';
const GLOVO_LOGO_TRANSFORM =
  'W3sicmVzaXplIjp7Im1vZGUiOiJmaXQiLCJ3aWR0aCI6NTEyLCJoZWlnaHQiOjUxMn19LHsid2VicCI6e319XQ==';

function stripGlovoTransform(url) {
  return url
    .replace(/([?&])t=[^&]*/g, '$1')
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '')
    .replace(/\?$/, '');
}

/** Répare / normalise les URLs images Glovo (dhmedia + transform t=). */
export function fixGlovoImageUrl(url, transform = GLOVO_MENU_TRANSFORM) {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';

  // CloudFront Glovo mort → laisser le fallback UI
  if (/cloudfront\.net/i.test(trimmed) || /d52ouboplz7yg/i.test(trimmed)) {
    return '';
  }

  // dhmedia.iomenus-glovo → dhmedia.io/image/menus-glovo
  const mangled = trimmed.match(/^https:\/\/glovo\.dhmedia\.io([a-z0-9-]+)\/(.*)$/i);
  if (mangled && !trimmed.includes('/image/')) {
    trimmed = `https://glovo.dhmedia.io/image/${mangled[1]}/${mangled[2]}`;
  } else if (trimmed.startsWith('https://glovo.dhmedia.io/') && !trimmed.includes('/image/')) {
    trimmed = trimmed.replace('https://glovo.dhmedia.io/', 'https://glovo.dhmedia.io/image/');
  }

  if (trimmed.startsWith('https://images.deliveryhero.io/image/')) {
    trimmed = `https://glovo.dhmedia.io/image/${trimmed.slice('https://images.deliveryhero.io/image/'.length)}`;
  }

  if (trimmed.includes('glovo.dhmedia.io/image/')) {
    trimmed = stripGlovoTransform(trimmed);
    trimmed += `${trimmed.includes('?') ? '&' : '?'}t=${transform}`;
  }

  if (trimmed.includes('unsplash.com')) {
    trimmed = trimmed.replace(/w=\d+/g, 'w=500').replace(/q=\d+/g, 'q=75');
  }
  return trimmed;
}

export function restaurantCover(url) {
  const fixed = fixGlovoImageUrl(url, GLOVO_COVER_TRANSFORM);
  return fixed || RESTAURANT_COVER_FALLBACK;
}

export function restaurantLogo(url) {
  const fixed = fixGlovoImageUrl(url, GLOVO_LOGO_TRANSFORM);
  return fixed || RESTAURANT_LOGO_FALLBACK;
}

export function MenuItemImage({ src, alt = '', className = '', loading = 'lazy' }) {
  const primary = fixGlovoImageUrl(typeof src === 'string' ? src : '');

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
    if (
      text.includes('patisserie') || text.includes('dessert') || text.includes('sweets') ||
      text.includes('bakery') || text.includes('cookie') || text.includes('cake') ||
      text.includes('brunch') || text.includes('toast') || text.includes('café') || text.includes('cafe') ||
      text.includes('matcha') || text.includes('smoothie') || text.includes('thé') || text.includes('tea')
    ) {
      return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75';
    }
    return FOOD_IMAGE_FALLBACK;
  };

  const initialSource = () => primary || getSmartFallback();

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
      referrerPolicy="no-referrer"
      decoding="async"
      onError={handleError}
      className={className}
    />
  );
}
