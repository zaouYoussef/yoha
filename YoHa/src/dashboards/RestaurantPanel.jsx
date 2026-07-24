'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  formatMad,
  bucketOrderCountLast7DaysForRestaurant,
  bucketRevenueLast7DaysForRestaurant,
  last7DayLabels,
  orderFoodTotalMad,
  ORDER_STATES,
  isRestaurantActiveOrder,
  isRestaurantCancelledOrder,
  isRestaurantStatsOrder,
  defaultOpeningHours,
  normalizeOpeningHours,
  OPENING_DAY_KEYS,
  OPENING_DAY_LABELS,
} from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { restaurantsApi, restaurantPromosApi } from '@/lib/api';
import { DashLayout, LineChart, BarChart, StatCard, StatusPill } from './DashShared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ImageUpload } from '../components/ui/ImageUpload.jsx';
import { OrderRestaurantNotes } from '../components/ui/OrderRestaurantNotes.jsx';
import { CancelOrderButton, CancelPhaseBadge, OrderCancellationNote } from '../components/ui/CancelOrderButton.jsx';

const CUISINES = [
  { value: 'pizza', label: 'Pizza' },
  { value: 'tacos', label: 'Tacos' },
  { value: 'kebab', label: 'Kebab' },
  { value: 'sushi', label: 'Sushi' },
  { value: 'burger', label: 'Burger' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'medical', label: 'Médical' },
  { value: 'asian', label: 'Asiatique' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drinks', label: 'Boissons' },
];

export function RestaurantDashboard({ goto, dark, setDark }) {
  const [current, setCurrent] = useState('incoming');
  const [myResto, setMyResto] = useState(undefined);
  const [loadError, setLoadError] = useState('');

  const reloadResto = useCallback(() => {
    setLoadError('');
    return restaurantsApi.me()
      .then(setMyResto)
      .catch((e) => {
        if (e.status === 404) {
          setMyResto(null);
          return;
        }
        setLoadError(e.message || 'Impossible de charger le restaurant.');
        setMyResto(null);
      });
  }, []);

  useEffect(() => {
    reloadResto();
  }, [reloadResto]);

  const restoId = myResto?.id;
  const titles = {
    incoming: 'Commandes entrantes',
    profile: 'Mon établissement',
    menu: 'Mon menu',
    promos: 'Codes promo',
    stats: 'Statistiques',
  };

  if (myResto === undefined) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-500">
        Chargement du restaurant…
      </div>
    );
  }

  if (loadError && myResto === null) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-4">
        <p className="text-ink-500 mb-4">{loadError}</p>
        <Button onClick={reloadResto}>Réessayer</Button>
      </div>
    );
  }

  if (!myResto) {
    return (
      <DashLayout kind="restaurant" current="profile" setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
        title="Créer mon restaurant" subtitle="Configurez votre établissement sur YoHa">
        <RestoCreate onCreated={(r) => { setMyResto(r); setCurrent('profile'); }} />
      </DashLayout>
    );
  }

  return (
    <DashLayout kind="restaurant" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle={`Connecté en tant que ${myResto.name}`}>
      {current === 'incoming' && <RestoIncoming restoId={restoId}/>}
      {current === 'profile' && <RestoProfile restaurant={myResto} onUpdated={setMyResto} />}
      {current === 'menu' && <RestoMenu restaurant={myResto} onRefresh={reloadResto} />}
      {current === 'promos' && <RestoPromos />}
      {current === 'stats' && <RestoStats restoId={restoId}/>}
    </DashLayout>
  );
}

export function RestoCreate({ onCreated }) {
  const [form, setForm] = useState({ name: '', cuisine: 'pizza', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const resto = await restaurantsApi.create({
        name: form.name.trim(),
        cuisine: form.cuisine,
        description: form.description.trim(),
      });
      onCreated(resto);
    } catch (err) {
      setError(err.message || 'Création impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <p className="text-sm text-ink-500">
        Les photos seront compressées automatiquement en WebP pour un chargement rapide.
      </p>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Nom du restaurant</span>
        <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Type de cuisine</span>
        <select value={form.cuisine} onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900">
          {CUISINES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Description</span>
        <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={busy} variant="primary">{busy ? 'Création…' : 'Créer mon restaurant'}</Button>
    </form>
  );
}

export function RestoProfile({ restaurant, onUpdated }) {
  const [form, setForm] = useState({
    name: restaurant.name,
    description: restaurant.description || '',
    promo_label: restaurant.promo || '',
    phone: restaurant.phone || '',
    opening_hours: normalizeOpeningHours(restaurant.openingHours),
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setForm({
      name: restaurant.name,
      description: restaurant.description || '',
      promo_label: restaurant.promo || '',
      phone: restaurant.phone || '',
      opening_hours: normalizeOpeningHours(restaurant.openingHours),
    });
  }, [restaurant]);

  const setDayHours = (day, patch) => {
    setForm((f) => ({
      ...f,
      opening_hours: {
        ...f.opening_hours,
        [day]: { ...f.opening_hours[day], ...patch },
      },
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const updated = await restaurantsApi.updateMe({
        name: form.name.trim(),
        description: form.description.trim(),
        promo_label: form.promo_label.trim(),
        phone: form.phone.trim(),
        opening_hours: normalizeOpeningHours(form.opening_hours),
      });
      onUpdated(updated);
      setMsg('Profil enregistré.');
    } catch (err) {
      setMsg(err.message || 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  const uploadCover = async (file) => {
    await restaurantsApi.uploadMedia('cover', file);
    const updated = await restaurantsApi.me();
    onUpdated(updated);
  };

  const uploadLogo = async (file) => {
    await restaurantsApi.uploadMedia('logo', file);
    const updated = await restaurantsApi.me();
    onUpdated(updated);
  };

  return (
    <form onSubmit={save} className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <ImageUpload
            label="Photo de couverture"
            hint="Max 8 Mo — convertie en WebP (~10× plus léger). Miniature auto pour les listes."
            currentUrl={restaurant.cover}
            onUpload={uploadCover}
            aspect="aspect-[16/9]"
          />
          <ImageUpload
            label="Logo"
            hint="Carré recommandé — redimensionné à 256 px."
            currentUrl={restaurant.logo}
            onUpload={uploadLogo}
            aspect="aspect-square max-w-[200px]"
          />
        </div>
        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Nom</span>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Description</span>
            <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Promo affichée</span>
            <input value={form.promo_label} onChange={(e) => setForm((f) => ({ ...f, promo_label: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">WhatsApp</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+212 6 12 34 56 78"
              className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"
            />
            <p className="text-xs text-ink-500">
              Visible par le livreur pour vous contacter lors d&apos;une course (bouton WhatsApp).
            </p>
          </label>
        </div>
      </div>

      <section className="rounded-2xl border border-ink-200/60 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-display font-bold text-lg">Horaires d&apos;ouverture</h3>
          <p className="text-sm text-ink-500 mt-1">
            Cochez <strong>24h/24</strong> pour ouvrir toute la journée, ou définissez une plage (ex. 10:00 → 23:00).
          </p>
        </div>
        <div className="space-y-2">
          {OPENING_DAY_KEYS.map((day) => {
            const slot = form.opening_hours[day] || defaultOpeningHours()[day];
            const is24h = slot.is_24h || (!slot.is_closed && slot.open === slot.close);
            return (
              <div
                key={day}
                className="flex flex-wrap items-center gap-3 py-2 border-b border-ink-100 dark:border-ink-800 last:border-0"
              >
                <span className="w-24 shrink-0 text-sm font-semibold">{OPENING_DAY_LABELS[day]}</span>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={slot.is_closed}
                    onChange={(e) => setDayHours(day, {
                      is_closed: e.target.checked,
                      is_24h: e.target.checked ? false : slot.is_24h,
                    })}
                  />
                  Fermé
                </label>
                {!slot.is_closed ? (
                  <>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={is24h}
                        onChange={(e) => setDayHours(day, e.target.checked
                          ? { is_24h: true, open: '00:00', close: '00:00', is_closed: false }
                          : { is_24h: false, open: '10:00', close: '23:00' })}
                      />
                      24h/24
                    </label>
                    {!is24h ? (
                      <>
                        <label className="inline-flex items-center gap-1.5 text-sm">
                          <span className="text-ink-500">Ouverture</span>
                          <input
                            type="time"
                            required
                            value={slot.open}
                            onChange={(e) => setDayHours(day, { open: e.target.value, is_24h: false })}
                            className="px-2 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"
                          />
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-sm">
                          <span className="text-ink-500">Fermeture</span>
                          <input
                            type="time"
                            required
                            value={slot.close}
                            onChange={(e) => setDayHours(day, { close: e.target.value, is_24h: false })}
                            className="px-2 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"
                          />
                        </label>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-emerald-600">Ouvert toute la journée</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-ink-400">Journée de repos</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {msg && <p className={`text-sm ${msg.includes('Erreur') ? 'text-red-500' : 'text-emerald-600'}`}>{msg}</p>}
      <Button type="submit" disabled={busy} variant="primary">{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
    </form>
  );
}

function belongsToRestaurant(order, restoId) {
  if (!restoId) return true;
  return order.restaurantId === restoId;
}

function formatOrderWhen(createdAt) {
  if (!createdAt) return '';
  return new Date(createdAt).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RestoIncoming({ restoId }) {
  const { orders, loadingOrders, updateOrderStatus, cancelOrder } = useOrders();

  const activeOrders = orders
    .filter((o) => belongsToRestaurant(o, restoId) && isRestaurantActiveOrder(o.status))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const cancelledOrders = orders
    .filter((o) => belongsToRestaurant(o, restoId) && isRestaurantCancelledOrder(o))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const actionForOrder = (o) => {
    if (o.status === 'pickup_confirmed') {
      return (
        <>
          <div className="px-3 py-2 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-400 text-xs font-bold text-center mb-2">
            🛵 Livreur en route vers vous
          </div>
          <Button onClick={() => updateOrderStatus(o.id, 'preparing')} variant="primary" size="md" className="w-full justify-center mb-2">
            ✅ Accepter & préparer
          </Button>
          <CancelOrderButton
            phase="before_pickup"
            onCancel={(reason) => cancelOrder(o.id, reason)}
            label="Annuler la commande"
          />
        </>
      );
    }
    if (o.status === 'preparing') {
      return (
        <>
          <div className="px-3 py-2 rounded-xl bg-violet-500/10 text-violet-600 text-xs font-bold text-center mb-2">
            {o.courierName
              ? <>👨‍🍳 Prête — {o.courierName} va récupérer</>
              : <>👨‍🍳 En préparation — livreur en attente d&apos;assignation</>}
          </div>
          <CancelOrderButton
            phase="before_pickup"
            onCancel={(reason) => cancelOrder(o.id, reason)}
            label="Annuler (avant récupération)"
          />
        </>
      );
    }
    return null;
  };

  if (loadingOrders && activeOrders.length === 0 && cancelledOrders.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-200 dark:border-ink-800 py-16 text-center text-sm text-ink-500">
        Chargement des commandes…
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display font-bold text-lg mb-4">En cours</h2>
        {activeOrders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-800 py-16 text-center text-sm text-ink-500">
            Aucune commande active pour ce restaurant.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeOrders.map((o) => (
              <RestoOrderCard key={o.id} order={o} action={actionForOrder(o)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-lg mb-1">Annulées</h2>
        <p className="text-sm text-ink-500 mb-4">
          Annulées avant récupération par le livreur.
        </p>
        {cancelledOrders.length === 0 ? (
          <div className="rounded-2xl border border-ink-200/60 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/40 py-12 text-center text-sm text-ink-500">
            Aucune commande annulée.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {cancelledOrders.map((o) => (
              <RestoOrderCard
                key={o.id}
                order={o}
                completed
                action={
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status="cancelled" />
                      {o.cancelledPhase && <CancelPhaseBadge phase={o.cancelledPhase} />}
                    </div>
                    <OrderCancellationNote reason={o.cancellationReason} />
                    {o.courierName && (
                      <span className="text-[10px] text-ink-500 inline-flex items-center gap-1">
                        <I.Bike size={10}/> {o.courierName}
                      </span>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function RestoOrderCard({ order, action, completed = false }) {
  const statusLabel = ORDER_STATES[order.status]?.label;

  return (
    <div className={`rounded-xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 p-3 shadow-card lift-on-hover ${completed ? 'opacity-90' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-sm">#{order.id}</div>
          <div className="text-[11px] text-ink-500">{order.customer?.name}</div>
          {order.createdAt && (
            <div className="text-[10px] text-ink-400 mt-0.5">{formatOrderWhen(order.createdAt)}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-sm">{formatMad(orderFoodTotalMad(order), { decimals: 0 })}</div>
          <div className="text-[10px] text-ink-500">{(order.items || []).reduce((s,i) => s+i.qty, 0)} art.</div>
          {!completed && statusLabel && (
            <div className="mt-1">
              <StatusPill status={order.status} className="text-[9px] px-2 py-0.5" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {(order.items || []).map(it => (
          <div key={it.db_id || it.id} className="flex items-center gap-2 text-xs">
            <span className="font-bold text-brand-600">{it.qty}×</span>
            <span className="truncate flex-1">{it.name}</span>
          </div>
        ))}
      </div>
      <OrderRestaurantNotes notes={order.restaurantNotes} className="mt-2" />
      {order.courierName && (
        <div className="mt-2 text-[10px] text-ink-500 flex items-center gap-1"><I.Bike size={10}/> {order.courierName}</div>
      )}
      <div className="mt-3">{action}</div>
    </div>
  );
}

export function RestoMenu({ restaurant, onRefresh }) {
  const [newCat, setNewCat] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [draftItem, setDraftItem] = useState(null);
  const [busy, setBusy] = useState(false);

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      await restaurantsApi.createCategory({ name });
      setNewCat('');
      await onRefresh();
    } finally {
      setAddingCat(false);
    }
  };

  const saveItem = async (categoryDbId, data, dbId) => {
    setBusy(true);
    try {
      if (dbId) {
        await restaurantsApi.updateMenuItem(dbId, {
          name: data.name,
          desc: data.desc,
          ingredients: data.ingredients,
          price: data.price,
          is_available: data.is_available,
        });
      } else {
        await restaurantsApi.createMenuItem(categoryDbId, {
          name: data.name,
          desc: data.desc,
          ingredients: data.ingredients,
          price: data.price,
        });
      }
      setDraftItem(null);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (dbId) => {
    if (!window.confirm('Supprimer ce plat ?')) return;
    setBusy(true);
    try {
      await restaurantsApi.deleteMenuItem(dbId);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const uploadItemPhoto = async (dbId, file) => {
    await restaurantsApi.uploadMenuItemImage(dbId, file);
    await onRefresh();
  };

  if (!restaurant?.menu?.length) {
    return (
      <div className="space-y-4 max-w-md">
        <p className="text-sm text-ink-500">Commencez par créer une catégorie (ex. « Entrées », « Plats »).</p>
        <div className="flex gap-2">
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nom de la catégorie"
            className="flex-1 px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
          <Button onClick={addCategory} disabled={addingCat} variant="primary">Ajouter</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-ink-500">
        Photos compressées en WebP côté serveur — stockage objet, pas dans la base de données.
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nouvelle catégorie"
          className="px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
        <Button onClick={addCategory} disabled={addingCat} size="sm" variant="secondary">+ Catégorie</Button>
      </div>

      {restaurant.menu.map((cat) => (
        <div key={cat.db_id || cat.category}>
          <h2 className="font-display font-extrabold text-xl mb-3">{cat.category}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.items.map((it) => (
              <div key={it.db_id || it.id} className={`rounded-2xl bg-white dark:bg-ink-900 border shadow-card overflow-hidden ${!it.is_available ? 'opacity-60' : ''} border-ink-200/60 dark:border-ink-800`}>
                <ImageUpload
                  currentUrl={it.img}
                  onUpload={(file) => uploadItemPhoto(it.db_id, file)}
                  aspect="aspect-[4/3]"
                  busy={busy}
                />
                <div className="p-3 space-y-2">
                  <div className="font-display font-bold">{it.name}</div>
                  <div className="text-xs text-ink-500 line-clamp-2">{it.desc}</div>
                  <div className="font-display font-extrabold text-brand-600">{formatMad(it.price)}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setDraftItem({ ...it, categoryDbId: cat.db_id })}>Modifier</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeItem(it.db_id)}>Supprimer</Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      await restaurantsApi.updateMenuItem(it.db_id, { is_available: !it.is_available });
                      await onRefresh();
                    }}>
                      {it.is_available ? 'Masquer' : 'Afficher'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setDraftItem({ categoryDbId: cat.db_id, name: '', desc: '', ingredients: '', price: '9.90' })}
              className="rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-700 min-h-[200px] flex flex-col items-center justify-center text-ink-500 hover:border-brand-400 hover:text-brand-600 transition">
              <I.Plus size={24}/> Ajouter un plat
            </button>
          </div>
        </div>
      ))}

      {draftItem && (
        <ItemDraftModal
          item={draftItem}
          busy={busy}
          onClose={() => setDraftItem(null)}
          onSave={(data) => saveItem(draftItem.categoryDbId, data, draftItem.db_id)}
        />
      )}
    </div>
  );
}

function ItemDraftModal({ item, busy, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item.name || '',
    desc: item.desc || '',
    ingredients: item.ingredients || '',
    price: String(item.price ?? '9.90'),
    is_available: item.is_available !== false,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <form
        className="bg-white dark:bg-ink-900 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <h3 className="font-display font-bold text-lg">{item.db_id ? 'Modifier le plat' : 'Nouveau plat'}</h3>
        <input required placeholder="Nom" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
        <input placeholder="Accroche courte (ex. Spécialité maison)" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
        <textarea placeholder="Ingrédients et description détaillée (visible quand le client clique sur le plat)" rows={4} value={form.ingredients} onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
        <input required type="number" step="0.01" min="0" placeholder="Prix (MAD)" value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"/>
        {item.db_id && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}/>
            Visible dans le menu client
          </label>
        )}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? '…' : 'Enregistrer'}</Button>
        </div>
      </form>
    </div>
  );
}

export function RestoPromos() {
  const [promos, setPromos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadPromos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await restaurantPromosApi.list();
      setPromos(Array.isArray(data) ? data : []);
    } catch {
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPromos(); }, [loadPromos]);

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
    setError('');
  };

  const handleEdit = (promo) => {
    setEditing(promo);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (promo) => {
    if (!window.confirm(`Supprimer le code "${promo.code}" ?`)) return;
    setBusy(true);
    try {
      await restaurantPromosApi.remove(promo.id);
      await loadPromos();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (promo) => {
    setBusy(true);
    try {
      await restaurantPromosApi.update(promo.id, { active: !promo.active });
      await loadPromos();
    } catch (err) {
      setError(err.message || 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (formData) => {
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await restaurantPromosApi.update(editing.id, formData);
      } else {
        await restaurantPromosApi.create(formData);
      }
      setShowForm(false);
      setEditing(null);
      await loadPromos();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-200 dark:border-ink-800 py-16 text-center text-sm text-ink-500">
        Chargement des codes promo…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          Créez des codes promo réductions pour vos clients. Le code est appliqué au panier lors du paiement.
        </p>
        <Button onClick={handleCreate} variant="primary" size="sm">
          <span className="flex items-center gap-1.5"><I.Plus size={14}/> Nouveau code</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {promos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-800 py-16 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="font-display font-bold text-lg">Aucun code promo</p>
          <p className="text-sm text-ink-500 mt-1">Créez votre premier code pour attirer des clients !</p>
          <Button onClick={handleCreate} variant="primary" size="sm" className="mt-4">
            Créer un code promo
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {promos.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              onEdit={() => handleEdit(promo)}
              onDelete={() => handleDelete(promo)}
              onToggle={() => handleToggle(promo)}
              busy={busy}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PromoFormModal
          promo={editing}
          busy={busy}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function PromoCard({ promo, onEdit, onDelete, onToggle, busy }) {
  const expired = promo.expires_at && new Date(promo.expires_at) < new Date();
  const limitReached = promo.usage_limit && promo.usage_count >= promo.usage_limit;
  const isInactive = !promo.active || expired || limitReached;

  return (
    <div className={`rounded-2xl border bg-white dark:bg-ink-900 p-4 transition ${
      isInactive
        ? 'border-ink-200/60 dark:border-ink-800 opacity-70'
        : 'border-brand-200 dark:border-brand-800 shadow-card'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-mono font-black text-lg tracking-wide ${isInactive ? 'text-ink-400' : 'text-brand-600'}`}>
              {promo.code}
            </span>
            {isInactive && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ink-100 dark:bg-ink-800 text-ink-500">
                {expired ? 'Expiré' : limitReached ? 'Épuisé' : 'Inactif'}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display font-black text-2xl text-emerald-600">-{promo.discount}%</span>
            {promo.min_order_mad && (
              <span className="text-xs text-ink-500">min. {formatMad(Number(promo.min_order_mad))}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy || expired || limitReached}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            promo.active ? 'bg-emerald-500' : 'bg-ink-300 dark:bg-ink-600'
          } ${busy ? 'opacity-50' : ''}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            promo.active ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span className="flex items-center gap-1">
          <I.Bag size={12}/> {promo.usage_count || 0} utilisation{promo.usage_count !== 1 ? 's' : ''}
        </span>
        {promo.usage_limit && (
          <span>/ {promo.usage_limit} max</span>
        )}
        {promo.expires_at && (
          <span className={expired ? 'text-red-500 font-semibold' : ''}>
            <I.Clock size={12} className="inline -mt-0.5"/> Expire le {new Date(promo.expires_at).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit} disabled={busy}>Modifier</Button>
        <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy} className="text-red-500 hover:text-red-600">
          <I.Trash size={12}/> Supprimer
        </Button>
      </div>
    </div>
  );
}

function PromoFormModal({ promo, busy, onClose, onSave }) {
  const [form, setForm] = useState({
    code: promo?.code || '',
    discount: String(promo?.discount || ''),
    min_order_mad: promo?.min_order_mad ? String(promo.min_order_mad) : '',
    expires_at: promo?.expires_at ? new Date(promo.expires_at).toISOString().slice(0, 16) : '',
    usage_limit: promo?.usage_limit ? String(promo.usage_limit) : '',
  });

  const submit = (e) => {
    e.preventDefault();
    onSave({
      code: form.code.trim().toUpperCase(),
      discount: Number(form.discount),
      min_order_mad: form.min_order_mad ? Number(form.min_order_mad) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <form
        className="bg-white dark:bg-ink-900 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h3 className="font-display font-bold text-lg">
          {promo ? 'Modifier le code promo' : 'Nouveau code promo'}
        </h3>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Code promo</span>
          <input
            required
            maxLength={50}
            placeholder="EX: BIENVENUE15"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 font-mono font-bold uppercase tracking-wider"
          />
          <p className="text-xs text-ink-400">Le code sera converti en majuscules automatiquement.</p>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Remise (%)</span>
          <input
            required
            type="number"
            min="1"
            max="100"
            placeholder="15"
            value={form.discount}
            onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Commande min. (MAD)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Optionnel"
              value={form.min_order_mad}
              onChange={(e) => setForm((f) => ({ ...f, min_order_mad: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Limite d'utilisation</span>
            <input
              type="number"
              min="1"
              placeholder="Illimité"
              value={form.usage_limit}
              onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Date d&apos;expiration</span>
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"
          />
          <p className="text-xs text-ink-400">Laissez vide pour un code sans expiration.</p>
        </label>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? '…' : promo ? 'Enregistrer' : 'Créer le code'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function RestoStats({ restoId }) {
  const { orders, loadingOrders } = useOrders();
  const myOrders = orders.filter((o) => o.restaurantId === restoId && isRestaurantStatsOrder(o));
  const totalRev = myOrders.reduce((s, o) => s + orderFoodTotalMad(o), 0);
  const days = last7DayLabels();
  const barData = bucketOrderCountLast7DaysForRestaurant(orders, restoId);
  const lineData = bucketRevenueLast7DaysForRestaurant(orders, restoId);
  const hasData = myOrders.length > 0;

  if (loadingOrders && !hasData) {
    return (
      <div className="py-16 text-center text-ink-500 text-sm">
        Chargement des statistiques…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-900/40 px-4 py-8 text-center">
          <p className="font-display font-bold text-lg">Aucune commande pour l&apos;instant</p>
          <p className="mt-1 text-sm text-ink-500">
            Les graphiques se rempliront dès que des clients commanderont chez vous.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Commandes" value={myOrders.length} icon={<I.Bag size={18}/>} color="from-sky-500 to-indigo-500"/>
        <StatCard label="CA (plats)" value={formatMad(totalRev, { decimals: 0 })} icon={<I.Bag size={18}/>} color="from-brand-500 to-pink-500"/>
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
