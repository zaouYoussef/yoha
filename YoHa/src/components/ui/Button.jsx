'use client';

import React from 'react';

export function Button({ children, variant='primary', size='md', className='', onClick, disabled, ...rest }) {
  const sizes = { md:'h-11 px-5 text-sm', lg:'h-14 px-7 text-base', sm:'h-10 px-3 text-sm' };
  const variants = {
    // Reflet continu + léger décollage au survol, repris de hiho (.ember-btn) — couleurs YoHa inchangées.
    primary:'btn-sweep bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5',
    ghost:  'bg-white/60 dark:bg-ink-900/60 border border-ink-200/60 dark:border-ink-800 hover:border-brand-500 transition-colors duration-300',
    glass:  'bg-white/85 dark:bg-ink-900/80 text-white border border-white/20 hover:bg-white/30',
    dark:   'bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:opacity-90',
  };
  return (
    <button
      onClick={(e) => { onClick && onClick(e); }}
      disabled={disabled}
      style={{ touchAction: 'manipulation', transform: 'translateZ(0)' }}
      className={`cursor-grow relative inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.985] active:translate-y-0 disabled:opacity-45 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed will-change-transform ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
