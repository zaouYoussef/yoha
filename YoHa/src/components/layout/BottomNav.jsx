'use client';

import React from 'react';
import { I } from '../../icons/Icons.jsx';

export function BottomNav({ active, onHome, onSearch, onCart, onProfile, cartCount }) {
  return (
    <nav className="fixed md:hidden bottom-0 inset-x-0 z-30 glass-strong border-t border-ink-200/60 dark:border-ink-800/60 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-16">
        <BNBtn active={active==='landing'} onClick={onHome} icon={<I.Home size={20}/>} label="Accueil"/>
        <BNBtn active={active==='browse'||active==='home'} onClick={onSearch} icon={<I.Chef size={20}/>} label="Commander"/>
        <BNBtn active={active==='checkout'} onClick={onCart} icon={
          <span className="relative">
            <I.Cart size={20}/>
            {cartCount > 0 && <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-brand-500 text-white grid place-items-center">{cartCount}</span>}
          </span>
        } label="Panier"/>
        <BNBtn onClick={onProfile} active={active==='my-orders'||active==='auth'} icon={<I.User size={20}/>} label="Profil"/>
      </div>
    </nav>
  );
}

export function BNBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`cursor-grow relative flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all duration-300 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'}`}>
      <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</span>
      <span>{label}</span>
      {/* Repris de hiho/yoha-web (BNBtn) : point discret sous l'onglet actif */}
      {active ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-500" /> : null}
    </button>
  );
}
