import React from 'react';

/** Pastilles d’étapes (page succès, barre de suivi) */
export function Step({ active, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`w-2 h-2 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-ink-300 dark:bg-ink-700'}`}></span>
      <span className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400'}>{label}</span>
    </div>
  );
}
