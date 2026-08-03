'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { ScrollProgress } from '@/components/effects/ScrollProgress.jsx';
import { Navbar } from '@/components/layout/Navbar.jsx';
import { BottomNav } from '@/components/layout/BottomNav.jsx';
import { ToastViewport } from '@/components/ui/ToastViewport.jsx';
import { useAuth, getStaffHomePath } from '@/contexts/AuthContext.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useCart, useToast, useOrders, CartUICtx } from '@/contexts/AppContexts.jsx';
import { filterOrdersForClient } from '@/utils/clientOrders.js';

const CartSidebar = dynamic(
  () => import('@/views/CartViews.jsx').then((m) => ({ default: m.CartSidebar })),
  { ssr: false },
);
const FloatingCart = dynamic(
  () => import('@/views/CartViews.jsx').then((m) => ({ default: m.FloatingCart })),
  { ssr: false },
);
const CampusHospitalsSection = dynamic(
  () => import('@/views/landing/LandingViews.jsx').then((m) => ({ default: m.CampusHospitalsSection })),
  { ssr: false, loading: () => null },
);

function pathToView(pathname) {
  if (pathname === '/') return 'landing';
  if (pathname.startsWith('/browse')) return 'home';
  if (pathname.startsWith('/restaurant/')) return 'restaurant';
  if (pathname === '/checkout') return 'checkout';
  if (pathname === '/success') return 'success';
  if (pathname === '/orders') return 'my-orders';
  if (pathname === '/auth') return 'auth';
  return 'home';
}

function safeScrollTop() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  } catch {
    try {
      window.scrollTo(0, 0);
    } catch {
      /* ignore */
    }
  }
}

export function ShopShell({ children, showCampus = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const viewName = pathToView(pathname);
  const { goto } = useYohaNav();
  const { user, booting } = useAuth();
  const { cart, setQty, removeFromCart, cartCount, cartTotal, theme } = useCart();
  const { dark, setDark } = theme;
  const { orders } = useOrders();
  const { toasts } = useToast();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState(null);

  // Livreurs / restos / admin → panel direct (pas landing / browse)
  useEffect(() => {
    if (booting || !user) return;
    if (pathname === '/auth') return;
    const home = getStaffHomePath(user.role);
    if (!home) return;
    if (pathname === home || pathname.startsWith(`${home}/`)) return;
    router.replace(home);
  }, [booting, user, pathname, router]);

  const staffHome = !booting && user ? getStaffHomePath(user.role) : null;
  const redirectingStaff =
    !!staffHome &&
    pathname !== '/auth' &&
    pathname !== staffHome &&
    !pathname.startsWith(`${staffHome}/`);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem('yoha-track-order');
      if (s) setTrackOrderId(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!trackOrderId) return;
    const o = orders.find((x) => x.id === trackOrderId);
    if (o?.status === 'delivered') {
      try {
        sessionStorage.removeItem('yoha-track-order');
      } catch {
        /* ignore */
      }
      setTrackOrderId(null);
    }
  }, [orders, trackOrderId]);

  const liveOrder = useMemo(() => {
    if (user?.role === 'client') {
      const list = filterOrdersForClient(orders, user).filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
      if (list.length) return [...list].sort((a, b) => b.createdAt - a.createdAt)[0];
    }
    if (!user || user.role === 'client') {
      const guestActive = orders.filter((o) => !o.customerUserId && o.status !== 'delivered' && o.status !== 'cancelled');
      if (guestActive.length) return [...guestActive].sort((a, b) => b.createdAt - a.createdAt)[0];
    }
    if (trackOrderId) {
      const o = orders.find((x) => x.id === trackOrderId && x.status !== 'delivered' && x.status !== 'cancelled');
      if (o) return o;
    }
    return null;
  }, [orders, user, trackOrderId]);

  useEffect(() => {
    safeScrollTop();
  }, [pathname]);

  // Sur checkout : fermer le panier pour éviter le double écran mobile
  useEffect(() => {
    if (viewName === 'checkout' || pathname === '/checkout') {
      setCartOpen(false);
    }
  }, [viewName, pathname]);

  useEffect(() => {
    const open = () => setCartOpen(true);
    const shake = () => {
      setCartShake(true);
      window.setTimeout(() => setCartShake(false), 550);
    };
    window.addEventListener('yoha-open-cart', open);
    window.addEventListener('yoha-cart-shake', shake);
    return () => {
      window.removeEventListener('yoha-open-cart', open);
      window.removeEventListener('yoha-cart-shake', shake);
    };
  }, []);

  const cartUI = useMemo(
    () => ({
      cartOpen,
      openCart: () => {
        setCartOpen(true);
        try {
          window.dispatchEvent(new CustomEvent('yoha-open-cart'));
        } catch {
          /* ignore */
        }
      },
      closeCart: () => setCartOpen(false),
    }),
    [cartOpen],
  );

  if (redirectingStaff) {
    return (
      <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-ink-500 font-medium">Redirection vers votre espace…</p>
        </div>
      </div>
    );
  }

  const hideBottomNav = ['checkout', 'success', 'auth'].includes(viewName);

  return (
    <CartUICtx.Provider value={cartUI}>
      <ScrollProgress />
      <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden relative bg-gradient-to-b from-amber-50/50 via-white to-violet-50/20 dark:from-ink-950 dark:via-ink-950 dark:to-ink-950">
        <div className="pointer-events-none fixed inset-0 mesh-bg opacity-50 dark:opacity-35" aria-hidden />
        <Navbar
          dark={dark}
          setDark={setDark}
          cartCount={cartCount}
          cartShake={cartShake}
          onCart={() => setCartOpen(true)}
          onLogo={() => goto('landing')}
          onHome={() => goto('home', { browseFilter: 'all' })}
          onPharmacy={() => goto('home', { browseFilter: 'pharmacy' })}
          onParapharmacy={() => goto('home', { browseFilter: 'parapharmacy' })}
          onPastry={() => goto('home', { browseFilter: 'dessert' })}
          onSupermarket={() => goto('home', { browseFilter: 'supermarket' })}
          onShop={() => goto('home', { browseFilter: 'shop' })}
          goto={goto}
          liveOrder={liveOrder}
          onLiveOrder={() => liveOrder && goto('success', { orderId: liveOrder.id })}
          onMyOrders={() => goto('my-orders')}
        />

        <main
          className={`relative z-10 min-w-0 flex-1 overflow-x-hidden pt-16 ${
            hideBottomNav ? 'pb-4 md:pb-0' : 'pb-28 md:pb-0'
          }`}
        >
          {children}
        </main>

        {showCampus && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-14">
            <CampusHospitalsSection />
          </div>
        )}

        {/* Pas de bottom nav sur checkout / auth / succès — évite le chevauchement avec les CTA */}
        {!['checkout', 'success', 'auth'].includes(viewName) && (
          <BottomNav
            active={cartOpen ? 'checkout' : viewName === 'restaurant' ? 'home' : viewName}
            onHome={() => goto('landing')}
            onSearch={() => goto('home', { browseFilter: 'all' })}
            onCart={() => setCartOpen(true)}
            onProfile={() => goto(user ? 'my-orders' : 'auth')}
            cartCount={cartCount}
            cartShake={cartShake}
          />
        )}

        <CartSidebar
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          items={cart}
          setQty={setQty}
          remove={removeFromCart}
          total={cartTotal}
          onBrowse={() => {
            setCartOpen(false);
            goto('home', { browseFilter: 'all' });
          }}
          onCheckout={() => {
            setCartOpen(false);
            goto('checkout');
          }}
        />

        <FloatingCart
          count={cartCount}
          total={cartTotal}
          items={cart}
          onClick={() => setCartOpen(true)}
          hidden={
            viewName === 'landing' ||
            viewName === 'success' ||
            viewName === 'auth' ||
            viewName === 'checkout' ||
            pathname === '/checkout' ||
            cartOpen
          }
        />

        <ToastViewport toasts={toasts} />
      </div>
    </CartUICtx.Provider>
  );
}
