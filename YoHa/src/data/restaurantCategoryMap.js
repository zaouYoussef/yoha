/**
 * Catégories browse basées sur les menus réels (pas seulement cuisine/tags Glovo).
 * Un resto peut apparaître dans plusieurs rails.
 */
export const RESTAURANT_CATEGORY_MAP = {
  'mr-tacos-tanger': ['tacos', 'burger', 'sandwich'],
  'new-school-tacos-corniche': ['tacos'],
  'new-school-tacos-boulevard': ['tacos', 'burger'],
  'new-school-tacos-marjane': ['tacos'],
  'new-school-tacos-tanger': ['tacos'],

  // Menu = sushi / asian / poke — pas burger/tacos
  kamora: ['sushi', 'asian', 'healthy'],

  burns: ['burger', 'healthy'],
  // Menu = crêpes / pancakes / desserts
  'melt-99': ['crepes', 'sweets', 'breakfast'],

  // Multi-snack : shawarma, sandwich, burger, pizza, tacos
  'al-mahroussa': ['sandwich', 'kebab', 'shawarma', 'burger', 'pizza', 'tacos', 'moroccan'],
  'al-mahrousa': ['sandwich', 'kebab', 'shawarma', 'burger', 'pizza', 'tacos', 'moroccan'],

  'beug-s-restaurant': ['burger', 'tacos', 'sandwich', 'healthy'],
  // Menu = smash burgers / sandwiches — pas pizza
  'big-bunn': ['burger', 'sandwich'],
  'matsco-food': ['tacos', 'sandwich', 'pizza', 'burger', 'kebab'],
  'matsco-sandwich': ['sandwich', 'kebab', 'shawarma', 'tacos'],
  vicio: ['burger', 'chicken', 'tacos'],
  'crousty-signature': ['burger', 'chicken'],
  'pam-pam': ['burger', 'tacos', 'sandwich'],

  'little-mamma': ['pizza', 'italian'],
  'pizzeria-les-amis': ['pizza', 'kebab', 'shawarma', 'sandwich', 'burger', 'italian'],

  'soju-sushi': ['sushi', 'asian', 'healthy'],
  'maro-sushi': ['sushi', 'asian', 'pizza'],

  // Indien dédié (pas seulement "Asian")
  'indian-spice-tanger': ['indian', 'asian'],

  'oppa-chicken': ['chicken', 'asian', 'burger'],
  'crousty-house': ['chicken', 'asian'],

  'snack-roma': ['sandwich', 'kebab', 'shawarma', 'pizza', 'tacos', 'burger'],

  'l-assiette-verte': ['healthy'],
  'good-food-corner': ['healthy', 'breakfast'],

  // Snack salé multi (malgré le branding chocolat)
  'tchoco-charly': ['pizza', 'tacos', 'burger', 'kebab', 'sandwich'],

  crumby: ['breakfast', 'sweets'],
  kunafita: ['sweets'],
  'maison-glaces': ['crepes', 'sweets'],
};

/** Alias filtres carousel / rails → clés canoniques */
const CATEGORY_ALIASES = {
  shawarma: ['kebab', 'shawarma'],
  kebab: ['kebab', 'shawarma'],
  sushi: ['sushi', 'asian'],
  asian: ['asian', 'sushi'],
  grillades: ['chicken', 'burger'],
  chicken: ['chicken'],
  sweets: ['sweets', 'crepes'],
  crepes: ['crepes', 'sweets'],
  dessert: ['sweets', 'crepes'],
  indian: ['indian'],
  italien: ['italian', 'pizza'],
  italian: ['italian', 'pizza'],
  breakfast: ['breakfast', 'crepes'],
  bakery: ['breakfast', 'sweets'],
  snacks: ['sandwich', 'tacos'],
  snack: ['sandwich'],
  moroccan: ['moroccan'],
};

function storeId(r) {
  return String(r?.id || r?.slug || '').trim().toLowerCase();
}

function fallbackCategories(r) {
  const out = new Set();
  const cuisine = String(r?.cuisine || '').toLowerCase();
  const name = String(r?.name || '').toLowerCase();
  const tags = (Array.isArray(r?.tags) ? r.tags : []).map((t) => String(t).toLowerCase());

  const add = (...keys) => keys.forEach((k) => out.add(k));

  if (cuisine === 'burger' || tags.some((t) => t.includes('burger')) || name.includes('burger')) add('burger');
  if (cuisine === 'pizza' || tags.some((t) => t.includes('pizza')) || name.includes('pizza')) add('pizza');
  if (cuisine === 'tacos' || tags.some((t) => t.includes('tacos')) || /tacos|wrap/.test(name)) add('tacos');
  if (cuisine === 'kebab' || tags.some((t) => /kebab|shawarma|chawarma/.test(t)) || /kebab|shawarma|chawarma/.test(name)) {
    add('kebab', 'shawarma');
  }
  if (cuisine === 'sushi' || tags.some((t) => /sushi|japonais/.test(t)) || /sushi|japonais/.test(name)) add('sushi', 'asian');
  if (cuisine === 'asian' || tags.some((t) => /asian|asiatique|coréen|coreen|nouilles|wok/.test(t))) add('asian');
  if (tags.some((t) => /indien|curry|indian/.test(t)) || /indian|indien|spice/.test(name)) add('indian', 'asian');
  if (cuisine === 'sandwich' || tags.some((t) => /sandwich|snack/.test(t)) || /snack|sandwich/.test(name)) add('sandwich');
  if (cuisine === 'healthy' || cuisine === 'medical' || tags.some((t) => /healthy|salade|bowl/.test(t)) || /healthy|bowl|assiette verte/.test(name)) {
    add('healthy');
  }
  if (cuisine === 'chicken' || tags.some((t) => /poulet|chicken|tenders|crispy/.test(t)) || /chicken|poulet|oppa|crousty/.test(name)) {
    add('chicken');
  }
  if (tags.some((t) => /crêpe|crepe|gaufre|waffle|pancake/.test(t)) || /glace|crêpe|crepe|melt/.test(name)) {
    add('crepes', 'sweets');
  }
  if (cuisine === 'dessert' || tags.some((t) => /dessert|cookie|kunafa|chocolat/.test(t))) add('sweets');
  if (tags.some((t) => /brunch|café|cafe|petit/.test(t))) add('breakfast');
  if (tags.some((t) => /italien|pasta|pâtes/.test(t))) add('italian');
  if (tags.some((t) => /marocain/.test(t))) add('moroccan');

  return [...out];
}

/** Liste des catégories d’un resto (map menu-first, sinon heuristique). */
export function restaurantCategories(r) {
  const id = storeId(r);
  if (id && RESTAURANT_CATEGORY_MAP[id]) return [...RESTAURANT_CATEGORY_MAP[id]];
  return fallbackCategories(r);
}

/** True si le resto appartient au filtre/rail demandé. */
export function restaurantInCategory(r, category) {
  if (!r || !category) return false;
  const cat = String(category).toLowerCase().trim();
  const cats = restaurantCategories(r);
  if (cats.includes(cat)) return true;
  const aliases = CATEGORY_ALIASES[cat];
  if (aliases) return aliases.some((a) => cats.includes(a));
  return false;
}
