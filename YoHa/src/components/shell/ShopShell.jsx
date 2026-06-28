'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ScrollProgress } from '@/components/effects/ScrollProgress.jsx';
import { SocialOrderPopup } from '@/components/effects/SocialOrderPopup.jsx';
import { Navbar } from '@/components/layout/Navbar.jsx';
import { BottomNav } from '@/components/layout/BottomNav.jsx';
import { CartSidebar, FloatingCart } from '@/views/CartViews.jsx';
import { ToastViewport } from '@/components/ui/ToastViewport.jsx';
import { CampusHospitalsSection } from '@/views/landing/LandingViews.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useCart } from '@/contexts/AppContexts.jsx';
import { useToast } from '@/contexts/AppContexts.jsx';
import { useOrders } from '@/contexts/AppContexts.jsx';
import { filterOrdersForClient } from '@/utils/clientOrders.js';
import { hasAnyRestaurantOpen } from '@/data/openingHours.js';

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

export function ShopShell({ children, showCampus = false }) {
  const pathname = usePathname();
  const viewName = pathToView(pathname);
  const { goto } = useYohaNav();
  const { user } = useAuth();
  const { cart, setQty, removeFromCart, cartCount, cartTotal, theme } = useCart();
  const { dark, setDark } = theme;
  const { orders, restaurants } = useOrders();
  const { toasts } = useToast();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState(null);

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
      const list = filterOrdersForClient(orders, user).filter((o) => o.status !== 'delivered');
      if (list.length) return [...list].sort((a, b) => b.createdAt - a.createdAt)[0];
    }
    if (!user || user.role === 'client') {
      const guestActive = orders.filter((o) => !o.customerUserId && o.status !== 'delivered');
      if (guestActive.length) return [...guestActive].sort((a, b) => b.createdAt - a.createdAt)[0];
    }
    if (trackOrderId) {
      const o = orders.find((x) => x.id === trackOrderId && x.status !== 'delivered');
      if (o) return o;
    }
    return null;
  }, [orders, user, trackOrderId]);

  const anyRestoOpen = useMemo(
    () => hasAnyRestaurantOpen(restaurants),
    [restaurants],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <>
      <ScrollProgress />
      <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden relative">
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

        <main className="min-w-0 flex-1 overflow-x-hidden pt-16 pb-24 md:pb-0">{children}</main>

        {showCampus && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-14">
            <CampusHospitalsSection />
          </div>
        )}

        <BottomNav
          active={viewName}
          onHome={() => goto('home', { browseFilter: 'all' })}
          onSearch={() => goto('home', { browseFilter: 'all' })}
          onCart={() => setCartOpen(true)}
          onProfile={() => goto(user ? 'my-orders' : 'auth')}
          cartCount={cartCount}
        />

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
          items={cart}
          onClick={() => setCartOpen(true)}
          hidden={
            viewName === 'landing' ||
            viewName === 'success' ||
            viewName === 'auth' ||
            cartOpen
          }
        />

        <SocialOrderPopup
          visible={
            anyRestoOpen &&
            viewName !== 'landing' &&
            viewName !== 'success' &&
            viewName !== 'checkout' &&
            viewName !== 'auth'
          }
        />

        <ToastViewport toasts={toasts} />
      </div>
    </>
  );
}
