'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { I } from '@/icons/Icons.jsx';
import { MenuItemImage } from './MenuItemImage.jsx';
import { formatMad } from '@/data/index.js';
import { rippleEffect } from '@/utils/ripple.js';
import { useCart } from '@/contexts/AppContexts.jsx';

const CATEGORY_GLOW = {
  pizza: 'from-orange-500/10 to-amber-500/10',
  tacos: 'from-amber-600/10 to-yellow-500/10',
  kebab: 'from-red-600/10 to-orange-500/10',
  healthy: 'from-emerald-500/10 to-teal-500/10',
  burger: 'from-amber-500/10 to-yellow-500/10',
  sushi: 'from-pink-500/10 to-rose-500/10',
  asian: 'from-purple-500/10 to-indigo-500/10',
  medical: 'from-sky-500/10 to-indigo-500/10',
  dessert: 'from-pink-500/10 to-rose-500/10',
  pharmacy: 'from-emerald-500/10 to-teal-500/10',
  drinks: 'from-cyan-500/10 to-blue-500/10',
};

export function MenuItemDetailModal({ item, restaurant, onClose, onAdd, orderingDisabled = false }) {
  const { cart, setQty } = useCart();
  const cartItem = cart?.find((p) => p.id === item.id);
  const quantity = cartItem?.qty || 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAdd = (e) => {
    if (orderingDisabled) return;
    onAdd?.(item, restaurant, e.currentTarget);
    rippleEffect(e);
  };

  const glowClass = CATEGORY_GLOW[restaurant?.cuisine] || 'from-brand-500/10 to-orange-500/10';
  const detailText = item.ingredients?.trim() || item.desc?.trim();

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-950/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-item-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-y-auto bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scale-in border border-ink-200/60 dark:border-ink-800"
      >
        {/* Ambient background glow */}
        <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br ${glowClass} opacity-60 blur-3xl pointer-events-none -z-10`} />
        
        {/* Hero Image */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-ink-50 dark:bg-ink-950">
          <MenuItemImage
            src={item.img}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="cursor-grow absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white grid place-items-center hover:bg-brand-500 hover:scale-110 active:scale-95 transition-all duration-300 shadow-md"
            aria-label="Fermer"
          >
            <I.X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h2 id="menu-item-detail-title" className="font-display font-black text-2xl sm:text-3xl leading-tight text-ink-900 dark:text-white">
              {item.name}
            </h2>
            {item.desc && (
              <p className="mt-2 text-sm text-brand-600 dark:text-brand-400 font-semibold leading-relaxed">{item.desc}</p>
            )}
          </div>

          {/* Description / Ingredients Card */}
          {item.ingredients?.trim() && (
            <div className="bg-ink-50 dark:bg-ink-950 p-4 rounded-2xl border border-ink-100 dark:border-ink-800/80">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-ink-500 mb-2">
                Ingrédients & Préparation
              </h3>
              <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                {item.ingredients}
              </p>
            </div>
          )}

          {!detailText && (
            <p className="text-sm text-ink-400 italic">
              Le restaurant n&apos;a pas encore ajouté la description de ce plat.
            </p>
          )}

          {/* Pricing and Cart Actions */}
          <div className="pt-5 border-t border-ink-150 dark:border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink-400">Prix unitaire</span>
              <span className="font-display font-black text-2xl text-ink-900 dark:text-white mt-0.5">{formatMad(item.price)}</span>
            </div>

            <div className="flex-1 sm:max-w-[280px]">
              {orderingDisabled ? (
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold bg-ink-100 text-ink-400 dark:bg-ink-850 dark:text-ink-500 cursor-not-allowed border border-ink-200/40 dark:border-ink-800"
                >
                  Restaurant fermé
                </button>
              ) : quantity === 0 ? (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="cursor-grow ripple w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white shadow-glow hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  <I.Plus size={16} stroke={3} />
                  <span>Ajouter au panier</span>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-ink-50 dark:bg-ink-950 p-1.5 rounded-xl border border-ink-200/50 dark:border-ink-800">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, quantity - 1)}
                    className="cursor-grow w-9 h-9 rounded-lg bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 text-ink-600 dark:text-ink-400 font-black text-base grid place-items-center hover:scale-105 active:scale-95 shadow-sm transition-all"
                  >
                    -
                  </button>
                  <span className="font-display font-black text-sm text-ink-900 dark:text-white px-2 select-none">
                    {quantity} dans le panier
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, quantity + 1)}
                    className="cursor-grow w-9 h-9 rounded-lg bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 text-ink-600 dark:text-ink-400 font-black text-base grid place-items-center hover:scale-105 active:scale-95 shadow-sm transition-all"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
