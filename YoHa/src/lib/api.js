/** Chemin relatif = proxy Next.js → Django (évite CORS / Failed to fetch) */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const TOKEN_KEY = 'yoha-tokens';

export function getTokens() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setTokens(tokens) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return data;
}

function firstFieldError(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val[0]) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return null;
}

function ensureTrailingSlash(path) {
  const qIndex = path.indexOf('?');
  const pathname = qIndex === -1 ? path : path.slice(0, qIndex);
  const search = qIndex === -1 ? '' : path.slice(qIndex);
  if (pathname.endsWith('/')) return path;
  return `${pathname}/${search}`;
}

function parseError(data, status) {
  if (status === 429) {
    return 'Chargement en cours…';
  }
  if (!data) return `Erreur serveur (${status})`;
  if (typeof data === 'string') {
    if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
      // Django APPEND_SLASH renvoie une page 404 avec ce message spécifique
      const isAppendSlash =
        (status === 404 || status === 301 || status === 302) &&
        (data.includes('Page not found') || data.includes('The current path') || data.includes("doesn't end in a slash"));
      if (isAppendSlash) {
        return "Erreur de configuration API (URL sans slash final). Redémarrez le serveur Next.js.";
      }
      return `Erreur serveur (${status}). Vérifiez que le backend Django tourne sur le port 8000.`;
    }
    return data;
  }
  if (typeof data.detail === 'string') return data.detail;
  const nested = firstFieldError(data.detail);
  if (nested) return nested;
  if (data.error && data.detail) {
    if (typeof data.detail === 'string') return data.detail;
    const fromDetail = firstFieldError(data.detail);
    if (fromDetail) return fromDetail;
  }
  const direct = firstFieldError(data);
  if (direct) return direct;
  return `Erreur (${status})`;
}

const NETWORK_ERROR_MSG =
  "Impossible de joindre l'API YoHa. Vérifiez que Django tourne (port 8000) et que Next.js est sur http://localhost:3002 — puis cliquez Réessayer.";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseThrottleWaitMs(data) {
  const candidates = [
    data?.detail,
    data?.detail?.detail,
    typeof data === 'string' ? data : null,
  ];
  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const m = raw.match(/(\d+)\s*seconds?/i);
    if (m) return Math.min(parseInt(m[1], 10), 3) * 1000;
  }
  return 1500;
}

async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  const next = { ...tokens, access: data.access };
  setTokens(next);
  return next.access;
}

export async function apiFetch(
  path,
  { method = 'GET', body, auth = true, retry = true, networkRetries = 0, throttleRetry = true } = {},
) {
  const url = `${API_BASE}${ensureTrailingSlash(path)}`;
  const headers = { 'Content-Type': 'application/json' };
  const tokens = getTokens();
  if (auth && tokens?.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    if (networkRetries > 0) {
      await sleep(800);
      return apiFetch(path, {
        method,
        body,
        auth,
        retry,
        networkRetries: networkRetries - 1,
      });
    }
    throw new Error(NETWORK_ERROR_MSG);
  }

  if (res.status === 401 && auth && retry && tokens?.refresh) {
    const access = await refreshAccessToken();
    if (access) {
      return apiFetch(path, { method, body, auth, retry: false, networkRetries, throttleRetry });
    }
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 429 && throttleRetry) {
    await sleep(parseThrottleWaitMs(data));
    return apiFetch(path, {
      method,
      body,
      auth,
      retry,
      networkRetries,
      throttleRetry: false,
    });
  }

  if (!res.ok) {
    const err = new Error(parseError(data, res.status));
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/** URLs médias servies via le proxy Next (/media → Django ou CDN) */
export function mediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/media/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/media/')) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* relative or invalid */
  }
  return trimmed;
}

export async function apiUpload(path, formData, { auth = true } = {}) {
  const url = `${API_BASE}${ensureTrailingSlash(path)}`;
  const headers = {};
  const tokens = getTokens();
  if (auth && tokens?.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(parseError(data, res.status));
    err.status = res.status;
    err.data = data;
    throw err;
  }

  if (data?.url) data.url = mediaUrl(data.url);
  if (data?.thumb_url) data.thumb_url = mediaUrl(data.thumb_url);
  return data;
}

export function mapUser(apiUser) {
  if (!apiUser) return null;
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    displayName: apiUser.display_name || apiUser.displayName,
    role: apiUser.role,
  };
}

export const authApi = {
  async login(identifier, password) {
    const id = String(identifier ?? '').trim();
    if (!id) throw new Error('Identifiant requis.');
    const data = await apiFetch('/auth/login/', {
      method: 'POST',
      body: { email: id, password },
      auth: false,
    });
    setTokens({ access: data.access, refresh: data.refresh });
    const me = await apiFetch('/auth/me/');
    return mapUser(me);
  },

  async register({ email, password, displayName }) {
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

  async loginWithGoogle(idToken) {
    const data = await apiFetch('/auth/google/', {
      method: 'POST',
      body: { id_token: idToken },
      auth: false,
    });
    setTokens({ access: data.access, refresh: data.refresh });
    const me = await apiFetch('/auth/me/');
    return mapUser(me);
  },

  async me() {
    const data = await apiFetch('/auth/me/');
    return mapUser(data);
  },

  logout() {
    clearTokens();
  },
};

export const restaurantsApi = {
  async list(params = {}) {
    const q = new URLSearchParams();
    if (params.cuisine) q.set('cuisine', params.cuisine);
    if (params.q) q.set('q', params.q);
    const query = q.toString();
    const path = query ? `/restaurants/?${query}` : '/restaurants/';
    const data = await apiFetch(path, { auth: false, networkRetries: 4 });
    const list = unwrapList(data);
    return Array.isArray(list) ? list.map(normalizeRestaurant) : [];
  },

  async get(slug) {
    const data = await apiFetch(`/restaurants/${slug}/`, { auth: false });
    return normalizeRestaurant(data);
  },

  async me() {
    const data = await apiFetch('/restaurants/me/');
    return normalizeRestaurant(data);
  },

  async create(payload) {
    const data = await apiFetch('/restaurants/me/create/', {
      method: 'POST',
      body: payload,
    });
    return normalizeRestaurant(data);
  },

  async updateMe(payload) {
    const data = await apiFetch('/restaurants/me/', {
      method: 'PATCH',
      body: payload,
    });
    return normalizeRestaurant(data);
  },

  async uploadMedia(field, file) {
    const fd = new FormData();
    fd.append('field', field);
    fd.append('file', file);
    return apiUpload('/restaurants/me/media/', fd);
  },

  async createCategory(payload) {
    return apiFetch('/restaurants/me/menu/categories/', {
      method: 'POST',
      body: payload,
    });
  },

  async updateCategory(id, payload) {
    return apiFetch(`/restaurants/me/menu/categories/${id}/`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async deleteCategory(id) {
    return apiFetch(`/restaurants/me/menu/categories/${id}/`, { method: 'DELETE' });
  },

  async createMenuItem(categoryId, payload) {
    return apiFetch('/restaurants/me/menu/items/', {
      method: 'POST',
      body: { ...payload, category_id: categoryId },
    });
  },

  async updateMenuItem(id, payload) {
    return apiFetch(`/restaurants/me/menu/items/${id}/`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async deleteMenuItem(id) {
    return apiFetch(`/restaurants/me/menu/items/${id}/`, { method: 'DELETE' });
  },

  async uploadMenuItemImage(itemDbId, file) {
    const fd = new FormData();
    fd.append('file', file);
    return apiUpload(`/restaurants/me/menu/items/${itemDbId}/image/`, fd);
  },
};

import { normalizeOpeningHours, restaurantOpenStatus } from '@/data/openingHours.js';

function normalizeRestaurant(r) {
  if (!r || typeof r !== 'object') return r;
  const openingHours = normalizeOpeningHours(r.openingHours ?? r.opening_hours);
  const status = restaurantOpenStatus(openingHours);
  return {
    ...r,
    cover: mediaUrl(r.cover),
    logo: mediaUrl(r.logo),
    openingHours,
    isOpen: r.isOpen ?? r.is_open ?? status.isOpen,
    openLabel: r.openLabel ?? r.open_label ?? status.openLabel,
    menu: Array.isArray(r.menu)
      ? r.menu.map((cat) => ({
          ...cat,
          items: Array.isArray(cat.items)
            ? cat.items.map((it) => ({ ...it, img: mediaUrl(it.img) }))
            : cat.items,
        }))
      : r.menu,
  };
}

export const ordersApi = {
  async list() {
    return unwrapList(await apiFetch('/orders/'));
  },

  async guestList(publicIds) {
    if (!publicIds?.length) return [];
    return unwrapList(
      await apiFetch('/orders/guest/', {
        method: 'POST',
        body: { public_ids: publicIds },
        auth: false,
      }),
    );
  },

  async get(publicId) {
    return apiFetch(`/orders/${publicId}/`);
  },

  async checkout(payload) {
    return apiFetch('/orders/checkout/', {
      method: 'POST',
      body: payload,
      auth: !!getTokens()?.access,
    });
  },

  async claimGuest(publicIds) {
    if (!publicIds?.length) return { claimed: 0, orders: [] };
    return apiFetch('/orders/claim/', {
      method: 'POST',
      body: { public_ids: publicIds },
    });
  },

  async updateStatus(publicId, status, note = '') {
    return apiFetch(`/orders/${publicId}/status/`, {
      method: 'PATCH',
      body: { status, note },
    });
  },

  async assignCourier(publicId, courierId) {
    return apiFetch(`/orders/${publicId}/assign-courier/`, {
      method: 'POST',
      body: { courier_id: Number(courierId) },
    });
  },

  async claimOrder(publicId) {
    return apiFetch(`/orders/${publicId}/claim/`, {
      method: 'POST',
      body: {},
    });
  },

  async dispatch(publicId) {
    return apiFetch(`/orders/${publicId}/dispatch/`, {
      method: 'POST',
      auth: false,
    });
  },

  async markReady(publicId) {
    return apiFetch(`/orders/${publicId}/ready/`, {
      method: 'POST',
      auth: false,
    });
  },

  async couriers() {
    return unwrapList(await apiFetch('/orders/couriers/'));
  },

  async sendToRestaurant(publicId) {
    return apiFetch(`/orders/${publicId}/send-to-restaurant/`, {
      method: 'POST',
      body: {},
    });
  },
};
