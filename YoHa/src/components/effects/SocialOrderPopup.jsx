import React, { useState, useEffect, useCallback, useRef } from 'react';
import { I } from '../../icons/Icons.jsx';

const FIRST_NAMES = [
  'Nouha',
  'Sarah',
  'Yassine',
  'Driss',
  'Lina',
  'Anas',
  'Imane',
  'Mehdi',
  'Salma',
  'Omar',
  'Yasmine',
  'Karim',
];

const MINUTES_OPTIONS = [2, 3, 5, 7, 8, 10, 12, 14, 15, 22, 25, 26];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Popups type « X a commandé il y a Y min » — visibles 5 s puis fermeture auto.
 * Intervalle aléatoire entre deux apparitions (~12–22 s).
 */
export function SocialOrderPopup({ visible }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState({ name: 'Nouha', minutes: 10 });
  const hideTimerRef = useRef(null);

  const flashOnce = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    setPayload({
      name: pickRandom(FIRST_NAMES),
      minutes: pickRandom(MINUTES_OPTIONS),
    });
    setOpen(true);
    hideTimerRef.current = window.setTimeout(() => setOpen(false), 5000);
  }, []);

  useEffect(() => {
    if (!visible) {
      setOpen(false);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      return;
    }

    const firstDelay = 3500 + Math.floor(Math.random() * 2500);
    const tFirst = window.setTimeout(flashOnce, firstDelay);
    const gap = 12000 + Math.floor(Math.random() * 10000);
    const loop = window.setInterval(flashOnce, gap);

    return () => {
      window.clearTimeout(tFirst);
      window.clearInterval(loop);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [visible, flashOnce]);

  if (!visible) return null;

  return (
    <div
      className={`social-order-popup fixed z-[35] max-sm:left-4 max-sm:right-4 max-sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:left-6 sm:bottom-6 md:w-[min(360px,calc(100vw-3rem))] pointer-events-none transition-all duration-300 ease-out ${
        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
      aria-live="polite"
      aria-hidden={!open}
    >
      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 shadow-cardhover px-4 py-3 flex items-start gap-3">
        <span className="mt-0.5 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-pink-500 text-white grid place-items-center shrink-0 shadow-md">
          <I.Bag size={18} stroke={2.2} />
        </span>
        <div className="min-w-0 pt-0.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Nouvelle commande
          </div>
          <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-50 leading-snug">
            <span className="text-gradient font-display">{payload.name}</span>
            {' '}a commandé il y a{' '}
            <span className="font-bold tabular-nums">{payload.minutes}</span> min
          </p>
        </div>
      </div>
    </div>
  );
}
