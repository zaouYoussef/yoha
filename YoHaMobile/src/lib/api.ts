import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeOpeningHours, restaurantOpenStatus, type OpeningHoursMap } from './openingHours';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function devMachineIp(): string | null {
  const expoConfig = Constants.expoConfig as
    | { hostUri?: string; debuggerHost?: string }
    | null
    | undefined;
  const host =
    Constants.expoGoConfig?.debuggerHost ??
    expoConfig?.debuggerHost ??
    expoConfig?.hostUri?.replace(/^[^:]+:\/\//, '') ??
    (
      Constants as {
        manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
      }
    ).manifest2?.extra?.expoClient?.hostUri;
  if (!host) return null;
  const ip = host.split(':')[0];
  if (!ip || ip === 'localhost') return '127.0.0.1';
  return ip;
}

/**
 * Web → localhost.
 * Dev client / Expo Go Wi‑Fi → IP du PC (depuis Metro).
 * Câble USB + adb reverse → 127.0.0.1.
 * Émulateur Android → 10.0.2.2.
 */
export function resolveApiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8000/api/v1';
  }
  const lanIp = devMachineIp();
  if (fromEnv) {
    // 127.0.0.1 dans .env = mode USB (adb reverse) — ne jamais remplacer
    return fromEnv;
  }
  if (lanIp && lanIp !== '127.0.0.1' && __DEV__) {
    return `http://${lanIp}:8000/api/v1`;
  }
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://127.0.0.1:8000/api/v1';
}

/** URL API courante (recalculée à chaque appel en dev). */
export function getApiBase(): string {
  return resolveApiBase();
}

/** @deprecated Préférez getApiBase() — valeur figée au chargement du module. */
export const API_BASE = resolveApiBase();

function apiHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  // localtunnel affiche une page interstitielle sans cet en-tête
  if (getApiBase().includes('loca.lt')) {
    headers['Bypass-Tunnel-Reminder'] = 'true';
  }
  return headers;
}

/** Test rapide depuis l'écran login (sans auth). */
export async function testApiConnection(): Promise<{ ok: boolean; message: string }> {
  const url = `${getApiBase()}/restaurants/`;
  try {
    const res = await fetch(url, { method: 'GET', headers: apiHeaders() });
    if (res.ok) return { ok: true, message: `OK (${res.status}) — ${url}` };
    const text = await res.text();
    return { ok: false, message: `HTTP ${res.status} — ${text.slice(0, 120)}` };
  } catch (e) {
    const hint =
      Platform.OS === 'web'
        ? 'Django tourne ? python manage.py runserver 0.0.0.0:8000'
        : 'USB: npm run adb:reverse + runserver 127.0.0.1:8000 — Wi‑Fi: runserver 0.0.0.0:8000';
    return {
      ok: false,
      message: `${e instanceof Error ? e.message : 'Erreur réseau'}. ${hint}`,
    };
  }
}

const TOKEN_KEY = 'yoha-mobile-tokens';

export type YoHaUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'client' | 'courier' | 'restaurant' | 'admin';
};

type Tokens = { access: string; refresh: string };

export async function getTokens(): Promise<Tokens | null> {
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setTokens(tokens: Tokens) {
  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export async function clearTokens() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

function apiOrigin() {
  return getApiBase().replace(/\/api\/v1\/?$/, '');
}

export function mediaUrl(url?: string | null) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http')) return trimmed;
  const origin = apiOrigin();
  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

function unwrapList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: unknown[] }).results;
  }
  return [];
}

function ensureTrailingSlash(path: string) {
  const qIndex = path.indexOf('?');
  const pathname = qIndex === -1 ? path : path.slice(0, qIndex);
  const search = qIndex === -1 ? '' : path.slice(qIndex);
  if (pathname.endsWith('/')) return path;
  return `${pathname}/${search}`;
}

function firstFieldError(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const val of Object.values(obj as Record<string, unknown>)) {
    if (Array.isArray(val) && val[0]) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return null;
}

function looksLikeHtml(text: string) {
  const t = text.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html') || t.includes('<body');
}

function parseError(data: unknown, status: number) {
  if (status === 429) return 'Chargement en cours…';
  if (!data) return `Erreur serveur (${status})`;
  if (typeof data === 'string') {
    if (looksLikeHtml(data)) {
      return `Réponse invalide du serveur (HTTP ${status}). Vérifiez que Django tourne sur ${getApiBase()} et redémarrez-le si besoin.`;
    }
    return data.length > 200 ? `${data.slice(0, 200)}…` : data;
  }
  if (typeof data === 'object' && data !== null) {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === 'string') return d.detail;
    const nested = firstFieldError(d.detail);
    if (nested) return nested;
    const direct = firstFieldError(d);
    if (direct) return direct;
  }
  return `Erreur (${status})`;
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens?.refresh) return null;
  const res = await fetch(`${getApiBase()}/auth/refresh/`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ refresh: tokens.refresh }),
  });
  if (!res.ok) {
    await clearTokens();
    return null;
  }
  const data = await res.json();
  const next = { ...tokens, access: data.access };
  await setTokens(next);
  return next.access;
}

export async function apiFetch<T = unknown>(
  path: string,
  {
    method = 'GET',
    body,
    auth = true,
    retry = true,
  }: {
    method?: string;
    body?: unknown;
    auth?: boolean;
    retry?: boolean;
  } = {},
): Promise<T> {
  const url = `${getApiBase()}${ensureTrailingSlash(path)}`;
  const headers = apiHeaders();
  const tokens = await getTokens();
  if (auth && tokens?.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const base = getApiBase();
    const hint =
      base.includes('127.0.0.1')
        ? 'Câble USB ? Lancez: npm run adb:reverse. Django: python manage.py runserver 127.0.0.1:8000'
        : 'Wi‑Fi ? Django: python manage.py runserver 0.0.0.0:8000 + même réseau que le téléphone';
    throw new Error(`Impossible de joindre l'API (${base}). ${hint}`);
  }

  if (res.status === 401 && auth && retry && tokens?.refresh) {
    const access = await refreshAccessToken();
    if (access) {
      return apiFetch(path, { method, body, auth, retry: false });
    }
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    if (res.ok) {
      throw new Error(
        `Réponse non-JSON depuis ${url}. Mauvaise URL API ? Attendu: ${getApiBase()}`,
      );
    }
    data = text;
  }

  if (!res.ok) {
    const err = new Error(parseError(data, res.status)) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export function mapUser(apiUser: Record<string, unknown> | null): YoHaUser | null {
  if (!apiUser) return null;
  const validRoles: YoHaUser['role'][] = ['client', 'courier', 'restaurant', 'admin'];
  const role = String(apiUser.role || '');
  if (!validRoles.includes(role as YoHaUser['role'])) return null;
  return {
    id: String(apiUser.id),
    email: String(apiUser.email),
    displayName: String(apiUser.display_name || apiUser.displayName || ''),
    role: role as YoHaUser['role'],
  };
}

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine?: string;
  cover?: string;
  logo?: string;
  phone?: string;
  address?: string;
  description?: string;
  fee?: string;
  distance?: string;
  promo?: string;
  tags?: string[];
  menu?: MenuCategory[];
  openingHours?: OpeningHoursMap;
  isOpen?: boolean;
  openLabel?: string;
  isCustomRequest?: boolean;
  [key: string]: unknown;
};

export type MenuItem = {
  id: string;
  dbId?: number;
  name: string;
  price: number | string;
  desc?: string;
  ingredients?: string;
  img?: string;
  isAvailable?: boolean;
};

export type MenuCategory = {
  id: string;
  dbId?: number;
  name: string;
  items: MenuItem[];
};

export type Order = {
  id: string;
  status: string;
  createdAt?: string;
  restaurantId?: string;
  restaurantName?: string;
  restaurantPhone?: string;
  restaurantNotes?: string;
  totalDh?: number | string;
  subtotalDh?: number | string;
  items?: Array<{ id: string; name: string; price: number | string; qty: number; img?: string }>;
  scheduledDeliveryAt?: string | null;
  customer?: { name?: string; address?: string; phone?: string; email?: string };
  courierId?: string | number | null;
  courierName?: string;
  cancelledPhase?: string;
  cancellationReason?: string;
  [key: string]: unknown;
};

function normalizeOrder(o: Record<string, unknown>): Order {
  const items = Array.isArray(o.items)
    ? (o.items as Record<string, unknown>[]).map((item) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
        price: (item.price as string | number) ?? 0,
        qty: typeof item.qty === 'number' ? item.qty : 1,
        img: mediaUrl(item.img as string),
      }))
    : [];

  return {
    ...(o as Order),
    items,
  };
}

function normalizeRestaurant(r: Record<string, unknown>): Restaurant {
  const slug = String(r.slug ?? r.id ?? '');
  const openingHours = normalizeOpeningHours(r.openingHours ?? r.opening_hours);
  const status = restaurantOpenStatus(openingHours);
  return {
    ...(r as Restaurant),
    id: slug,
    slug,
    fee: String(r.fee ?? r.fee_label ?? 'Livraison offerte'),
    distance: String(r.distance ?? r.distance_label ?? ''),
    promo: String(r.promo ?? r.promo_label ?? ''),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    cover: mediaUrl(r.cover as string),
    logo: mediaUrl(r.logo as string),
    openingHours,
    isOpen: typeof r.isOpen === 'boolean' ? r.isOpen : typeof r.is_open === 'boolean' ? r.is_open : status.isOpen,
    openLabel: String(r.openLabel ?? r.open_label ?? status.openLabel),
    menu: Array.isArray(r.menu)
      ? (r.menu as Record<string, unknown>[]).map((cat) => ({
          id: String(cat.db_id ?? cat.id ?? cat.category ?? ''),
          dbId: typeof cat.db_id === 'number' ? cat.db_id : undefined,
          name: String(cat.name ?? cat.category ?? 'Menu'),
          items: Array.isArray(cat.items)
            ? (cat.items as Record<string, unknown>[]).map((it) => ({
                id: String(it.id ?? ''),
                dbId: typeof it.db_id === 'number' ? it.db_id : undefined,
                name: String(it.name ?? ''),
                price: it.price as number | string,
                desc: String(it.desc ?? it.description ?? ''),
                ingredients: it.ingredients ? String(it.ingredients) : undefined,
                img: mediaUrl(it.img as string),
                isAvailable: it.is_available !== false && it.isAvailable !== false,
              }))
            : [],
        }))
      : r.menu,
  } as Restaurant;
}

export const authApi = {
  async login(identifier: string, password: string) {
    const id = String(identifier ?? '').trim();
    if (!id) throw new Error('Identifiant requis.');
    const data = await apiFetch<{ access: string; refresh: string }>('/auth/login/', {
      method: 'POST',
      body: { email: id, password },
      auth: false,
    });
    await setTokens({ access: data.access, refresh: data.refresh });
    const me = await apiFetch<Record<string, unknown>>('/auth/me/');
    return mapUser(me);
  },

  async register(email: string, password: string, displayName: string) {
    await apiFetch('/auth/register/', {
      method: 'POST',
      body: {
        email: email.trim().toLowerCase(),
        password,
        display_name: (displayName || '').trim(),
      },
      auth: false,
    });
    return authApi.login(email.trim().toLowerCase(), password);
  },

  async me() {
    const data = await apiFetch<Record<string, unknown>>('/auth/me/');
    return mapUser(data);
  },

  async logout() {
    await clearTokens();
  },

  async registerPushToken(token: string, platform: string) {
    return apiFetch('/auth/push-token/', {
      method: 'POST',
      body: { token, platform },
    });
  },

  async unregisterPushToken(token?: string) {
    return apiFetch('/auth/push-token/', {
      method: 'DELETE',
      body: token ? { token } : {},
    });
  },

  async loginWithGoogle(idToken: string) {
    const data = await apiFetch<{
      access: string;
      refresh: string;
      user: Record<string, unknown>;
    }>('/auth/google/', {
      method: 'POST',
      body: { id_token: idToken },
      auth: false,
    });
    await setTokens({ access: data.access, refresh: data.refresh });
    return mapUser(data.user);
  },

};

export const restaurantsApi = {
  async list(params: { cuisine?: string; q?: string } = {}) {
    const q = new URLSearchParams();
    if (params.cuisine) q.set('cuisine', params.cuisine);
    if (params.q) q.set('q', params.q);
    const query = q.toString();
    const path = query ? `/restaurants/?${query}` : '/restaurants/';
    const data = await apiFetch(path, { auth: false });
    const list = unwrapList(data);
    return list.map((r) => normalizeRestaurant(r as Record<string, unknown>));
  },

  async get(slug: string) {
    const data = await apiFetch<Record<string, unknown>>(`/restaurants/${slug}/`, { auth: false });
    return normalizeRestaurant(data);
  },

  async me() {
    const data = await apiFetch<Record<string, unknown>>('/restaurants/me/');
    return normalizeRestaurant(data);
  },

  async updateMe(payload: Record<string, unknown>) {
    const data = await apiFetch<Record<string, unknown>>('/restaurants/me/', {
      method: 'PATCH',
      body: payload,
    });
    return normalizeRestaurant(data);
  },

  async create(payload: { name: string; cuisine: string; description?: string }) {
    const data = await apiFetch<Record<string, unknown>>('/restaurants/me/create/', {
      method: 'POST',
      body: payload,
    });
    return normalizeRestaurant(data);
  },

  async createCategory(payload: { name: string }) {
    return apiFetch('/restaurants/me/menu/categories/', {
      method: 'POST',
      body: payload,
    });
  },

  async createMenuItem(categoryId: number, payload: Record<string, unknown>) {
    return apiFetch('/restaurants/me/menu/items/', {
      method: 'POST',
      body: { ...payload, category_id: categoryId },
    });
  },

  async updateMenuItem(dbId: number, payload: Record<string, unknown>) {
    return apiFetch(`/restaurants/me/menu/items/${dbId}/`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async deleteMenuItem(dbId: number) {
    return apiFetch(`/restaurants/me/menu/items/${dbId}/`, { method: 'DELETE' });
  },
};

export const ordersApi = {
  async list() {
    const raw = unwrapList(await apiFetch('/orders/'));
    return (raw as Record<string, unknown>[]).map(normalizeOrder);
  },

  async guestList(publicIds: string[]) {
    if (!publicIds.length) return [] as Order[];
    const raw = unwrapList(
      await apiFetch('/orders/guest/', {
        method: 'POST',
        body: { public_ids: publicIds },
        auth: false,
      }),
    );
    return (raw as Record<string, unknown>[]).map(normalizeOrder);
  },

  async subscribePush(token: string, publicIds: string[], platform?: string) {
    const tokens = await getTokens();
    return apiFetch<{ subscribed: number; public_ids: string[] }>('/orders/push-subscribe/', {
      method: 'POST',
      body: { token, public_ids: publicIds, platform },
      auth: !!tokens?.access,
    });
  },

  async get(publicId: string) {
    const tokens = await getTokens();
    if (tokens?.access) {
      const raw = await apiFetch<Record<string, unknown>>(`/orders/${publicId}/`);
      return normalizeOrder(raw);
    }
    const guest = await ordersApi.guestList([publicId]);
    if (guest[0]) return guest[0];
    throw new Error('Commande introuvable');
  },

  async checkout(payload: Record<string, unknown>) {
    const tokens = await getTokens();
    const raw = await apiFetch<Record<string, unknown>>('/orders/checkout/', {
      method: 'POST',
      body: payload,
      auth: !!tokens?.access,
    });
    return normalizeOrder(raw);
  },

  async updateStatus(publicId: string, status: string, note = '') {
    return apiFetch(`/orders/${publicId}/status/`, {
      method: 'PATCH',
      body: { status, note },
    });
  },

  async claimOrder(publicId: string) {
    return apiFetch(`/orders/${publicId}/claim/`, { method: 'POST', body: {} });
  },

  async couriers() {
    return unwrapList(await apiFetch('/orders/couriers/')) as Array<{
      id: string;
      name: string;
      userId?: string;
    }>;
  },

  async cancelOrder(publicId: string, reason: string) {
    return apiFetch(`/orders/${publicId}/status/`, {
      method: 'PATCH',
      body: { status: 'cancelled', note: reason },
    });
  },

  async sendToRestaurant(publicId: string) {
    return apiFetch(`/orders/${publicId}/send-to-restaurant/`, { method: 'POST', body: {} });
  },
};
