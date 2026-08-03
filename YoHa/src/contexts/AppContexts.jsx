'use client';

import { createContext, useContext } from 'react';

/** Clé stable d'une ligne de panier : item + options triées.
 * Sans options, on retombe sur l'id brut (comportement d'origine). */
export function makeCartKey(itemId, options = []) {
  const base = String(itemId);
  const opts = Array.isArray(options) ? options : [];
  if (!opts.length) return base;
  const tail = opts
    .slice()
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((o) => `${o.name}:${Number(o.price || 0)}`)
    .join('|');
  return `${base}::${tail}`;
}

export const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx) || { push: () => {}, toasts: [] };

export const CartIconRefCtx = createContext({ current: null });

export const OrdersCtx = createContext(null);
export const useOrders = () => useContext(OrdersCtx) || {
  orders: [],
  restaurants: [],
  loadingRestaurants: false,
  restaurantsError: null,
  refreshRestaurants: () => {},
  addOrder: async () => {},
  refreshOrders: async () => {},
};

export const CartCtx = createContext(null);
export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) {
    return {
      cart: [],
      setCart: () => {},
      addToCart: () => {},
      removeFromCart: () => {},
      setQty: () => {},
      clearCart: () => {},
      cartCount: 0,
      cartTotal: 0,
    };
  }
  return ctx;
};

/** Ouvre / ferme le tiroir panier depuis n’importe quel écran (modal plat, toast…). */
export const CartUICtx = createContext({
  cartOpen: false,
  openCart: () => {},
  closeCart: () => {},
});
export const useCartUI = () =>
  useContext(CartUICtx) || { cartOpen: false, openCart: () => {}, closeCart: () => {} };
