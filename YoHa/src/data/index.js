export { CUISINES } from './cuisines.js';
export { CUISINE_CATEGORIES } from './cuisineCategories.js';
export { CATEGORIES_BANNERS, CATEGORY_GROUPS } from './categories.js';
export { FEATURES } from './features.jsx';
export { TESTIMONIALS } from './testimonials.js';
export { HOW_STEPS } from './howSteps.jsx';
export { CAMPUS_HOSPITALS } from './campusHospitals.js';
export * from './orderConstants.js';
export * from './openingHours.js';
export * from './chartMocks.js';
export { STATIC_STORES as STATIC_STORES_RAW } from './staticStores.js';
export { STATIC_STORE_META } from './staticStoreMeta.js';
import { STATIC_STORES as STATIC_STORES_RAW } from './staticStores.js';
import { STATIC_STORE_META } from './staticStoreMeta.js';

/** Static stores enriched with researched address / openingHours when available. */
export const STATIC_STORES = (STATIC_STORES_RAW || []).map((store) => {
  const meta = STATIC_STORE_META?.[store.id];
  if (!meta) return store;
  const next = { ...store };
  if (meta.address) {
    next.address = meta.address;
    const baseDesc = String(store.description || '');
    if (baseDesc.includes('—')) {
      const prefix = baseDesc.split('—', 1)[0].trim();
      const tail = baseDesc.includes('. ') ? baseDesc.split('. ').slice(1).join('. ') : '';
      next.description = tail
        ? `${prefix} — ${meta.address}. ${tail}`
        : `${prefix} — ${meta.address}`;
    }
  }
  if (meta.openingHours) {
    next.openingHours = meta.openingHours;
  }
  return next;
});
