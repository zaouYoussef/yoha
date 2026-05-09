import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  RESTAURANTS,
  generateMockOrders,
  ORDER_STATES,
  computeProfit,
  computeNet,
} from './data/index.js';
import { ToastCtx, OrdersCtx, CartIconRefCtx } from './contexts/AppContexts.jsx';
import { AuthProvider, useAuth, DASHBOARD_REQUIRED_ROLE, ROLE_LABELS } from './contexts/AuthContext.jsx';
import { flyToCart } from './utils/flyToCart.js';
import { filterOrdersForClient } from './utils/clientOrders.js';

import { ScrollProgress } from './components/effects/ScrollProgress.jsx';
import { SocialOrderPopup } from './components/effects/SocialOrderPopup.jsx';

import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { BottomNav } from './components/layout/BottomNav.jsx';

import { Landing, CampusHospitalsSection } from './pages/landing/LandingViews.jsx';
import { Home, RestaurantPage } from './pages/BrowseViews.jsx';
import { Checkout } from './pages/CheckoutPage.jsx';
import { SuccessPage } from './pages/SuccessPage.jsx';
import { CartSidebar, FloatingCart } from './pages/CartViews.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { MyOrdersPage } from './pages/MyOrdersPage.jsx';

import { ToastViewport } from './components/ui/ToastViewport.jsx';

import { AdminDashboard } from './dashboards/AdminPanel.jsx';
import { DeliveryDashboard } from './dashboards/DeliveryPanel.jsx';
import { RestaurantDashboard } from './dashboards/RestaurantPanel.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const { user } = useAuth();
  const [view, setView] = useState({ name: 'landing' });
  const [dark, setDark] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [cartShake, setCartShake] = useState(false);
  const [orders, setOrders] = useState(() => generateMockOrders());
  const [restaurants, setRestaurants] = useState(RESTAURANTS);
  const cartIconRef = useRef(null);

  const pushToast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.duration || 2400);
  }, []);
  const toastApi = { push: pushToast };

  const addOrder = useCallback((cartItems, orderTotalMad, customer, customerUserId = null) => {
    const id = 'YH-' + (5000 + Math.floor(Math.random() * 999));
    const totalDh = orderTotalMad;
    const restaurantId = cartItems[0]?.restaurantId;
    const restaurantName = cartItems[0]?.restaurantName;
    const order = {
      id,
      createdAt: Date.now(),
      customer,
      customerUserId: customerUserId || undefined,
      restaurantId,
      restaurantName,
      items: cartItems,
      totalDh,
      profitDh: computeProfit(totalDh),
      netDh: computeNet(totalDh),
      status: 'placed',
      courierId: null,
      courierName: null,
      eta: 26,
    };
    setOrders((prev) => [order, ...prev]);
    return id;
  }, []);

  const updateOrderStatus = useCallback((orderId, status, extra = {}) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status, ...extra } : o)));
    pushToast({
      title: 'Statut mis à jour',
      desc: `#${orderId} · ${ORDER_STATES[status]?.label || status}`,
      type: 'success',
    });
  }, [pushToast]);

  const assignCourier = useCallback(
    (orderId, courier) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, courierId: courier.id, courierName: courier.name, status: 'pickup_confirmed' }
            : o
        )
      );
      pushToast({ title: 'Livreur assigné', desc: `${courier.name} · #${orderId}`, type: 'success' });
    },
    [pushToast]
  );

  useEffect(() => {
    const stored = localStorage.getItem('yoha-theme');
    const prefers = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setDark(stored ? stored === 'dark' : prefers);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#fff7ed');
    localStorage.setItem('yoha-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  const addToCart = (item, restaurant, sourceEl) => {
    if (sourceEl && cartIconRef.current) {
      flyToCart(sourceEl, cartIconRef.current, item.img);
    }
    setCart((prev) => {
      const e = prev.find((p) => p.id === item.id);
      if (e) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { ...item, qty: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    });
    setTimeout(() => {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 500);
      pushToast({ title: 'Ajouté au panier', desc: item.name, type: 'success' });
    }, 800);
  };
  const removeFromCart = (id) => setCart((prev) => prev.filter((p) => p.id !== id));
  const setQty = (id, qty) =>
    setCart((prev) => (qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, qty } : p))));
  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, p) => s + p.qty, 0);
  const cartTotal = cart.reduce((s, p) => s + p.qty * p.price, 0);

  const [trackOrderId, setTrackOrderId] = useState(null);
  useEffect(() => {
    try {
      const s = sessionStorage.getItem('yoha-track-order');
      if (s) setTrackOrderId(s);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!trackOrderId) return;
    const o = orders.find((x) => x.id === trackOrderId);
    if (o?.status === 'delivered') {
      try {
        sessionStorage.removeItem('yoha-track-order');
      } catch { /* ignore */ }
      setTrackOrderId(null);
    }
  }, [orders, trackOrderId]);

  const liveOrder = useMemo(() => {
    if (user?.role === 'client') {
      const list = filterOrdersForClient(orders, user).filter((o) => o.status !== 'delivered');
      if (list.length) return [...list].sort((a, b) => b.createdAt - a.createdAt)[0];
    }
    if (trackOrderId) {
      const o = orders.find((x) => x.id === trackOrderId && x.status !== 'delivered');
      if (o) return o;
    }
    return null;
  }, [orders, user, trackOrderId]);

  /** `opts.session` : session tout juste connectée (le state React `user` peut être en retard d’un rendu). */
  const goto = useCallback(
    (name, params = {}, opts = {}) => {
      const effectiveUser = opts.session ?? user;
      const need = DASHBOARD_REQUIRED_ROLE[name];
      if (need) {
        if (!effectiveUser) {
          pushToast({
            title: 'Connexion requise',
            desc: 'Identifiez-vous pour accéder à cet espace professionnel.',
            type: 'default',
          });
          setView({ name: 'auth', redirect: name, ...params });
          return;
        }
        if (effectiveUser.role !== need) {
          pushToast({
            title: 'Accès réservé',
            desc: `Un compte « ${ROLE_LABELS[need] || need} » est nécessaire.`,
            type: 'default',
          });
          setView({ name: 'auth', redirect: name, ...params });
          return;
        }
      }
      setView({ name, ...params });
    },
    [user, pushToast]
  );

  const isDashboard = view.name === 'admin' || view.name === 'delivery' || view.name === 'restaurant-dash';
  const showShell = !isDashboard;

  return (
    <ToastCtx.Provider value={toastApi}>
      <OrdersCtx.Provider
        value={{ orders, setOrders, addOrder, updateOrderStatus, assignCourier, restaurants, setRestaurants }}
      >
        <CartIconRefCtx.Provider value={cartIconRef}>
          <ScrollProgress />
          <div className="min-h-screen flex flex-col relative">
            {showShell && (
              <Navbar
                dark={dark}
                setDark={setDark}
                cartCount={cartCount}
                cartShake={cartShake}
                cartIconRef={cartIconRef}
                onCart={() => setCartOpen(true)}
                onLogo={() => goto('landing')}
                onHome={() => goto('home', { browseFilter: 'all' })}
                onPharmacy={() => goto('home', { browseFilter: 'pharmacy' })}
                onPastry={() => goto('home', { browseFilter: 'dessert' })}
                goto={goto}
                liveOrder={liveOrder}
                onLiveOrder={() => liveOrder && goto('success', { orderId: liveOrder.id })}
                onMyOrders={() => goto('my-orders')}
              />
            )}

            <main className={`flex-1 ${isDashboard ? '' : 'pt-16 pb-24 md:pb-0'}`}>
              {view.name === 'landing' && <Landing onStart={() => goto('home', { browseFilter: 'all' })} />}
              {view.name === 'home' && (
                <Home
                  key={view.browseFilter ?? 'all'}
                  initialFilter={view.browseFilter ?? 'all'}
                  onPickRestaurant={(r) => goto('restaurant', { restaurant: r })}
                />
              )}
              {view.name === 'restaurant' && (
                <RestaurantPage restaurant={view.restaurant} onBack={() => goto('home', { browseFilter: 'all' })} onAdd={addToCart} />
              )}
              {view.name === 'checkout' && (
                <Checkout
                  cart={cart}
                  total={cartTotal}
                  onBack={() => setCartOpen(true)}
                  addOrder={addOrder}
                  onSuccess={(orderId) => {
                    clearCart();
                    try {
                      sessionStorage.setItem('yoha-track-order', orderId);
                    } catch { /* ignore */ }
                    setTrackOrderId(orderId);
                    goto('success', { orderId });
                  }}
                />
              )}
              {view.name === 'success' && (
                <SuccessPage
                  orderId={view.orderId}
                  onHome={() => goto('home', { browseFilter: 'all' })}
                  onMyOrders={user?.role === 'client' ? () => goto('my-orders') : undefined}
                />
              )}
              {view.name === 'my-orders' && (
                <MyOrdersPage
                  onBack={() => goto('home', { browseFilter: 'all' })}
                  onOpenOrder={(id) => goto('success', { orderId: id })}
                />
              )}
              {view.name === 'auth' && (
                <AuthPage redirect={view.redirect} goto={goto} goHome={() => goto('home', { browseFilter: 'all' })} />
              )}
              {view.name === 'admin' && <AdminDashboard goto={goto} dark={dark} setDark={setDark} />}
              {view.name === 'delivery' && <DeliveryDashboard goto={goto} dark={dark} setDark={setDark} />}
              {view.name === 'restaurant-dash' && <RestaurantDashboard goto={goto} dark={dark} setDark={setDark} />}
            </main>

            {showShell && (view.name === 'landing' || view.name === 'home') && (
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-14">
                <CampusHospitalsSection />
              </div>
            )}

            {showShell && <Footer goto={goto} />}

            {showShell && (
              <BottomNav
                active={view.name}
                onHome={() => goto('home', { browseFilter: 'all' })}
                onSearch={() => goto('home', { browseFilter: 'all' })}
                onCart={() => setCartOpen(true)}
                cartCount={cartCount}
              />
            )}

            <CartSidebar
              open={cartOpen}
              onClose={() => setCartOpen(false)}
              items={cart}
              setQty={setQty}
              remove={removeFromCart}
              total={cartTotal}
              onCheckout={() => {
                setCartOpen(false);
                goto('checkout');
              }}
            />

            <FloatingCart
              count={cartCount}
              total={cartTotal}
              onClick={() => setCartOpen(true)}
              hidden={
                view.name === 'landing' ||
                view.name === 'success' ||
                view.name === 'auth' ||
                cartOpen ||
                isDashboard
              }
            />

            {showShell && (
              <SocialOrderPopup
                visible={
                  view.name !== 'landing' &&
                  view.name !== 'success' &&
                  view.name !== 'checkout' &&
                  view.name !== 'auth'
                }
              />
            )}

            <ToastViewport toasts={toasts} />
          </div>
        </CartIconRefCtx.Provider>
      </OrdersCtx.Provider>
    </ToastCtx.Provider>
  );
}
