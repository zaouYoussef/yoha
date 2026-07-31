const FILTER_TO_SLUG = {
  all: '',
  pharmacy: 'pharmacie',
  parapharmacy: 'parapharmacie',
  dessert: 'patisserie',
  supermarket: 'supermarche',
  shop: 'magasins',
};

const SLUG_TO_FILTER = {};
for (const [f, s] of Object.entries(FILTER_TO_SLUG)) {
  if (s) SLUG_TO_FILTER[s] = f;
}

export function browsePathForFilter(filter) {
  if (!filter || filter === 'all') return '/browse';
  const slug = FILTER_TO_SLUG[filter];
  if (slug) return `/browse/${slug}`;
  return `/browse?filter=${encodeURIComponent(filter)}`;
}

export function filterFromSlug(slug) {
  if (!slug) return 'all';
  return SLUG_TO_FILTER[slug] || slug;
}
