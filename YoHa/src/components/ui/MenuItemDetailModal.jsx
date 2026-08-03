'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { I } from '@/icons/Icons.jsx';
import { MenuItemImage } from './MenuItemImage.jsx';
import { formatMad } from '@/data/index.js';
import { useCart, makeCartKey, useCartUI } from '@/contexts/AppContexts.jsx';

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
  const unitPrice = Number(item.price || 0) + optionsPrice;
  const key = makeCartKey(item.id, selectedOptions);
  const cartItem = cart?.find((p) => (p.key || p.id) === key);
  const quantity = cartItem?.qty || 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
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

  const handleAdd = (e) => {
    if (orderingDisabled || incomplete) return;
    onAdd?.(item, restaurant, e.currentTarget, selectedOptions);
    onClose?.();
    setTimeout(() => {
      openCart();
      try {
        window.dispatchEvent(new CustomEvent('yoha-open-cart'));
      } catch {
        /* ignore */
      }
    }, 50);
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
    }, 50);
  };

  const desc = (item.desc || '').trim();
  const ingredients = (item.ingredients || '').trim();
  const showIngredients = ingredients && ingredients !== desc;
  const detailText = ingredients || desc;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-950/55 dark:bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-item-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-ink-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl shadow-brand-500/10 border border-ink-200/70 dark:border-ink-800 ring-gradient overflow-hidden animate-slide-up sm:animate-scale-in"
      >
        <div className="relative shrink-0 aspect-[16/11] sm:aspect-[16/10] overflow-hidden bg-ink-100 dark:bg-ink-950">
          <MenuItemImage
            src={item.img}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20 dark:from-ink-900 dark:via-transparent dark:to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-pink-500/10 pointer-events-none" />
          <div className="absolute top-3 inset-x-0 flex justify-center sm:hidden">
            <span className="w-10 h-1 rounded-full bg-ink-300/80 dark:bg-white/25" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-grow absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md text-ink-900 dark:text-white grid place-items-center active:scale-95 transition-transform shadow-md"
            aria-label="Fermer"
          >
            <I.X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-4 pb-3 space-y-5">
          <div>
            {restaurant?.name ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                {restaurant.name}
              </p>
            ) : null}
            <h2
              id="menu-item-detail-title"
              className="mt-1.5 font-display font-black text-[1.65rem] sm:text-3xl leading-[1.05] tracking-tight text-ink-900 dark:text-white"
            >
              {item.name}
            </h2>
            {desc ? (
              <p className="mt-3 text-[13px] text-ink-500 dark:text-ink-400 leading-relaxed">{desc}</p>
            ) : null}
          </div>

          {showIngredients ? (
            <div className="bg-gradient-to-br from-brand-500/5 via-pink-500/5 to-violet-500/5 dark:from-brand-500/10 dark:via-pink-500/5 dark:to-violet-500/10 p-4 rounded-2xl border border-brand-500/15 dark:border-brand-500/20">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-brand-600/80 dark:text-brand-400 mb-2">
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
            <div className="space-y-5">
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
                    <div className="mt-2.5 space-y-2">
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

        <div className="shrink-0 border-t border-ink-100 dark:border-ink-800 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-ink-400">Total</span>
            <div className="text-right">
              <div className="font-display font-black text-2xl sm:text-3xl bg-gradient-to-r from-brand-600 via-pink-600 to-violet-600 bg-clip-text text-transparent">
                {formatMad(unitPrice)}
              </div>
              {optionsPrice > 0 ? (
                <div className="text-[11px] font-semibold text-ink-400 mt-0.5">
                  {formatMad(Number(item.price || 0))} + {formatMad(optionsPrice)} d&apos;options
                </div>
              ) : null}
              {selectedOptions.length > 0 ? (
                <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400 mt-1 max-w-[240px] ml-auto line-clamp-2">
                  {selectedOptions.map((o) => o.name).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>

          {orderingDisabled ? (
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500 cursor-not-allowed"
            >
              Restaurant fermé
            </button>
          ) : incomplete ? (
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500 cursor-not-allowed"
            >
              Choisissez encore des options
            </button>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className="cursor-grow w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm cta-brand btn-shimmer border-0 text-white active:scale-[0.98] transition-transform shadow-glow"
            >
              <I.Plus size={16} stroke={3} />
              <span>Ajouter au panier · {formatMad(unitPrice)}</span>
            </button>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-gradient-to-r from-brand-500/5 via-pink-500/5 to-violet-500/5 dark:from-brand-500/10 dark:via-pink-500/5 dark:to-violet-500/10 p-1.5 rounded-2xl border border-brand-500/20 dark:border-brand-500/25">
                <button
                  type="button"
                  onClick={() => setQty(key, quantity - 1)}
                  className="cursor-grow w-11 h-11 rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-ink-700 dark:text-ink-200 font-black text-lg grid place-items-center active:scale-95"
                  aria-label="Moins"
                >
                  −
                </button>
                <span className="font-display font-black text-sm text-ink-900 dark:text-white px-2 select-none">
                  {quantity} dans le panier
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
                className="cursor-grow w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm cta-brand btn-shimmer border-0 text-white active:scale-[0.98] transition-transform shadow-glow"
              >
                <I.Bag size={16} />
                <span>Voir le panier</span>
                <I.Right size={16} stroke={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
