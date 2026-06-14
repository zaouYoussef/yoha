import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../lib/api';

export type CourierProfile = {
  id: string;
  name: string;
  userId?: string;
  phone?: string;
};

export function useCourierMe() {
  const { user } = useAuth();
  const [courier, setCourier] = useState<CourierProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await ordersApi.couriers();
      const me = list.find((c) => c.userId === user?.id);
      if (me) {
        setCourier({ id: me.id, name: me.name, userId: me.userId, phone: (me as any).phone });
      } else if (user) {
        setCourier({ id: '0', name: user.displayName || 'Livreur', userId: user.id });
      }
    } catch {
      if (user) {
        setCourier({ id: '0', name: user.displayName || 'Livreur', userId: user.id });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { courier, loading, refresh };
}
