import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrderAlerts } from '../hooks/useOrderAlerts';
import { useRestaurantMe } from '../hooks/useRestaurantMe';
import { Order, ordersApi } from '../lib/api';
import { getGuestOrderIds } from '../lib/guestOrders';
import { subscribeOrder, unsubscribe } from '../lib/ws/client';

/** WebSocket-driven order alerts for client tab. Falls back to polling if WS fails. */
export function ClientOrderAlertPoller() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [armed, setArmed] = useState(false);
  const wsSubs = useRef<string[]>([]);

  const load = useCallback(async () => {
    try {
      const data = user
        ? await ordersApi.list()
        : await ordersApi.guestList(await getGuestOrderIds());
      const list = Array.isArray(data) ? data : [];
      setOrders(list);

      for (const o of list) {
        if (wsSubs.current.includes(o.public_id || o.id)) continue;
        const pid = o.public_id || o.id;
        subscribeOrder(pid, {
          onState: (data) => {
            setOrders((prev) =>
              prev.map((p) =>
                (p.public_id || p.id) === pid
                  ? { ...p, status: data.status, eta_minutes: data.eta_minutes }
                  : p,
              ),
            );
          },
        });
        wsSubs.current.push(pid);
      }

      const currentIds = new Set(list.map((o) => o.public_id || o.id));
      for (const subId of wsSubs.current) {
        if (!currentIds.has(subId)) {
          unsubscribe(subId);
        }
      }
      wsSubs.current = wsSubs.current.filter((id) => currentIds.has(id));
    } catch {
      setOrders([]);
    } finally {
      setArmed(true);
    }
  }, [user]);

  useEffect(() => {
    setArmed(false);
    wsSubs.current.forEach(unsubscribe);
    wsSubs.current = [];
    load();
    const interval = setInterval(load, 30000);
    return () => {
      clearInterval(interval);
      wsSubs.current.forEach(unsubscribe);
    };
  }, [load]);

  useOrderAlerts(orders, { mode: 'client', armed });
  return null;
}

/** WebSocket-driven order alerts for restaurant dashboard. */
export function RestaurantOrderAlertPoller() {
  const { restoId } = useRestaurantMe();
  const [orders, setOrders] = useState<Order[]>([]);
  const [armed, setArmed] = useState(false);
  const wsSubs = useRef<string[]>([]);

  const load = useCallback(async () => {
    if (!restoId) {
      setOrders([]);
      setArmed(false);
      return;
    }
    try {
      const data = await ordersApi.list();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);

      for (const o of list) {
        if (wsSubs.current.includes(o.public_id || o.id)) continue;
        const pid = o.public_id || o.id;
        subscribeOrder(pid, {
          onState: (data) => {
            setOrders((prev) =>
              prev.map((p) =>
                (p.public_id || p.id) === pid
                  ? { ...p, status: data.status, eta_minutes: data.eta_minutes }
                  : p,
              ),
            );
          },
        });
        wsSubs.current.push(pid);
      }

      const currentIds = new Set(list.map((o) => o.public_id || o.id));
      for (const subId of wsSubs.current) {
        if (!currentIds.has(subId)) {
          unsubscribe(subId);
        }
      }
      wsSubs.current = wsSubs.current.filter((id) => currentIds.has(id));
    } catch {
      setOrders([]);
    } finally {
      setArmed(true);
    }
  }, [restoId]);

  useEffect(() => {
    setArmed(false);
    wsSubs.current.forEach(unsubscribe);
    wsSubs.current = [];
    load();
    if (!restoId) return;
    const interval = setInterval(load, 30000);
    return () => {
      clearInterval(interval);
      wsSubs.current.forEach(unsubscribe);
    };
  }, [load, restoId]);

  useOrderAlerts(orders, { mode: 'restaurant', restoId, armed });
  return null;
}
