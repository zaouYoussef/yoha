'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, DASHBOARD_REQUIRED_ROLE, ROLE_LABELS } from './AuthContext';
import { useToast } from './AppContexts';

const NavCtx = createContext(null);

function buildPath(name, params = {}) {
  switch (name) {
    case 'landing':
      return '/';
    case 'home': {
      const f = params.browseFilter;
      if (f && f !== 'all') return `/browse?filter=${encodeURIComponent(f)}`;
      return '/browse';
    }
    case 'restaurant': {
      const id = params.restaurant?.id || params.restaurant;
      return id ? `/restaurant/${id}` : '/browse';
    }
    case 'checkout':
      return '/checkout';
    case 'success':
      return params.orderId ? `/success?orderId=${encodeURIComponent(params.orderId)}` : '/success';
    case 'my-orders':
      return '/orders';
    case 'auth': {
      const q = params.redirect ? `?redirect=${encodeURIComponent(params.redirect)}` : '';
      return `/auth${q}`;
    }
    case 'admin':
      return '/youssef';
    case 'delivery':
      return '/delivery';
    case 'restaurant-dash':
      return '/restaurant-dash';
    default:
      return '/';
  }
}

export function YohaNavProvider({ children }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const goto = useCallback(
    (name, params = {}, opts = {}) => {
      const effectiveUser = opts.session ?? user;
      const need = DASHBOARD_REQUIRED_ROLE[name];
      if (need) {
        if (!effectiveUser) {
          toast?.push({
            title: 'Connexion requise',
            desc: 'Identifiez-vous pour accéder à cet espace professionnel.',
            type: 'default',
          });
          router.push(buildPath('auth', { redirect: name }));
          return;
        }
        if (effectiveUser.role !== need) {
          toast?.push({
            title: 'Accès réservé',
            desc: `Un compte « ${ROLE_LABELS[need] || need} » est nécessaire.`,
            type: 'default',
          });
          router.push(buildPath('auth', { redirect: name }));
          return;
        }
      }
      router.push(buildPath(name, params));
    },
    [user, router, toast]
  );

  const value = useMemo(() => ({ goto }), [goto]);
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

export function useYohaNav() {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error('useYohaNav doit être utilisé dans YohaNavProvider');
  return ctx;
}
