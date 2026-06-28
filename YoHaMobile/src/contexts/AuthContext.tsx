import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, YoHaUser } from '../lib/api';
import { ADMIN_MOBILE_BLOCKED_MSG, isAdminRole } from '../lib/constants';

async function rejectAdminSession(user: YoHaUser | null): Promise<YoHaUser | null> {
  if (!user) return null;
  if (!isAdminRole(user.role)) return user;
  await authApi.logout();
  throw new Error(ADMIN_MOBILE_BLOCKED_MSG);
}

type AuthContextValue = {
  user: YoHaUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<YoHaUser | null>;
  register: (email: string, password: string, displayName: string) => Promise<YoHaUser | null>;
  loginWithGoogle: (idToken: string) => Promise<YoHaUser | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<YoHaUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      if (me && isAdminRole(me.role)) {
        await authApi.logout();
        setUser(null);
        return;
      }
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await authApi.me();
        if (me && isAdminRole(me.role)) {
          await authApi.logout();
          setUser(null);
        } else {
          setUser(me);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await rejectAdminSession(await authApi.login(email, password));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const u = await rejectAdminSession(await authApi.register(email, password, displayName));
    setUser(u);
    return u;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const u = await rejectAdminSession(await authApi.loginWithGoogle(idToken));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      const { unregisterPushToken } = await import('../lib/pushRegistration');
      await unregisterPushToken();
    } catch {
      /* push indisponible */
    }
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      loginWithGoogle,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, loginWithGoogle, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function roleHome(role?: string) {
  if (isAdminRole(role)) return '/auth/login';
  switch (role) {
    case 'courier':
      return '/(courier)';
    case 'restaurant':
      return '/(restaurant)';
    case 'client':
    default:
      return '/(client)';
  }
}
