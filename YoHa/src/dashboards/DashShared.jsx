import React, { useState } from 'react';
import { I } from '../icons/Icons.jsx';
import { Logo } from '../components/layout/Logo.jsx';
import { ORDER_STATES } from '../data/index.js';
import { spotlightHandler } from '../utils/spotlight.js';
import gerantPhoto from '../../gerant.jpg';

export function DashLink({ icon, title, sub, color, onClick }) {
  return (
    <button onClick={onClick} className="cursor-grow w-full flex items-center gap-3 p-3 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition text-left">
      <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white grid place-items-center shadow-md shrink-0`}>{icon}</span>
      <div className="min-w-0">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-ink-500 truncate">{sub}</div>
      </div>
      <I.Right size={14} className="ml-auto text-ink-400"/>
    </button>
  );
}

/* === Shared dashboard layout with sidebar === */
export function DashLayout({ kind, current, setCurrent, goto, dark, setDark, children, title, subtitle }) {
  const links = {
    admin: [
      { id:'overview',    label:'Tableau de bord', icon:<I.Sparkle size={18}/> },
      { id:'orders',      label:'Commandes',       icon:<I.Bag size={18}/> },
      { id:'restaurants', label:'Restaurants',     icon:<I.Chef size={18}/> },
      { id:'revenue',     label:'Revenus',         icon:<I.Star size={18}/> },
    ],
    delivery: [
      { id:'available',  label:'Disponibles',  icon:<I.Bell size={18}/> },
      { id:'mine',       label:'Mes courses',  icon:<I.Bike size={18}/> },
      { id:'history',    label:'Historique',   icon:<I.Clock size={18}/> },
    ],
    restaurant: [
      { id:'incoming',   label:'Commandes',    icon:<I.Bell size={18}/> },
      { id:'menu',       label:'Mon menu',     icon:<I.Chef size={18}/> },
      { id:'stats',      label:'Statistiques', icon:<I.Sparkle size={18}/> },
    ],
  }[kind];

  const accent = {
    admin:      { from:'from-brand-500',  to:'to-pink-500',     name:'Admin · Manager',  emoji:'✨' },
    delivery:   { from:'from-violet-500', to:'to-fuchsia-500',  name:'Livreur',          emoji:'🚴' },
    restaurant: { from:'from-sky-500',    to:'to-indigo-500',   name:'Restaurant',       emoji:'🍽️' },
  }[kind];

  const [open, setOpen] = useState(false);

  return (
    <div className="page-enter min-h-screen flex bg-ink-50 dark:bg-ink-950">
      {/* SIDEBAR */}
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-72 bg-white dark:bg-ink-900 border-r border-ink-200/60 dark:border-ink-800 transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-ink-200/60 dark:border-ink-800">
          <button onClick={() => goto('landing')} className="cursor-grow flex items-center gap-2 group">
            <Logo/>
            <span className="font-display font-extrabold text-lg">YoHa</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r ${accent.from} ${accent.to} text-white`}>{accent.emoji} {accent.name}</span>
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map(l => (
            <button key={l.id} onClick={() => { setCurrent(l.id); setOpen(false); }}
              className={`cursor-grow w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${current === l.id
                ? `bg-gradient-to-r ${accent.from} ${accent.to} text-white shadow-md`
                : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'}`}>
              {l.icon} {l.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-3 inset-x-3 space-y-1">
          <button onClick={() => setDark(d => !d)} className="cursor-grow w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800">
            {dark ? <I.Sun size={18}/> : <I.Moon size={18}/>} {dark ? 'Mode clair' : 'Mode sombre'}
          </button>
          <button onClick={() => goto('landing')} className="cursor-grow w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800">
            <I.Left size={18}/> Retour à YoHa
          </button>
        </div>
      </aside>

      {/* Backdrop mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)}/>}

      {/* MAIN */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 glass-strong border-b border-ink-200/60 dark:border-ink-800 h-16 flex items-center px-4 sm:px-6 gap-3">
          <button onClick={() => setOpen(true)} className="cursor-grow lg:hidden w-9 h-9 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 grid place-items-center">
            <I.Sparkle size={20}/>
          </button>
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-lg sm:text-xl truncate">{title}</h1>
            {subtitle && <div className="text-xs text-ink-500 truncate">{subtitle}</div>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Synchronisé en direct
            </span>
            <img
              src={kind === 'admin' ? gerantPhoto : 'https://i.pravatar.cc/64?img=11'}
              alt=""
              className="w-9 h-9 rounded-xl object-cover border-2 border-white dark:border-ink-800"
            />
          </div>
        </header>

        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/* === SVG Charts === */
export function LineChart({ data, height=180, color='#f97316', color2='#ec4899' }) {
  const list = Array.isArray(data) && data.length ? data : [0];
  const max = Math.max(1, ...list.map((v) => Number(v) || 0));
  const w = 100;
  const denom = Math.max(1, list.length - 1);
  const points = list.map((v, i) => `${(i / denom) * w},${100 - ((Number(v) || 0) / max) * 90 - 5}`);
  const path = `M ${points.join(' L ')}`;
  const area = `M 0,100 L ${points.join(' L ')} L ${w},100 Z`;
  const id = 'chart-' + Math.random().toString(36).slice(2);
  return (
    <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" style={{ height, width:'100%' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.45"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={id+'-l'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={color}/>
          <stop offset="100%" stopColor={color2}/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`}/>
      <path d={path} fill="none" stroke={`url(#${id}-l)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      {points.map((p, i) => {
        const [x, y] = p.split(',');
        return <circle key={i} cx={x} cy={y} r="1.4" fill="white" stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke"/>;
      })}
    </svg>
  );
}

export function BarChart({ data, labels, color1='from-violet-500', color2='to-fuchsia-400' }) {
  const list = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...list.map((v) => Number(v) || 0));
  return (
    <div className="flex gap-2 h-48 w-full min-w-0">
      {list.map((raw, i) => {
        const v = Number(raw) || 0;
        const pct = max > 0 ? (v / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col min-w-0 h-full">
            <div className="flex-1 flex flex-col justify-end min-h-[7rem]">
              <div
                title={`${v}`}
                className={`w-full rounded-t-xl bg-gradient-to-t ${color1} ${color2} shadow-md transition-all hover:opacity-90`}
                style={{ height: `${pct}%`, minHeight: v > 0 ? 10 : 2 }}
              />
            </div>
            <div className="shrink-0 pt-2 text-[10px] text-ink-500 dark:text-ink-400 text-center truncate" title={labels?.[i]}>
              {labels?.[i] ?? '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ data, colors, size=180 }) {
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
    <div className="relative shrink-0 select-none" style={{ width: size, height: size }}>
      <div className="h-full w-full rounded-full shadow-inner ring-1 ring-ink-200/30 dark:ring-ink-700/40" style={{ background: bg }} />
      <div
        className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-ink-900 shadow-sm ring-1 ring-ink-200/60 dark:ring-ink-700/60"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display font-black text-2xl text-ink-900 dark:text-white">{total}</div>
          <div className="text-xs text-ink-500">Total</div>
        </div>
      </div>
    </div>
  );
}

/* === Stat Card === */
export function StatCard({ label, value, sub, icon, color='from-brand-500 to-pink-500', trend }) {
  return (
    <div className="relative p-5 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card overflow-hidden spotlight"
      onMouseMove={spotlightHandler}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl`}></div>
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</div>
          <div className="mt-1 font-display font-black text-2xl sm:text-3xl">{value}</div>
          {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
        </div>
        <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white grid place-items-center shadow-md shrink-0`}>{icon}</span>
      </div>
      {trend !== undefined && (
        <div className={`relative mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

/* === Status Pill === */
export function StatusPill({ status }) {
  const s = ORDER_STATES[status] || { label:status, color:'bg-ink-500', text:'text-ink-700' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-opacity-10 ${s.text}`} style={{ backgroundColor: 'rgb(' + (s.color.includes('amber') ? '254 243 199' : s.color.includes('sky') ? '224 242 254' : s.color.includes('violet') ? '237 233 254' : s.color.includes('emerald') ? '209 250 229' : s.color.includes('pink') ? '252 231 243' : '241 245 249') + ')' }}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.color}`}></span>
      {s.label}
    </span>
  );
}
