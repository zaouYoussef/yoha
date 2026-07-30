export const UNSPLASH_FALLBACKS: Record<string, string> = {
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
  tacos: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&auto=format&fit=crop&q=80',
  kebab: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80',
  sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
  healthy: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  asian: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80',
  dessert: 'https://images.unsplash.com/photo-1558961309-dbdf0f0237fa?w=600&auto=format&fit=crop&q=80',
  pharmacy: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',
  parapharmacy: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
  supermarket: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
  shop: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
  drinks: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
};

export function getSmartFallback(cuisine?: string): string {
  if (!cuisine) return UNSPLASH_FALLBACKS.default;
  const key = cuisine.toLowerCase().trim();
  return UNSPLASH_FALLBACKS[key] || UNSPLASH_FALLBACKS.default;
}

export function resolveImageUrl(url?: string | null, cuisine?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return getSmartFallback(cuisine);
  }
  let trimmed = url.trim();
  if (trimmed.startsWith('http://127.0.0.1:8000') || trimmed.startsWith('http://localhost:8000')) {
    trimmed = trimmed.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, 'https://yoha.ma');
  } else if (trimmed.startsWith('/')) {
    trimmed = `https://yoha.ma${trimmed}`;
  }
  return trimmed;
}
