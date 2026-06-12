'use client';

import React from 'react';

export function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-500 dark:text-ink-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}
