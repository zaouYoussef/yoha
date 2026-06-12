'use client';

import React, { useEffect } from 'react';

export function ModalOverlay({ children, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-ink-900 rounded-3xl p-6 shadow-cardhover animate-scale-in border border-ink-200/60 dark:border-ink-800">
        {children}
      </div>
    </div>
  );
}
