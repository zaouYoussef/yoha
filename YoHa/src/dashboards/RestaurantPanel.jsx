import React, { useState } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  RESTAURANTS,
  formatMad,
  bucketOrderCountLast7DaysForRestaurant,
  bucketRevenueLast7DaysForRestaurant,
  last7DayLabels,
  mergeSeries7,
  MOCK_RESTAURANT_ORDERS_7D,
  MOCK_RESTAURANT_REVENUE_7D,
} from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { DashLayout, LineChart, BarChart, StatCard } from './DashShared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/checkout/CheckoutForms.jsx';
import { ModalOverlay } from '../components/ui/ModalOverlay.jsx';
import { MenuItemImage } from '../components/ui/MenuItemImage.jsx';

export function RestaurantDashboard({ goto, dark, setDark }) {
  const [current, setCurrent] = useState('incoming');
  const RESTO_ID = 'pizza-palace';
  const titles = {
    incoming:'Commandes entrantes',
    menu:'Mon menu',
    stats:'Statistiques',
  };
  return (
    <DashLayout kind="restaurant" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle={`Connecté en tant que ${RESTAURANTS.find(r => r.id === RESTO_ID).name}`}>
      {current === 'incoming' && <RestoIncoming restoId={RESTO_ID}/>}
      {current === 'menu'     && <RestoMenu restoId={RESTO_ID}/>}
      {current === 'stats'    && <RestoStats restoId={RESTO_ID}/>}
    </DashLayout>
  );
}

export function RestoIncoming({ restoId }) {
  const { orders, updateOrderStatus } = useOrders();
  const myOrders = orders.filter(o => o.restaurantId === restoId && o.status !== 'delivered' && o.status !== 'placed');

  const actionForOrder = (o) => {
    if (o.status === 'pickup_confirmed') {
      return (
        <Button onClick={() => updateOrderStatus(o.id, 'preparing')} variant="primary" size="md" className="w-full justify-center">
          ✅ Accepter & préparer
        </Button>
      );
    }
    if (o.status === 'preparing') {
      return (
        <Button onClick={() => updateOrderStatus(o.id, 'delivering')} variant="primary" size="md" className="w-full justify-center bg-gradient-to-r from-emerald-500 to-teal-500">
          🍽️ Terminer la préparation
        </Button>
      );
    }
    if (o.status === 'delivering') {
      return (
        <div className="px-3 py-2 rounded-xl bg-pink-500/10 text-pink-600 text-xs font-bold text-center">
          🛵 En route vers le client
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {myOrders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-800 py-16 text-center text-sm text-ink-500">
          Aucune commande active pour ce restaurant.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {myOrders.map((o) => (
            <RestoOrderCard key={o.id} order={o} action={actionForOrder(o)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RestoOrderCard({ order, action }) {
  return (
    <div className="rounded-xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 p-3 shadow-card lift-on-hover">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-sm">#{order.id}</div>
          <div className="text-[11px] text-ink-500">{order.customer?.name}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm">{formatMad(order.totalDh, { decimals: 0 })}</div>
          <div className="text-[10px] text-ink-500">{order.items.reduce((s,i) => s+i.qty, 0)} art.</div>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {order.items.map(it => (
          <div key={it.id} className="flex items-center gap-2 text-xs">
            <span className="font-bold text-brand-600">{it.qty}×</span>
            <span className="truncate flex-1">{it.name}</span>
          </div>
        ))}
      </div>
      {order.courierName && (
        <div className="mt-2 text-[10px] text-ink-500 flex items-center gap-1"><I.Bike size={10}/> {order.courierName}</div>
      )}
      <div className="mt-3">{action}</div>
    </div>
  );
}

export function RestoMenu({ restoId }) {
  const { restaurants, setRestaurants } = useOrders();
  const resto = restaurants.find(r => r.id === restoId);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const updateItem = (catIdx, itemId, patch) => {
    setRestaurants(prev => prev.map(r => r.id !== restoId ? r : ({
      ...r,
      menu: r.menu.map((c, i) => i !== catIdx ? c : ({
        ...c,
        items: c.items.map(it => it.id !== itemId ? it : ({ ...it, ...patch })),
      })),
    })));
  };
  const removeItem = (catIdx, itemId) => {
    setRestaurants(prev => prev.map(r => r.id !== restoId ? r : ({
      ...r,
      menu: r.menu.map((c, i) => i !== catIdx ? c : ({
        ...c,
        items: c.items.filter(it => it.id !== itemId),
      })),
    })));
  };
  const addItem = (catIdx, item) => {
    const newItem = { ...item, id: 'new-' + Date.now() };
    setRestaurants(prev => prev.map(r => r.id !== restoId ? r : ({
      ...r,
      menu: r.menu.map((c, i) => i !== catIdx ? c : ({
        ...c,
        items: [...c.items, newItem],
      })),
    })));
  };

  return (
    <div className="space-y-6">
      {resto.menu.map((cat, catIdx) => (
        <div key={cat.category}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-extrabold text-xl">{cat.category}</h2>
            <button onClick={() => setAdding({ catIdx, name:'', desc:'', price:0, img:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' })}
              className="cursor-grow inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition">
              <I.Plus size={14} stroke={3}/> Ajouter un plat
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.items.map(it => (
              <div key={it.id} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card overflow-hidden lift-on-hover">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <MenuItemImage src={it.img} alt="" className="w-full h-full object-cover"/>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => setEditing({ catIdx, ...it })} className="cursor-grow w-8 h-8 rounded-lg bg-white/90 grid place-items-center shadow hover:scale-110 transition">
                      ✏️
                    </button>
                    <button onClick={() => removeItem(catIdx, it.id)} className="cursor-grow w-8 h-8 rounded-lg bg-red-500 text-white grid place-items-center shadow hover:scale-110 transition">
                      <I.Trash size={14}/>
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-display font-bold">{it.name}</div>
                  <div className="text-xs text-ink-500 line-clamp-2">{it.desc}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display font-extrabold text-brand-600">{formatMad(it.price)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Actif</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit modal */}
      {editing && (
        <ModalOverlay onClose={() => setEditing(null)}>
          <h3 className="font-display font-bold text-xl mb-4">Modifier le plat</h3>
          <div className="space-y-3">
            <Input label="Nom"   value={editing.name}  onChange={v => setEditing({ ...editing, name:v })}/>
            <Input label="Description" value={editing.desc} onChange={v => setEditing({ ...editing, desc:v })}/>
            <Input label="Prix (MAD)" value={editing.price} onChange={v => setEditing({ ...editing, price: parseFloat(v) || 0 })}/>
            <div className="rounded-xl border-2 border-dashed border-ink-200 dark:border-ink-800 p-6 text-center cursor-pointer hover:border-brand-500 transition">
              <div className="text-3xl mb-2">📷</div>
              <div className="text-xs text-ink-500">Glisser-déposer une image (mock)</div>
            </div>
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            <Button variant="primary" onClick={() => { updateItem(editing.catIdx, editing.id, { name:editing.name, desc:editing.desc, price:editing.price }); setEditing(null); }}>Enregistrer</Button>
          </div>
        </ModalOverlay>
      )}

      {/* Add modal */}
      {adding && (
        <ModalOverlay onClose={() => setAdding(null)}>
          <h3 className="font-display font-bold text-xl mb-4">Nouveau plat</h3>
          <div className="space-y-3">
            <Input label="Nom"   value={adding.name}  onChange={v => setAdding({ ...adding, name:v })}/>
            <Input label="Description" value={adding.desc} onChange={v => setAdding({ ...adding, desc:v })}/>
            <Input label="Prix (MAD)" value={adding.price} onChange={v => setAdding({ ...adding, price: parseFloat(v) || 0 })}/>
            <div className="rounded-xl border-2 border-dashed border-ink-200 dark:border-ink-800 p-6 text-center cursor-pointer hover:border-brand-500 transition">
              <div className="text-3xl mb-2">📷</div>
              <div className="text-xs text-ink-500">Glisser-déposer une image (mock)</div>
            </div>
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAdding(null)}>Annuler</Button>
            <Button variant="primary" onClick={() => { addItem(adding.catIdx, { name:adding.name||'Nouveau plat', desc:adding.desc||'Description', price:adding.price||0, img:adding.img }); setAdding(null); }}>Ajouter</Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

export function RestoStats({ restoId }) {
  const { orders } = useOrders();
  const myOrders = orders.filter(o => o.restaurantId === restoId);
  const totalRev = myOrders.reduce((s,o) => s + o.totalDh, 0);
  const days = last7DayLabels();
  const barRaw = bucketOrderCountLast7DaysForRestaurant(orders, restoId);
  const lineRaw = bucketRevenueLast7DaysForRestaurant(orders, restoId);
  const barData = mergeSeries7(barRaw, MOCK_RESTAURANT_ORDERS_7D);
  const lineData = mergeSeries7(lineRaw, MOCK_RESTAURANT_REVENUE_7D);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Commandes" value={myOrders.length} icon={<I.Bag size={18}/>} color="from-sky-500 to-indigo-500"/>
        <StatCard label="CA"        value={formatMad(totalRev, { decimals: 0 })} icon={<I.Star size={18}/>} color="from-brand-500 to-pink-500"/>
        <StatCard label="Note"      value="4,8 ⭐"           icon={<I.Sparkle size={18}/>} color="from-amber-500 to-orange-500"/>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card">
          <h3 className="font-display font-bold mb-3">Commandes par jour</h3>
          <BarChart data={barData} labels={days} color1="from-sky-500" color2="to-indigo-400"/>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card">
          <h3 className="font-display font-bold mb-3">CA sur 7 jours</h3>
          <LineChart data={lineData} color="#3b82f6" color2="#06b6d4"/>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-500 mt-2">
            {days.map((d, i) => (
              <div key={i} className="text-center">{d}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
