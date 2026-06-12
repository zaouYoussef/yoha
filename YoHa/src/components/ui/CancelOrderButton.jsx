'use client';

import React, { useState } from 'react';
import { I } from '../../icons/Icons.jsx';
import { CANCEL_PHASES } from '../../data/orderConstants.js';
import { Button } from './Button.jsx';

export function CancelPhaseBadge({ phase, className = '' }) {
  const meta = CANCEL_PHASES[phase];
  if (!meta) return null;
  const isAfter = phase === 'after_pickup';

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isAfter
          ? 'bg-red-500/10 text-red-700 dark:text-red-400'
          : 'bg-orange-500/10 text-orange-800 dark:text-orange-300'
      } ${className}`}
      title={meta.hint}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isAfter ? 'bg-red-500' : 'bg-orange-500'}`} />
      <span className="truncate">{meta.short}</span>
    </span>
  );
}

export function OrderCancellationNote({ reason, className = '' }) {
  const text = reason?.trim();
  if (!text) return null;
  return (
    <p className={`text-xs text-ink-500 italic leading-relaxed ${className}`}>
      Motif : {text}
    </p>
  );
}

export function CancelOrderButton({
  phase,
  onCancel,
  label,
  variant = 'ghost',
  size = 'sm',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const meta = CANCEL_PHASES[phase];

  if (!meta) return null;

  const defaultLabel = phase === 'after_pickup'
    ? 'Client injoignable — annuler'
    : 'Annuler la commande';

  const submit = async () => {
    setBusy(true);
    try {
      await onCancel(reason.trim());
      setOpen(false);
      setReason('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={`w-full justify-center text-red-600 hover:text-red-700 dark:text-red-400 ${className}`}
        onClick={() => setOpen(true)}
      >
        <I.X size={14} />
        {label || defaultLabel}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !busy && setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border border-ink-200/60 dark:border-ink-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-lg">{meta.label}</h3>
            <p className="mt-1 text-sm text-ink-500">{meta.hint}</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={
                phase === 'after_pickup'
                  ? 'Ex. client ne répond pas à la porte…'
                  : 'Ex. rupture de stock, restaurant fermé…'
              }
              className="mt-4 w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm resize-none"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
                Retour
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                className="bg-red-600 hover:bg-red-700 border-red-600"
                onClick={submit}
              >
                {busy ? '…' : 'Confirmer l\'annulation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
