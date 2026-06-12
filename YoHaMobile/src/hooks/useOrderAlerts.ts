import { useEffect, useRef } from 'react';
import { Order } from '../lib/api';
import { ORDER_STATUS_TOASTS, isRestaurantActiveOrder } from '../lib/constants';
import { notifyOrderEvent } from '../lib/orderNotifications';
import { belongsToRestaurant } from '../lib/restaurantOrder';
import { useToast } from '../contexts/ToastContext';

type Config =
  | { mode: 'client'; armed?: boolean }
  | { mode: 'restaurant'; restoId?: string; armed?: boolean };

export function useOrderAlerts(orders: Order[], config: Config) {
  const { showToast } = useToast();
  const seededRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const statusRef = useRef<Map<string, string>>(new Map());

  const armed = config.armed !== false;
  const enabled =
    armed &&
    (config.mode === 'client' || (config.mode === 'restaurant' && !!config.restoId));

  useEffect(() => {
    if (!enabled) return;

    if (!seededRef.current) {
      for (const o of orders) {
        seenIdsRef.current.add(o.id);
        statusRef.current.set(o.id, o.status);
      }
      seededRef.current = true;
      return;
    }

    if (config.mode === 'restaurant' && config.restoId) {
      const active = orders.filter(
        (o) => belongsToRestaurant(o, config.restoId) && isRestaurantActiveOrder(o.status),
      );
      for (const o of active) {
        if (seenIdsRef.current.has(o.id)) continue;
        seenIdsRef.current.add(o.id);
        statusRef.current.set(o.id, o.status);
        const title = '🔔 Nouvelle commande';
        const body = `#${o.id} · ${o.customer?.name || 'Client'}`;
        showToast(title, body, '📥');
        void notifyOrderEvent(title, body, o.id);
      }
      return;
    }

    if (config.mode === 'client') {
      for (const o of orders) {
        const prevStatus = statusRef.current.get(o.id);
        if (prevStatus === undefined) {
          seenIdsRef.current.add(o.id);
          statusRef.current.set(o.id, o.status);
          const title = '✅ Nouvelle commande';
          const body = `#${o.id} — suivi activé`;
          showToast(title, body, '📦');
          void notifyOrderEvent(title, body, o.id);
          continue;
        }
        if (prevStatus !== o.status) {
          statusRef.current.set(o.id, o.status);
          const meta = ORDER_STATUS_TOASTS[o.status];
          if (!meta) continue;
          showToast(meta.title, meta.desc, undefined);
          void notifyOrderEvent(meta.title, `${meta.desc} (#${o.id})`, o.id);
        }
      }
    }
  }, [orders, enabled, config, showToast]);
}
