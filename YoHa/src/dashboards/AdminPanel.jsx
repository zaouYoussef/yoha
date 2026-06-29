'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  ORDER_STATES,
  bucketRevenueLast7Days,
  bucketOrderCountLast7Days,
  last7DayLabels,
  mergeSeries7,
  mergeDonutFromOrders,
  MOCK_ADMIN_REVENUE_7D,
  MOCK_ADMIN_ORDERS_7D,
  MOCK_ADMIN_DONUT,
  isActiveOrderStatus,
} from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { apiFetch } from '../lib/api.js';
import {
  DashLayout,
  LineChart,
  BarChart,
  DonutChart,
  StatCard,
  StatusPill,
} from './DashShared.jsx';
import { CancelPhaseBadge, OrderCancellationNote } from '../components/ui/CancelOrderButton.jsx';

function revenueWeekTrendPct(rev7) {
  const a = rev7[5] || 0;
  const b = rev7[6] || 0;
  if (a <= 0) return b > 0 ? 100 : 0;
  return Math.round(((b - a) / a) * 100);
}

export function AdminDashboard({ goto, dark, setDark }) {
  const [current, setCurrent] = useState('overview');
  const { orders, restaurants } = useOrders();
  const restaurantPartnersCount = restaurants.filter((r) => r.cuisine !== 'pharmacy').length;

  const titles = {
    overview:'Tableau de bord',
    orders:'Toutes les commandes',
    restaurants:'Restaurants',
    couriers:'Livreurs',
    revenue:'Revenus & Bénéfices',
    promos:'Codes promo',
  };

  return (
    <DashLayout kind="admin" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle="Vue d'ensemble de la plateforme YoHa">
      {current === 'overview'    && <AdminOverview orders={orders} restaurantCount={restaurantPartnersCount}/>}
      {current === 'orders'      && <AdminOrders orders={orders}/>}
      {current === 'restaurants' && <AdminRestaurants/>}
      {current === 'couriers'    && <AdminCouriers/>}
      {current === 'revenue'     && <AdminRevenue orders={orders}/>}
      {current === 'promos'      && <AdminPromos/>}
    </DashLayout>
  );
}

export function AdminOverview({ orders, restaurantCount = 0 }) {
  const dayAgo = Date.now() - 1000 * 60 * 60 * 24;
  const today = orders.filter((o) => o.createdAt >= dayAgo);
  const active = orders.filter((o) => isActiveOrderStatus(o.status));
  const totalRev = orders.reduce((s, o) => s + (Number(o.totalDh) || 0), 0);
  const totalProf = orders.reduce((s, o) => s + (Number(o.netDh) || 0), 0);
  const grossProf = orders.reduce((s, o) => s + (Number(o.profitDh) || 0), 0);
  const rev7Raw = bucketRevenueLast7Days(orders);
  const ord7Raw = bucketOrderCountLast7Days(orders);
  const rev7 = mergeSeries7(rev7Raw, MOCK_ADMIN_REVENUE_7D);
  const ord7 = mergeSeries7(ord7Raw, MOCK_ADMIN_ORDERS_7D);
  const days = last7DayLabels();
  const revTrendPct = revenueWeekTrendPct(rev7);

  const donut = mergeDonutFromOrders(orders, MOCK_ADMIN_DONUT);
  const donutColors = ['#f97316','#ec4899','#8b5cf6','#3b82f6','#10b981'];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Commandes total"   value={orders.length}                            sub="Cumulé"          icon={<I.Bag size={18}/>}    color="from-brand-500 to-orange-500"/>
        <StatCard label="Aujourd'hui"        value={today.length}                              sub="Dernières 24 h"   icon={<I.Bell size={18}/>}   color="from-pink-500 to-rose-500"/>
        <StatCard label="Revenus totaux"     value={`${totalRev.toLocaleString('fr-FR')} MAD`}              sub="Somme des commandes" icon={<I.Star size={18}/>} color="from-violet-500 to-fuchsia-500"/>
        <StatCard label="Livraisons actives" value={active.length}                             sub="Non livrées"        icon={<I.Bike size={18}/>}   color="from-sky-500 to-indigo-500"/>
        <StatCard label="Restaurants & co." value={restaurantCount}                        sub="Sans pharmacie campus"     icon={<I.Chef size={18}/>}   color="from-emerald-500 to-teal-500"/>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-ink-200/60 bg-white p-4 shadow-card dark:border-ink-800 dark:bg-ink-900 sm:p-5">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Revenus 7 derniers jours</div>
              <div className="mt-1 font-display text-xl font-extrabold sm:text-2xl">{rev7.reduce((a,b)=>a+b,0).toLocaleString('fr-FR')} MAD</div>
            </div>
            <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${revTrendPct >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              {revTrendPct >= 0 ? '▲' : '▼'} {Math.abs(revTrendPct)}% <span className="hidden font-normal opacity-80 sm:inline">(hier → auj.)</span>
            </span>
          </div>
          <LineChart data={rev7} color="#f97316" color2="#ec4899"/>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-500 mt-2">
            {days.map((d, i) => <div key={i} className="text-center">{d}</div>)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Activité par resto</div>
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 min-w-0">
            <DonutChart data={donut} colors={donutColors}/>
            <div className="flex-1 space-y-1.5 text-xs w-full min-w-0">
              {donut.map((d, i) => (
                <div key={`${d.label}-${i}`} className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: donutColors[i % donutColors.length] }}></span>
                  <span className="truncate">{d.label}</span>
                  <span className="ml-auto font-bold shrink-0">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Commandes par jour</div>
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-brand-500/10 text-brand-600">7j · {ord7.reduce((a,b)=>a+b,0)}</span>
          </div>
          <BarChart data={ord7} labels={days}/>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 dark:from-black text-white border border-ink-800 shadow-card relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-brand-500/40 blur-3xl"></div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Bénéfice net cumulé</div>
          <div className="font-display font-black text-4xl mt-2 text-gradient">{totalProf.toFixed(0)} MAD</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="opacity-70">Bénéfice brut</span><b>{grossProf.toFixed(0)} MAD</b></div>
            <div className="border-t border-white/10 pt-2 flex justify-between"><span>Net</span><b className="text-emerald-400">{totalProf.toFixed(0)} MAD</b></div>
          </div>
        </div>
      </div>

      <RecentOrdersTable orders={orders.slice(0, 8)} title="Dernières commandes"/>
    </div>
  );
}

export function AdminOrders({ orders }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter==='all'} onClick={() => setFilter('all')}>Toutes ({orders.length})</FilterChip>
        {Object.entries(ORDER_STATES).map(([k, s]) => {
          const count = orders.filter(o => o.status === k).length;
          return (
            <FilterChip key={k} active={filter===k} onClick={() => setFilter(k)}>{s.label} ({count})</FilterChip>
          );
        })}
      </div>
      <RecentOrdersTable orders={filtered} title={`${filtered.length} commandes`} full/>
    </div>
  );
}

export function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`cursor-grow px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${active
        ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900 shadow-md'
        : 'bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 hover:border-brand-500'}`}>
      {children}
    </button>
  );
}

export function RecentOrdersTable({ orders, title, full, gainMad, hideCourier = false, hideViewAll = false, showCancellation = false }) {
  const showGain = gainMad != null || full;
  const gainLabel = gainMad != null ? 'Gain' : 'Profit net';
  const gainValue = (o) => {
    if (o.status === 'cancelled') return 0;
    return gainMad != null ? gainMad : Number(o.netDh || 0);
  };
  const colCount = 5 + (hideCourier ? 0 : 1) + (showGain ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/60 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between gap-2 border-b border-ink-200/60 px-4 py-3 dark:border-ink-800 sm:px-5 sm:py-4">
        <h3 className="min-w-0 truncate font-display font-bold">{title}</h3>
        {!hideViewAll && (
          <button type="button" className="shrink-0 cursor-grow text-xs font-bold text-brand-600">
            Tout voir
          </button>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500 dark:bg-ink-950/50">
            <tr>
              <th className="px-4 py-3 text-left sm:px-5">Commande</th>
              <th className="px-4 py-3 text-left sm:px-5">Client</th>
              <th className="px-4 py-3 text-left sm:px-5">Restaurant</th>
              {!hideCourier && (
                <th className="px-4 py-3 text-left sm:px-5">Livreur</th>
              )}
              <th className="px-4 py-3 text-right sm:px-5">Total</th>
              {showGain && (
                <th className="px-4 py-3 text-right sm:px-5">{gainLabel}</th>
              )}
              <th className="px-4 py-3 text-left sm:px-5">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
            {orders.map((o) => (
              <tr key={o.id} className="transition hover:bg-ink-50 dark:hover:bg-ink-950/30">
                <td className="break-anywhere px-4 py-3 font-bold sm:px-5">#{o.id}</td>
                <td className="max-w-[8rem] truncate px-4 py-3 sm:px-5">{o.customer?.name || '—'}</td>
                <td className="max-w-[8rem] truncate px-4 py-3 sm:px-5">{o.restaurantName}</td>
                {!hideCourier && (
                  <td className="max-w-[8rem] truncate px-4 py-3 text-ink-500 sm:px-5">
                    {o.courierName || '—'}
                  </td>
                )}
                <td className="px-4 py-3 text-right font-bold sm:px-5">
                  {Number(o.totalDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD
                </td>
                {showGain && (
                  <td className="px-4 py-3 text-right font-bold sm:px-5">
                    {o.status === 'cancelled' ? (
                      <span className="text-ink-400">—</span>
                    ) : (
                      <span className="text-emerald-600">
                        +{gainValue(o).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD
                      </span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-1 items-start">
                    <StatusPill status={o.status} />
                    {showCancellation && o.status === 'cancelled' && o.cancelledPhase && (
                      <CancelPhaseBadge phase={o.cancelledPhase} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-5 py-12 text-center text-ink-400">
                  Aucune commande
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {orders.length === 0 ? (
          <div className="py-10 text-center text-ink-400">Aucune commande</div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-ink-200/60 bg-ink-50/50 p-3 dark:border-ink-800 dark:bg-ink-950/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="break-anywhere font-bold">#{o.id}</div>
                  <div className="mt-0.5 truncate text-sm text-ink-500">{o.restaurantName}</div>
                </div>
                <StatusPill status={o.status} />
              </div>
              {showCancellation && o.status === 'cancelled' && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {o.cancelledPhase && <CancelPhaseBadge phase={o.cancelledPhase} />}
                  <OrderCancellationNote reason={o.cancellationReason} className="mt-0" />
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="min-w-0 rounded-lg bg-white p-2 dark:bg-ink-900">
                  <div className="text-ink-400">Client</div>
                  <div className="truncate font-semibold">{o.customer?.name || '—'}</div>
                </div>
                {!hideCourier && (
                  <div className="min-w-0 rounded-lg bg-white p-2 dark:bg-ink-900">
                    <div className="text-ink-400">Livreur</div>
                    <div className="truncate font-semibold">{o.courierName || '—'}</div>
                  </div>
                )}
                <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-900/20">
                  <div className="text-ink-400">Total</div>
                  <div className="font-bold text-brand-600">
                    {Number(o.totalDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD
                  </div>
                </div>
                {showGain && (
                  <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                    <div className="text-ink-400">{gainLabel}</div>
                    <div className="font-bold text-emerald-600">
                      {o.status === 'cancelled'
                        ? '—'
                        : `+${gainValue(o).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminRestaurants() {
  const { restaurants, refreshRestaurants } = useOrders();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('pizza');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerDisplayName, setOwnerDisplayName] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Supprimer ce restaurant ?')) return;
    try {
      await apiFetch(`/restaurants/youssef/${id}/`, { method: 'DELETE', auth: true });
      refreshRestaurants();
    } catch (e) {
      setError(e.message || 'Erreur');
    }
  }, [refreshRestaurants]);

  const handleAdd = useCallback(async () => {
    setError('');
    if (!name.trim()) { setError('Nom requis'); return; }
    setAdding(true);
    try {
      const body = { name: name.trim(), cuisine, description, phone };
      if (ownerEmail.trim()) {
        body.email = ownerEmail.trim();
        if (ownerPassword) body.password = ownerPassword;
        if (ownerDisplayName.trim()) body.display_name = ownerDisplayName.trim();
      }
      await apiFetch('/restaurants/youssef/create/', {
        method: 'POST',
        body,
        auth: true,
      });
      setName('');
      setDescription('');
      setPhone('');
      setOwnerEmail('');
      setOwnerPassword('');
      setOwnerDisplayName('');
      setShowForm(false);
      refreshRestaurants();
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setAdding(false);
    }
  }, [name, cuisine, description, phone, ownerEmail, ownerPassword, ownerDisplayName, refreshRestaurants]);

  const CUISINE_LABELS = {
    pizza:'Pizza', tacos:'Tacos', kebab:'Kebab', sushi:'Sushi',
    burger:'Burger', healthy:'Healthy', asian:'Asiatique', medical:'Médical',
    dessert:'Dessert', drinks:'Boissons', supermarket:'Supermarché',
    shop:'Magasins', parapharmacy:'Parapharmacie',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg">{restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''}</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="cursor-grow rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-transform">
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-ink-200/60 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Nom</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du restaurant"
                className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Cuisine</label>
              <select value={cuisine} onChange={e => setCuisine(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white">
                {Object.entries(CUISINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white resize-none"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Téléphone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+212 5 39 12 34 56"
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
          </div>
          <div className="border-t border-ink-200/60 dark:border-ink-800 pt-3 mt-1">
            <p className="text-xs font-semibold text-ink-400 mb-2">Compte propriétaire (optionnel)</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Email</label>
                <input value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="restaurant@yoha.ma" type="email"
                  className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Nom d'affichage</label>
                <input value={ownerDisplayName} onChange={e => setOwnerDisplayName(e.target.value)} placeholder="Nom du gérant"
                  className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Mot de passe</label>
                <input value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} placeholder="••••••" type="password"
                  className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
              </div>
            </div>
          </div>
          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
          <button onClick={handleAdd} disabled={adding}
            className="cursor-grow rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-transform disabled:opacity-50">
            {adding ? 'Ajout…' : 'Créer le restaurant'}
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map(r => (
          <div key={r.id} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card overflow-hidden">
            <img src={r.cover} className="h-32 w-full object-cover" alt=""/>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold truncate">{r.name}</h3>
                <button onClick={() => handleDelete(r.id)}
                  className="cursor-grow shrink-0 ml-2 w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center">
                  <I.Trash size={14}/>
                </button>
              </div>
              <div className="mt-1 text-xs text-ink-500">{r.tags?.join(' · ') || r.cuisine}</div>
              <div className="mt-3 grid grid-cols-2 text-xs gap-2">
                <div className="p-2 rounded-lg bg-ink-50 dark:bg-ink-950">
                  <div className="text-[10px] text-ink-500">Distance</div>
                  <div className="font-bold">{r.distance}</div>
                </div>
                <div className="p-2 rounded-lg bg-ink-50 dark:bg-ink-950 col-span-1 break-anywhere">
                  <div className="text-[10px] text-ink-500">Email gérant</div>
                  <div className="font-mono text-[11px] truncate" title={r.ownerEmail || '—'}>{r.ownerEmail || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PROMO_SECTIONS = [
  { id: 'all', label: 'Toutes les sections' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'patisserie', label: 'Pâtisseries' },
  { id: 'pharmacy', label: 'Pharmacies' },
  { id: 'parapharmacy', label: 'Parapharmacies' },
  { id: 'supermarket', label: 'Supermarchés' },
  { id: 'shop', label: 'Magasins' },
];

export function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);
  const [section, setSection] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadFromApi = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/marketing/promos/', { auth: true });
      setPromos(Array.isArray(data) ? data : data?.results || []);
    } catch {
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  const addPromo = useCallback(async () => {
    const c = code.trim().toUpperCase();
    if (!c) { setError('Code requis'); return; }
    if (discount < 1 || discount > 100) { setError('Remise entre 1 et 100 %'); return; }
    try {
      await apiFetch('/marketing/promos/', {
        method: 'POST',
        body: { code: c, discount, section },
        auth: true,
      });
      setCode('');
      setError('');
      await loadFromApi();
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'ajout');
    }
  }, [code, discount, section, loadFromApi]);

  const deletePromo = useCallback(async (id) => {
    try {
      await apiFetch(`/marketing/promos/${id}/`, { method: 'DELETE', auth: true });
      await loadFromApi();
    } catch (e) {
      setError(e.message || 'Erreur lors de la suppression');
    }
  }, [loadFromApi]);

  const toggleActive = useCallback(async (id, currentActive) => {
    try {
      await apiFetch(`/marketing/promos/${id}/`, {
        method: 'PATCH',
        body: { active: !currentActive },
        auth: true,
      });
      await loadFromApi();
    } catch (e) {
      setError(e.message || 'Erreur lors de la mise à jour');
    }
  }, [loadFromApi]);

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-2xl border border-ink-200/60 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <h3 className="font-display font-bold mb-4">Ajouter un code promo</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1.5">Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="EXCLU15"
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm font-bold tracking-wider text-ink-900 outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1.5">Remise (%)</label>
            <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min={1} max={100}
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm font-bold text-ink-900 outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1.5">Section ciblée</label>
            <select value={section} onChange={e => setSection(e.target.value)}
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm font-semibold text-ink-900 outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white">
              {PROMO_SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={addPromo}
              className="cursor-grow w-full rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-transform">
              + Ajouter
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
      </div>

      {/* Liste */}
      <div className="rounded-2xl border border-ink-200/60 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="border-b border-ink-200/60 px-5 py-4 dark:border-ink-800">
          <h3 className="font-display font-bold">
            {loading ? 'Chargement…' : promos.length === 0 ? 'Aucun code promo pour le moment' : `${promos.length} code${promos.length > 1 ? 's' : ''} promo`}
          </h3>
        </div>
        {promos.length > 0 && (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {promos.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-ink-50 dark:hover:bg-ink-950/30 transition">
                <div className="min-w-0 flex-1 flex items-center gap-4">
                  <span className={`px-3 py-1.5 rounded-lg font-black tracking-wider text-sm ${p.active !== false ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'}`}>
                    {p.code}
                  </span>
                  <span className="font-bold text-lg text-emerald-600">-{p.discount}%</span>
                  <span className="text-xs text-ink-500 bg-ink-100 dark:bg-ink-800 px-2 py-1 rounded-md font-semibold">
                    {PROMO_SECTIONS.find(s => s.id === p.section)?.label || p.section}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(p.id, p.active !== false)}
                    className={`cursor-grow w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${p.active !== false ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}>
                    {p.active !== false ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => deletePromo(p.id)}
                    className="cursor-grow w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center">
                    <I.Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminCouriers() {
  const { couriers, refreshOrders } = useOrders();
  const [courierList, setCourierList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const loadCouriers = useCallback(async () => {
    try {
      const data = await apiFetch('/orders/couriers/', { auth: true });
      setCourierList(Array.isArray(data) ? data : []);
    } catch {
      setCourierList([]);
    }
  }, []);

  useEffect(() => { loadCouriers(); }, [loadCouriers]);

  const handleAdd = useCallback(async () => {
    setError('');
    if (!email.trim() || !password) { setError('Email et mot de passe requis'); return; }
    if (password.length < 6) { setError('Mot de passe (min 6 caractères)'); return; }
    setAdding(true);
    try {
      await apiFetch('/auth/youssef/users/create/', {
        method: 'POST',
        body: { email: email.trim(), password, display_name: displayName.trim() || email.split('@')[0], role: 'courier' },
        auth: true,
      });
      setEmail('');
      setPassword('');
      setDisplayName('');
      setShowForm(false);
      loadCouriers();
      refreshOrders();
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setAdding(false);
    }
  }, [email, password, displayName, loadCouriers, refreshOrders]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Supprimer ce livreur ?')) return;
    try {
      await apiFetch(`/orders/couriers/${id}/`, { method: 'DELETE', auth: true });
      loadCouriers();
    } catch (e) {
      setError(e.message || 'Erreur');
    }
  }, [loadCouriers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg">{courierList.length} livreur{courierList.length > 1 ? 's' : ''}</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="cursor-grow rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-transform">
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-ink-200/60 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Nom</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nom du livreur"
                className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="livreur@yoha.ma" type="email"
                className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Mot de passe</label>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" type="password"
                className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
            </div>
          </div>
          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
          <button onClick={handleAdd} disabled={adding}
            className="cursor-grow rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-transform disabled:opacity-50">
            {adding ? 'Création…' : 'Créer le livreur'}
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courierList.map(c => (
          <div key={c.id} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card overflow-hidden p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {c.avatar ? (
                  <img src={c.avatar} className="w-10 h-10 rounded-xl object-cover shrink-0" alt=""/>
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-ink-100 dark:bg-ink-800 flex items-center justify-center shrink-0">
                    <I.Bike size={18}/>
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="font-display font-bold truncate">{c.name || c.displayName || '—'}</h3>
                  <div className="text-xs text-ink-500 truncate">{c.vehicle || 'Véhicule non spécifié'}</div>
                  <div className="text-[10px] font-mono text-ink-400 truncate mt-0.5">{c.email || '—'}</div>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)}
                className="cursor-grow shrink-0 ml-2 w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center">
                <I.Trash size={14}/>
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
              <span>⭐ {c.rating || '—'}</span>
            </div>
          </div>
        ))}
        {courierList.length === 0 && (
          <div className="col-span-full text-center py-12 text-ink-400">Aucun livreur</div>
        )}
      </div>
    </div>
  );
}

export function AdminRevenue({ orders }) {
  const [expanded, setExpanded] = useState(null);
  const totalRev   = orders.reduce((s, o) => s + (Number(o.totalDh) || 0), 0);
  const grossProf  = orders.reduce((s, o) => s + (Number(o.profitDh) || 0), 0);
  const netProf    = orders.reduce((s, o) => s + (Number(o.netDh) || 0), 0);
  const margin     = totalRev > 0 ? ((netProf / totalRev) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Chiffre d'affaires" value={`${totalRev.toLocaleString('fr-FR')} MAD`} icon={<I.Star size={18}/>} color="from-brand-500 to-pink-500"/>
        <StatCard label="Bénéfice brut"      value={`${grossProf.toLocaleString('fr-FR')} MAD`} icon={<I.Sparkle size={18}/>} color="from-violet-500 to-fuchsia-500"/>
        <StatCard label="Bénéfice net"       value={`${netProf.toLocaleString('fr-FR')} MAD`} sub={`Livraison offerte · marge ${margin}%`} icon={<I.Award size={18}/>} color="from-emerald-500 to-teal-500"/>
      </div>

      <div className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card p-5">
        <h3 className="font-display font-bold mb-4">Détail par commande · calcul des profits</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 dark:bg-ink-950/50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left">Cmd</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Téléphone</th>
                <th className="px-4 py-3 text-left">Adresse</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Brut</th>
                <th className="px-4 py-3 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
              {orders.map(o => (
                <React.Fragment key={o.id}>
                  <tr className="cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-950/30 transition" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    <td className="px-4 py-3 font-bold text-xs">#{o.id}</td>
                    <td className="px-4 py-3 max-w-[120px] truncate">{o.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs">{o.customer?.phone || '—'}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-xs">{o.customer?.address || '—'}</td>
                    <td className="px-4 py-3 text-right">{Number(o.totalDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD</td>
                    <td className="px-4 py-3 text-right text-violet-600 font-bold">+{Number(o.profitDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{Number(o.netDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD</td>
                  </tr>
                  {expanded === o.id && (
                    <tr key={`detail-${o.id}`}>
                      <td colSpan={7} className="px-6 py-4 bg-ink-50/50 dark:bg-ink-950/20 border-b border-ink-100 dark:border-ink-800">
                        <div className="text-sm space-y-2">
                          <span className="font-semibold text-ink-700 dark:text-ink-200">Articles commandés :</span>
                          <div className="grid gap-2">
                            {(o.items || []).map((item, i) => (
                              <div key={i} className="flex items-center justify-between bg-white dark:bg-ink-900 rounded-xl px-4 py-2 border border-ink-200/60 dark:border-ink-800">
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold">{item.name}</span>
                                  <span className="text-ink-500 ml-2">x{item.qty}</span>
                                  <span className="text-ink-400 ml-2 text-xs">{item.restaurantName}</span>
                                </div>
                                <span className="font-bold shrink-0 ml-2">{Number(item.price * item.qty).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD</span>
                              </div>
                            ))}
                            {(!o.items || o.items.length === 0) && <span className="text-ink-400 text-xs">Aucun article</span>}
                          </div>
                          {o.restaurantNotes && (
                            <div className="mt-2 text-xs text-ink-500">
                              <span className="font-semibold">Remarques :</span> {o.restaurantNotes}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
