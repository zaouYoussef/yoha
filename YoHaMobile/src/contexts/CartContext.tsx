import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type CartLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
  img?: string;
  restaurantId: string;
  restaurantName: string;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  restaurantId: string | null;
  triggerTime: number;
  addItem: (item: Omit<CartLine, 'qty'>, qty?: number) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  replaceItems: (lines: CartLine[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [triggerTime, setTriggerTime] = useState(0);

  const addItem = useCallback((item: Omit<CartLine, 'qty'>, qty = 1) => {
    setTriggerTime(Date.now());
    setItems((prev) => {
      if (prev.length > 0 && prev[0].restaurantId !== item.restaurantId) {
        return [{ ...item, qty }];
      }
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.id === item.id ? { ...l, qty: Math.min(l.qty + qty, 50) } : l,
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((l) => l.id !== id);
      return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, 50) } : l));
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const replaceItems = useCallback((lines: CartLine[]) => {
    setItems(lines);
  }, []);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items],
  );
  const restaurantId = items[0]?.restaurantId ?? null;

  const value = useMemo(
    () => ({ items, count, subtotal, restaurantId, triggerTime, addItem, updateQty, removeItem, clear, replaceItems }),
    [items, count, subtotal, restaurantId, triggerTime, addItem, updateQty, removeItem, clear, replaceItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
