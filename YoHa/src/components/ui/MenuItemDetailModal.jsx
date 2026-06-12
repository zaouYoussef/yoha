'use client';

import React, { useEffect } from 'react';
import { I } from '../../icons/Icons.jsx';
import { MenuItemImage } from './MenuItemImage.jsx';
import { formatMad } from '../../data/index.js';
import { rippleEffect } from '../../utils/ripple.js';

export function MenuItemDetailModal({ item, restaurant, onClose, onAdd, orderingDisabled = false }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleAdd = (e) => {
    if (orderingDisabled) return;
    onAdd?.(item, restaurant);
    rippleEffect(e);
    onClose();
  };

  const detailText = item.ingredients?.trim() || item.desc?.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-item-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92vh] sm:max-h-[88vh] overflow-y-auto bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-3xl shadow-cardhover animate-scale-in border border-ink-200/60 dark:border-ink-800"
      >
        <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
          <MenuItemImage
            src={item.img}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          <button
            type="button"
            onClick={onClose}
            className="cursor-grow absolute top-3 right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white grid place-items-center hover:bg-black/55 transition"
            aria-label="Fermer"
          >
            <I.X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 id="menu-item-detail-title" className="font-display font-extrabold text-2xl leading-tight">
              {item.name}
            </h2>
            {item.desc && (
              <p className="mt-1 text-sm text-brand-600 dark:text-brand-400 font-medium">{item.desc}</p>
            )}
          </div>

          {detailText && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
                {item.ingredients?.trim() ? 'Ingrédients' : 'Description'}
              </h3>
              <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                {detailText}
              </p>
            </div>
          )}

          {!detailText && (
            <p className="text-sm text-ink-400 italic">
              Le restaurant n&apos;a pas encore ajouté la description de ce plat.
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-ink-200/60 dark:border-ink-800">
            <div className="font-display font-extrabold text-2xl">{formatMad(item.price)}</div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={orderingDisabled}
              className={`cursor-grow ripple flex-1 max-w-[220px] inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl font-semibold transition-transform ${
                orderingDisabled
                  ? 'bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-400 cursor-not-allowed'
                  : 'bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:scale-[1.02] active:scale-95'
              }`}
            >
              <I.Plus size={18} stroke={2.5} />
              {orderingDisabled ? 'Fermé' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
