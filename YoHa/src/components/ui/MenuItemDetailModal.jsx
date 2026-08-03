'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { I } from '@/icons/Icons.jsx';
import { MenuItemImage } from './MenuItemImage.jsx';
import { formatMad } from '@/data/index.js';

import { useCart } from '@/contexts/AppContexts.jsx';

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
  };

  const detailText = item.ingredients?.trim() || item.desc?.trim();

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-item-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-y-auto bg-[#12100e] rounded-t-[28px] sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-scale-in ring-1 ring-white/10"
      >
        <div className="relative aspect-[16/11] sm:aspect-[16/10] overflow-hidden bg-[#1a1513]">
          <MenuItemImage
            src={item.img}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12100e] via-transparent to-black/30" />

          <div className="absolute top-3 inset-x-0 flex justify-center sm:hidden">
            <span className="w-10 h-1 rounded-full bg-white/25" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-grow absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white grid place-items-center active:scale-95 transition-transform shadow-md ring-1 ring-white/15"
            aria-label="Fermer"
          >
            <I.X size={18} />
          </button>
        </div>

        <div className="px-5 pb-7 pt-1 space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-400">
              {restaurant?.name}
            </p>
            <h2
              id="menu-item-detail-title"
              className="mt-1.5 font-display font-black text-[1.65rem] sm:text-3xl leading-[1.05] tracking-tight text-white uppercase"
            >
              {item.name}
            </h2>
            {item.desc ? (
              <p className="mt-3 text-[13px] text-white/50 leading-relaxed">{item.desc}</p>
            ) : null}
          </div>

          {item.ingredients?.trim() ? (
            <div className="bg-white/[0.04] p-4 rounded-2xl ring-1 ring-white/[0.06]">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-white/35 mb-2">
                Ingrédients
              </h3>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                {item.ingredients}
              </p>
            </div>
          ) : null}

          {!detailText ? (
            <p className="text-sm text-white/35 italic">
              Description bientôt disponible.
            </p>
          ) : null}

          <div className="pt-1 flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/35">
                  Prix
                </span>
                <div className="font-display font-black text-2xl text-brand-400 mt-0.5">
                  {formatMad(item.price)}
                </div>
              </div>
            </div>

            {orderingDisabled ? (
              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold bg-white/[0.08] text-white/40 cursor-not-allowed"
              >
                Restaurant fermé
              </button>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                className="cursor-grow w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-white shadow-glow active:scale-[0.98] transition-transform"
              >
                <I.Plus size={16} stroke={3} />
                <span>Ajouter au panier</span>
              </button>
            ) : (
              <div className="flex items-center justify-between bg-white/[0.05] p-1.5 rounded-2xl ring-1 ring-white/10">
                <button
                  type="button"
                  onClick={() => setQty(item.id, quantity - 1)}
                  className="cursor-grow w-11 h-11 rounded-xl bg-white/[0.08] text-white font-black text-base grid place-items-center active:scale-95 transition-transform"
                  aria-label="Moins"
                >
                  −
                </button>
                <span className="font-display font-black text-sm text-white px-2 select-none">
                  {quantity} dans le panier
                </span>
                <button
                  type="button"
                  onClick={() => setQty(item.id, quantity + 1)}
                  className="cursor-grow w-11 h-11 rounded-xl bg-brand-500 text-white font-black text-base grid place-items-center active:scale-95 transition-transform shadow-glow"
                  aria-label="Plus"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
