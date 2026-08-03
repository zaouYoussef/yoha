const FILTER_TO_SLUG = {
  all: '',
  pharmacy: 'pharmacie',
  parapharmacy: 'parapharmacie',
  dessert: 'patisserie',
  supermarket: 'supermarche',
  shop: 'magasins',
};

/** Alias FR / variantes → id filtre interne */
const FILTER_ALIASES = {
  pharmacie: 'pharmacy',
  parapharmacie: 'parapharmacy',
  patisserie: 'dessert',
  pâtisserie: 'dessert',
  supermarche: 'supermarket',
  supermarché: 'supermarket',
  magasins: 'shop',
  restaurants: 'all',
};

const SLUG_TO_FILTER = {};
for (const [f, s] of Object.entries(FILTER_TO_SLUG)) {
  if (s) SLUG_TO_FILTER[s] = f;
}

export function normalizeBrowseFilter(filter) {
  if (!filter || filter === 'all') return 'all';
  if (FILTER_TO_SLUG[filter] !== undefined) return filter;
  if (FILTER_ALIASES[filter]) return FILTER_ALIASES[filter];
  if (SLUG_TO_FILTER[filter]) return SLUG_TO_FILTER[filter];
  return filter;
}

export function browsePathForFilter(filter) {
  const f = normalizeBrowseFilter(filter);
  if (!f || f === 'all') return '/browse';
  const slug = FILTER_TO_SLUG[f];
  if (slug) return `/browse/${slug}`;
  return `/browse?filter=${encodeURIComponent(f)}`;
}

export function filterFromSlug(slug) {
  if (!slug) return 'all';
  return normalizeBrowseFilter(SLUG_TO_FILTER[slug] || slug);
}
