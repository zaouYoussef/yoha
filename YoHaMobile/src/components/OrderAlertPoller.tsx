import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrderAlerts } from '../hooks/useOrderAlerts';
import { useRestaurantMe } from '../hooks/useRestaurantMe';
import { Order, ordersApi } from '../lib/api';
import { getGuestOrderIds } from '../lib/guestOrders';

/** Polling léger + alertes sonores pour le parcours client (tous les onglets). */
export function ClientOrderAlertPoller() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [armed, setArmed] = useState(false);

  const load = useCallback(async () => {
    try {
      if (user) {
        const data = await ordersApi.list();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        const ids = await getGuestOrderIds();
        if (!ids.length) {
          setOrders([]);
          return;
        }
        const data = await ordersApi.guestList(ids);
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      setOrders([]);
    } finally {
      setArmed(true);
    }
  }, [user]);

  useEffect(() => {
    setArmed(false);
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  useOrderAlerts(orders, { mode: 'client', armed });
  return null;
}

/** Polling + alertes pour le dashboard restaurant (tous les onglets). */
export function RestaurantOrderAlertPoller() {
  const { restoId } = useRestaurantMe();
  const [orders, setOrders] = useState<Order[]>([]);
  const [armed, setArmed] = useState(false);

  const load = useCallback(async () => {
    if (!restoId) {
      setOrders([]);
      setArmed(false);
      return;
    }
    try {
      const data = await ordersApi.list();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setArmed(true);
    }
  }, [restoId]);

  useEffect(() => {
    setArmed(false);
    load();
    if (!restoId) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load, restoId]);

  useOrderAlerts(orders, { mode: 'restaurant', restoId, armed });
  return null;
}
