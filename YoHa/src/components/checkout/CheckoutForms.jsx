'use client';

import React from 'react';
import { I } from '../../icons/Icons.jsx';

export function Card({ children }) {
  return <div className="bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 rounded-3xl shadow-card overflow-hidden">{children}</div>;
}
export function CardHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 px-5 h-14 border-b border-ink-200/60 dark:border-ink-800">
      <span className="text-brand-500">{icon}</span>
      <h3 className="font-display font-bold">{title}</h3>
    </div>
  );
}
export function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="block w-full mt-1 px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition"/>
    </label>
  );
}
export function PayOption({ active, onClick, icon, title, subtitle }) {
  return (
    <button onClick={onClick}
      className={`cursor-grow relative text-left p-4 rounded-2xl border-2 transition-all ${active
        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
        : 'border-ink-200 dark:border-ink-800 hover:border-brand-300'}`}>
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl grid place-items-center transition ${active ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800'}`}>
          {icon}
        </span>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-ink-500">{subtitle}</div>
        </div>
        <span className={`ml-auto w-5 h-5 rounded-full border-2 transition ${active ? 'border-brand-500 bg-brand-500' : 'border-ink-300'}`}>
          {active && <I.Check size={12} stroke={4} className="text-white -translate-y-0.5"/>}
        </span>
      </div>
    </button>
  );
}
export function Loader() {
  return <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>;
}
