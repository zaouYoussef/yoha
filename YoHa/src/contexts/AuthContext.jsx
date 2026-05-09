import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_USERS = 'yoha-users';
const STORAGE_SESSION = 'yoha-session';

/** Rôles : client (commande), admin (gérant), courier (livreur), restaurant */
export const AUTH_ROLES = {
  client: 'client',
  admin: 'admin',
  courier: 'courier',
  restaurant: 'restaurant',
};

export const ROLE_LABELS = {
  client: 'Client',
  admin: 'Gérant',
  courier: 'Livreur',
  restaurant: 'Restaurant',
};

/** Vue App (`goto`) → rôle requis */
export const DASHBOARD_REQUIRED_ROLE = {
  admin: 'admin',
  delivery: 'courier',
  'restaurant-dash': 'restaurant',
};

function seedUsers() {
  return [
    { id: 'seed-admin', email: 'admin@yoha.ma', password: 'demo123', displayName: 'Admin démo', role: 'admin' },
    { id: 'seed-courier', email: 'livreur@yoha.ma', password: 'demo123', displayName: 'Livreur démo', role: 'courier' },
    { id: 'seed-restaurant', email: 'resto@yoha.ma', password: 'demo123', displayName: 'Restaurant démo', role: 'restaurant' },
    { id: 'seed-client', email: 'client@yoha.ma', password: 'demo123', displayName: 'Client démo', role: 'client' },
  ];
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const seed = seedUsers();
  localStorage.setItem(STORAGE_USERS, JSON.stringify(seed));
  return seed;
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

export const AuthCtx = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persistSession = useCallback((session) => {
    if (session) localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_SESSION);
    setUser(session);
  }, []);

  const login = useCallback(({ email, password }) => {
    const users = loadUsers();
    const e = email.trim().toLowerCase();
    const found = users.find((x) => x.email === e && x.password === password);
    if (!found) return { ok: false, error: 'E-mail ou mot de passe incorrect.' };
    const session = {
      id: found.id,
      email: found.email,
      displayName: found.displayName,
      role: found.role,
    };
    persistSession(session);
    return { ok: true, user: session };
  }, [persistSession]);

  /** Inscription réservée aux comptes client — les rôles pro sont créés côté YoHa uniquement. */
  const register = useCallback(({ email, password, displayName }) => {
    if (!password || password.length < 4) {
      return { ok: false, error: 'Mot de passe : au moins 4 caractères.' };
    }
    const users = loadUsers();
    const e = email.trim().toLowerCase();
    if (users.some((x) => x.email === e)) {
      return { ok: false, error: 'Cette adresse e-mail est déjà utilisée.' };
    }
    const row = {
      id: 'u-' + Math.random().toString(36).slice(2),
      email: e,
      password,
      displayName: (displayName || '').trim() || e.split('@')[0],
      role: AUTH_ROLES.client,
    };
    users.push(row);
    saveUsers(users);
    const session = {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
    };
    persistSession(session);
    return { ok: true, user: session };
  }, [persistSession]);

  const logout = useCallback(() => persistSession(null), [persistSession]);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      ROLE_LABELS,
      AUTH_ROLES,
    }),
    [user, login, register, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
