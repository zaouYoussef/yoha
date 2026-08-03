'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { I } from '../../icons/Icons.jsx';

export function BottomNav({ active, onHome, onSearch, onCart, onProfile, cartCount }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto relative mx-auto max-w-md overflow-hidden rounded-[1.35rem] border border-ink-200/70 bg-white/90 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.28),0_0_0_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-2xl dark:border-ink-700/70 dark:bg-ink-950/88 dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="grid grid-cols-4 h-[3.75rem]">
          <BNBtn
            active={active === 'landing'}
            onClick={onHome}
            icon={<I.Home size={21} stroke={active === 'landing' ? 2.35 : 2} />}
            label="Accueil"
          />
          <BNBtn
            active={active === 'browse' || active === 'home'}
            onClick={onSearch}
            icon={
              <I.Chef
                size={21}
                stroke={active === 'browse' || active === 'home' ? 2.35 : 2}
              />
            }
            label="Commander"
          />
          <BNBtn
            active={active === 'checkout'}
            onClick={onCart}
            icon={
              <span className="relative">
                <I.Cart size={21} stroke={active === 'checkout' || cartCount > 0 ? 2.35 : 2} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                    className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-black tracking-tight bg-brand-500 text-white grid place-items-center ring-2 ring-white dark:ring-ink-950"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </span>
            }
            label="Panier"
            highlight={cartCount > 0}
          />
          <BNBtn
            onClick={onProfile}
            active={active === 'my-orders' || active === 'auth'}
            icon={
              <I.User
                size={21}
                stroke={active === 'my-orders' || active === 'auth' ? 2.35 : 2}
              />
            }
            label="Profil"
          />
        </div>
      </div>
    </nav>
  );
}

export function BNBtn({ active, onClick, icon, label, highlight }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`cursor-grow relative flex flex-col items-center justify-center gap-0.5 px-1 transition-colors duration-200 active:scale-[0.94] ${
        active
          ? 'text-brand-600 dark:text-brand-400'
          : highlight
            ? 'text-brand-500'
            : 'text-ink-500 dark:text-ink-400'
      }`}
    >
      {active && (
        <motion.span
          layoutId="bottom-nav-active"
          className="absolute inset-x-2.5 top-1.5 bottom-1.5 rounded-2xl bg-brand-500/[0.12] dark:bg-brand-500/20"
          transition={{ type: 'spring', stiffness: 520, damping: 36 }}
        />
      )}
      <span
        className={`relative z-[1] grid place-items-center transition-transform duration-300 ${
          active ? '-translate-y-px scale-105' : 'scale-100'
        }`}
      >
        {icon}
      </span>
      <span
        className={`relative z-[1] text-[10px] leading-none tracking-wide ${
          active ? 'font-bold' : 'font-semibold opacity-80'
        }`}
      >
        {label}
      </span>
      {active && (
        <motion.span
          layoutId="bottom-nav-dot"
          className="absolute bottom-1.5 h-1 w-1 rounded-full bg-brand-500"
          transition={{ type: 'spring', stiffness: 520, damping: 36 }}
        />
      )}
    </button>
  );
}
