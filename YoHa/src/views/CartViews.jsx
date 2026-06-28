'use client';

import React, { useEffect, Fragment } from 'react';
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
            <button onClick={onClose} className="cursor-grow mt-6 px-5 py-3 rounded-2xl bg-ink-900 text-white dark:bg-white dark:text-ink-900 font-semibold">
              Parcourir les restaurants
            </button>
          </div>
        ) : (
          <Fragment>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map(item => (
                <CartLine key={item.id} item={item} setQty={setQty} remove={remove} />
              ))}

              {(() => {
                const isCustom = items.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
                const customItems = items.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
                const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
                const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;

                return (
                  <>
                    {isCustom ? (
                      <div className="mt-6 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-600 grid place-items-center shrink-0"><I.Bike size={18}/></span>
                        <div>
                          <div className="font-semibold text-sm">Livraison fixe à {deliveryFee} DH</div>
                          <div className="text-xs text-ink-500 mt-0.5 font-medium">Arrivée estimée dans 15-22 min ⚡</div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 grid place-items-center shrink-0"><I.Bike size={18}/></span>
                        <div>
                          <div className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Livraison Offerte ✨</div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Sur tout le campus Tangérois</div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="px-5 py-4 border-t border-ink-200 dark:border-ink-800 space-y-3">
              {(() => {
                const isCustom = items.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
                const customItems = items.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
                const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
                const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;
                const grandTotal = total + deliveryFee;
                const isLimitBlocked = !isCustom && total < 70;

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
                            ? (total > 0 ? `${formatMad(grandTotal)} + achats` : `${deliveryFee},00 MAD + achats`)
                            : formatMad(grandTotal)
                          }
                        </b>
                      } 
                    />

                    {isLimitBlocked && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-fade-up">
                        <span className="text-sm">⚠️</span>
                        <span>Le restaurant n&apos;accepte pas les commandes de moins de 70 DH. Ajoutez encore {formatMad(70 - total)}.</span>
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
                      className="w-full justify-center"
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
    <div className="flex gap-3 items-start bg-ink-50 dark:bg-ink-900 rounded-2xl p-3 animate-fade-up">
      <MenuItemImage src={item.img} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 mt-1"/>
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
            <div className="font-semibold text-sm truncate">{item.name}</div>
            <div className="text-xs text-ink-500 truncate">{item.restaurantName}</div>
          </>
        )}
        <div className="mt-1 font-display font-extrabold text-sm">
          {item.price > 0 ? formatMad(item.price * item.qty) : <span className="text-brand-600 dark:text-brand-400 font-semibold">Sur ticket</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
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
export function FloatingCart({ count, total, items = [], onClick, hidden }) {
  if (count === 0 || hidden) return null;
  const isCustom = items.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const customItems = items.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
  const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;
  const displayTotal = total + deliveryFee;
  
  return (
    <button onClick={onClick}
      className="cursor-grow fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-30 group flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-ink-900 dark:bg-white text-white dark:text-ink-900 shadow-glow-lg active:scale-95 transition-transform animate-bounce-soft">
      <span className="relative">
        <I.Bag size={20}/>
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-brand-500 text-white grid place-items-center">{count}</span>
      </span>
      <span className="font-bold text-sm sm:text-base hidden sm:inline">Voir le panier</span>
      <span className="font-bold text-sm sm:text-base">
        {isCustom 
          ? (total > 0 ? `${formatMad(displayTotal)} + achats` : "20 DH + achats")
          : formatMad(displayTotal)
        }
      </span>
      <I.Right size={16}/>
    </button>
  );
}
