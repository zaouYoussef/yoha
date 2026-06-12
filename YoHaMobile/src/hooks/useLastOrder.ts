import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Order, ordersApi } from '../lib/api';
import { getGuestOrderIds } from '../lib/guestOrders';
import { useAuth } from '../contexts/AuthContext';

export function useLastOrder() {
  const { user } = useAuth();
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    try {
      let orders: Order[] = [];
      if (user) {
        orders = (await ordersApi.list()) as Order[];
      } else {
        const ids = await getGuestOrderIds();
        if (!ids.length) {
          setLastOrder(null);
          return;
        }
        orders = await ordersApi.guestList(ids);
      }
      const delivered = orders.find((o) => o.status === 'delivered');
      setLastOrder(delivered ?? orders[0] ?? null);
    } catch {
      setLastOrder(null);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { lastOrder, refresh: load };
}
