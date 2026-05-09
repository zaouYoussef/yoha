import React, { useState } from 'react';
import { I } from '../icons/Icons.jsx';
import { ORDER_STATES, COURIERS, MOCK_COURIER_GAIN_PER_DELIVERY_MAD } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { DashLayout, StatusPill } from './DashShared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Loader } from '../components/checkout/CheckoutForms.jsx';
import { spotlightHandler } from '../utils/spotlight.js';
import { RecentOrdersTable } from './AdminPanel.jsx';

export function DeliveryDashboard({ goto, dark, setDark }) {
  const [current, setCurrent] = useState('available');
  const { orders } = useOrders();
  const COURIER_ME = COURIERS[0]; // Yacine

  const titles = {
    available:'Commandes disponibles',
    mine:'Mes courses en cours',
    history:'Historique',
  };

  return (
    <DashLayout kind="delivery" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle={`Connecté en tant que ${COURIER_ME.name}`}>
      {current === 'available' && <DeliveryAvailable courier={COURIER_ME}/>}
      {current === 'mine'      && <DeliveryMine courier={COURIER_ME}/>}
      {current === 'history'   && <DeliveryHistory courier={COURIER_ME}/>}
    </DashLayout>
  );
}

export function DeliveryAvailable({ courier }) {
  const { orders, assignCourier } = useOrders();
  const available = orders.filter(o => o.status === 'placed');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white p-5 shadow-glow-lg flex items-center gap-4">
        <span className="w-12 h-12 rounded-2xl bg-white/15 grid place-items-center text-xl">🛵</span>
        <div className="flex-1">
          <div className="font-display font-extrabold text-xl">{available.length} commande{available.length > 1 ? 's' : ''} en attente</div>
          <div className="text-white/80 text-sm">Cliquez sur "Confirm Pickup" pour prendre une commande.</div>
        </div>
      </div>

      {available.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800">
          <div className="text-6xl mb-4 animate-float-med">🍕</div>
          <h3 className="font-display font-bold text-xl">Pause bien méritée</h3>
          <p className="mt-1 text-ink-500">Aucune commande disponible pour l'instant.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {available.map(o => (
            <DeliveryOrderCard key={o.id} order={o} action={
              <Button onClick={() => assignCourier(o.id, courier)} variant="primary" size="lg" className="w-full justify-center">
                ✅ Confirm Pickup
              </Button>
            }/>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeliveryMine({ courier }) {
  const { orders, updateOrderStatus } = useOrders();
  const mine = orders.filter(o => o.courierId === courier.id && o.status !== 'delivered');

  return (
    <div className="space-y-4">
      {mine.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800">
          <div className="text-6xl mb-4 animate-wiggle">📍</div>
          <h3 className="font-display font-bold text-xl">Aucune course en cours</h3>
          <p className="mt-1 text-ink-500">Allez prendre une commande dans "Disponibles".</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {mine.map(o => (
            <DeliveryOrderCard key={o.id} order={o} showMap action={
              <div className="space-y-2">
                {o.status === 'pickup_confirmed' && (
                  <div className="px-4 py-3 rounded-xl bg-amber-500/10 text-amber-600 text-sm font-semibold flex items-center gap-2">
                    <Loader/> En attente du restaurant…
                  </div>
                )}
                {o.status === 'preparing' && (
                  <div className="px-4 py-3 rounded-xl bg-violet-500/10 text-violet-600 text-sm font-semibold flex items-center gap-2">
                    👨‍🍳 Le restaurant prépare la commande
                  </div>
                )}
                {o.status === 'delivering' && (
                  <Button onClick={() => updateOrderStatus(o.id, 'delivered')} variant="primary" size="lg" className="w-full justify-center bg-gradient-to-r from-emerald-500 to-teal-500">
                    ✅ Marquer comme livré
                  </Button>
                )}
              </div>
            }/>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeliveryHistory({ courier }) {
  const { orders } = useOrders();
  const done = orders.filter(o => o.courierId === courier.id && o.status === 'delivered');
  return <RecentOrdersTable orders={done} title={`${done.length} livraisons effectuées`} full/>;
}

export function DeliveryOrderCard({ order, action, showMap }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card overflow-hidden lift-on-hover spotlight"
      onMouseMove={spotlightHandler}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display font-extrabold text-xl">#{order.id}</div>
            <div className="text-xs text-ink-500">{order.restaurantName}</div>
          </div>
          <StatusPill status={order.status}/>
        </div>

        {showMap && (
          <div className="mt-4 relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/40 dark:to-indigo-900/40 border border-ink-200/60 dark:border-ink-800">
            <svg viewBox="0 0 300 120" className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="g1" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(100,116,139,.2)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="300" height="120" fill="url(#g1)"/>
              <path d="M 20 80 Q 90 30, 160 60 T 280 30" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="6 6"/>
              <circle cx="20" cy="80" r="6" fill="#ec4899"/>
              <text x="20" y="103" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ec4899">Resto</text>
              <circle cx="280" cy="30" r="6" fill="#10b981"/>
              <text x="280" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#10b981">Client</text>
              <g style={{ offsetPath:"path('M 20 80 Q 90 30, 160 60 T 280 30')", animation:'bike-go 3s ease-in-out infinite alternate' }}>
                <circle r="10" fill="white" stroke="#f97316" strokeWidth="2"/>
                <text textAnchor="middle" y="3" fontSize="10">🛵</text>
              </g>
            </svg>
          </div>
        )}

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 grid place-items-center shrink-0"><I.Chef size={14}/></span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">Récupérer</div>
              <div className="font-semibold">{order.restaurantName}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 grid place-items-center shrink-0"><I.MapPin size={14}/></span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">Livrer à</div>
              <div className="font-semibold">{order.customer?.name} · {order.customer?.address}</div>
              <div className="text-xs text-ink-500">{order.customer?.phone}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed border-ink-200 dark:border-ink-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Articles</div>
            <div className="font-bold">{order.items.reduce((s,i) => s + i.qty, 0)} × {order.totalDh.toFixed(0)} MAD</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Vous gagnez</div>
            <div className="font-bold text-emerald-600">+{MOCK_COURIER_GAIN_PER_DELIVERY_MAD} MAD</div>
          </div>
        </div>

        <div className="mt-4">{action}</div>
      </div>
    </div>
  );
}
