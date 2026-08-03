/** Utilitaires offres resto — réduction % par catégories. */

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

/** Meilleure offre % applicable à un plat (catégorie ciblée ou tout le menu). */
export function findItemPercentageOffer(item, restaurant) {
  const offers = activeOffers(restaurant).filter(
    (o) => o.offer_type === 'percentage' && Number(o.discount_percent) > 0,
  );
  if (!offers.length) return null;

  const catId = resolveItemCategoryId(item, restaurant);
  let best = null;
  for (const offer of offers) {
    const ids = Array.isArray(offer.category_ids) ? offer.category_ids.map(Number) : [];
    const applies = ids.length === 0 || (catId > 0 && ids.includes(catId));
    if (!applies) continue;
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
  const names = Array.isArray(offer?.category_names) ? offer.category_names.filter(Boolean) : [];
  if (!names.length && (!offer?.category_ids || offer.category_ids.length === 0)) {
    return 'tout le menu';
  }
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(' & ');
  if (names.length > 2) return `${names.slice(0, 2).join(', ')}…`;
  return 'catégories sélectionnées';
}
