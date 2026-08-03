'use client';

import React, { useEffect, Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { I } from '../icons/Icons.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatMad } from '../data/index.js';
import { MenuItemImage } from '../components/ui/MenuItemImage.jsx';
import { Row } from '../components/ui/Row.jsx';
import { useCart } from '../contexts/AppContexts.jsx';

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
        className={`fixed inset-0 z-[60] bg-ink-950/55 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside className={`fixed top-0 right-0 z-[60] h-full w-full sm:w-[440px] bg-white dark:bg-ink-950 shadow-2xl flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="relative overflow-hidden flex items-center justify-between px-5 h-[4.25rem] border-b border-ink-200/80 dark:border-ink-800">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/15 via-pink-500/10 to-violet-500/5 pointer-events-none" />
          <div className="relative flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 text-white grid place-items-center shadow-glow">
              <I.Bag size={18}/>
            </span>
            <div>
              <h3 className="font-display font-black text-lg leading-none text-ink-900 dark:text-white">Mon panier</h3>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500/80 mt-1">Prêt à commander</p>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-sm">{items.reduce((s,i)=>s+i.qty,0)}</span>
          </div>
          <button onClick={onClose} className="relative cursor-grow w-10 h-10 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 grid place-items-center transition" aria-label="Fermer">
            <I.X size={20}/>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-12 overflow-hidden">
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 text-white grid place-items-center text-4xl mb-4 shadow-glow">
              <I.Bag size={32}/>
            </div>
            <h4 className="relative font-display font-black text-2xl text-ink-900 dark:text-white">Votre panier est vide</h4>
            <p className="relative mt-2.5 text-sm text-ink-500 dark:text-ink-400 max-w-xs leading-relaxed">
              Ajoutez quelques délices et ils apparaîtront ici.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={onClose}
              className="relative mt-8 w-full justify-center cta-brand border-0 btn-shimmer shadow-glow"
            >
              <span>Découvrir les établissements</span>
              <span>🚀</span>
            </Button>
          </div>
        ) : (
          <Fragment>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {items.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <CartLine item={item} setQty={setQty} remove={remove} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {(() => {
                const isCustom = items.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
                const customItems = items.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
                const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
                const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;
                const etaText = uniqueCustomShops.size > 1 ? 'Arrivée estimée dans 45 min - 1h ⚡' : 'Arrivée estimée dans 15-22 min ⚡';

                return (
                  <>
                    {isCustom ? (
                      <div className="mt-6 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-600 grid place-items-center shrink-0"><I.Bike size={18}/></span>
                        <div>
                          <div className="font-semibold text-sm">Livraison fixe à {deliveryFee} DH</div>
                          <div className="text-xs text-ink-500 mt-0.5 font-medium">{etaText}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 grid place-items-center shrink-0"><I.Bike size={18}/></span>
                        <div>
                          <div className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Livraison Offerte ✨</div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Sur toute l&apos;Alliance Tangéroise</div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="px-5 py-4 border-t border-ink-200 dark:border-ink-800 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {(() => {
                const isCustom = items.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
                const customItems = items.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
                const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
                const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;
                const grandTotal = total + deliveryFee;
                const isLimitBlocked = !isCustom && total < 40;

                return (
                  <>
                    <Row 
                      label="Sous-total" 
                      value={isCustom 
                        ? (total > 0 ? `${formatMad(total)} + achats` : <span className="text-brand-600 dark:text-brand-400 font-semibold">Sur ticket</span>)
                        : formatMad(total)
                      } 
                    />
                    <Row 
                      label="Frais de livraison" 
                      value={deliveryFee > 0 ? formatMad(deliveryFee) : 'Offerte ✨'} 
                    />
                    <div className="border-t border-dashed border-ink-200 dark:border-ink-800 my-1"></div>
                    <Row 
                      label={<b className="text-base">Total</b>} 
                      value={
                        <b className="text-xl">
                          {isCustom 
                            ? `${formatMad(grandTotal)} + achats`
                            : formatMad(grandTotal)
                          }
                        </b>
                      } 
                    />

                    {isLimitBlocked && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-fade-up">
                        <span className="text-sm">⚠️</span>
                        <span>Le restaurant n&apos;accepte pas les commandes de moins de 40 DH. Ajoutez encore {formatMad(40 - total)}.</span>
                      </div>
                    )}
                    {isCustom && (
                      <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-700 dark:text-brand-300 flex items-start gap-2 animate-fade-up">
                        <span className="text-sm">📝</span>
                        <span>Commande sur-mesure : {deliveryFee} DH de livraison. Les achats seront réglés à la livraison selon le ticket de caisse réel.</span>
                      </div>
                    )}

                    <Button
                      onClick={onCheckout}
                      variant="primary"
                      size="lg"
                      className="w-full justify-center btn-shimmer cta-brand border-0 shadow-glow"
                      disabled={isLimitBlocked}
                    >
                      Passer commande · {isCustom 
                        ? (total > 0 ? `${formatMad(grandTotal)} + achats` : "20 DH + achats") 
                        : formatMad(grandTotal)
                      } <I.Right size={18}/>
                    </Button>
                  </>
                );
              })()}
            </div>
          </Fragment>
        )}
      </aside>
    </Fragment>
  );
}

export function CartLine({ item, setQty, remove }) {
  const { setCart } = useCart();
  return (
    <div className="flex gap-3 items-start bg-gradient-to-br from-ink-50 via-white to-pink-50/40 dark:from-ink-900 dark:via-ink-900 dark:to-ink-900 rounded-2xl p-3 border border-ink-100/80 dark:border-ink-800/60 hover:border-brand-500/25 transition-colors">
      <MenuItemImage src={item.img} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 mt-1 ring-1 ring-brand-500/10"/>
      <div className="flex-1 min-w-0">
        {item.isCustom ? (
          <div className="space-y-1">
            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Demande sur-mesure</div>
            {item.customDetails?.storeAddress && (
              <div className="text-xs text-ink-500 font-semibold truncate">Établissement : {item.customDetails.storeName}</div>
            )}
            <textarea
              value={item.customDetails?.details || ''}
              onChange={(e) => {
                const newDetails = e.target.value;
                setCart(prev => prev.map(p => {
                  if (p.id === item.id) {
                    const storeName = p.customDetails?.storeName || p.restaurantName;
                    const name = p.customDetails?.storeAddress 
                      ? `[${storeName}] ${newDetails}`
                      : `${p.restaurantName} - ${newDetails}`;
                    return {
                      ...p,
                      name,
                      customDetails: {
                        ...p.customDetails,
                        details: newDetails
                      }
                    };
                  }
                  return p;
                }));
              }}
              className="w-full text-xs bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
              placeholder="Modifiez les détails de votre demande..."
              rows={2}
            />
          </div>
        ) : (
          <>
            <div className="font-semibold text-sm truncate text-ink-900 dark:text-white">{item.name}</div>
            <div className="text-xs text-ink-500 truncate">{item.restaurantName}</div>
            {(item.options || []).length > 0 && (
              <div className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400 truncate">
                {item.options.map((o) => o.name).join(' · ')}
              </div>
            )}
          </>
        )}
        <div className="mt-1 font-display font-extrabold text-sm text-brand-600 dark:text-brand-400">
          {item.price > 0 ? formatMad(item.price * item.qty) : <span className="font-semibold">Sur ticket</span>}
        </div>
      </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white dark:bg-ink-800 rounded-full p-0.5 border border-ink-200 dark:border-ink-700 shadow-sm">
            <button onClick={() => setQty(item.key || item.id, item.qty - 1)} className="cursor-grow w-10 h-10 rounded-full hover:bg-ink-100 dark:hover:bg-ink-700 grid place-items-center transition-colors" aria-label="Diminuer"><I.Minus size={14}/></button>
            <span className="min-w-[24px] text-center text-sm font-bold">{item.qty}</span>
            <button onClick={() => setQty(item.key || item.id, item.qty + 1)} className="cursor-grow w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 text-white hover:opacity-95 grid place-items-center transition-colors shadow-sm" aria-label="Augmenter"><I.Plus size={14}/></button>
          </div>
          <button onClick={() => remove(item.key || item.id)} className="cursor-grow w-10 h-10 rounded-lg flex items-center justify-center text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" aria-label="Supprimer">
            <I.Trash size={16}/>
          </button>
        </div>
    </div>
  );
}

/* ============================================================================
   FLOATING CART
============================================================================ */
export function FloatingCart({ count, total, items = [], onClick, hidden }) {
  if (count === 0 || hidden) return null;
  const isCustom = items.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const customItems = items.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
  const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;
  const displayTotal = total + deliveryFee;
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ y: 80, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className="btn-shimmer cursor-pointer fixed z-50 left-3 right-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:hidden group flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 rounded-2xl cta-brand text-white shadow-glow-lg active:scale-[0.98] transition-transform pointer-events-auto border border-white/25 touch-manipulation"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span className="relative shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
          <I.Bag size={18}/>
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-white text-brand-600 grid place-items-center shadow-xs">{count}</span>
        </span>
        <span className="font-extrabold text-sm sm:text-base truncate">Voir le panier</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="font-black text-sm sm:text-base tabular-nums">
          {isCustom 
            ? (total > 0 ? `${formatMad(displayTotal)} + achats` : "20 DH + achats")
            : formatMad(displayTotal)
          }
        </span>
        <span className="w-8 h-8 rounded-full bg-white/20 grid place-items-center">
          <I.Right size={15}/>
        </span>
      </span>
    </motion.button>
  );
}
