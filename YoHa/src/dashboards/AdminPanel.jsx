'use client';

import React, { useState, useMemo } from 'react';
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
    revenue:'Revenus & Bénéfices',
  };

  return (
    <DashLayout kind="admin" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle="Vue d'ensemble de la plateforme YouHa">
      {current === 'overview'    && <AdminOverview orders={orders} restaurantCount={restaurantPartnersCount}/>}
      {current === 'orders'      && <AdminOrders orders={orders}/>}
      {current === 'restaurants' && <AdminRestaurants/>}
      {current === 'revenue'     && <AdminRevenue orders={orders}/>}
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
      className={`cursor-grow px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active
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
  const { restaurants } = useOrders();
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {restaurants.map(r => (
        <div key={r.id} className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card overflow-hidden">
          <img src={r.cover} className="h-32 w-full object-cover"/>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold">{r.name}</h3>
            </div>
            <div className="mt-1 text-xs text-ink-500">{r.tags.join(' · ')}</div>
            <div className="mt-3 grid grid-cols-1 text-xs gap-2">
              <div className="p-2 rounded-lg bg-ink-50 dark:bg-ink-950">
                <div className="text-[10px] text-ink-500">Distance</div>
                <div className="font-bold">{r.distance}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminRevenue({ orders }) {
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
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Brut</th>
                <th className="px-4 py-3 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
              {orders.slice(0, 10).map(o => (
                <tr key={o.id}>
                  <td className="px-4 py-2 font-bold">#{o.id}</td>
                  <td className="px-4 py-2 text-right">{Number(o.totalDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD</td>
                  <td className="px-4 py-2 text-right text-violet-600 font-bold">+{Number(o.profitDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD</td>
                  <td className="px-4 py-2 text-right text-emerald-600 font-bold">{Number(o.netDh || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
