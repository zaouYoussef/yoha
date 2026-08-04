'use client';

import React from 'react';

export function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm min-w-0">
      <span className="text-ink-500 dark:text-ink-400 shrink min-w-0 leading-snug">{label}</span>
      <span className="shrink-0 text-right tabular-nums font-medium text-ink-950 dark:text-white">{value}</span>
    </div>
  );
}
