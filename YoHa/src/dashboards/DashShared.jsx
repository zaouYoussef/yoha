'use client';

import React, { useState } from 'react';
import { I } from '../icons/Icons.jsx';
import { Logo } from '../components/layout/Logo.jsx';
import { ORDER_STATES } from '../data/index.js';
import { spotlightHandler } from '../utils/spotlight.js';

const gerantPhoto = 'https://i.pravatar.cc/120?img=33';

const DASH_LINKS = {
  admin: [
    { id: 'overview', label: 'Tableau de bord', icon: <I.Sparkle size={18} /> },
    { id: 'orders', label: 'Commandes', icon: <I.Bag size={18} /> },
    { id: 'restaurants', label: 'Restaurants', icon: <I.Chef size={18} /> },
    { id: 'couriers', label: 'Livreurs', icon: <I.Bike size={18} /> },
    { id: 'revenue', label: 'Revenus', icon: <I.Star size={18} /> },
    { id: 'promos', label: 'Codes promo', icon: <I.Zap size={18} /> },
  ],
  delivery: [
    { id: 'available', label: 'Disponibles', icon: <I.Bell size={18} /> },
    { id: 'mine', label: 'Mes courses', icon: <I.Bike size={18} /> },
    { id: 'history', label: 'Historique', icon: <I.Clock size={18} /> },
  ],
  restaurant: [
    { id: 'incoming', label: 'Commandes', icon: <I.Bell size={18} /> },
    { id: 'profile', label: 'Établissement', icon: <I.Chef size={18} /> },
    { id: 'menu', label: 'Mon menu', icon: <I.Bag size={18} /> },
    { id: 'stats', label: 'Statistiques', icon: <I.Sparkle size={18} /> },
  ],
};

const DASH_ACCENT = {
  admin: { from: 'from-brand-500', to: 'to-pink-500', name: 'Admin · Manager', emoji: '✨' },
  delivery: { from: 'from-violet-500', to: 'to-fuchsia-500', name: 'Livreur', emoji: '🚴' },
  restaurant: { from: 'from-sky-500', to: 'to-indigo-500', name: 'Restaurant', emoji: '🍽️' },
};

function pillBg(color) {
  if (color.includes('amber')) return 'rgb(254 243 199)';
  if (color.includes('sky')) return 'rgb(224 242 254)';
  if (color.includes('violet')) return 'rgb(237 233 254)';
  if (color.includes('emerald')) return 'rgb(209 250 229)';
  if (color.includes('pink')) return 'rgb(252 231 243)';
  return 'rgb(241 245 249)';
}

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
      className="dash-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/60 bg-white/95 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/95 lg:hidden pb-[env(safe-area-inset-bottom,0px)]"
    >
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
            <span className="shrink-0 scale-90 sm:scale-100">{l.icon}</span>
            <span className="w-full truncate text-center text-[9px] font-bold leading-tight sm:text-[10px]">
              {l.label}
            </span>
            {current === l.id && (
              <span
                className={`absolute bottom-[calc(env(safe-area-inset-bottom,0px)+2px)] h-0.5 w-8 rounded-full bg-gradient-to-r ${accent.from} ${accent.to}`}
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

  const pickTab = (id) => {
    setCurrent(id);
    setOpen(false);
  };

  return (
    <div className="page-enter flex min-h-screen min-h-[100dvh] overflow-x-hidden bg-ink-50 dark:bg-ink-950">
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col border-r border-ink-200/60 bg-white transition-transform duration-300 dark:border-ink-800/60 dark:bg-ink-900 lg:static lg:z-auto lg:w-72 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-ink-200/60 px-4 dark:border-ink-800 sm:px-5">
          <button
            type="button"
            onClick={() => goto('landing')}
            className="group flex min-w-0 cursor-grow items-center gap-2"
          >
            <Logo />
            <span className="truncate font-display text-lg font-extrabold">YoHa</span>
            <span
              className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r sm:inline ${accent.from} ${accent.to}`}
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
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4 lg:pb-4">
          {links.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => pickTab(l.id)}
              className={`flex w-full min-w-0 cursor-grow items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition sm:px-4 sm:py-3 ${
                current === l.id
                  ? `bg-gradient-to-r text-white shadow-md ${accent.from} ${accent.to}`
                  : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
              }`}
            >
              <span className="shrink-0">{l.icon}</span>
              <span className="truncate">{l.label}</span>
            </button>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-ink-100 p-3 dark:border-ink-800 sm:p-4">
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="flex w-full cursor-grow items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            {dark ? <I.Sun size={18} /> : <I.Moon size={18} />}
            {dark ? 'Mode clair' : 'Mode sombre'}
          </button>
          <button
            type="button"
            onClick={() => goto('landing')}
            className="flex w-full cursor-grow items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <I.Left size={18} /> Retour à YoHa
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-ink-200/60 bg-white/90 px-3 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/90 sm:h-16 sm:gap-3 sm:px-5">
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 shrink-0 cursor-grow place-items-center rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"
          >
            <I.Sparkle size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base font-extrabold sm:text-xl">{title}</h1>
            {subtitle && (
              <div className="truncate text-[11px] text-ink-500 sm:text-xs">{subtitle}</div>
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
              title="Synchronisé en direct"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 sm:h-2 sm:w-2" />
              <span className="hidden sm:inline">Synchronisé en direct</span>
              <span className="sm:hidden">Live</span>
            </span>
            {kind === 'admin' && (
              <img
                src={gerantPhoto}
                alt=""
                className="h-8 w-8 rounded-xl border-2 border-white object-cover dark:border-ink-800 sm:h-9 sm:w-9"
              />
            )}
          </div>
        </header>

        <div className="min-w-0 flex-1 overflow-x-hidden p-3 pb-safe-nav sm:p-5 sm:pb-safe-nav lg:pb-5">
          {children}
        </div>
      </div>

      <DashMobileTabBar links={links} current={current} setCurrent={pickTab} accent={accent} />
    </div>
  );
}

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

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'from-brand-500 to-pink-500',
  trend,
}) {
  return (
    <div
      className="spotlight relative min-w-0 overflow-hidden rounded-2xl border border-ink-200/60 bg-white p-4 shadow-card dark:border-ink-800 dark:bg-ink-900 sm:p-5"
      onMouseMove={spotlightHandler}
    >
      <div
        className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl ${color}`}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold uppercase tracking-wider text-ink-500">
            {label}
          </div>
          <div className="mt-1 break-words font-display text-xl font-black sm:text-2xl md:text-3xl">
            {value}
          </div>
          {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
        </div>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md sm:h-10 sm:w-10 ${color}`}
        >
          {icon}
        </span>
      </div>
      {trend !== undefined && (
        <div
          className={`relative mt-3 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
            trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
          }`}
        >
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

export function StatusPill({ status, className = '' }) {
  const s = ORDER_STATES[status] || { label: status, color: 'bg-ink-500', text: 'text-ink-700' };

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px] ${s.text} ${className}`}
      style={{ backgroundColor: pillBg(s.color) }}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2 ${s.color}`} />
      <span className="truncate">{s.label}</span>
    </span>
  );
}
