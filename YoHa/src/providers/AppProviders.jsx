'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ORDER_STATES } from '@/data/index.js';
import { ToastCtx, OrdersCtx, CartIconRefCtx, CartCtx } from '@/contexts/AppContexts.jsx';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';
import { YohaNavProvider } from '@/contexts/YohaNavContext.jsx';
import { getTokens, ordersApi, restaurantsApi } from '@/lib/api';
import { getGuestOrderIds, addGuestOrderId, clearGuestOrderIds } from '@/utils/guestOrders';
import { orderToCartItems } from '@/utils/reorder';

const RESTAURANTS_CACHE_KEY = 'yoha-restaurants-cache';

function loadRestaurantsCache() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(RESTAURANTS_CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveRestaurantsCache(list) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(RESTAURANTS_CACHE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

export function AppProviders({ children }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('yoha-theme');
    const prefers = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setDark(stored ? stored === 'dark' : prefers);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#fff7ed');
    localStorage.setItem('yoha-theme', dark ? 'dark' : 'light');
  }, [dark, mounted]);

  return (
    <AuthProvider>
      <AppStateProvider dark={dark} setDark={setDark}>
        <YohaNavProvider>{children}</YohaNavProvider>
      </AppStateProvider>
    </AuthProvider>
  );
}

function AppStateProvider({ children, dark, setDark }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState('');
  const [couriers, setCouriers] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const cartIconRef = useRef(null);
  const statusUpdateLocks = useRef(new Set());

  const pushToast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.duration || 2400);
  }, []);

  const refreshRestaurants = useCallback(async () => {
    const cached = loadRestaurantsCache();
    if (!cached.length) {
      setLoadingRestaurants(true);
    }
    setRestaurantsError('');
    let keepLoading = false;
    try {
      const list = await restaurantsApi.list();
      const arr = Array.isArray(list) ? list : [];
      setRestaurants(arr);
      saveRestaurantsCache(arr);
    } catch (e) {
      const fallback = cached.length ? cached : loadRestaurantsCache();
      if (fallback.length) {
        setRestaurants(fallback);
        setRestaurantsError('');
        if (e.status === 429) {
          window.setTimeout(() => refreshRestaurants(), 4000);
        }
      } else if (e.status === 429) {
        keepLoading = true;
        window.setTimeout(() => refreshRestaurants(), 4000);
      } else {
        setRestaurants([]);
        setRestaurantsError(
          "Impossible de joindre le serveur. Vérifiez que Django tourne (port 8000).",
        );
        pushToast({
          title: 'Restaurants indisponibles',
          desc: 'Démarrez le backend : python manage.py runserver',
          type: 'default',
          duration: 5000,
        });
      }
    } finally {
      if (!keepLoading) {
        setLoadingRestaurants(false);
      }
    }
  }, [pushToast]);

  const refreshOrders = useCallback(async ({ silent = false } = {}) => {
    const guestIds = getGuestOrderIds();
    const hasAuth = !!getTokens()?.access;

    if (!hasAuth && guestIds.length === 0) {
      setOrders([]);
      return;
    }

    if (!silent) setLoadingOrders(true);
    try {
      const byId = new Map();
      if (hasAuth) {
        const list = await ordersApi.list();
        (Array.isArray(list) ? list : []).forEach((o) => byId.set(o.id, o));
      }
      if (guestIds.length) {
        const guestList = await ordersApi.guestList(guestIds);
        (Array.isArray(guestList) ? guestList : []).forEach((o) => byId.set(o.id, o));
      }
      const merged = [...byId.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders((prev) => {
        if (silent && user?.role === 'courier') {
          for (const o of merged) {
            const existed = prev.some((p) => p.id === o.id);
            if (!existed && o.status === 'placed' && !o.courierId) {
              pushToast({
                title: 'Nouvelle course disponible',
                desc: `#${o.id} · ${o.restaurantName} — confirmez en premier !`,
                type: 'success',
                duration: 6000,
              });
            }
          }
        }
        if (silent && user?.role === 'restaurant') {
          for (const o of merged) {
            const existed = prev.some((p) => p.id === o.id);
            if (!existed && o.status === 'pickup_confirmed') {
              pushToast({
                title: 'Nouvelle commande',
                desc: `#${o.id} · ${o.customer?.name || 'Client'} — livreur en route`,
                type: 'success',
                duration: 6000,
              });
            }
          }
        }
        return merged;
      });
    } catch {
      if (!silent) {
        pushToast({ title: 'Commandes', desc: 'Impossible de charger les commandes.', type: 'default' });
      }
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  }, [pushToast, user?.role]);

  const refreshCouriers = useCallback(async () => {
    if (!getTokens()) return;
    try {
      const list = await ordersApi.couriers();
      setCouriers(list.map((c) => ({ id: String(c.id), name: c.name, ...c })));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const cached = loadRestaurantsCache();
    if (cached.length) {
      setRestaurants(cached);
      setLoadingRestaurants(false);
    }
    refreshRestaurants();
  }, [refreshRestaurants]);

  useEffect(() => {
    refreshOrders();
    refreshCouriers();
  }, [user, refreshOrders, refreshCouriers]);

  /** Rattache les commandes invité au compte client après connexion. */
  useEffect(() => {
    if (user?.role !== 'client') return undefined;
    const guestIds = getGuestOrderIds();
    if (!guestIds.length) return undefined;

    let cancelled = false;
    (async () => {
      try {
        await ordersApi.claimGuest(guestIds);
        if (!cancelled) clearGuestOrderIds();
      } catch {
        /* garde les ids pour réessayer */
      } finally {
        if (!cancelled) refreshOrders();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, refreshOrders]);

  useEffect(() => {
    const guestIds = getGuestOrderIds();
    if (!user && guestIds.length === 0) return undefined;
    const intervalMs =
      user?.role === 'courier' ? 3000 : user?.role === 'restaurant' ? 5000 : 30000;
    const id = setInterval(() => {
      refreshOrders({ silent: true });
    }, intervalMs);
    return () => clearInterval(id);
  }, [user, refreshOrders]);

  /** Rafraîchit dès que l'onglet redevient visible (dashboard pro). */
  useEffect(() => {
    if (user?.role !== 'courier' && user?.role !== 'restaurant') return undefined;
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshOrders({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.role, refreshOrders]);

  const addOrder = useCallback(
    async (cartItems, _orderTotalMad, customer) => {
      const payload = {
        items: cartItems.map((i) => ({
          menu_item_id: i.id,
          restaurant_slug: i.restaurantId,
          quantity: i.qty,
          item_name: i.name,
          item_price: i.price,
          restaurant_name: i.restaurantName,
        })),
        customer_name: customer.name,
        customer_email: customer.email || undefined,
        customer_address: customer.address,
        customer_phone: customer.phone,
        delivery_instructions: customer.restaurantNotes || '',
        scheduled_delivery_at: customer.scheduledTime || undefined,
      };
      const order = await ordersApi.checkout(payload);
      const isLoggedInClient = !!getTokens()?.access && user?.role === 'client';
      if (!isLoggedInClient) {
        addGuestOrderId(order.id);
      }
      setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
      if (isLoggedInClient) {
        refreshOrders();
      }
      return order.id;
    },
    [user, refreshOrders],
  );

  const updateOrderStatus = useCallback(
    async (orderId, status, extra = {}) => {
      const lockKey = `${orderId}:${status}`;
      if (statusUpdateLocks.current.has(lockKey)) return null;

      let alreadyAtStatus = false;
      setOrders((prev) => {
        const current = prev.find((o) => o.id === orderId);
        if (current?.status === status) alreadyAtStatus = true;
        return prev;
      });
      if (alreadyAtStatus) return null;

      statusUpdateLocks.current.add(lockKey);
      const previousStatus = orders.find((o) => o.id === orderId)?.status;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );

      try {
        const updated = await ordersApi.updateStatus(orderId, status, extra.note || '');
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...updated, ...extra } : o)));
        const title = status === 'cancelled' ? 'Commande annulée' : 'Statut mis à jour';
        pushToast({
          title,
          desc: `#${orderId} · ${ORDER_STATES[status]?.label || status}`,
          type: status === 'cancelled' ? 'default' : 'success',
        });
        return updated;
      } catch (e) {
        if (previousStatus) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: previousStatus } : o)),
          );
        } else {
          refreshOrders({ silent: true });
        }
        pushToast({ title: 'Erreur', desc: e.message, type: 'default' });
        throw e;
      } finally {
        statusUpdateLocks.current.delete(lockKey);
      }
    },
    [pushToast, orders, refreshOrders],
  );

  const cancelOrder = useCallback(
    async (orderId, reason = '') => {
      await updateOrderStatus(orderId, 'cancelled', { note: reason });
    },
    [updateOrderStatus]
  );

  const assignCourier = useCallback(
    async (orderId, courier) => {
      try {
        const updated = await ordersApi.claimOrder(orderId);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        pushToast({
          title: 'Course confirmée',
          desc: `${courier?.name || 'Vous'} · #${orderId}`,
          type: 'success',
        });
      } catch (e) {
        const msg =
          e.status === 409
            ? 'Un autre livreur vient de prendre cette course.'
            : e.message;
        pushToast({ title: 'Course indisponible', desc: msg, type: 'default' });
        refreshOrders({ silent: true });
        throw e;
      }
    },
    [pushToast, refreshOrders],
  );

  const syncOrder = useCallback((order) => {
    if (!order?.id) return;
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id);
      if (exists) return prev.map((o) => (o.id === order.id ? order : o));
      return [order, ...prev];
    });
  }, []);

  const trackOrder = useCallback(
    async (publicId) => {
      if (!publicId) return null;
      try {
        let order = null;
        if (getTokens()?.access) {
          try {
            order = await ordersApi.get(publicId);
          } catch {
            const list = await ordersApi.guestList([publicId]);
            order = list[0] ?? null;
          }
        } else {
          const list = await ordersApi.guestList([publicId]);
          order = list[0] ?? null;
        }
        if (order) syncOrder(order);
        return order;
      } catch {
        return null;
      }
    },
    [syncOrder],
  );

  const reorderFromOrder = useCallback(
    (order) => {
      const items = orderToCartItems(order);
      if (!items.length) {
        pushToast({ title: 'Panier vide', desc: 'Cette commande ne contient plus d’articles.', type: 'default' });
        return false;
      }
      setCart(items);
      pushToast({
        title: 'Panier prêt',
        desc: `Comme chez ${order.restaurantName || 'votre restaurant'}.`,
        type: 'success',
      });
      return true;
    },
    [pushToast],
  );

  const cartApi = useMemo(
    () => ({
      cart,
      setCart,
      addToCart: (item, restaurant, sourceEl) => {
        if (sourceEl && cartIconRef.current) {
          import('@/utils/flyToCart.js').then(({ flyToCart }) => {
            flyToCart(sourceEl, cartIconRef.current, item.img);
          });
        }
        setCart((prev) => {
          const e = prev.find((p) => p.id === item.id);
          if (e) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
          return [...prev, { ...item, qty: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
        });
        setTimeout(() => {
          pushToast({ title: 'Ajouté au panier', desc: item.name, type: 'success' });
        }, 800);
      },
      removeFromCart: (id) => setCart((prev) => prev.filter((p) => p.id !== id)),
      setQty: (id, qty) =>
        setCart((prev) =>
          qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, qty } : p))
        ),
      clearCart: () => setCart([]),
      cartCount: cart.reduce((s, p) => s + p.qty, 0),
      cartTotal: cart.reduce((s, p) => s + p.qty * p.price, 0),
    }),
    [cart, pushToast]
  );

  const themeApi = useMemo(() => ({ dark, setDark }), [dark, setDark]);

  return (
    <ToastCtx.Provider value={{ push: pushToast, toasts }}>
      <OrdersCtx.Provider
        value={{
          orders,
          setOrders,
          addOrder,
          updateOrderStatus,
          cancelOrder,
          assignCourier,
          syncOrder,
          trackOrder,
          restaurants,
          setRestaurants,
          couriers,
          refreshOrders,
          refreshRestaurants,
          loadingRestaurants,
          restaurantsError,
          loadingOrders,
          reorderFromOrder,
        }}
      >
        <CartIconRefCtx.Provider value={cartIconRef}>
          <CartCtx.Provider value={{ ...cartApi, theme: themeApi }}>
            {children}
          </CartCtx.Provider>
        </CartIconRefCtx.Provider>
      </OrdersCtx.Provider>
    </ToastCtx.Provider>
  );
}

export { useCart } from '@/contexts/AppContexts.jsx';

