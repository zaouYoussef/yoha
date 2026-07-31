import type { StaticStore } from '../data/staticStores';
import type { Restaurant } from './api';

export function storeToRestaurant(s: StaticStore): Restaurant {
  return {
    id: s.id,
    slug: s.id,
    name: s.name,
    cuisine: s.cuisine,
    cover: s.cover,
    logo: s.logo,
    description: s.description,
    tags: s.tags,
    isOpen: s.isOpen,
    distance: s.distance,
    eta: s.eta,
    fee: s.fee,
    promo: s.isCustomRequest ? 'Sur-mesure' : s.fee,
    isCustomRequest: s.isCustomRequest,
  };
}

export function storeEtaMin(s: StaticStore): number {
  const n = parseInt(s.eta, 10);
  return Number.isFinite(n) ? n : 25;
}

export function storeHook(s: StaticStore): string {
  return s.isCustomRequest ? 'Sur-mesure' : s.fee || '20 DH';
}
