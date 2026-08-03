'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { I } from '../icons/Icons.jsx';
import { Logo } from '../components/layout/Logo.jsx';
import { ORDER_STATES } from '../data/index.js';
import { spotlightHandler } from '../utils/spotlight.js';
import { useAuth, getStaffHomePath } from '../contexts/AuthContext.jsx';
import { useRouter } from 'next/navigation';

const gerantPhoto = '/logo.webp';

const DASH_LINKS = {
  admin: [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <I.Sparkle size={18} /> },
    { id: 'clients', label: 'Clients', icon: <I.User size={18} /> },
    { id: 'requests', label: 'Requêtes', icon: <I.Bell size={18} /> },
    { id: 'orders', label: 'Commandes', icon: <I.Bag size={18} /> },
    { id: 'restaurants', label: 'Restaurants', icon: <I.Chef size={18} /> },
    { id: 'couriers', label: 'Livreurs', icon: <I.Bike size={18} /> },
    { id: 'revenue', label: 'Revenus', icon: <I.Star size={18} /> },
    { id: 'promos', label: 'Promos', icon: <I.Zap size={18} /> },
    { id: 'reviews', label: 'Avis & Notes', icon: <I.Star size={18} /> },
  ],
  delivery: [
    { id: 'available', label: 'À prendre', icon: <I.Bell size={18} />, badge: true },
    { id: 'mine', label: 'Mes courses', icon: <I.Bike size={18} /> },
    { id: 'history', label: 'Historique', icon: <I.Clock size={18} /> },
  ],
  restaurant: [
    { id: 'incoming', label: 'Cuisine', icon: <I.Bell size={18} />, badge: true },
    { id: 'profile', label: 'Établissement', icon: <I.Chef size={18} /> },
    { id: 'menu', label: 'Carte', icon: <I.Bag size={18} /> },
    { id: 'promos', label: 'Offres', icon: <I.Zap size={18} /> },
    { id: 'stats', label: 'Analytics', icon: <I.Sparkle size={18} /> },
  ],
};

const DASH_ACCENT = {
  admin: { from: 'from-brand-500', to: 'to-pink-500', name: 'Admin', emoji: '✨', gradient: 'from-brand-500 via-pink-500 to-violet-500' },
  delivery: { from: 'from-emerald-600', to: 'to-teal-500', name: 'Livreur', emoji: '🚴', gradient: 'from-emerald-600 via-teal-500 to-cyan-500' },
  restaurant: { from: 'from-slate-800', to: 'to-amber-600', name: 'Partner', emoji: '🍽️', gradient: 'from-slate-800 via-slate-700 to-amber-600' },
};

function pillBg(color) {
  if (color.includes('amber')) return 'rgb(254 243 199 / 0.8)';
  if (color.includes('sky')) return 'rgb(224 242 254 / 0.8)';
  if (color.includes('violet')) return 'rgb(237 233 254 / 0.8)';
  if (color.includes('emerald')) return 'rgb(209 250 229 / 0.8)';
  if (color.includes('pink')) return 'rgb(252 231 243 / 0.8)';
  if (color.includes('indigo')) return 'rgb(224 232 252 / 0.8)';
  if (color.includes('red')) return 'rgb(254 226 226 / 0.8)';
  if (color.includes('rose')) return 'rgb(255 228 230 / 0.8)';
  return 'rgb(241 245 249 / 0.8)';
}

/* ─── Glass Card ─── */
export function GlassCard({ children, className = '', hover = true, glow, ring = false, ...props }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/25 bg-white/75 shadow-card backdrop-blur-xl glass-card-premium dark:border-white/5 dark:bg-ink-900/75 ${hover ? 'spotlight card-glow-hover' : ''} ${ring ? 'ring-gradient' : ''} ${className}`}
      onMouseMove={hover ? spotlightHandler : undefined}
      {...props}
    >
      {glow && (
        <div className={`pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br opacity-[0.14] blur-3xl dark:opacity-20 ${glow}`} />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
      {children}
    </div>
  );
}

/* ─── Gradient Header ─── */
export function GradientHeader({ title, subtitle, icon, gradient, actions, children }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br ${gradient || 'from-brand-500 via-pink-500 to-violet-500'} p-5 text-white shadow-glow-lg sm:rounded-3xl sm:p-6`}>
      <div className="pointer-events-none absolute inset-0 opacity-40 mesh-bg" aria-hidden />
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-violet-300/20 blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/15 text-xl shadow-lg backdrop-blur-md sm:h-14 sm:w-14 float-soft">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-display text-lg font-black tracking-tight sm:text-2xl">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-white/85">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/* ─── Search Bar ─── */
export function SearchBar({ value, onChange, placeholder = 'Rechercher...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <I.Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-ink-200/60 bg-white/85 py-2.5 pl-10 pr-4 text-sm font-medium outline-none shadow-xs backdrop-blur-sm transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25 dark:border-ink-700/50 dark:bg-ink-900/85 dark:text-white dark:placeholder:text-ink-500 dark:focus:border-pink-500/60"
      />
    </div>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <span className="relative mb-5 grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/25 via-pink-500/20 to-violet-500/25 blur-xl" />
        <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-white/40 bg-white/80 text-3xl shadow-card dark:border-white/10 dark:bg-ink-900/80 float-soft">
          {icon || '📭'}
        </span>
      </span>
      <h3 className="font-display text-xl font-black text-ink-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─── Animated Counter ─── */
export function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
    if (num === 0) { setDisplay(0); return; }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(num * eased));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);

  return <span>{prefix}{display.toLocaleString('fr-FR')}{suffix}</span>;
}

/* ─── Stat Card (Enhanced) ─── */
export function StatCard({ label, value, sub, icon, color = 'from-brand-500 to-pink-500', trend, animate }) {
  return (
    <GlassCard className="p-4 sm:p-5" glow={color}>
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            {label}
          </div>
          <div className="mt-1.5 break-words font-display text-2xl font-black tracking-tight text-ink-900 dark:text-white sm:text-3xl">
            {animate ? <AnimatedCounter value={value} /> : value}
          </div>
          {sub && <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{sub}</div>}
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-glow sm:h-12 sm:w-12 ${color}`}
        >
          {icon}
        </span>
      </div>
      {trend !== undefined && (
        <div
          className={`relative mt-3 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
            trend >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
          }`}
        >
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
    </GlassCard>
  );
}

/* ─── Status Pill (Enhanced) ─── */
export function StatusPill({ status, className = '' }) {
  const s = ORDER_STATES[status] || { label: status, color: 'bg-ink-500', text: 'text-ink-700' };

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:text-[11px] ${s.text} ${className}`}
      style={{ backgroundColor: pillBg(s.color) }}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2 ${s.color} ${status !== 'delivered' && status !== 'cancelled' ? 'animate-pulse' : ''}`} />
      <span className="truncate">{s.label}</span>
    </span>
  );
}

/* ─── Filter Chip ─── */
export function FilterChip({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-grow inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
        active
          ? 'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow'
          : 'border border-ink-200/60 bg-white/80 text-ink-600 backdrop-blur-sm hover:border-brand-400 hover:text-brand-600 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-ink-300 dark:hover:border-pink-500/50'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${active ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Action Button ─── */
export function ActionButton({ children, variant = 'primary', size = 'md', icon, className = '', ...props }) {
  const variants = {
    primary: 'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow hover:shadow-glow-lg hover:opacity-95 active:scale-[0.98]',
    secondary: 'border border-ink-200/60 bg-white/80 text-ink-700 backdrop-blur-sm hover:border-brand-400 hover:text-brand-600 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-ink-300',
    danger: 'bg-red-500 text-white shadow-lg hover:bg-red-600 active:scale-[0.98]',
    ghost: 'text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800',
    success: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg hover:shadow-xl active:scale-[0.98]',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl active:scale-[0.98]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-sm rounded-xl',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

/* ─── Sheet / Drawer (mobile bottom sheet + desktop dialog) ─── */
export function DashSheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  wide = false,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[1.35rem] border border-ink-200/60 bg-white shadow-2xl dark:border-ink-700/60 dark:bg-ink-950 sm:max-h-[88vh] sm:rounded-2xl ${
          wide ? 'sm:max-w-xl' : 'sm:max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink-200 dark:bg-ink-700 sm:hidden" aria-hidden />

        <div className="flex shrink-0 items-start gap-3 border-b border-ink-100 px-4 py-3 dark:border-ink-800 sm:px-5 sm:py-4">
          {icon && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-pink-500 text-white shadow-lg">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-display text-base font-bold leading-tight sm:text-lg">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11px] text-ink-500 sm:text-xs">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
          >
            <I.X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-ink-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-ink-800 dark:bg-ink-950/95 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ─── Table (Glass) ─── */
export function GlassTable({ headers, children, className = '' }) {
  return (
    <GlassCard className={`overflow-hidden ${className}`} hover={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200/40 dark:border-ink-700/40">
              {headers.map((h, i) => (
                <th key={i} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 ${h.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100/50 dark:divide-ink-800/50">
            {children}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ─── Toggle Switch ─── */
export function Toggle({ checked, onChange, disabled, size = 'md' }) {
  const sizes = { sm: 'h-6 w-11', md: 'h-8 w-14', lg: 'h-10 w-[4.5rem]' };
  const knobs = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' };
  const translate = { sm: checked ? 'translate-x-[20px]' : 'translate-x-[2px]', md: checked ? 'translate-x-[26px]' : 'translate-x-[3px]', lg: checked ? 'translate-x-[32px]' : 'translate-x-[3px]' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${sizes[size]} ${checked ? 'bg-gradient-to-r from-brand-500 to-pink-500 shadow-glow' : 'bg-ink-300 dark:bg-ink-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`inline-block rounded-full bg-white shadow-lg transition-transform duration-200 ${knobs[size]} ${translate[size]}`} />
    </button>
  );
}

/* ─── Tabs (Pill) ─── */
export function PillTabs({ tabs, current, onChange }) {
  return (
    <div className="flex gap-1 rounded-2xl border border-ink-200/40 bg-ink-100/70 p-1 backdrop-blur-sm dark:border-ink-700/40 dark:bg-ink-800/70">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all sm:text-sm ${
            current === t.id
              ? 'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow'
              : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ml-1 text-[10px] opacity-70">({t.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Section Header ─── */
export function SectionHeader({ title, subtitle, action, icon }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500/15 via-pink-500/10 to-violet-500/15 text-base dark:from-brand-500/25 dark:to-violet-500/20">
            {icon}
          </span>
        )}
        <div>
          <h3 className="font-display text-base font-black tracking-tight sm:text-lg text-ink-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-ink-500 dark:text-ink-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ─── Layout ─── */
export function DashLink({ icon, title, sub, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-grow flex w-full min-w-0 items-center gap-3 rounded-xl p-3 text-left transition hover:bg-ink-100 dark:hover:bg-ink-800"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold">{title}</div>
        <div className="truncate text-xs text-ink-500">{sub}</div>
      </div>
      <I.Right size={14} className="ml-auto shrink-0 text-ink-400" />
    </button>
  );
}

function DashMobileTabBar({ links, current, setCurrent, accent }) {
  return (
    <nav
      aria-label="Navigation dashboard"
      className="dash-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/25 bg-white/90 backdrop-blur-2xl dark:border-ink-800/60 dark:bg-ink-950/92 lg:hidden pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-500/0 via-pink-500/50 to-violet-500/0" />
      <div
        className="grid h-16"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setCurrent(l.id)}
            className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 transition ${
              current === l.id
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-ink-500 dark:text-ink-400'
            }`}
          >
            {current === l.id && (
              <span className={`absolute inset-x-2 top-1 bottom-1 rounded-2xl bg-gradient-to-b from-brand-500/15 to-violet-500/10 dark:from-brand-500/25 dark:to-violet-500/15 border border-brand-500/20`} />
            )}
            <span className={`relative shrink-0 scale-90 sm:scale-100 ${current === l.id ? 'scale-105 sm:scale-110' : ''}`}>{l.icon}</span>
            <span className="relative w-full truncate text-center text-[9px] font-bold leading-tight sm:text-[10px]">
              {l.label}
            </span>
            {current === l.id && (
              <span
                className={`absolute bottom-[calc(env(safe-area-inset-bottom,0px)+2px)] h-0.5 w-8 rounded-full bg-gradient-to-r ${accent.from} ${accent.to} shadow-glow`}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function DashLayout({
  kind,
  current,
  setCurrent,
  goto,
  dark,
  setDark,
  children,
  title,
  subtitle,
}) {
  const links = DASH_LINKS[kind] || [];
  const accent = DASH_ACCENT[kind] || DASH_ACCENT.admin;
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuth();
  const router = useRouter();

  const pickTab = (id) => {
    setCurrent(id);
    setOpen(false);
  };

  const goHomeOrPanel = () => {
    const home = getStaffHomePath(user?.role);
    if (home) {
      router.push(home);
      return;
    }
    goto('landing');
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  return (
    <div className={`page-enter relative flex min-h-screen min-h-[100dvh] overflow-x-hidden ${
      kind === 'restaurant'
        ? 'bg-gradient-to-b from-slate-100 via-white to-amber-50/40 dark:from-ink-950 dark:via-ink-950 dark:to-ink-950'
        : kind === 'delivery'
          ? 'bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/30 dark:from-ink-950 dark:via-ink-950 dark:to-ink-950'
          : 'bg-gradient-to-b from-amber-50/60 via-ink-50 to-violet-50/30 dark:from-ink-950 dark:via-ink-950 dark:to-ink-950'
    }`}>
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70 dark:opacity-50" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 dark:opacity-30" aria-hidden />

      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col border-r border-white/25 bg-white/85 backdrop-blur-2xl transition-transform duration-300 dark:border-white/5 dark:bg-ink-900/90 lg:static lg:z-auto lg:w-72 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.gradient}`} />

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/20 px-4 dark:border-ink-800/80 sm:px-5">
          <button
            type="button"
            onClick={goHomeOrPanel}
            className="group flex min-w-0 cursor-grow items-center gap-2"
          >
            <Logo />
            <span className="truncate font-display text-lg font-black tracking-tight">YoHa</span>
            <span
              className={`hidden shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-glow bg-gradient-to-r sm:inline ${accent.gradient}`}
            >
              {accent.emoji} {accent.name}
            </span>
          </button>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300 lg:hidden"
          >
            <I.X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4 lg:pb-4">
          {links.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => pickTab(l.id)}
              className={`relative flex w-full min-w-0 cursor-grow items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition sm:px-4 sm:py-3 ${
                current === l.id
                  ? `bg-gradient-to-r text-white shadow-glow ${accent.from} ${accent.to}`
                  : 'text-ink-600 hover:bg-brand-500/8 dark:text-ink-300 dark:hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">{l.icon}</span>
              <span className="truncate">{l.label}</span>
              {current === l.id && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="shrink-0 space-y-1 border-t border-ink-100/60 p-3 dark:border-ink-800/60 sm:p-4">
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="flex w-full cursor-grow items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-brand-500/8 dark:text-ink-300 dark:hover:bg-white/5"
          >
            {dark ? <I.Sun size={18} /> : <I.Moon size={18} />}
            {dark ? 'Mode clair' : 'Mode sombre'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-grow items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
          >
            <I.Left size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-white/25 bg-white/75 px-3 backdrop-blur-2xl dark:border-white/5 dark:bg-ink-950/75 sm:h-16 sm:gap-3 sm:px-5">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-500/0 via-pink-500/35 to-violet-500/0" />
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 shrink-0 cursor-grow place-items-center rounded-xl border border-ink-200/50 bg-white/70 hover:bg-brand-500/10 dark:border-ink-700/50 dark:bg-ink-900/70 dark:hover:bg-brand-500/15 lg:hidden"
          >
            <I.Sparkle size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base font-black tracking-tight sm:text-xl text-ink-900 dark:text-white">{title}</h1>
            {subtitle && (
              <div className="truncate text-[11px] text-ink-500 sm:text-xs">{subtitle}</div>
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 sm:px-3 sm:text-xs dark:text-emerald-400"
              title="Synchronisé en direct"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 sm:h-2 sm:w-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="hidden sm:inline">En direct</span>
              <span className="sm:hidden">Live</span>
            </span>
            {kind === 'admin' && (
              <img
                src={gerantPhoto}
                alt=""
                className="h-8 w-8 rounded-xl border-2 border-white object-cover shadow-md ring-2 ring-brand-500/30 dark:border-ink-800 sm:h-9 sm:w-9"
              />
            )}
          </div>
        </header>

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-x-hidden p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:p-5 sm:pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
          <div key={current} className="page-enter stagger-children mx-auto w-full max-w-6xl space-y-0">
            {children}
          </div>
        </div>
      </div>

      <DashMobileTabBar links={links} current={current} setCurrent={pickTab} accent={accent} />
    </div>
  );
}

/* ─── Charts ─── */
export function LineChart({ data, height = 180, color = '#f97316', color2 = '#ec4899' }) {
  const list = Array.isArray(data) && data.length ? data : [0];
  const max = Math.max(1, ...list.map((v) => Number(v) || 0));
  const w = 100;
  const denom = Math.max(1, list.length - 1);
  const points = list.map(
    (v, i) => `${(i / denom) * w},${100 - ((Number(v) || 0) / max) * 90 - 5}`,
  );
  const path = `M ${points.join(' L ')}`;
  const area = `M 0,100 L ${points.join(' L ')} L ${w},100 Z`;
  const id = `chart-${Math.random().toString(36).slice(2)}`;

  return (
    <svg
      viewBox={`0 0 ${w} 100`}
      preserveAspectRatio="none"
      className="w-full min-w-0"
      style={{ height }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={path}
        fill="none"
        stroke={`url(#${id}-l)`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((p, i) => {
        const [x, y] = p.split(',');
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1.4"
            fill="white"
            stroke={color}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

export function BarChart({ data, labels, color1 = 'from-violet-500', color2 = 'to-fuchsia-400' }) {
  const list = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...list.map((v) => Number(v) || 0));

  return (
    <div className="flex h-40 w-full min-w-0 gap-1.5 sm:h-48 sm:gap-2">
      {list.map((raw, i) => {
        const v = Number(raw) || 0;
        const pct = max > 0 ? (v / max) * 100 : 0;
        return (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col">
            <div className="flex min-h-[5rem] flex-1 flex-col justify-end sm:min-h-[7rem]">
              <div
                title={String(v)}
                className={`w-full rounded-t-xl bg-gradient-to-t shadow-md transition-all hover:opacity-90 ${color1} ${color2}`}
                style={{ height: `${pct}%`, minHeight: v > 0 ? 10 : 2 }}
              />
            </div>
            <div
              className="shrink-0 truncate pt-1.5 text-center text-[9px] text-ink-500 dark:text-ink-400 sm:pt-2 sm:text-[10px]"
              title={labels?.[i]}
            >
              {labels?.[i] ?? '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ data, colors, size = 180 }) {
  const list = Array.isArray(data) ? data : [];
  const total = list.reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
  let angle = 0;
  const stops = [];

  list.forEach((d, i) => {
    const val = Number(d.value) || 0;
    if (val <= 0) return;
    const sweep = (val / total) * 360;
    const start = angle;
    angle += sweep;
    const c = colors[i % colors.length] ?? '#94a3b8';
    stops.push(`${c} ${start}deg ${angle}deg`);
  });

  const bg =
    stops.length > 0
      ? `conic-gradient(from -90deg, ${stops.join(', ')})`
      : 'conic-gradient(from -90deg, rgb(203 213 225) 0deg 360deg)';

  return (
    <div
      className="relative mx-auto w-full max-w-[180px] shrink-0 select-none"
      style={{ aspectRatio: '1 / 1', maxWidth: size }}
    >
      <div
        className="h-full w-full rounded-full shadow-inner ring-1 ring-ink-200/30 dark:ring-ink-700/40"
        style={{ background: bg }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm ring-1 ring-ink-200/60 dark:bg-ink-900 dark:ring-ink-700/60"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-xl font-black text-ink-900 dark:text-white sm:text-2xl">
            {total}
          </div>
          <div className="text-xs text-ink-500">Total</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Recent Orders Table (Reusable) ─── */
export function RecentOrdersTable({ orders, title, full, gainMad, hideCourier = false, hideViewAll = false, showCancellation = false }) {
  const showGain = gainMad != null || full;
  const gainLabel = gainMad != null ? 'Gain' : 'Profit net';
  const gainValue = (o) => {
    if (o.status === 'cancelled') return 0;
    return gainMad != null ? gainMad : Number(o.netDh || 0);
  };
  const colCount = 5 + (hideCourier ? 0 : 1) + (showGain ? 1 : 0);

  return (
    <GlassCard className="overflow-hidden" hover={false}>
      <div className="flex items-center justify-between gap-2 border-b border-ink-200/40 px-4 py-3 dark:border-ink-800/40 sm:px-5 sm:py-4">
        <h3 className="min-w-0 truncate font-display font-bold">{title}</h3>
        {!hideViewAll && (
          <button type="button" className="shrink-0 cursor-grow text-xs font-bold text-brand-600">
            Tout voir
          </button>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink-50/50 text-xs uppercase tracking-wider text-ink-500 dark:bg-ink-950/30">
            <tr>
              <th className="px-4 py-3 text-left sm:px-5">Commande</th>
              <th className="px-4 py-3 text-left sm:px-5">Client</th>
              <th className="px-4 py-3 text-left sm:px-5">Restaurant</th>
              {!hideCourier && (
                <th className="px-4 py-3 text-left sm:px-5">Livreur</th>
              )}
              <th className="px-4 py-3 text-right sm:px-5">Total</th>
              {showGain && (
                <th className="px-4 py-3 text-right sm:px-5">{gainLabel}</th>
              )}
              <th className="px-4 py-3 text-left sm:px-5">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100/50 dark:divide-ink-800/50">
            {orders.map((o) => (
              <tr key={o.id} className="transition hover:bg-ink-50/50 dark:hover:bg-ink-950/30">
                <td className="break-anywhere px-4 py-3 font-bold sm:px-5">#{o.id}</td>
                <td className="max-w-[8rem] truncate px-4 py-3 sm:px-5">{o.customer?.name || '—'}</td>
                <td className="max-w-[8rem] truncate px-4 py-3 sm:px-5">{o.restaurantName}</td>
                {!hideCourier && (
                  <td className="max-w-[8rem] truncate px-4 py-3 text-ink-500 sm:px-5">
                    {o.courierName || '—'}
                  </td>
                )}
                <td className="px-4 py-3 text-right font-bold sm:px-5">
                  {Number(o.totalDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD
                </td>
                {showGain && (
                  <td className="px-4 py-3 text-right font-bold sm:px-5">
                    {o.status === 'cancelled' ? (
                      <span className="text-ink-400">—</span>
                    ) : (
                      <span className="text-emerald-600">
                        +{gainValue(o).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD
                      </span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-1 items-start">
                    <StatusPill status={o.status} />
                    {showCancellation && o.status === 'cancelled' && o.cancelledPhase && (
                      <CancelPhaseBadge phase={o.cancelledPhase} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-5 py-12 text-center text-ink-400">
                  Aucune commande
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {orders.length === 0 ? (
          <div className="py-10 text-center text-ink-400">Aucune commande</div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-ink-200/40 bg-white/50 p-3 dark:border-ink-800/40 dark:bg-ink-950/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="break-anywhere font-bold">#{o.id}</div>
                  <div className="mt-0.5 truncate text-sm text-ink-500">{o.restaurantName}</div>
                </div>
                <StatusPill status={o.status} />
              </div>
              {showCancellation && o.status === 'cancelled' && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {o.cancelledPhase && <CancelPhaseBadge phase={o.cancelledPhase} />}
                  <OrderCancellationNote reason={o.cancellationReason} className="mt-0" />
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="min-w-0 rounded-lg bg-white/80 p-2 dark:bg-ink-900/80">
                  <div className="text-ink-400">Client</div>
                  <div className="truncate font-semibold">{o.customer?.name || '—'}</div>
                </div>
                {!hideCourier && (
                  <div className="min-w-0 rounded-lg bg-white/80 p-2 dark:bg-ink-900/80">
                    <div className="text-ink-400">Livreur</div>
                    <div className="truncate font-semibold">{o.courierName || '—'}</div>
                  </div>
                )}
                <div className="rounded-lg bg-brand-50/80 p-2 dark:bg-brand-900/20">
                  <div className="text-ink-400">Total</div>
                  <div className="font-bold text-brand-600">
                    {Number(o.totalDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD
                  </div>
                </div>
                {showGain && (
                  <div className="rounded-lg bg-emerald-50/80 p-2 dark:bg-emerald-900/20">
                    <div className="text-ink-400">{gainLabel}</div>
                    <div className="font-bold text-emerald-600">
                      {o.status === 'cancelled'
                        ? '—'
                        : `+${gainValue(o).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

import { CancelPhaseBadge, OrderCancellationNote } from '../components/ui/CancelOrderButton.jsx';

/* ─── formatOrderDateTime ─── */
export function formatOrderDateTime(ts) {
  if (!ts) return '—';
  try {
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(d.getTime())) return '—';
    const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  } catch {
    return '—';
  }
}

/* ─── DateRangeSelector ─── */
export function DateRangeSelector({ dateRange, setDateRange, startDate, setStartDate, endDate, setEndDate }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-wrap">
      <div className="inline-flex items-center rounded-2xl bg-ink-100/80 dark:bg-ink-800/80 p-1 border border-ink-200/60 dark:border-ink-700/60 shadow-xs backdrop-blur-sm">
        <button type="button" onClick={() => setDateRange('today')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${dateRange === 'today' ? 'bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-glow' : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'}`}>
          Aujourd&apos;hui
        </button>
        <button type="button" onClick={() => setDateRange('custom')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${dateRange === 'custom' ? 'bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-glow' : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'}`}>
          <span>📅 Plage de dates</span>
        </button>
        <button type="button" onClick={() => setDateRange('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${dateRange === 'all' ? 'bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-glow' : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'}`}>
          Tout
        </button>
      </div>
      {dateRange === 'custom' && (
        <div className="flex items-center gap-2 bg-white dark:bg-ink-900 p-1.5 rounded-2xl border border-ink-200/80 dark:border-ink-800 shadow-xs text-xs animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-ink-400 font-semibold text-[11px] pl-1">Du:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-2.5 py-1 text-xs text-ink-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-ink-400 font-semibold text-[11px]">Au:</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-2.5 py-1 text-xs text-ink-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer" />
          </div>
          {(startDate || endDate) && (
            <button type="button" onClick={() => { setStartDate(''); setEndDate(''); }}
              className="px-2 py-1 text-[11px] font-bold text-rose-500 hover:text-rose-600"
              title="Réinitialiser">✕ Effacer</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── StarRating ─── */
export function StarRating({ rating, count }) {
  const stars = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={`text-xs ${s <= stars ? 'text-amber-400' : 'text-ink-300 dark:text-ink-600'}`}>★</span>
        ))}
      </div>
      {rating != null && <span className="text-[11px] font-extrabold text-ink-900 dark:text-white">{Number(rating).toFixed(1)}</span>}
      {count !== undefined && count !== null && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-0.5">({count} avis)</span>}
    </div>
  );
}

/* ─── Horizontal Bar (percentage) ─── */
export function HorizontalBar({ value, max = 100, label, color = 'from-brand-500 to-pink-500', height = 8, showLabel = true }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      {showLabel && label && <span className="w-20 shrink-0 text-[11px] font-bold text-ink-500 truncate">{label}</span>}
      <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-[11px] font-bold text-ink-700 dark:text-ink-300">{value}</span>
    </div>
  );
}

/* ─── HorizontalBarChart (comparison set) ─── */
export function HorizontalBarChart({ data, color = 'from-brand-500 to-pink-500' }) {
  const maxVal = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <HorizontalBar key={i} value={d.value} max={maxVal} label={d.label} color={color} />
      ))}
    </div>
  );
}

/* ─── Mini Trend (sparkline) ─── */
export function MiniTrend({ data, color = '#f97316', height = 30 }) {
  const list = Array.isArray(data) && data.length ? data : [0];
  const max = Math.max(1, ...list.map((v) => Number(v) || 0));
  const w = 60;
  const denom = Math.max(1, list.length - 1);
  const points = list.map((v, i) => `${(i / denom) * w},${height - ((Number(v) || 0) / max) * (height - 4) - 2}`);
  const path = `M ${points.join(' L ')}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const [x, y] = p.split(',');
        return <circle key={i} cx={x} cy={y} r="1.2" fill={color} />;
      })}
    </svg>
  );
}

/* ─── Gauge Chart (circular) ─── */
export function GaugeChart({ value, max = 5, label = '', size = 100 }) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const color = pct > 0.8 ? '#10b981' : pct > 0.5 ? '#f97316' : '#ef4444';
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 50" className="w-full h-full" style={{ transform: 'rotate(0deg)' }}>
        <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 125.6} 125.6`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-1">
        <span className="font-display text-lg font-black" style={{ color }}>{typeof value === 'number' ? value.toFixed(1) : value}</span>
        {label && <span className="text-[9px] font-bold text-ink-400 mt-[-2px]">{label}</span>}
      </div>
    </div>
  );
}

/* ─── ComparisonBadge ─── */
export function ComparisonBadge({ current, previous, label = '', inverse = false }) {
  const pct = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
  const positive = inverse ? pct < 0 : pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${positive ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-600 bg-red-500/10'}`}>
      {positive ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

/* ─── KpiCard (enhanced StatCard with trend + comparison) ─── */
export function KpiCard({ label, value, sub, icon, color, trend, trendLabel, format }) {
  const display = format ? format(value) : typeof value === 'number' ? value.toLocaleString('fr-FR') : value;
  return (
    <GlassCard className="p-4 sm:p-5" glow={color}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">{label}</div>
          <div className="mt-0.5 font-display text-xl font-black tracking-tight text-ink-900 dark:text-white sm:text-2xl truncate">{display}</div>
          {sub && <div className="mt-0.5 text-[11px] text-ink-400">{sub}</div>}
          {trend !== undefined && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {trendLabel && <span className="text-[10px] text-ink-400">{trendLabel}</span>}
              <ComparisonBadge current={trend} previous={0} />
            </div>
          )}
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-glow ${color}`}>
          {icon}
        </span>
      </div>
    </GlassCard>
  );
}

/* ─── LegendRow (for donut/bar legends) ─── */
export function LegendRow({ items, colors = ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#eab308'] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
          <span className="text-ink-600 dark:text-ink-300 truncate max-w-[120px]">{item.label}</span>
          <span className="font-bold text-ink-900 dark:text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── InsightCard ─── */
export function InsightCard({ children, icon, color = 'border-l-brand-500' }) {
  return (
    <div className={`rounded-2xl border border-white/20 border-l-4 bg-white/70 px-4 py-3 text-sm shadow-card backdrop-blur-sm dark:border-white/5 dark:bg-ink-900/70 ${color}`}>
      <div className="flex items-start gap-2">
        {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
        <div className="text-ink-700 dark:text-ink-200">{children}</div>
      </div>
    </div>
  );
}

/* ─── DataRow ─── */
export function DataRow({ label, value, color = '' }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-ink-500 dark:text-ink-400">{label}</span>
      <span className={`font-bold text-right ${color || 'text-ink-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

/* ─── SectionDivider ─── */
export function SectionDivider() {
  return <div className="border-t border-ink-200/40 dark:border-ink-800/40 my-4" />;
}

/* ─── MetricGrid ─── */
export function MetricGrid({ children, cols = 4 }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${Math.min(cols, 4)} lg:grid-cols-${cols} gap-3`}>
      {children}
    </div>
  );
}

/* ─── TimeDistribution (hourly bars) ─── */
export function TimeDistribution({ data, label = 'Heure' }) {
  const max = Math.max(1, ...data.map((v) => v || 0));
  return (
    <div className="space-y-1">
      {data.map((v, i) => {
        const pct = max > 0 ? (v / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="w-6 text-right font-mono text-ink-400 shrink-0">{String(i).padStart(2, '0')}h</span>
            <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 text-right font-bold text-ink-600 dark:text-ink-300 shrink-0">{v || ''}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── DayComparison (weekday bars) ─── */
export function DayComparison({ data, labels, color1 = 'from-brand-500', color2 = 'to-pink-400' }) {
  const max = Math.max(1, ...data.map((v) => Number(v) || 0));
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((v, i) => {
        const pct = max > 0 ? (Number(v) / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex-1 flex flex-col justify-end">
              <div className={`w-full rounded-t-lg bg-gradient-to-t ${color1} ${color2} transition-all`} style={{ height: `${pct}%`, minHeight: v > 0 ? 8 : 0 }} />
            </div>
            <span className="text-[9px] text-ink-400 font-medium">{labels?.[i] || ''}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── FunnelStep ─── */
export function FunnelStep({ label, value, pct, color = 'from-brand-500 to-pink-500' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm`}>
        {pct}%
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-ink-900 dark:text-white">{value.toLocaleString('fr-FR')}</div>
        <div className="text-[11px] text-ink-400 truncate">{label}</div>
      </div>
    </div>
  );
}
