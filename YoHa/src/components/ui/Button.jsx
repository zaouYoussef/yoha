import React from 'react';
import { rippleEffect } from '../../utils/ripple.js';

export function Button({ children, variant='primary', size='md', className='', onClick, disabled, ...rest }) {
  const sizes = { md:'h-11 px-5 text-sm', lg:'h-14 px-7 text-base', sm:'h-9 px-3 text-sm' };
  const variants = {
    primary:'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5',
    ghost:  'bg-white/60 dark:bg-ink-900/60 backdrop-blur border border-ink-200/60 dark:border-ink-800 hover:border-brand-500',
    glass:  'glass-strong text-white border border-white/20 hover:bg-white/20',
    dark:   'bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:opacity-90',
  };
  return (
    <button
      onClick={(e) => { rippleEffect(e); onClick && onClick(e); }}
      disabled={disabled}
      className={`cursor-grow ripple btn-shine relative inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
