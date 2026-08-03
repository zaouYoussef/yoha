'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, clearTokens, getTokens, ensureFreshSession } from '@/lib/api';

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

/** Page d’accueil forcée pour le staff (pas de landing / browse). */
export const ROLE_HOME_PATH = {
  [AUTH_ROLES.courier]: '/delivery',
  [AUTH_ROLES.restaurant]: '/restaurant-dash',
  [AUTH_ROLES.admin]: '/youssef',
};

export function getStaffHomePath(role) {
  return ROLE_HOME_PATH[role] || null;
}

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
      // Nettoyer l'ancien mode démo (fausses sessions)
      try {
        localStorage.removeItem('yoha_demo_user');
      } catch {}

      const tokens = getTokens();
      if (!tokens?.refresh) {
        if (tokens) clearTokens();
        if (!cancelled) setBooting(false);
        return;
      }

      // Jetons démo → forcer reconnexion réelle
      if (String(tokens.refresh).startsWith('demo-') || String(tokens.access || '').startsWith('demo-')) {
        clearTokens();
        if (!cancelled) {
          setUser(null);
          setBooting(false);
        }
        return;
      }

      try {
        // Garde la session vivante (nouveau access + refresh si rotation)
        await ensureFreshSession();
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        // Ne pas vider immédiatement si c'est juste un souci réseau :
        // ensureFreshSession / apiFetch gèrent déjà les 401.
        try {
          const me = await authApi.me();
          if (!cancelled) setUser(me);
        } catch {
          if (!cancelled) setUser(null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    // Refresh périodique (reste connecté longtemps)
    const interval = setInterval(() => {
      ensureFreshSession().catch(() => {});
    }, 10 * 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        ensureFreshSession().catch(() => {});
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
      }
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
    try { localStorage.removeItem('yoha_last_order'); } catch {}
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
