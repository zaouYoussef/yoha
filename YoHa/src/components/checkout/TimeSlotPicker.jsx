'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';

function generateSlots() {
  const cutoff = new Date(Date.now() + 45 * 60 * 1000);
  const roundM = cutoff.getMinutes() <= 30 ? 30 : 0;
  const roundH = cutoff.getMinutes() <= 30 ? cutoff.getHours() : cutoff.getHours() + 1;
  const ref = new Date(cutoff);
  ref.setHours(roundH, roundM, 0, 0);

  const slots = [];
  for (let i = 0; i < 48; i++) {
    const start = new Date(ref.getTime() + i * 30 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const sh = String(start.getHours()).padStart(2, '0');
    const sm = String(start.getMinutes()).padStart(2, '0');
    const eh = String(end.getHours()).padStart(2, '0');
    const em = String(end.getMinutes()).padStart(2, '0');
    slots.push({ range: `${sh}:${sm} → ${eh}:${em}`, iso: start.toISOString() });
  }
  return slots;
}

export function TimeSlotPicker({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const allSlots = useMemo(() => generateSlots(), []);
  const dropdownRef = useRef(null);
  const isScheduled = !!selected;

  const selectedRange = useMemo(() => {
    if (!isScheduled) return '';
    const s = allSlots.find((s) => s.iso === selected);
    return s ? s.range : '';
  }, [selected, isScheduled, allSlots]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="flex gap-2 items-stretch">
      <button
        type="button"
        onClick={() => onSelect('')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full border-2 font-semibold text-sm transition-all ${
          !isScheduled
            ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 shadow-sm'
            : 'border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 hover:border-brand-300'
        }`}
      >
        <span>⚡</span> ASAP
        {!isScheduled && <span className="w-2 h-2 rounded-full bg-brand-500" />}
      </button>

      <div ref={dropdownRef} className="flex-1 relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full border-2 font-semibold text-sm transition-all ${
            isScheduled
              ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 shadow-sm'
              : 'border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 hover:border-brand-300'
          }`}
        >
          <span>🕐</span>
          {isScheduled ? selectedRange : 'Planifier'}
          {isScheduled ? (
            <span className="w-2 h-2 rounded-full bg-brand-500" />
          ) : (
            <svg className={`w-3.5 h-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute z-50 mt-2 left-0 right-0 w-full rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-gradient-to-r from-brand-500/5 via-pink-500/5 to-transparent px-5 py-3 border-b border-ink-100 dark:border-ink-800 text-center">
              <p className="font-display font-bold text-sm text-ink-900 dark:text-white">Choisissez votre plage</p>
              <p className="text-[11px] text-ink-500 dark:text-ink-400">Tranches de 30 min disponibles</p>
            </div>
            <div className="max-h-56 overflow-y-auto p-2 space-y-1">
              {allSlots.map((s) => {
                const active = selected === s.iso;
                return (
                  <button
                    key={s.iso}
                    type="button"
                    onClick={() => { onSelect(s.iso); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      active
                        ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-400'
                        : 'hover:bg-ink-50 dark:hover:bg-ink-800 border border-transparent'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-brand-500' : 'border-ink-300'}`}>
                      {active && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                    </div>
                    <span className={`font-bold text-sm flex-1 ${active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-800 dark:text-ink-200'}`}>
                      {s.range}
                    </span>
                    <span className="text-[11px] font-medium text-ink-400 dark:text-ink-500">30 min</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
