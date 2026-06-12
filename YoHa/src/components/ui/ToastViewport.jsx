'use client';

import React from 'react';
import { I } from '../../icons/Icons.jsx';

export function ToastViewport({ toasts }) {
  return (
    <div className="fixed top-20 right-4 z-[60] space-y-2 w-[min(92vw,360px)] pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className="pointer-events-auto rounded-2xl glass-strong shadow-cardhover border border-ink-200/60 dark:border-ink-800 px-4 py-3 flex items-center gap-3 animate-slide-up">
          <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
            t.type === 'success' ? 'bg-emerald-500/15 text-emerald-600' :
            t.type === 'error'   ? 'bg-red-500/15 text-red-600' :
                                    'bg-brand-500/15 text-brand-600'
          }`}>
            {t.type === 'success' ? <I.Check size={18} stroke={3}/> : <I.Bell size={18}/>}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-sm">{t.title}</div>
            {t.desc && <div className="text-xs text-ink-500 truncate">{t.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
