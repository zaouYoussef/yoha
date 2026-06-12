'use client';

import { createContext, useContext } from 'react';

export const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx) || { push: () => {}, toasts: [] };
export const CartIconRefCtx = createContext({ current: null });
export const OrdersCtx = createContext(null);
export const useOrders = () => useContext(OrdersCtx);
