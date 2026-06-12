import { useCallback, useEffect, useState } from 'react';
import { Order, ordersApi } from '../lib/api';
import { isActiveOrderStatus } from '../lib/constants';
import { getGuestOrderIds } from '../lib/guestOrders';
import { useAuth } from '../contexts/AuthContext';

export function useActiveOrder() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    try {
      let orders: Order[] = [];
      if (user) {
        orders = (await ordersApi.list()) as Order[];
      } else {
        const ids = await getGuestOrderIds();
        orders = await ordersApi.guestList(ids);
      }
      const active = orders.find((o) => isActiveOrderStatus(o.status));
      setActiveOrder(active || null);
    } catch {
      setActiveOrder(null);
    }
  }, [user]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, [load]);

  return { activeOrder, refresh: load };
}
