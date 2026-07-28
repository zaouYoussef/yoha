'use client';

import React, { useState, useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { I } from '../../icons/Icons.jsx';
import { Logo } from './Logo.jsx';
import { Magnetic } from '../ui/Magnetic.jsx';
import { useAuth, ROLE_LABELS } from '../../contexts/AuthContext.jsx';
import { CartIconRefCtx } from '../../contexts/AppContexts.jsx';
import { ORDER_STATES } from '../../data/index.js';

export function Navbar({
  dark,
  setDark,
  cartCount,
  cartShake,
  onCart,
  onLogo,
  onHome,
  onPharmacy,
  onParapharmacy,
  onPastry,
  onSupermarket,
  onShop,
  goto,
  liveOrder,
  onLiveOrder,
  onMyOrders,
}) {
  const pathname = usePathname();
  const [isBrowsePage, setIsBrowsePage] = useState(false);
  useEffect(() => {
    const p = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    setIsBrowsePage(p === '/browse' || p === '/browse/' || p.startsWith('/browse?'));
  }, [pathname]);
  const cartIconRef = useContext(CartIconRefCtx);
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-40 transition-all duration-500 pointer-events-none">
      <div className={`mx-auto flex h-12 sm:h-14 md:h-16 items-center justify-between transition-all duration-500 pointer-events-auto overflow-hidden ${
        scrolled 
          ? 'w-[calc(100%-0.5rem)] sm:w-[calc(100%-2rem)] max-w-6xl mt-1.5 sm:mt-3 px-2 sm:px-5 rounded-2xl glass-card-premium shadow-cardhover border border-white/20 dark:border-white/5' 
          : 'w-full max-w-7xl px-2 sm:px-5 bg-transparent border-transparent'
      }`}>
        {/* LEFT: Logo */}
        <button onClick={onLogo} className="group flex items-center gap-2 shrink-0 cursor-grow">
          <Logo />
        </button>

        {/* RIGHT: Actions — max 3 items on mobile */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 ml-auto">

          {/* Mes commandes — icon only on mobile */}
          {(!user || user.role === 'client') && isBrowsePage && (
            <button
              type="button"
              onClick={onMyOrders}
              aria-label="Mes commandes"
              title="Mes commandes"
              className="cursor-grow w-8 h-8 sm:w-9 sm:h-9 md:w-auto md:h-auto md:px-3 md:py-2 rounded-xl flex items-center justify-center md:gap-1.5 bg-ink-100/90 dark:bg-ink-800/80 text-ink-900 dark:text-white border border-ink-200/60 dark:border-ink-700/60 hover:border-brand-500/50 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 text-xs font-bold shadow-xs active:scale-95 shrink-0"
            >
              <I.Receipt size={15} className="text-brand-500 shrink-0" />
              <span className="hidden md:inline">Mes commandes</span>
            </button>
          )}

          {/* Live order — sm+ only */}
          {liveOrder && (
            <button
              type="button"
              onClick={onLiveOrder}
              title="Suivi de commande"
              className="cursor-grow hidden md:flex min-w-0 max-w-[14rem] items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25 transition"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
              </span>
              <span className="truncate">{ORDER_STATES[liveOrder.status]?.label ?? liveOrder.status}</span>
              <span className="opacity-70 shrink-0">{liveOrder.id}</span>
            </button>
          )}

          {/* Dashboard icon — role-only */}
          {user?.role === 'admin' && (
            <DashBtn onClick={() => goto('admin')} />
          )}
          {user?.role === 'courier' && (
            <DashBtn onClick={() => goto('delivery')} />
          )}
          {user?.role === 'restaurant' && (
            <DashBtn onClick={() => goto('restaurant-dash')} />
          )}

          {/* Dark mode — md+ only */}
          <button
            onClick={() => setDark(d => !d)}
            aria-label="Changer le thème"
            title="Mode sombre / clair"
            className="cursor-grow hidden sm:flex w-9 h-9 md:w-10 md:h-10 rounded-xl items-center justify-center hover:bg-brand-500/10 hover:text-brand-500 dark:hover:text-brand-400 transition-all duration-300 text-ink-700 dark:text-ink-200 bg-ink-100/50 dark:bg-ink-800/40 border border-ink-200/50 dark:border-ink-700/50 shrink-0"
          >
            <span className={`absolute transition-all duration-500 ${dark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
              <I.Sun size={17}/>
            </span>
            <span className={`absolute transition-all duration-500 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
              <I.Moon size={17}/>
            </span>
          </button>

          {/* Cart */}
          <button 
            ref={cartIconRef} 
            onClick={onCart} 
            aria-label="Voir le panier"
            title="Voir le panier"
            className={`cursor-grow relative w-8 h-8 sm:w-9 sm:h-9 md:w-auto md:h-auto md:px-3 py-2 rounded-xl flex items-center justify-center md:gap-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white transition-all duration-300 font-extrabold text-xs sm:text-sm shadow-sm shrink-0 ${cartShake ? 'cart-shake' : ''}`}
          >
            <I.Cart size={17}/>
            <span className="hidden md:inline">Panier</span>
            {cartCount > 0 && (
              <span key={cartCount} className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-black bg-brand-500 text-white grid place-items-center animate-pop shadow-glow">
                {cartCount}
              </span>
            )}
          </button>

          {/* User / Auth */}
          {user ? (
            <>
              <div className="hidden lg:flex items-center gap-2 ml-1">
                <span className="max-w-[10rem] truncate text-xs font-semibold text-ink-600 dark:text-ink-300" title={user.email}>
                  {user.displayName}
                  <span className="block text-[10px] font-normal text-ink-400">{ROLE_LABELS[user.role]}</span>
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="cursor-grow px-3 py-2 rounded-xl text-xs font-semibold border border-ink-200 dark:border-ink-700 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 dark:hover:bg-red-500/15 dark:hover:text-red-400 dark:hover:border-red-500/35 transition-colors duration-300"
                >
                  Déconnexion
                </button>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                aria-label="Déconnexion"
                title="Déconnexion"
                className="cursor-grow lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/15 dark:hover:text-red-400 transition-colors duration-300 text-ink-700 dark:text-ink-200 shrink-0"
              >
                <I.LogOut size={16}/>
              </button>
            </>
          ) : (
            <Magnetic>
              <button
                type="button"
                onClick={() => goto('auth')}
                className="cursor-grow inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:opacity-90 transition-opacity shadow-md shrink-0"
              >
                <I.User size={15}/>
                <span className="hidden sm:inline">Connexion</span>
              </button>
            </Magnetic>
          )}
        </div>
      </div>
    </header>
  );
}

function NavBtn({ onClick, emoji, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-grow items-center gap-1.5 px-2 py-2 rounded-xl text-sm font-medium text-ink-700 dark:text-ink-200 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors duration-300"
    >
      <span>{emoji}</span>
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function DashBtn({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Tableau de bord ${label}`}
      title={`Tableau de bord ${label}`}
      className="cursor-grow w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center hover:bg-brand-500/10 hover:text-brand-500 dark:hover:text-brand-400 transition-colors duration-300 text-ink-700 dark:text-ink-200 shrink-0"
    >
      <I.LayoutDashboard size={18}/>
    </button>
  );
}
