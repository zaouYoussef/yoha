/**
 * YoHa — design system "Braise".
 *
 * Fond charbon chaud, la photo du plat est la seule source de lumière,
 * un seul accent (l'orange YoHa poussé en braise). Les noms d'export
 * historiques (brand, ink, gradients…) sont conservés pour que les écrans
 * pas encore migrés continuent de compiler.
 */

/** L'accent unique. Un seul orange, décliné. */
export const brand = {
  50: '#fff1e9',
  100: '#ffdcc8',
  200: '#ffbd97',
  300: '#ff9d66',
  400: '#ff8a3d',
  500: '#ff5a1f',
  600: '#e63f06',
  700: '#b83205',
  800: '#8a2604',
  900: '#5c1902',
};

/** L'échelle de gris est chaude, jamais neutre : elle garde la braise. */
export const ink = {
  50: '#f4efe9',
  100: '#e3dbd3',
  200: '#c6bbb1',
  300: '#a2968e',
  400: '#7d716a',
  500: '#5c524d',
  600: '#413936',
  700: '#2b2422',
  800: '#1e1917',
  900: '#141010',
  950: '#0a0806',
};

export const surface = {
  void: '#0a0806',
  soot: '#141010',
  ash: '#1e1917',
  smoke: '#2b2422',
};

export const text = {
  bone: '#f4efe9',
  fog: '#a2968e',
  dim: '#7d716a',
  onEmber: '#0a0806',
};

export const accent = {
  ember: '#ff5a1f',
  emberHot: '#ff8a3d',
  mint: '#4ade9b',
  saffron: '#f5c451',
  /* alias historiques */
  pink: '#ff5a1f',
  violet: '#ff8a3d',
  sky: '#4ade9b',
  emerald: '#4ade9b',
};

export const line = {
  hair: 'rgba(244,239,233,0.08)',
  soft: 'rgba(244,239,233,0.14)',
  strong: 'rgba(244,239,233,0.24)',
  ember: 'rgba(255,90,31,0.32)',
};

/**
 * Les dégradés ne colorent plus l'interface : ils servent uniquement à
 * fondre une photo dans le noir. C'est le changement clé par rapport à
 * l'ancien thème orange→rose→violet.
 */
export const gradients = {
  /** Voile plein cadre sur une photo hero. */
  scrim: ['rgba(10,8,6,0.72)', 'rgba(10,8,6,0.12)', 'rgba(10,8,6,0.88)', '#0a0806'] as const,
  scrimLocations: [0, 0.32, 0.74, 1] as const,
  /** Voile bas seulement (cartes). */
  cardScrim: ['transparent', 'rgba(20,16,16,0.55)', 'rgba(20,16,16,0.97)'] as const,
  /** Fondu vers le fond sous une sheet ou un footer. */
  fadeDown: ['transparent', '#0a0806'] as const,
  fadeUp: ['#0a0806', 'transparent'] as const,
  /** Le CTA : deux braises, pas un arc-en-ciel. */
  cta: ['#ff6a2b', '#ff5a1f', '#e63f06'] as const,
  /* alias historiques */
  primary: ['#ff6a2b', '#e63f06'] as const,
  warm: ['#141010', '#0a0806'] as const,
  hero: ['#ff6a2b', '#e63f06'] as const,
  courier: ['#ff6a2b', '#e63f06'] as const,
  sunset: ['#ff8a3d', '#ff5a1f'] as const,
  aurora: ['#0a0806', '#1e1917', '#0a0806'] as const,
  glass: ['rgba(30,25,23,0.92)', 'rgba(20,16,16,0.86)'] as const,
  card: ['#1e1917', '#141010'] as const,
};

export const glass = {
  bg: 'rgba(30,25,23,0.72)',
  border: line.soft,
  blur: 24,
};

/**
 * Titres en display condensé, capitales, interlignage serré.
 * Corps en Archivo. Chiffres en mono pour que les prix s'alignent.
 */
export const typography = {
  hero: { fontSize: 58, lineHeight: 50, letterSpacing: -1.2, textTransform: 'uppercase' as const },
  h1: { fontSize: 42, lineHeight: 37, letterSpacing: -0.9, textTransform: 'uppercase' as const },
  h2: { fontSize: 30, lineHeight: 27, letterSpacing: -0.5, textTransform: 'uppercase' as const },
  h3: { fontSize: 23, lineHeight: 21, letterSpacing: -0.3, textTransform: 'uppercase' as const },
  body: { fontSize: 14, lineHeight: 21, letterSpacing: 0 },
  small: { fontSize: 12.5, lineHeight: 18 },
  caption: { fontSize: 11.5, lineHeight: 16 },
  label: { fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase' as const },
  price: { fontSize: 15, letterSpacing: -0.2 },
};

/**
 * Sur fond sombre une ombre noire ne se voit pas : on éclaire.
 * `emberGlow` est réservé au CTA principal, un seul par écran.
 */
export const shadows = {
  emberGlow: {
    shadowColor: '#ff5a1f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 26,
    elevation: 14,
  },
  lift: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 6,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  /* alias historiques */
  glow: {
    shadowColor: '#ff5a1f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 26,
    elevation: 14,
  },
  glowOrange: {
    shadowColor: '#ff5a1f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 12,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, xxl: 34, full: 999 };

/** Durées de transition. Rien au-dessus de 700 ms : l'app doit rester nerveuse. */
export const motion = { fast: 160, base: 280, slow: 620 };
