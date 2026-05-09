import React from 'react';

export function Logo() {
  return (
    <span className="relative min-w-[2.25rem] h-9 px-1 rounded-2xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 grid place-items-center shadow-glow group-hover:scale-110 transition-transform">
      <span className="font-display font-extrabold text-white text-sm sm:text-base leading-none tracking-tight">YN</span>
      <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 opacity-50 blur-md -z-10"></span>
    </span>
  );
}
