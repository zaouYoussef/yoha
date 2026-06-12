import { Order, Restaurant } from './api';
import { isRestaurantStatsOrder } from './constants';

export const DAY_MS = 86400000;

export function orderFoodTotal(order: {
  subtotalDh?: number | string;
  totalDh?: number | string;
  items?: Array<{ price: number | string; qty: number }>;
}) {
  const sub = Number(order.subtotalDh);
  if (Number.isFinite(sub) && sub > 0) return sub;
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.reduce(
      (s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0),
      0,
    );
  }
  return Number(order.totalDh) || 0;
}

export function belongsToRestaurant(
  order: { restaurantId?: string },
  resto?: Restaurant | null | string,
) {
  if (!resto) return false;
  const id = typeof resto === 'string' ? resto : resto.slug || resto.id;
  return order.restaurantId === id;
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function last7DayLabels() {
  const names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const out: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(names[d.getDay()]);
  }
  return out;
}

function bucketTotalsLast7Days(
  orders: Order[],
  pick: (o: Order) => number,
) {
  const now = Date.now();
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = startOfDay(now - i * DAY_MS);
    const end = start + DAY_MS;
    let v = 0;
    for (const o of orders) {
      const at = Number(o.createdAt) || 0;
      if (at >= start && at < end) v += pick(o);
    }
    out.push(v);
  }
  return out;
}

function restaurantStatsOrders(orders: Order[], restoId: string) {
  return orders.filter(
    (o) => belongsToRestaurant(o, restoId) && isRestaurantStatsOrder(o),
  );
}

export function bucketOrderCountLast7Days(orders: Order[], restoId: string) {
  return bucketTotalsLast7Days(restaurantStatsOrders(orders, restoId), () => 1);
}

export function bucketRevenueLast7Days(orders: Order[], restoId: string) {
  return bucketTotalsLast7Days(restaurantStatsOrders(orders, restoId), orderFoodTotal);
}

export function formatOrderWhen(createdAt?: number | string) {
  const ts = Number(createdAt);
  if (!Number.isFinite(ts) || ts <= 0) return '';
  return new Date(ts).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sortOrdersNewest(orders: Order[]) {
  return [...orders].sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
}
