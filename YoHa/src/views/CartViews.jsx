'use client';

import React, { useEffect, Fragment } from 'react';
import { I } from '../icons/Icons.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatMad } from '../data/index.js';
import { MenuItemImage } from '../components/ui/MenuItemImage.jsx';
import { Row } from '../components/ui/Row.jsx';

export function CartSidebar({ open, onClose, items, setQty, remove, total, onCheckout }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <Fragment>
      <div
        className={`fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-white dark:bg-ink-950 shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink-200 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <I.Bag size={20}/>
            <h3 className="font-display font-bold text-lg">Mon panier</h3>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{items.reduce((s,i)=>s+i.qty,0)}</span>
          </div>
          <button onClick={onClose} className="cursor-grow w-9 h-9 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 grid place-items-center transition">
            <I.X size={20}/>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="text-7xl mb-4 animate-float-med">🛒</div>
            <h4 className="font-display font-bold text-xl">Votre panier est vide</h4>
            <p className="mt-2 text-ink-500 dark:text-ink-400">Ajoutez quelques délices et ils apparaîtront ici.</p>
            <button onClick={onClose} className="cursor-grow mt-6 px-5 py-3 rounded-2xl bg-ink-900 text-white dark:bg-white dark:text-ink-900 font-semibold hover:scale-105 transition btn-shine">
              Parcourir les restaurants
            </button>
          </div>
        ) : (
          <Fragment>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map(item => (
                <CartLine key={item.id} item={item} setQty={setQty} remove={remove} />
              ))}

              <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 grid place-items-center shrink-0"><I.Bike size={18}/></span>
                <div>
                  <div className="font-semibold text-sm">Livraison offerte sur votre campus</div>
                  <div className="text-xs text-ink-500 mt-0.5">Arrivée estimée dans 15-22 min ⚡</div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-ink-200 dark:border-ink-800 space-y-3">
              <Row label="Sous-total" value={formatMad(total)} />
              <div className="border-t border-dashed border-ink-200 dark:border-ink-800 my-1"></div>
              <Row label={<b className="text-base">Total</b>} value={<b className="text-xl">{formatMad(total)}</b>} />

              <Button onClick={onCheckout} variant="primary" size="lg" className="w-full justify-center">
                Passer commande · {formatMad(total)} <I.Right size={18}/>
              </Button>
            </div>
          </Fragment>
        )}
      </aside>
    </Fragment>
  );
}

export function CartLine({ item, setQty, remove }) {
  return (
    <div className="flex gap-3 items-center bg-ink-50 dark:bg-ink-900 rounded-2xl p-3 animate-fade-up">
      <MenuItemImage src={item.img} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0"/>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{item.name}</div>
        <div className="text-xs text-ink-500 truncate">{item.restaurantName}</div>
        <div className="mt-1 font-display font-extrabold">{formatMad(item.price * item.qty)}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-ink-800 rounded-full p-0.5 border border-ink-200 dark:border-ink-700">
          <button onClick={() => setQty(item.id, item.qty - 1)} className="cursor-grow w-7 h-7 rounded-full hover:bg-ink-100 dark:hover:bg-ink-700 grid place-items-center"><I.Minus size={14}/></button>
          <span className="min-w-[22px] text-center text-sm font-bold">{item.qty}</span>
          <button onClick={() => setQty(item.id, item.qty + 1)} className="cursor-grow w-7 h-7 rounded-full hover:bg-ink-100 dark:hover:bg-ink-700 grid place-items-center"><I.Plus size={14}/></button>
        </div>
        <button onClick={() => remove(item.id)} className="cursor-grow text-ink-400 hover:text-red-500 transition" aria-label="Supprimer">
          <I.Trash size={16}/>
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   FLOATING CART
============================================================================ */
export function FloatingCart({ count, total, onClick, hidden }) {
  if (count === 0 || hidden) return null;
  return (
    <button onClick={onClick}
      className="cursor-grow fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-30 group flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-ink-900 dark:bg-white text-white dark:text-ink-900 shadow-glow-lg hover:scale-105 active:scale-95 transition-transform animate-bounce-soft">
      <span className="relative">
        <I.Bag size={20}/>
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-brand-500 text-white grid place-items-center">{count}</span>
      </span>
      <span className="font-bold text-sm sm:text-base hidden sm:inline">Voir le panier</span>
      <span className="font-bold text-sm sm:text-base">{formatMad(total)}</span>
      <I.Right size={16} className="group-hover:translate-x-0.5 transition-transform"/>
    </button>
  );
}
