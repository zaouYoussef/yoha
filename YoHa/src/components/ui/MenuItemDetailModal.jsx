'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { I } from '@/icons/Icons.jsx';
import { MenuItemImage } from './MenuItemImage.jsx';
import { formatMad } from '@/data/index.js';
import { useCart, makeCartKey, useCartUI } from '@/contexts/AppContexts.jsx';
import { withItemOfferPricing } from '@/utils/restaurantOffers.js';

function groupHint(g) {
  const min = Number(g.min || 0);
  const max = Number(g.max || 0);
  if (min > 0 && max > 0 && min === max) return `Choisir ${min}`;
  if (min > 0 && max > min) return `Entre ${min} et ${max}`;
  if (min > 0) return `Minimum ${min}`;
  if (max === 1) return '1 maximum';
  if (max > 0) return `Jusqu'à ${max}`;
  return 'Au choix';
}

export function MenuItemDetailModal({ item, restaurant, onClose, onAdd, orderingDisabled = false }) {
  const { cart, setQty } = useCart();
  const { openCart } = useCartUI();
  const groups = item.modifierGroups || [];
  const priced = useMemo(() => withItemOfferPricing(item, restaurant), [item, restaurant]);

  const blankSelections = useMemo(() => {
    const sel = {};
    groups.forEach((g) => {
      sel[g.name] = [];
    });
    return sel;
  }, [groups]);

  const [selections, setSelections] = useState(blankSelections);

  useEffect(() => {
    setSelections(blankSelections);
  }, [item.id, blankSelections]);

  const selectedOptions = useMemo(() => {
    const out = [];
    groups.forEach((g) => {
      (selections[g.name] || []).forEach((optName) => {
        const opt = (g.options || []).find((o) => o.name === optName);
        if (opt) out.push({ name: opt.name, price: Number(opt.price || 0) });
      });
    });
    return out;
  }, [groups, selections]);

  const optionsPrice = useMemo(
    () => selectedOptions.reduce((s, o) => s + (Number(o.price) || 0), 0),
    [selectedOptions],
  );
  const basePrice = Number(priced.price || 0);
  const originalBase = Number((priced.originalPrice ?? item.price) || 0);
  const unitPrice = basePrice + optionsPrice;
  const originalUnitPrice = priced.discountPercent ? originalBase + optionsPrice : null;
  const key = makeCartKey(item.id, selectedOptions);
  const cartItem = cart?.find((p) => (p.key || p.id) === key);
  const quantity = cartItem?.qty || 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const toggle = (g, opt) => {
    setSelections((prev) => {
      const cur = prev[g.name] || [];
      const isSel = cur.includes(opt.name);
      if (Number(g.max) <= 1) {
        return { ...prev, [g.name]: isSel ? [] : [opt.name] };
      }
      if (isSel) return { ...prev, [g.name]: cur.filter((n) => n !== opt.name) };
      if (cur.length >= Number(g.max || 0)) return prev;
      return { ...prev, [g.name]: [...cur, opt.name] };
    });
  };

  const incomplete = groups.some((g) => (selections[g.name] || []).length < Number(g.min || 0));

  /** Ajoute et ferme — le bandeau « Voir le panier » reste visible sous le modal. */
  const handleAdd = (e) => {
    if (orderingDisabled || incomplete) return;
    onAdd?.(item, restaurant, e.currentTarget, selectedOptions);
    onClose?.();
  };

  const goToCart = () => {
    onClose?.();
    setTimeout(() => {
      openCart();
      try {
        window.dispatchEvent(new CustomEvent('yoha-open-cart'));
      } catch {
        /* ignore */
      }
    }, 40);
  };

  const desc = (item.desc || '').trim();
  const ingredients = (item.ingredients || '').trim();
  const showIngredients = ingredients && ingredients !== desc;
  const detailText = ingredients || desc;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-950/55 dark:bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-item-detail-title"
    >
      {/* Hauteur fixe mobile → footer toujours à l’écran, sans scroll jusqu’en bas */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full sm:max-w-lg h-[min(92dvh,92vh)] sm:h-auto sm:max-h-[88vh] bg-white dark:bg-ink-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl shadow-brand-500/10 border border-ink-200/70 dark:border-ink-800 ring-gradient overflow-hidden animate-slide-up sm:animate-scale-in"
      >
        <button
          type="button"
          onClick={onClose}
          className="cursor-grow absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md text-ink-900 dark:text-white grid place-items-center active:scale-95 transition-transform shadow-md"
          aria-label="Fermer"
        >
          <I.X size={18} />
        </button>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <div className="relative h-40 sm:h-52 overflow-hidden bg-ink-100 dark:bg-ink-950 shrink-0">
            <MenuItemImage
              src={item.img}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20 dark:from-ink-900 dark:via-transparent dark:to-black/30" />
            {priced.discountPercent ? (
              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md">
                −{priced.discountPercent}%
              </span>
            ) : null}
            <div className="absolute top-2.5 inset-x-0 flex justify-center sm:hidden">
              <span className="w-10 h-1 rounded-full bg-ink-300/80 dark:bg-white/25" />
            </div>
          </div>

          <div className="px-4 sm:px-5 pt-3 pb-4 space-y-4">
            <div>
              {restaurant?.name ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                  {restaurant.name}
                </p>
              ) : null}
              <h2
                id="menu-item-detail-title"
                className="mt-1 font-display font-black text-xl sm:text-3xl leading-[1.15] tracking-tight text-ink-900 dark:text-white pr-10"
              >
                {item.name}
              </h2>
              {priced.discountPercent && priced.offerTitle ? (
                <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Offre : {priced.offerTitle}
                </p>
              ) : null}
              {desc ? (
                <p className="mt-2 text-[13px] text-ink-500 dark:text-ink-400 leading-relaxed">{desc}</p>
              ) : null}
            </div>

            {showIngredients ? (
              <div className="bg-gradient-to-br from-brand-500/5 via-pink-500/5 to-violet-500/5 dark:from-brand-500/10 dark:via-pink-500/5 dark:to-violet-500/10 p-3.5 rounded-2xl border border-brand-500/15 dark:border-brand-500/20">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-brand-600/80 dark:text-brand-400 mb-1.5">
                  Ingrédients
                </h3>
                <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                  {ingredients}
                </p>
              </div>
            ) : null}

            {!detailText ? (
              <p className="text-sm text-ink-400 italic">Description bientôt disponible.</p>
            ) : null}

            {groups.length > 0 ? (
              <div className="space-y-4">
                {groups.map((g) => {
                  const picked = selections[g.name] || [];
                  const required = Number(g.min || 0) > 0;
                  const multi = Number(g.max) > 1;
                  return (
                    <section key={g.name}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[10px] font-black uppercase tracking-wider text-ink-400 dark:text-ink-500">
                            {g.name}
                          </h3>
                          <p className="text-[11px] font-semibold text-ink-400 mt-0.5">{groupHint(g)}</p>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            required
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
                              : 'bg-ink-100 dark:bg-ink-800 text-ink-500'
                          }`}
                        >
                          {required ? 'Requis' : 'Optionnel'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-2">
                        {(g.options || []).map((opt) => {
                          const price = Number(opt.price || 0);
                          const active = picked.includes(opt.name);
                          const disabled = !active && multi && picked.length >= Number(g.max);
                          return (
                            <button
                              type="button"
                              key={opt.name}
                              disabled={disabled}
                              onClick={() => toggle(g, opt)}
                              className={`cursor-grow w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors active:scale-[0.99] ${
                                active
                                  ? 'border-brand-500 bg-gradient-to-r from-brand-500/10 to-pink-500/10 text-ink-900 dark:text-white shadow-sm shadow-brand-500/10'
                                  : disabled
                                    ? 'border-ink-100 dark:border-ink-800 opacity-45 cursor-not-allowed'
                                    : 'border-ink-200 dark:border-ink-800 hover:border-brand-400 text-ink-900 dark:text-white'
                              }`}
                            >
                              <span className="text-sm font-semibold leading-snug min-w-0">{opt.name}</span>
                              <span className="flex items-center gap-2 shrink-0">
                                {price > 0 ? (
                                  <span className="text-xs font-bold text-ink-500 dark:text-ink-400">
                                    +{formatMad(price)}
                                  </span>
                                ) : null}
                                <span
                                  className={`w-5 h-5 grid place-items-center text-[11px] font-black transition-colors ${
                                    multi ? 'rounded-md' : 'rounded-full'
                                  } ${
                                    active
                                      ? 'bg-gradient-to-br from-brand-500 to-pink-500 text-white shadow-sm'
                                      : 'border-2 border-ink-300 dark:border-ink-600'
                                  }`}
                                >
                                  {active ? '✓' : ''}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* CTA sticky — toujours visible sans scroller */}
        <div className="shrink-0 z-10 border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 px-3 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)]">
          {orderingDisabled ? (
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-2xl font-bold bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500 cursor-not-allowed"
            >
              Restaurant fermé
            </button>
          ) : incomplete ? (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-ink-400">Total</p>
                <p className="font-display font-black text-lg text-ink-900 dark:text-white tabular-nums">
                  {formatMad(unitPrice)}
                </p>
              </div>
              <button
                type="button"
                disabled
                className="flex-[1.4] min-h-12 px-3 rounded-2xl font-bold text-sm bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500 cursor-not-allowed"
              >
                Choisissez des options
              </button>
            </div>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className="cursor-grow w-full min-h-12 inline-flex items-center justify-between gap-3 px-4 rounded-2xl font-bold text-sm cta-brand btn-shimmer border-0 text-white active:scale-[0.98] transition-transform shadow-glow"
            >
              <span className="inline-flex items-center gap-2">
                <I.Plus size={16} stroke={3} />
                Ajouter
              </span>
              <span className="inline-flex items-center gap-2 tabular-nums">
                {priced.discountPercent ? (
                  <span className="text-white/70 text-xs line-through font-semibold">
                    {formatMad(originalUnitPrice)}
                  </span>
                ) : null}
                <span className="font-black">{formatMad(unitPrice)}</span>
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center rounded-2xl border border-brand-500/25 bg-brand-500/5 dark:bg-brand-500/10 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setQty(key, quantity - 1)}
                  className="cursor-grow w-11 h-11 rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-ink-700 dark:text-ink-200 font-black text-lg grid place-items-center active:scale-95"
                  aria-label="Moins"
                >
                  −
                </button>
                <span className="font-display font-black text-sm text-ink-900 dark:text-white px-3 tabular-nums select-none min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(key, quantity + 1)}
                  className="cursor-grow w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-pink-500 text-white font-black text-lg grid place-items-center active:scale-95 shadow-glow"
                  aria-label="Plus"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={goToCart}
                className="cursor-grow flex-1 min-h-12 inline-flex items-center justify-center gap-2 px-3 rounded-2xl font-bold text-sm cta-brand btn-shimmer border-0 text-white active:scale-[0.98] transition-transform shadow-glow"
              >
                <I.Bag size={16} />
                <span>Panier</span>
                <span className="tabular-nums opacity-90">{formatMad(unitPrice * quantity)}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
