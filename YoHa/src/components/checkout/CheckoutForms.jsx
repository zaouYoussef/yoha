'use client';

import React from 'react';
import { I } from '../../icons/Icons.jsx';

export function Card({ children, className = '' }) {
  return (
    <div
      className={`relative bg-white dark:bg-ink-900 border border-ink-100 dark:border-white/8 rounded-[1.35rem] sm:rounded-3xl shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 h-13 sm:h-14 border-b border-ink-100 dark:border-white/8">
      {icon ? (
        <span className="w-9 h-9 rounded-xl bg-ink-950 text-white dark:bg-white dark:text-ink-950 grid place-items-center shrink-0">
          {icon}
        </span>
      ) : null}
      <h3 className="font-display font-bold text-sm sm:text-base text-ink-950 dark:text-white tracking-tight truncate">
        {title}
      </h3>
    </div>
  );
}

export function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300 tracking-tight">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full px-3.5 sm:px-4 py-3 rounded-xl bg-ink-50/80 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 dark:focus:border-brand-400 text-base sm:text-sm font-medium transition text-ink-950 dark:text-white placeholder:text-ink-400"
      />
    </label>
  );
}

export function PayOption({ active, onClick, icon, title, subtitle }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer relative text-left p-4 rounded-2xl border-2 transition-all ${
        active
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
          : 'border-ink-200 dark:border-ink-800 hover:border-brand-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-10 h-10 rounded-xl grid place-items-center transition ${
            active ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800'
          }`}
        >
          {icon}
        </span>
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs text-ink-500">{subtitle}</div>
        </div>
        <span
          className={`ml-auto w-5 h-5 rounded-full border-2 transition ${
            active ? 'border-brand-500 bg-brand-500' : 'border-ink-300'
          }`}
        >
          {active && <I.Check size={12} stroke={4} className="text-white -translate-y-0.5" />}
        </span>
      </div>
    </button>
  );
}

export function Loader() {
  return <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}
