'use client';

import React from 'react';
import { I } from '../../icons/Icons.jsx';
import { ORDER_STATES, CLIENT_TRACK_STEPS } from '../../data/orderConstants.js';

const STEP_META = {
  placed:           { label: 'Confirmée',  icon: I.Check,  emoji: '✓' },
  pickup_confirmed: { label: 'Vers resto', icon: I.Bike,   emoji: '🛵' },
  delivering:       { label: 'En route',   icon: I.MapPin, emoji: '📦' },
  delivered:        { label: 'Livré',      icon: I.Star,   emoji: '✅' },
};

function resolveTimeline(status) {
  if (status === 'preparing') {
    return { currentIdx: 1, messageKey: 'preparing' };
  }
  const idx = CLIENT_TRACK_STEPS.indexOf(status);
  return { currentIdx: idx >= 0 ? idx : 0, messageKey: status };
}

/** Pastille simple (legacy) */
export function Step({ active, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`w-2 h-2 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-ink-300 dark:bg-ink-700'}`} />
      <span className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400'}>{label}</span>
    </div>
  );
}

/** Timeline de suivi commande (4 étapes client) */
export function OrderTrackingTimeline({ status = 'placed' }) {
  const { currentIdx, messageKey } = resolveTimeline(status);
  const activeMsg = ORDER_STATES[messageKey] || ORDER_STATES.placed;

  return (
    <div className="w-full">
      {/* Mobile */}
      <ol className="space-y-0 sm:hidden">
        {CLIENT_TRACK_STEPS.map((key, i) => {
          const meta = STEP_META[key];
          const st = ORDER_STATES[key];
          const done = i < currentIdx;
          const current = i === currentIdx;
          const pending = i > currentIdx;
          const Icon = meta.icon;
          const label = current && messageKey === 'preparing' ? activeMsg.label : st.label;
          const clientMsg = current ? activeMsg.clientMsg : null;

          return (
            <li key={key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-11 h-11 rounded-2xl grid place-items-center shrink-0 transition-all duration-500 ${
                    current
                      ? 'bg-gradient-to-br from-brand-500 to-pink-500 text-white shadow-glow scale-105'
                      : done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-ink-100 dark:bg-ink-800 text-ink-400'
                  }`}
                >
                  {done && !current ? <I.Check size={18} stroke={2.5} /> : <Icon size={18} stroke={current ? 2.5 : 2} />}
                </div>
                {i < CLIENT_TRACK_STEPS.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[20px] my-1 transition-colors ${
                      i < currentIdx ? 'bg-emerald-400' : 'bg-ink-200 dark:bg-ink-700'
                    }`}
                  />
                )}
              </div>
              <div className={`pb-5 pt-1.5 flex-1 min-w-0 ${pending ? 'opacity-[0.45]' : ''}`}>
                <div className={`text-sm font-bold ${current ? 'text-brand-600 dark:text-brand-400' : done ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink-500'}`}>
                  {label}
                </div>
                {current && clientMsg && (
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">{clientMsg}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="relative flex items-start justify-between">
          <div className="absolute top-6 left-[10%] right-[10%] h-1 rounded-full bg-ink-100 dark:bg-ink-800" aria-hidden />
          <div
            className="absolute top-6 left-[10%] h-1 rounded-full bg-gradient-to-r from-brand-500 via-pink-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(0, (currentIdx / (CLIENT_TRACK_STEPS.length - 1)) * 80)}%` }}
            aria-hidden
          />

          {CLIENT_TRACK_STEPS.map((key, i) => {
            const meta = STEP_META[key];
            const st = ORDER_STATES[key];
            const done = i < currentIdx;
            const current = i === currentIdx;
            const pending = i > currentIdx;
            const Icon = meta.icon;

            return (
              <div key={key} className={`relative z-10 flex flex-col items-center flex-1 px-0.5 ${pending ? 'opacity-40' : ''}`}>
                <div
                  className={`w-12 h-12 rounded-2xl grid place-items-center transition-all duration-500 ${
                    current
                      ? 'bg-gradient-to-br from-brand-500 to-pink-500 text-white shadow-glow ring-4 ring-brand-500/25'
                      : done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-ink-900 text-ink-400 border-2 border-ink-200 dark:border-ink-700'
                  }`}
                >
                  {done && !current ? <I.Check size={20} stroke={2.5} /> : <Icon size={20} stroke={current ? 2.5 : 2} />}
                </div>
                <span
                  className={`mt-2.5 text-[11px] font-bold text-center leading-tight max-w-[4.5rem] ${
                    current
                      ? 'text-brand-600 dark:text-brand-400'
                      : done
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-ink-400'
                  }`}
                >
                  {meta.label}
                </span>
                {current && (
                  <span className="mt-1 text-[10px] text-center text-ink-500 dark:text-ink-400 leading-snug max-w-[5.5rem] hidden lg:block">
                    {activeMsg.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const BADGE_STYLES = {
  placed:           'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/25',
  pickup_confirmed: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 ring-sky-500/25',
  preparing:        'bg-violet-500/15 text-violet-700 dark:text-violet-400 ring-violet-500/25',
  delivering:       'bg-pink-500/15 text-pink-700 dark:text-pink-400 ring-pink-500/25',
  delivered:        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/25',
  cancelled:        'bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/25',
};

export function OrderStatusBadge({ status }) {
  const st = ORDER_STATES[status] || ORDER_STATES.placed;
  const live = status !== 'delivered' && status !== 'cancelled';
  const badgeStyle = BADGE_STYLES[status] || BADGE_STYLES.placed;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ${
        live ? badgeStyle : 'bg-ink-100 dark:bg-ink-800 text-ink-600 ring-ink-200/50'
      }`}
    >
      {live && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {st.label}
    </span>
  );
}
