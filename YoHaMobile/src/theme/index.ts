export const brand = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
};

export const ink = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

export const accent = {
  pink: '#ec4899',
  violet: '#8b5cf6',
  sky: '#0ea5e9',
  emerald: '#10b981',
};

export const gradients = {
  primary: ['#f97316', '#ec4899', '#8b5cf6'] as const,
  warm: ['#fff7ed', '#ffffff', '#f8fafc'] as const,
  hero: ['#f97316', '#ec4899'] as const,
  courier: ['#8b5cf6', '#ec4899', '#f97316'] as const,
  sunset: ['#fb923c', '#f472b6', '#a78bfa'] as const,
  aurora: ['#0f172a', '#1e1b4b', '#312e81', '#0f172a'] as const,
  glass: ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.78)'] as const,
  cta: ['#ea580c', '#db2777', '#7c3aed'] as const,
  card: ['#ffffff', '#fff7ed'] as const,
};

export const glass = {
  bg: 'rgba(255,255,255,0.82)',
  border: 'rgba(255,255,255,0.65)',
  blur: 24,
};

export const typography = {
  hero: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1.2 },
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6 },
};

export const shadows = {
  glow: {
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 16,
  },
  glowOrange: {
    shadowColor: brand[500],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
  },
  float: {
    shadowColor: ink[900],
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 10,
  },
  card: {
    shadowColor: ink[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  soft: {
    shadowColor: ink[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 12, md: 18, lg: 24, xl: 32, full: 999 };
