/** Granularité calendaire pour les graphiques « 7 derniers jours » */
export const DAY_MS = 86400000;

export function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function bucketTotalsLast7Days(orders, pick) {
  const now = Date.now();
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const start = startOfDay(now - i * DAY_MS);
    const end = start + DAY_MS;
    let v = 0;
    for (const o of orders) {
      if (o.createdAt >= start && o.createdAt < end) v += pick(o);
    }
    out.push(v);
  }
  return out;
}

export function bucketRevenueLast7Days(orders) {
  return bucketTotalsLast7Days(orders, (o) => Number(o.totalDh) || 0);
}

export function bucketOrderCountLast7Days(orders) {
  return bucketTotalsLast7Days(orders, () => 1);
}

export function last7DayLabels() {
  const names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const out = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(names[d.getDay()]);
  }
  return out;
}

export function bucketRevenueLast7DaysForRestaurant(orders, restaurantId) {
  return bucketTotalsLast7Days(
    orders.filter((o) => o.restaurantId === restaurantId),
    (o) => Number(o.totalDh) || 0,
  );
}

export function bucketOrderCountLast7DaysForRestaurant(orders, restaurantId) {
  return bucketTotalsLast7Days(
    orders.filter((o) => o.restaurantId === restaurantId),
    () => 1,
  );
}

/** Données de démo si aucune commande ne remplit les 7 jours */
export const MOCK_ADMIN_REVENUE_7D = [4200, 5100, 4800, 6300, 7200, 6800, 8100];
export const MOCK_ADMIN_ORDERS_7D = [12, 18, 14, 21, 24, 22, 28];
export const MOCK_ADMIN_DONUT = [
  { label: 'Pizza Palace', value: 5 },
  { label: 'Burger Lab', value: 4 },
  { label: 'Soju Sushi Tanger', value: 3 },
  { label: "Bomo's Kebab", value: 3 },
  { label: 'Healthy Bowl', value: 3 },
];

export const MOCK_RESTAURANT_ORDERS_7D = [10, 14, 11, 18, 16, 22, 19];
export const MOCK_RESTAURANT_REVENUE_7D = [6200, 9100, 7800, 11200, 10500, 13800, 12100];

export function mergeSeries7(real, mock) {
  const sum = real.reduce((a, b) => a + b, 0);
  return sum > 0 ? real : mock;
}

export function mergeDonutFromOrders(orders, mockDonut) {
  const byResto = {};
  orders.forEach((o) => {
    byResto[o.restaurantName] = (byResto[o.restaurantName] || 0) + 1;
  });
  const donut = Object.entries(byResto)
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
  const total = donut.reduce((s, d) => s + d.value, 0);
  return total > 0 ? donut : mockDonut;
}
