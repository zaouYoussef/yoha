/** Utilitaires offres resto — réduction % par catégories et/ou plats. */

function activeOffers(restaurant) {
  const list = Array.isArray(restaurant?.offers) ? restaurant.offers : [];
  return list.filter((o) => o && o.is_active !== false);
}

/** ID catégorie menu d’un plat (API ou fallback via restaurant.menu). */
export function resolveItemCategoryId(item, restaurant) {
  const direct = Number(item?.categoryId ?? item?.category_id ?? 0);
  if (direct > 0) return direct;
  const menu = Array.isArray(restaurant?.menu) ? restaurant.menu : [];
  for (const cat of menu) {
    const items = cat?.items || [];
    const hit = items.some(
      (it) =>
        (item?.db_id && it?.db_id === item.db_id) ||
        (item?.id != null && it?.id === item.id),
    );
    if (hit) return Number(cat.db_id || 0);
  }
  return 0;
}

/** ID DB d’un plat. */
export function resolveItemDbId(item) {
  return Number(item?.db_id ?? item?.pk ?? 0);
}

/** Une offre % s’applique-t-elle à ce plat ? */
export function offerAppliesToItem(offer, item, restaurant) {
  if (!offer || offer.offer_type !== 'percentage') return false;
  if (!(Number(offer.discount_percent) > 0)) return false;

  const itemIds = Array.isArray(offer.item_ids) ? offer.item_ids.map(Number) : [];
  const catIds = Array.isArray(offer.category_ids) ? offer.category_ids.map(Number) : [];

  // Aucun filtre → tout le menu
  if (itemIds.length === 0 && catIds.length === 0) return true;

  const itemId = resolveItemDbId(item);
  if (itemIds.length > 0 && itemId > 0 && itemIds.includes(itemId)) return true;

  const catId = resolveItemCategoryId(item, restaurant);
  if (catIds.length > 0 && catId > 0 && catIds.includes(catId)) return true;

  return false;
}

/** Meilleure offre % applicable à un plat (plat / catégorie / tout le menu). */
export function findItemPercentageOffer(item, restaurant) {
  const offers = activeOffers(restaurant).filter(
    (o) => o.offer_type === 'percentage' && Number(o.discount_percent) > 0,
  );
  if (!offers.length) return null;

  let best = null;
  for (const offer of offers) {
    if (!offerAppliesToItem(offer, item, restaurant)) continue;
    const pct = Number(offer.discount_percent);
    if (!best || pct > Number(best.discount_percent)) best = offer;
  }
  return best;
}

export function discountedUnitPrice(basePrice, discountPercent) {
  const price = Number(basePrice) || 0;
  const pct = Number(discountPercent) || 0;
  if (pct <= 0) return price;
  return Math.round(price * (100 - pct)) / 100;
}

/** Enrichit un item avec prix promo pour affichage / panier. */
export function withItemOfferPricing(item, restaurant) {
  if (!item) return item;
  const offer = findItemPercentageOffer(item, restaurant);
  if (!offer) {
    return {
      ...item,
      originalPrice: undefined,
      discountPercent: undefined,
      offerTitle: undefined,
    };
  }
  const base = Number(item.originalPrice ?? item.price) || 0;
  const pct = Number(offer.discount_percent);
  return {
    ...item,
    originalPrice: base,
    price: discountedUnitPrice(base, pct),
    discountPercent: pct,
    offerTitle: offer.title,
  };
}

export function offerScopeLabel(offer) {
  const itemNames = Array.isArray(offer?.item_names) ? offer.item_names.filter(Boolean) : [];
  const catNames = Array.isArray(offer?.category_names) ? offer.category_names.filter(Boolean) : [];
  const hasItems = itemNames.length > 0 || (Array.isArray(offer?.item_ids) && offer.item_ids.length > 0);
  const hasCats = catNames.length > 0 || (Array.isArray(offer?.category_ids) && offer.category_ids.length > 0);

  if (!hasItems && !hasCats) return 'tout le menu';

  const parts = [];
  if (itemNames.length === 1) parts.push(itemNames[0]);
  else if (itemNames.length === 2) parts.push(itemNames.join(' & '));
  else if (itemNames.length > 2) parts.push(`${itemNames.slice(0, 2).join(', ')}…`);
  else if (hasItems) parts.push('plats sélectionnés');

  if (catNames.length === 1) parts.push(catNames[0]);
  else if (catNames.length === 2) parts.push(catNames.join(' & '));
  else if (catNames.length > 2) parts.push(`${catNames.slice(0, 2).join(', ')}…`);
  else if (hasCats && !hasItems) parts.push('catégories sélectionnées');

  return parts.filter(Boolean).join(' · ') || 'sélection';
}
