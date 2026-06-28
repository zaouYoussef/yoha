'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, clearTokens, getTokens } from '@/lib/api';

export function migrateLegacyDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') return displayName;
  const collapsed = displayName.normalize('NFKC').trim().replace(/\s+/g, ' ');
  return /^nouha bourouhou$/i.test(collapsed) ? 'X Y' : displayName;
}

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

export const DASHBOARD_REQUIRED_ROLE = {
  admin: 'admin',
  delivery: 'courier',
  'restaurant-dash': 'restaurant',
};

export const AuthCtx = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getTokens()) {
        if (!cancelled) setBooting(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        clearTokens();
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials = {}) => {
    const { password } = credentials;
    const identifier = String(
      credentials.login ?? credentials.email ?? credentials.identifier ?? '',
    ).trim();
    if (!identifier) {
      return { ok: false, error: 'Saisissez votre identifiant (e-mail ou nom d’utilisateur).' };
    }
    try {
      const session = await authApi.login(identifier, password);
      setUser(session);
      return { ok: true, user: session };
    } catch (e) {
      return { ok: false, error: e.message || 'Identifiant ou mot de passe incorrect.' };
    }
  }, []);

  const register = useCallback(async ({ email, password, displayName }) => {
    if (!password || password.length < 10) {
      return { ok: false, error: 'Mot de passe : au moins 10 caractères.' };
    }
    try {
      const session = await authApi.register({ email, password, displayName });
      setUser(session);
      return { ok: true, user: session };
    } catch (e) {
      return { ok: false, error: e.message || 'Inscription impossible.' };
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken) => {
    try {
      const session = await authApi.loginWithGoogle(idToken);
      setUser(session);
      return { ok: true, user: session };
    } catch (e) {
      return { ok: false, error: e.message || 'Connexion Google impossible.' };
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      register,
      loginWithGoogle,
      logout,
      ROLE_LABELS,
      AUTH_ROLES,
    }),
    [user, booting, login, register, loginWithGoogle, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
