'use client';

import React from 'react';

export function OrderRestaurantNotes({ notes, title = 'Remarques pour le restaurant', className = '' }) {
  const text = notes?.trim();
  if (!text) return null;

  return (
    <div
      className={`rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100 ${className}`}
    >
      <div className="font-bold uppercase tracking-wide text-[10px] text-amber-800 dark:text-amber-300">
        {title}
      </div>
      <p className="mt-1 leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}
