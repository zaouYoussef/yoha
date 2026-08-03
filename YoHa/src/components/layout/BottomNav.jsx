'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { I } from '../../icons/Icons.jsx';

export function BottomNav({ active, onHome, onSearch, onCart, onProfile, cartCount }) {
  return (
    <nav className="fixed md:hidden bottom-0 inset-x-0 z-30 glass-strong border-t border-ink-200/60 dark:border-ink-800/60 pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-500/0 via-pink-500/55 to-violet-500/0" />
      <div className="grid grid-cols-4 h-16">
        <BNBtn active={active === 'landing'} onClick={onHome} icon={<I.Home size={20} />} label="Accueil" />
        <BNBtn active={active === 'browse' || active === 'home'} onClick={onSearch} icon={<I.Chef size={20} />} label="Commander" />
        <BNBtn
          active={active === 'checkout'}
          onClick={onCart}
          icon={
            <span className="relative">
              <I.Cart size={20} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-brand-500 to-pink-500 text-white grid place-items-center shadow-glow"
                >
                  {cartCount}
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
          icon={<I.User size={20} />}
          label="Profil"
        />
      </div>
    </nav>
  );
}

export function BNBtn({ active, onClick, icon, label, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-grow relative flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all duration-300 active:scale-95 ${
        active
          ? 'text-brand-600 dark:text-brand-400'
          : highlight
            ? 'text-brand-500'
            : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
      }`}
    >
      {active && (
        <motion.span
          layoutId="bottom-nav-active"
          className="absolute inset-x-2.5 top-1 bottom-1 rounded-2xl bg-gradient-to-b from-brand-500/15 via-pink-500/10 to-violet-500/10 dark:from-brand-500/25 dark:via-pink-500/15 dark:to-violet-500/15 border border-brand-500/25 dark:border-brand-500/30 shadow-[0_0_20px_rgba(249,115,22,0.12)]"
          transition={{ type: 'spring', stiffness: 480, damping: 38 }}
        />
      )}
      <span className={`relative transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </span>
      <span className="relative">{label}</span>
      {active && (
        <span className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+3px)] h-0.5 w-6 rounded-full bg-gradient-to-r from-brand-500 to-violet-500" />
      )}
    </button>
  );
}
