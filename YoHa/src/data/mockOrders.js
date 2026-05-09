import { RESTAURANTS } from './restaurants.js';
import { COURIERS, computeProfit, computeNet } from './orderConstants.js';
import { startOfDay, DAY_MS } from './chartMocks.js';

export function generateMockOrders() {
  const customers = [
    { name:'Nouha Bourouhou',    address:'Résidence A · Ch. 312', phone:'+212 6 11 22 33 44' },
    { name:'Yassine El Idrissi',address:'Pavillon C · Ch. 207',  phone:'+212 6 22 33 44 55' },
    { name:'Dr. Karim Naciri', address:'CHU · Aile B · 4e étage', phone:'+212 6 33 44 55 66' },
    { name:'Lina Tazi',        address:'Cité U · Bât. 7 · Ch. 18', phone:'+212 6 44 55 66 77' },
    { name:'Anas Benali',      address:'Internat · Ch. 412',     phone:'+212 6 55 66 77 88' },
    { name:'Imane Cherkaoui',  address:'Faculté · Bloc 3',       phone:'+212 6 66 77 88 99' },
  ];
  const states = ['delivered','delivered','delivered','delivered','delivering','delivering','preparing','pickup_confirmed','placed'];
  const now = Date.now();
  return Array.from({ length:18 }).map((_, i) => {
    const r = RESTAURANTS[i % RESTAURANTS.length];
    const items = r.menu[0].items.slice(0, 1 + (i % 3)).map(it => ({ ...it, qty: 1 + (i % 2), restaurantId:r.id, restaurantName:r.name }));
    const totalDh = items.reduce((s,it) => s + it.price * it.qty, 0);
    const cust = customers[i % customers.length];
    const status = states[i % states.length];
    const courier = COURIERS[i % COURIERS.length];
    const daysAgo = i % 7;
    const dayStart = startOfDay(now - daysAgo * DAY_MS);
    const createdAt = dayStart + (i + 1) * 3600000 + (i * 173) * 1000;
    return {
      id: 'YH-' + (4001 + i),
      createdAt,
      customer: cust,
      restaurantId: r.id,
      restaurantName: r.name,
      items,
      totalDh,
      profitDh: computeProfit(totalDh),
      netDh: computeNet(totalDh),
      status,
      courierId: status === 'placed' ? null : courier.id,
      courierName: status === 'placed' ? null : courier.name,
      eta: 20 + (i % 11),
    };
  });
}
