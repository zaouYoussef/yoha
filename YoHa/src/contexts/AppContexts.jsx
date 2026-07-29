'use client';

import { createContext, useContext } from 'react';

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
