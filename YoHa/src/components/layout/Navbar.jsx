import React, { useState, useEffect } from 'react';
import { I } from '../../icons/Icons.jsx';
import { Logo } from './Logo.jsx';
import { Magnetic } from '../ui/Magnetic.jsx';
import { useAuth, ROLE_LABELS } from '../../contexts/AuthContext.jsx';
import { ORDER_STATES } from '../../data/index.js';

export function Navbar({
  dark,
  setDark,
  cartCount,
  cartShake,
  cartIconRef,
  onCart,
  onLogo,
  onHome,
  onPharmacy,
  onPastry,
  goto,
  liveOrder,
  onLiveOrder,
  onMyOrders,
}) {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${scrolled ? 'glass-strong shadow-soft' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        <button onClick={onLogo} className="flex items-center gap-2 group cursor-grow">
          <Logo />
          <span className="font-display font-extrabold text-xl tracking-tight">YoHa</span>
        </button>

        <button
          type="button"
          onClick={onHome}
          className="cursor-grow hidden md:inline-flex ml-6 items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800 transition"
        >
          <span>🍔</span> Restaurants
        </button>
        <button
          type="button"
          onClick={onPharmacy}
          className="cursor-grow hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800 transition"
        >
          <span>💊</span> Pharmacies
        </button>
        <button
          type="button"
          onClick={onPastry}
          className="cursor-grow hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800 transition"
        >
          <span>🥐</span> Pâtisseries
        </button>

        <div className="ml-auto flex items-center gap-2">
          {user?.role === 'client' && (
            <button
              type="button"
              onClick={onMyOrders}
              aria-label="Mes commandes"
              title="Mes commandes"
              className="cursor-grow w-10 h-10 rounded-xl flex items-center justify-center hover:bg-ink-100 dark:hover:bg-ink-800 transition text-ink-700 dark:text-ink-200"
            >
              <I.History size={20}/>
            </button>
          )}

          {liveOrder && (
            <button
              type="button"
              onClick={onLiveOrder}
              title="Suivi de commande"
              className="cursor-grow flex min-w-0 max-w-[min(100%,14rem)] items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25 transition"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
              </span>
              <span className="truncate">{ORDER_STATES[liveOrder.status]?.label ?? liveOrder.status}</span>
              <span className="opacity-70 shrink-0 hidden sm:inline">{liveOrder.id}</span>
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => goto('admin')}
              aria-label="Tableau de bord gérant"
              className="cursor-grow w-10 h-10 rounded-xl flex items-center justify-center hover:bg-ink-100 dark:hover:bg-ink-800 transition text-ink-700 dark:text-ink-200"
            >
              <I.LayoutDashboard size={20}/>
            </button>
          )}
          {user?.role === 'courier' && (
            <button
              type="button"
              onClick={() => goto('delivery')}
              aria-label="Tableau de bord livreur"
              className="cursor-grow w-10 h-10 rounded-xl flex items-center justify-center hover:bg-ink-100 dark:hover:bg-ink-800 transition text-ink-700 dark:text-ink-200"
            >
              <I.LayoutDashboard size={20}/>
            </button>
          )}
          {user?.role === 'restaurant' && (
            <button
              type="button"
              onClick={() => goto('restaurant-dash')}
              aria-label="Tableau de bord restaurant"
              className="cursor-grow w-10 h-10 rounded-xl flex items-center justify-center hover:bg-ink-100 dark:hover:bg-ink-800 transition text-ink-700 dark:text-ink-200"
            >
              <I.LayoutDashboard size={20}/>
            </button>
          )}

          <button
            onClick={() => setDark(d => !d)}
            aria-label="Changer le thème"
            className="cursor-grow relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-ink-100 dark:hover:bg-ink-800 transition group"
          >
            <span className={`absolute transition-all duration-500 ${dark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
              <I.Sun size={20}/>
            </span>
            <span className={`absolute transition-all duration-500 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
              <I.Moon size={20}/>
            </span>
          </button>

          <button ref={cartIconRef} onClick={onCart} className={`cursor-grow relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-ink-100 dark:hover:bg-ink-800 transition ${cartShake ? 'cart-shake' : ''}`}>
            <I.Cart size={20}/>
            {cartCount > 0 && (
              <span key={cartCount} className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-brand-500 to-pink-500 text-white grid place-items-center animate-pop shadow-glow">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <span className="max-w-[10rem] truncate text-xs font-semibold text-ink-600 dark:text-ink-300" title={user.email}>
                {user.displayName}
                <span className="block text-[10px] font-normal text-ink-400">{ROLE_LABELS[user.role]}</span>
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="cursor-grow px-3 py-2 rounded-xl text-xs font-semibold border border-ink-200 dark:border-ink-700 hover:bg-ink-100 dark:hover:bg-ink-800 transition"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Magnetic>
              <button
                type="button"
                onClick={() => goto('auth')}
                className="cursor-grow inline-flex items-center gap-2 ml-1 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:opacity-90 transition btn-shine"
              >
                <I.User size={16}/> Connexion
              </button>
            </Magnetic>
          )}
        </div>
      </div>
    </header>
  );
}
