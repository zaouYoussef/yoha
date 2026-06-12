'use client';

import React from 'react';

export function Logo() {
  return (
    <span className="relative w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
      <img src="/logo.png" alt="YoHa Logo" className="w-full h-full object-contain" />
      <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 opacity-40 blur-sm -z-10"></span>
    </span>
  );
}
