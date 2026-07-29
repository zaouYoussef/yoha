'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import { getStoredReviews, deleteReview } from '../utils/reviews.js';
import { getCourierGps, calculateHaversineDistance, resolveDestinationCoords } from '../utils/courierGps.js';
import { LiveMapTracker } from '../components/ui/LiveMapTracker.jsx';
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
  CUISINE_CATEGORIES,
} from '../data/index.js';
import { useOrders, useToast } from '../contexts/AppContexts.jsx';
import { apiFetch, ordersApi } from '../lib/api.js';
import { CancelOrderButton, CancelPhaseBadge, OrderCancellationNote } from '../components/ui/CancelOrderButton.jsx';
import {
  DashLayout,
  LineChart,
  BarChart,
  DonutChart,
  StatCard,
  StatusPill,
  GlassCard,
  GradientHeader,
  SearchBar,
  EmptyState,
  ActionButton,
  GlassTable,
  Toggle,
  PillTabs,
  SectionHeader,
  AnimatedCounter,
} from './DashShared.jsx';
function isOrderAssignedToCourier(order, courier) {
  if (!order || !courier) return false;
  const cId = String(courier.id || '').toLowerCase();
  const cName = (courier.name || courier.username || courier.displayName || '').toLowerCase();
  const cEmail = (courier.email || '').toLowerCase();

  const oCourierId = String(order.courierId || '').toLowerCase();
  const oCourierName = (order.courierName || '').toLowerCase();

  if (cId && oCourierId && oCourierId === cId) return true;
  if (cName && oCourierName && (oCourierName === cName || oCourierName.includes(cName) || cName.includes(oCourierName))) return true;
  if (cId && oCourierName && (oCourierName === cId || oCourierName.includes(cId))) return true;
  if (cEmail && (oCourierId === cEmail || oCourierName.includes(cEmail.split('@')[0]))) return true;

  return false;
}

function revenueWeekTrendPct(rev7) {
  const a = rev7[5] || 0;
  const b = rev7[6] || 0;
  if (a <= 0) return b > 0 ? 100 : 0;
  return Math.round(((b - a) / a) * 100);
}

function formatMAD(v) {
  return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' MAD';
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function StarRating({ rating }) {
  const stars = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-xs ${s <= stars ? 'text-amber-400' : 'text-ink-300 dark:text-ink-600'}`}>
          ★
        </span>
      ))}
      {rating != null && <span className="ml-1 text-[10px] text-ink-500">{Number(rating).toFixed(1)}</span>}
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

const DATE_RANGES = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'custom', label: 'Plage de dates' },
  { id: 'all', label: 'Tout' },
];

export function formatOrderDateTime(ts) {
  if (!ts) return '—';
  try {
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(d.getTime())) return '—';
    const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  } catch {
    return '—';
  }
}

function filterByDateRange(orders, range, startDate = '', endDate = '') {
  if (!orders || !Array.isArray(orders)) return [];
  const now = new Date();

  if (range === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return orders.filter((o) => {
      const ts = typeof o.createdAt === 'number' ? o.createdAt : new Date(o.createdAt).getTime();
      return ts >= startOfToday;
    });
  }

  if (range === 'custom') {
    const startMs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
    const endMs = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Infinity;
    return orders.filter((o) => {
      const ts = typeof o.createdAt === 'number' ? o.createdAt : new Date(o.createdAt).getTime();
      return (!startMs || ts >= startMs) && (!endMs || ts <= endMs);
    });
  }

  return orders;
}

export function DateRangeSelector({ dateRange, setDateRange, startDate, setStartDate, endDate, setEndDate }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-wrap">
      <div className="inline-flex items-center rounded-2xl bg-ink-100 dark:bg-ink-800 p-1 border border-ink-200/60 dark:border-ink-700/60 shadow-xs">
        <button
          type="button"
          onClick={() => setDateRange('today')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            dateRange === 'today'
              ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
              : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          Aujourd&apos;hui
        </button>

        <button
          type="button"
          onClick={() => setDateRange('custom')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            dateRange === 'custom'
              ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
              : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          <span>📅 Plage de dates</span>
        </button>

        <button
          type="button"
          onClick={() => setDateRange('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            dateRange === 'all'
              ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
              : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          Tout
        </button>
      </div>

      {dateRange === 'custom' && (
        <div className="flex items-center gap-2 bg-white dark:bg-ink-900 p-1.5 rounded-2xl border border-ink-200/80 dark:border-ink-800 shadow-xs text-xs animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-ink-400 font-semibold text-[11px] pl-1">Du:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-2.5 py-1 text-xs text-ink-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-ink-400 font-semibold text-[11px]">Au:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-2.5 py-1 text-xs text-ink-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="px-2 py-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
              title="Réinitialiser les dates"
            >
              ✕ Effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminDashboard({ goto, dark, setDark }) {
  const [current, setCurrent] = useState('overview');
  const { orders, restaurants } = useOrders();
  const restaurantPartnersCount = restaurants.filter((r) => r.cuisine !== 'pharmacy').length;

  const titles = {
    overview: 'Tableau de bord',
    orders: 'Toutes les commandes',
    restaurants: 'Restaurants',
    couriers: 'Livreurs',
    revenue: 'Revenus & Bénéfices',
    promos: 'Codes promo',
    reviews: 'Avis & Notes clients',
  };

  return (
    <DashLayout kind="admin" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle="Vue d'ensemble de la plateforme YoHa">
      {current === 'overview' && <AdminOverview orders={orders} restaurantCount={restaurantPartnersCount} />}
      {current === 'orders' && <AdminOrders orders={orders} />}
      {current === 'restaurants' && <AdminRestaurants />}
      {current === 'couriers' && <AdminCouriers />}
      {current === 'revenue' && <AdminRevenue orders={orders} />}
      {current === 'promos' && <AdminPromos />}
      {current === 'reviews' && <AdminReviews />}
    </DashLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW
   ═══════════════════════════════════════════════════════════════ */
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
  const donutColors = ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'];

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6);
  }, [orders]);

  const topRestaurants = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const name = o.restaurantName || 'Inconnu';
      if (!map[name]) map[name] = { name, orders: 0, revenue: 0 };
      map[name].orders++;
      if (o.status !== 'cancelled') map[name].revenue += Number(o.totalDh) || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Vue d'ensemble"
        subtitle={`${orders.length} commandes cumulées · ${active.length} en cours`}
        icon="📊"
        gradient="from-brand-500 via-pink-500 to-rose-500"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Commandes" value={orders.length} sub="Cumulé" icon={<I.Bag size={18} />} color="from-brand-500 to-orange-500" animate />
        <StatCard label="Aujourd'hui" value={today.length} sub="Dernières 24h" icon={<I.Bell size={18} />} color="from-pink-500 to-rose-500" animate />
        <StatCard label="Revenus totaux" value={totalRev} suffix=" MAD" sub="Somme des commandes" icon={<I.Star size={18} />} color="from-violet-500 to-fuchsia-500" animate />
        <StatCard label="Actives" value={active.length} sub="Non livrées" icon={<I.Bike size={18} />} color="from-sky-500 to-indigo-500" animate />
        <StatCard label="Restaurants" value={restaurantCount} sub="Partenaires actifs" icon={<I.Chef size={18} />} color="from-emerald-500 to-teal-500" animate />
      </div>

      {/* Revenue chart + Today summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-4 sm:p-5" hover={false}>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <SectionHeader title="Revenus 7 jours" subtitle={`${rev7.reduce((a, b) => a + b, 0).toLocaleString('fr-FR')} MAD cumulé`} icon="📈" />
            </div>
            <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${revTrendPct >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'}`}>
              {revTrendPct >= 0 ? '▲' : '▼'} {Math.abs(revTrendPct)}% <span className="hidden font-normal opacity-80 sm:inline">(vs hier)</span>
            </span>
          </div>
          <LineChart data={rev7} color="#f97316" color2="#ec4899" />
          <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-500 dark:text-ink-400 mt-2">
            {days.map((d, i) => <div key={i} className="text-center font-medium">{d}</div>)}
          </div>
        </GlassCard>

        {/* Today's summary card */}
        <GlassCard className="p-5" hover={false} glow="from-brand-500 to-pink-500">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">Résumé du jour</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Commandes
              </div>
              <span className="font-display font-black text-lg">{today.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Revenus
              </div>
              <span className="font-display font-black text-lg">{formatMAD(today.reduce((s, o) => s + (Number(o.totalDh) || 0), 0))}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Profit net
              </div>
              <span className="font-display font-black text-lg text-emerald-600">{formatMAD(today.reduce((s, o) => s + (Number(o.netDh) || 0), 0))}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                En livraison
              </div>
              <span className="font-display font-black text-lg">{active.length}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Activity feed + Donut + Orders bar */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Donut */}
        <GlassCard className="p-5" hover={false}>
          <SectionHeader title="Activité par resto" icon="🍩" />
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 min-w-0 mt-3">
            <DonutChart data={donut} colors={donutColors} />
            <div className="flex-1 space-y-1.5 text-xs w-full min-w-0">
              {donut.map((d, i) => (
                <div key={`${d.label}-${i}`} className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: donutColors[i % donutColors.length] }} />
                  <span className="truncate">{d.label}</span>
                  <span className="ml-auto font-bold shrink-0">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Orders bar chart */}
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Commandes / jour" icon="📊" />
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-500/20">
              7j · {ord7.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <BarChart data={ord7} labels={days} />
        </GlassCard>

        {/* Live activity feed */}
        <GlassCard className="p-5" hover={false} glow="from-emerald-500 to-teal-500">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Activité en direct" icon="⚡" />
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
            {recentOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-400">Aucune activité récente</div>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="flex items-start gap-2.5 rounded-xl bg-white/50 dark:bg-ink-900/50 p-2.5 border border-ink-100/50 dark:border-ink-800/50">
                  <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isActiveOrderStatus(o.status) ? 'bg-emerald-500 animate-pulse' : o.status === 'cancelled' ? 'bg-red-400' : 'bg-ink-300'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">#{o.id}</span>
                      <StatusPill status={o.status} />
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-ink-500">{o.restaurantName} · {o.customer?.name || '—'}</div>
                    <div className="mt-0.5 text-[10px] text-ink-400">{formatRelativeDate(o.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Profit card + Top restaurants */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5" hover={false}>
          <RecentOrdersTable orders={orders.slice(0, 6)} title="Dernières commandes" />
        </GlassCard>

        <GlassCard className="p-5 overflow-hidden relative" hover={false}>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-brand-500/40 blur-3xl pointer-events-none" />
          <SectionHeader title="Bénéfice net cumulé" icon="💰" />
          <div className="relative mt-3">
            <div className="font-display font-black text-4xl text-gradient">{totalProf.toFixed(0)} MAD</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Bénéfice brut</span>
                <b>{grossProf.toFixed(0)} MAD</b>
              </div>
              <div className="border-t border-ink-200/40 dark:border-ink-700/40 pt-2 flex justify-between">
                <span className="font-semibold">Net</span>
                <b className="text-emerald-500">{totalProf.toFixed(0)} MAD</b>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-ink-200/40 dark:border-ink-700/40">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">Top restaurants</div>
            <div className="space-y-2">
              {topRestaurants.map((r, i) => (
                <div key={r.name} className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{r.name}</div>
                    <div className="text-[10px] text-ink-400">{r.orders} cmd · {formatMAD(r.revenue)}</div>
                  </div>
                </div>
              ))}
              {topRestaurants.length === 0 && (
                <div className="text-xs text-ink-400 text-center py-3">Aucune donnée</div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ORDERS
   ═══════════════════════════════════════════════════════════════ */
export function AdminOrders({ orders }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    let list = orders;
    list = filterByDateRange(list, dateRange, startDate, endDate);
    if (filter !== 'all') list = list.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) =>
        String(o.id).includes(q) ||
        (o.customer?.name || '').toLowerCase().includes(q) ||
        (o.restaurantName || '').toLowerCase().includes(q) ||
        (o.courierName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search, dateRange, startDate, endDate]);

  const statusCounts = useMemo(() => {
    const base = filterByDateRange(orders, dateRange, startDate, endDate);
    const counts = { all: base.length };
    Object.keys(ORDER_STATES).forEach((k) => {
      counts[k] = base.filter((o) => o.status === k).length;
    });
    return counts;
  }, [orders, dateRange, startDate, endDate]);

  return (
    <div className="space-y-5">
      <GradientHeader
        title="Toutes les commandes"
        subtitle={`${filtered.length} commandes affichées`}
        icon="📦"
        gradient="from-brand-500 via-pink-500 to-rose-500"
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par ID, client, restaurant..."
          className="lg:w-80"
        />
        <DateRangeSelector
          dateRange={dateRange}
          setDateRange={setDateRange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} count={statusCounts.all}>
          Toutes
        </FilterChip>
        {Object.entries(ORDER_STATES).map(([k, s]) => (
          <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)} count={statusCounts[k] || 0}>
            {s.label}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Aucune commande trouvée"
          description="Essayez de modifier vos filtres ou votre recherche"
        />
      ) : (
        <RecentOrdersTable orders={filtered} title={`${filtered.length} commandes`} full showCancellation />
      )}
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

export function AdminOrderGpsCell({ order }) {
  const [gpsData, setGpsData] = useState(null);
  const [remoteGps, setRemoteGps] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!order?.id) return;
    const fetchGps = () => {
      let data = getCourierGps(order.id);
      if (!data && order.courierId) data = getCourierGps(order.courierId);
      if (!data) data = getCourierGps('active_courier');
      setGpsData(data);
    };
    fetchGps();
    const interval = setInterval(fetchGps, 3000);
    window.addEventListener('yoha_courier_gps_updated', fetchGps);
    return () => {
      clearInterval(interval);
      window.removeEventListener('yoha_courier_gps_updated', fetchGps);
    };
  }, [order?.id, order?.courierId]);

  // Fetch GPS from backend API (cross-device) — only when active and assigned to courier
  useEffect(() => {
    if (!order?.id || !order?.courierName || order.status === 'delivered' || order.status === 'cancelled') return;
    const fetchRemote = () => {
      ordersApi.getLocation(order.id).then((data) => {
        if (data?.latitude != null) setRemoteGps(data);
      }).catch(() => {});
    };
    fetchRemote();
    const interval = setInterval(fetchRemote, 5000);
    return () => clearInterval(interval);
  }, [order?.id, order?.courierName, order?.status]);

  if (!order || order.status === 'delivered' || order.status === 'cancelled') {
    return <span className="text-ink-400 text-xs">—</span>;
  }

  const destInfo = resolveDestinationCoords(order.customerAddress || order.address || order.delivery_instructions || '');
  const activeLat = gpsData?.active ? gpsData.lat : 35.68500;
  const activeLng = gpsData?.active ? gpsData.lng : -5.92300;
  const dist = calculateHaversineDistance(activeLat, activeLng, destInfo.lat, destInfo.lng);
  const live = gpsData?.active && order.courierName;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <button onClick={() => setExpanded(!expanded)} type="button"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shrink-0 w-max shadow-xs cursor-pointer ${
          live
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600'
            : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
        }`}
        title={`${expanded ? 'Masquer' : 'Afficher'} la carte de ${order.courierName || 'livreur'}`}
      >
        <span className={`w-2 h-2 rounded-full ${live ? 'bg-white animate-ping' : 'bg-amber-500'}`} />
        <span>{live ? `📡 GPS Live (${dist.toFixed(1)} km)` : `🗺️ ${order.courierName || 'Aucun livreur'}`}</span>
        <span className={`text-[11px] transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {order.courierName && (
        <span className="text-[10px] text-ink-400 font-semibold truncate max-w-[170px]">
          {activeLat.toFixed(4)}, {activeLng.toFixed(4)} ➔ {destInfo.name.split(' ')[0]}
        </span>
      )}
      {expanded && order.courierName && (
        <LiveMapTracker orderId={order.id} courierName={order.courierName} address={order.customerAddress || order.address || ''} height="240px" />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECENT ORDERS TABLE (exported, used by DeliveryPanel too)
   ═══════════════════════════════════════════════════════════════ */
export function RecentOrdersTable({ orders, title, full, gainMad, hideCourier = false, hideViewAll = false, showCancellation = false }) {
  const showGain = gainMad != null || full;
  const gainLabel = gainMad != null ? 'Gain' : 'Profit net';
  const gainValue = (o) => {
    if (o.status === 'cancelled') return 0;
    return gainMad != null ? gainMad : Number(o.netDh || 0);
  };
  const colCount = 7 + (hideCourier ? 0 : 1) + (showGain ? 1 : 0);

  return (
    <GlassCard className="overflow-hidden" hover={false}>
      <div className="flex items-center justify-between gap-2 border-b border-ink-200/40 px-4 py-3 dark:border-ink-800/40 sm:px-5 sm:py-4">
        <h3 className="min-w-0 truncate font-display font-bold">{title}</h3>
        {!hideViewAll && (
          <button type="button" className="shrink-0 cursor-grow text-xs font-bold text-brand-600">
            Tout voir
          </button>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-ink-50/50 text-xs uppercase tracking-wider text-ink-500 dark:bg-ink-950/30">
            <tr>
              <th className="px-4 py-3 text-left sm:px-5">Commande</th>
              <th className="px-4 py-3 text-left sm:px-5">Date &amp; Heure</th>
              <th className="px-4 py-3 text-left sm:px-5">Client</th>
              <th className="px-4 py-3 text-left sm:px-5">Restaurant</th>
              {!hideCourier && (
                <th className="px-4 py-3 text-left sm:px-5">Livreur</th>
              )}
              <th className="px-4 py-3 text-left sm:px-5">Position GPS</th>
              <th className="px-4 py-3 text-right sm:px-5">Total</th>
              {showGain && (
                <th className="px-4 py-3 text-right sm:px-5">{gainLabel}</th>
              )}
              <th className="px-4 py-3 text-left sm:px-5">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100/50 dark:divide-ink-800/50">
            {orders.map((o) => (
              <tr key={o.id} className="transition hover:bg-ink-50/50 dark:hover:bg-ink-950/30">
                <td className="break-anywhere px-4 py-3 font-bold sm:px-5">#{o.id}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-ink-600 dark:text-ink-300 sm:px-5 font-mono">
                  {formatOrderDateTime(o.createdAt)}
                </td>
                <td className="max-w-[8rem] truncate px-4 py-3 sm:px-5">{o.customer?.name || '—'}</td>
                <td className="max-w-[8rem] truncate px-4 py-3 sm:px-5">{o.restaurantName}</td>
                {!hideCourier && (
                  <td className="max-w-[8rem] truncate px-4 py-3 text-ink-500 sm:px-5">
                    {o.courierName || '—'}
                  </td>
                )}
                <td className="px-4 py-3 sm:px-5">
                  <AdminOrderGpsCell order={o} />
                </td>
                <td className="px-4 py-3 text-right font-bold sm:px-5">
                  {formatMAD(o.totalDh)}
                </td>
                {showGain && (
                  <td className="px-4 py-3 text-right font-bold sm:px-5">
                    {o.status === 'cancelled' ? (
                      <span className="text-ink-400">—</span>
                    ) : (
                      <span className="text-emerald-600">
                        +{formatMAD(gainValue(o))}
                      </span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-1 items-start">
                    <StatusPill status={o.status} />
                    {showCancellation && o.status === 'cancelled' && (
                      <>
                        {o.cancelledPhase && <CancelPhaseBadge phase={o.cancelledPhase} />}
                        <OrderCancellationNote reason={o.cancellationReason} className="mt-0" />
                      </>
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
              className="rounded-xl border border-ink-200/40 bg-white/50 p-3 dark:border-ink-800/40 dark:bg-ink-950/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="break-anywhere font-bold">#{o.id}</span>
                    <span className="text-[11px] text-ink-400 font-mono">
                      {formatOrderDateTime(o.createdAt)}
                    </span>
                  </div>
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
                <div className="min-w-0 rounded-lg bg-white/80 p-2 dark:bg-ink-900/80">
                  <div className="text-ink-400">Client</div>
                  <div className="truncate font-semibold">{o.customer?.name || '—'}</div>
                </div>
                {!hideCourier && (
                  <div className="min-w-0 rounded-lg bg-white/80 p-2 dark:bg-ink-900/80">
                    <div className="text-ink-400">Livreur</div>
                    <div className="truncate font-semibold">{o.courierName || '—'}</div>
                  </div>
                )}
                <div className="rounded-lg bg-brand-50/80 p-2 dark:bg-brand-900/20">
                  <div className="text-ink-400">Total</div>
                  <div className="font-bold text-brand-600">
                    {formatMAD(o.totalDh)}
                  </div>
                </div>
                {showGain && (
                  <div className="rounded-lg bg-emerald-50/80 p-2 dark:bg-emerald-900/20">
                    <div className="text-ink-400">{gainLabel}</div>
                    <div className="font-bold text-emerald-600">
                      {o.status === 'cancelled'
                        ? '—'
                        : `+${formatMAD(gainValue(o))}`}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2.5 p-2 rounded-lg bg-slate-100/70 dark:bg-ink-950/40 border border-ink-200/50 dark:border-ink-800/40">
                <div className="text-[10px] font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-1">Localisation Livreur</div>
                <AdminOrderGpsCell order={o} />
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESTAURANTS
   ═══════════════════════════════════════════════════════════════ */
export function AdminRestaurants() {
  const { restaurants, orders, refreshRestaurants } = useOrders();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerDisplayName, setOwnerDisplayName] = useState('');
  const [distanceLabel, setDistanceLabel] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('30-45 min');
  const [restoRating, setRestoRating] = useState('4.8');
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editDist, setEditDist] = useState({});
  const [editRating, setEditRating] = useState({});
  const [editDelivery, setEditDelivery] = useState({});
  const [editTags, setEditTags] = useState({});
  const [showTagsPicker, setShowTagsPicker] = useState({});
  const [saving, setSaving] = useState(null);

  const saveRestoField = async (r, field, value) => {
    setSaving(r.pk);
    const body = {};
    if (field === 'distance') body.distance_label = value;
    else if (field === 'delivery') body.delivery_time = value;
    else body[field] = value;
    try {
      await apiFetch(`/restaurants/youssef/${r.pk}/update/`, {
        method: 'PATCH',
        body,
        auth: true,
      });
      refreshRestaurants();
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setSaving(null);
    }
  };

  const restaurantStats = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const rn = o.restaurantName;
      if (!rn) return;
      if (!map[rn]) map[rn] = { orders: 0, revenue: 0 };
      map[rn].orders++;
      if (o.status !== 'cancelled') map[rn].revenue += Number(o.totalDh) || 0;
    });
    return map;
  }, [orders]);

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
      const body = { name: name.trim(), description, phone, distance_label: distanceLabel, delivery_time: deliveryTime, rating: restoRating, tags: selectedTags.length ? selectedTags : [] };
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
      setDistanceLabel('');
      setDeliveryTime('30-45 min');
      setRestoRating('4.8');
      setSelectedTags([]);
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
  }, [name, description, phone, distanceLabel, deliveryTime, restoRating, selectedTags, ownerEmail, ownerPassword, ownerDisplayName, refreshRestaurants]);

  const COMMISSION_RATE = 15;

  return (
    <div className="space-y-5">
      <GradientHeader
        title={`${restaurants.length} restaurant${restaurants.length > 1 ? 's' : ''}`}
        subtitle="Gestion des restaurants partenaires"
        icon="🍽️"
        gradient="from-brand-500 via-pink-500 to-rose-500"
        actions={
          <ActionButton onClick={() => setShowForm(!showForm)} icon={<I.Plus size={16} />}>
            Ajouter
          </ActionButton>
        }
      />

      {showForm && (
        <GlassCard className="p-5" hover={false}>
          <SectionHeader title="Nouveau restaurant" icon="➕" />
          <div className="mt-4">
            <label className="block text-xs font-bold text-ink-500 mb-1.5">Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du restaurant"
              className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
          </div>
          <div className="mt-3">
            <label className="block text-xs font-bold text-ink-500 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white resize-none" />
          </div>
          <div className="mt-3">
            <label className="block text-xs font-bold text-ink-500 mb-1.5">Téléphone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 5 39 12 34 56"
              className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">Distance (km)</label>
              <input value={distanceLabel} onChange={(e) => setDistanceLabel(e.target.value)} placeholder="3.2 km"
                className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">Délai livraison</label>
              <input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="30-45 min"
                className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">Avis (⭐)</label>
              <input value={restoRating} onChange={(e) => setRestoRating(e.target.value)} placeholder="4.8"
                className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-bold text-ink-500 mb-1.5">Catégories</label>
            <div className="flex flex-wrap gap-1.5">
              {CUISINE_CATEGORIES.map((cat) => {
                const sel = selectedTags.includes(cat.id);
                return (
                  <button key={cat.id} type="button" onClick={() => setSelectedTags((prev) => sel ? prev.filter((t) => t !== cat.id) : [...prev, cat.id])}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${sel ? 'bg-brand-500 text-white shadow-sm' : 'bg-ink-100/70 text-ink-600 hover:bg-ink-200/70 dark:bg-ink-800/40 dark:text-ink-300 dark:hover:bg-ink-700/50'}`}>
                    <span className="text-xs leading-none">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-ink-200/40 dark:border-ink-800/40 pt-4 mt-4">
            <SectionHeader title="Compte propriétaire" subtitle="Optionnel" icon="👤" />
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-ink-500 mb-1.5">Email</label>
                <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="restaurant@yoha.ma" type="email"
                  className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 mb-1.5">Nom d'affichage</label>
                <input value={ownerDisplayName} onChange={(e) => setOwnerDisplayName(e.target.value)} placeholder="Nom du gérant"
                  className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 mb-1.5">Mot de passe</label>
                <input value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} placeholder="••••••" type="password"
                  className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
              </div>
            </div>
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
          <div className="mt-4">
            <ActionButton onClick={handleAdd} disabled={adding} icon={adding ? <I.Loader size={14} /> : <I.Plus size={14} />}>
              {adding ? 'Création…' : 'Créer le restaurant'}
            </ActionButton>
          </div>
        </GlassCard>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((r) => {
          const stats = restaurantStats[r.name] || { orders: 0, revenue: 0 };
          const commission = Math.round(stats.revenue * COMMISSION_RATE / 100);
          return (
            <GlassCard key={r.id} className="overflow-hidden" hover>
              {/* Cover with gradient overlay */}
              <div className="relative h-32 w-full">
                {r.cover ? (
                  <img src={r.cover} className="h-full w-full object-cover" alt="" />
                ) : r.logo ? (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brand-500/20 to-pink-500/20 dark:from-brand-500/10 dark:to-pink-500/10">
                    <img src={r.logo} className="h-16 w-16 rounded-2xl object-cover opacity-80" alt="" />
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brand-500/20 to-pink-500/20 dark:from-brand-500/10 dark:to-pink-500/10">
                    <span className="text-3xl font-black text-white/30 drop-shadow-lg">
                      {r.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display font-bold text-white text-base truncate drop-shadow-lg">{r.name}</h3>
                  <div className="text-[11px] text-white/80">{r.tags?.map((t) => typeof t === 'string' ? t.charAt(0).toUpperCase() + t.slice(1) : t).join(' · ') || (r.cuisine ? r.cuisine.charAt(0).toUpperCase() + r.cuisine.slice(1) : '')}</div>
                </div>
                <button onClick={() => handleDelete(r.pk)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-xl bg-red-500/90 text-white hover:bg-red-600 transition-colors flex items-center justify-center backdrop-blur-sm">
                  <I.Trash size={14} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-brand-50/80 dark:bg-brand-900/20 p-2">
                    <div className="text-[10px] text-ink-400 font-bold">Commandes</div>
                    <div className="font-display font-black text-sm">{stats.orders}</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 p-2">
                    <div className="text-[10px] text-ink-400 font-bold">Revenus</div>
                    <div className="font-display font-black text-sm">{formatMAD(stats.revenue)}</div>
                  </div>
                  <div className="rounded-xl bg-violet-50/80 dark:bg-violet-900/20 p-2">
                    <div className="text-[10px] text-ink-400 font-bold">Commission</div>
                    <div className="font-display font-black text-sm text-violet-600">{COMMISSION_RATE}%</div>
                  </div>
                </div>

                {/* Distance + Rating éditable */}
                <div className="rounded-xl bg-ink-50/50 dark:bg-ink-950/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <I.Bike size={12} className="text-ink-400 shrink-0" />
                    <span className="text-ink-400 shrink-0">Distance</span>
                    <input value={editDist[r.pk] ?? r.distance ?? ''}
                      onChange={(e) => setEditDist((d) => ({ ...d, [r.pk]: e.target.value }))}
                      onBlur={() => { const v = editDist[r.pk]; if (v !== undefined && v !== r.distance) saveRestoField(r, 'distance', v); }}
                      className="ml-auto w-20 text-right text-xs font-bold bg-transparent border-b border-dotted border-ink-300 dark:border-ink-600 focus:border-brand-400 focus:outline-none" placeholder="km" />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-400 shrink-0 text-xs">🕐</span>
                    <span className="text-ink-400 shrink-0">Livraison</span>
                    <input value={editDelivery[r.pk] ?? r.delivery ?? ''}
                      onChange={(e) => setEditDelivery((d) => ({ ...d, [r.pk]: e.target.value }))}
                      onBlur={() => { const v = editDelivery[r.pk]; if (v !== undefined && v !== r.delivery) saveRestoField(r, 'delivery', v); }}
                      className="ml-auto w-24 text-right text-xs font-bold bg-transparent border-b border-dotted border-ink-300 dark:border-ink-600 focus:border-brand-400 focus:outline-none" placeholder="30-45 min" />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-amber-500 shrink-0 text-xs">⭐</span>
                    <span className="text-ink-400 shrink-0">Note</span>
                    <input value={editRating[r.pk] ?? r.rating ?? ''}
                      onChange={(e) => setEditRating((d) => ({ ...d, [r.pk]: e.target.value }))}
                      onBlur={() => { const v = editRating[r.pk]; if (v !== undefined && v !== r.rating) saveRestoField(r, 'rating', v); }}
                      className="ml-auto w-16 text-right text-xs font-bold bg-transparent border-b border-dotted border-ink-300 dark:border-ink-600 focus:border-brand-400 focus:outline-none" placeholder="4.8" />
                  </div>
                  {r.ownerEmail && (
                    <div className="flex items-center gap-2 text-xs">
                      <I.Bell size={12} className="text-ink-400 shrink-0" />
                      <span className="text-ink-400 shrink-0">Gérant</span>
                      <span className="ml-auto font-mono text-[11px] truncate" title={r.ownerEmail}>{r.ownerEmail}</span>
                    </div>
                  )}
                  {/* Tags / Catégories */}
                  <div className="pt-1 border-t border-ink-200/50 dark:border-ink-700/50">
                    <button onClick={() => setShowTagsPicker((d) => ({ ...d, [r.pk]: !d[r.pk] }))}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
                      <span>📂</span> Catégories ({r.tags?.length || 0})
                      <span className="text-[8px]">{showTagsPicker[r.pk] ? '▲' : '▼'}</span>
                    </button>
                    {showTagsPicker[r.pk] && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {CUISINE_CATEGORIES.map((cat) => {
                          const currentTags = editTags[r.pk] ?? r.tags ?? [];
                          const isSelected = currentTags.some((t) => t.toLowerCase() === cat.label.toLowerCase());
                          return (
                            <button key={cat.id}
                              onClick={() => {
                                const old = editTags[r.pk] ?? r.tags ?? [];
                                const next = isSelected
                                  ? old.filter((t) => t.toLowerCase() !== cat.label.toLowerCase())
                                  : [...old, cat.label];
                                setEditTags((d) => ({ ...d, [r.pk]: next }));
                                saveRestoField(r, 'tags', next);
                              }}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${
                                isSelected
                                  ? 'bg-brand-500 text-white border-brand-500'
                                  : 'bg-white dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-600 hover:border-brand-300'
                              }`}>
                              {cat.emoji} {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {restaurants.length === 0 && (
        <EmptyState
          icon="🍽️"
          title="Aucun restaurant"
          description="Ajoutez votre premier restaurant partenaire"
          action={<ActionButton onClick={() => setShowForm(true)} icon={<I.Plus size={14} />}>Ajouter un restaurant</ActionButton>}
        />
      )}
    </div>
  );
}

export function AdminCourierLiveGpsBadge({ courier, orders: propOrders }) {
  const { orders: contextOrders = [] } = useOrders();
  const orders = propOrders || contextOrders || [];
  const [gpsData, setGpsData] = useState(null);
  const [remoteGps, setRemoteGps] = useState(null);

  const courierName = (courier?.name || courier?.username || '').toLowerCase();
  const courierId = String(courier?.id || '');

  const activeOrder = useMemo(() => {
    return (orders || []).find((o) => {
      if (o.status === 'delivered' || o.status === 'cancelled') return false;
      return isOrderAssignedToCourier(o, courier);
    });
  }, [orders, courier]);

  useEffect(() => {
    const checkGps = () => {
      const activeOrderId = activeOrder?.id || 'active_courier';
      let data = getCourierGps(activeOrderId);
      if (!data && courierId) data = getCourierGps(courierId);
      if (!data && courierName) data = getCourierGps(courierName);
      if (!data) data = getCourierGps('active_courier');
      setGpsData(data);
    };

    checkGps();
    const interval = setInterval(checkGps, 3000);
    window.addEventListener('yoha_courier_gps_updated', checkGps);
    return () => {
      clearInterval(interval);
      window.removeEventListener('yoha_courier_gps_updated', checkGps);
    };
  }, [activeOrder?.id, courierId, courierName]);

  // Cross-device backend GPS polling for active order
  useEffect(() => {
    if (!activeOrder?.id || activeOrder.status === 'delivered' || activeOrder.status === 'cancelled') return;
    const fetchRemote = () => {
      ordersApi.getLocation(activeOrder.id).then((data) => {
        if (data?.latitude != null) setRemoteGps(data);
      }).catch(() => {});
    };
    fetchRemote();
    const interval = setInterval(fetchRemote, 5000);
    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.status]);

  const activeLat = remoteGps?.latitude || gpsData?.lat || (activeOrder ? 35.68500 : null);
  const activeLng = remoteGps?.longitude || gpsData?.lng || (activeOrder ? -5.92300 : null);
  const isLive = Boolean((remoteGps && remoteGps.latitude != null) || (gpsData && gpsData.active));

  if (activeLat != null && activeLng != null) {
    const mapsUrl = `https://www.google.com/maps?q=${activeLat},${activeLng}`;
    return (
      <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs ${
        isLive
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-amber-500/15 border-amber-500/30'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <div className="min-w-0 text-left">
            <span className={`font-extrabold block truncate ${isLive ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {isLive ? '📡 GPS Live' : '📍 Pos. estimée'} : {activeLat.toFixed(4)}, {activeLng.toFixed(4)}
            </span>
            {activeOrder && (
              <span className="text-[10px] text-ink-500 dark:text-ink-400 block truncate font-medium">
                Cmd #{activeOrder.id} ({activeOrder.restaurantName || 'En cours'})
              </span>
            )}
          </div>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-2.5 py-1 rounded-lg text-white font-extrabold text-[10px] transition shrink-0 ml-1.5 ${
            isLive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          Carte 📍
        </a>
      </div>
    );
  }

  return (
    <div className="mt-3 p-2 rounded-xl bg-slate-100/80 dark:bg-ink-950/40 text-ink-400 text-[11px] font-semibold text-center">
      ⚪ GPS non disponible / Hors-ligne
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COURIERS
   ═══════════════════════════════════════════════════════════════ */
export function AdminCouriers() {
  const { orders = [], couriers, refreshOrders } = useOrders();
  const [courierList, setCourierList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const saveCouriersLocally = (newList) => {
    setCourierList(newList);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('yoha_couriers', JSON.stringify(newList));
      }
    } catch {}
  };

  const loadCouriers = useCallback(async () => {
    try {
      let localList = [];
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('yoha_couriers') : null;
        if (raw) localList = JSON.parse(raw);
      } catch {}

      let users = [];
      let profiles = [];

      try {
        const data = await apiFetch('/auth/youssef/users/?role=courier', { auth: true });
        users = Array.isArray(data) ? data : data?.results || [];
      } catch {}

      try {
        const data = await apiFetch('/orders/couriers/', { auth: true });
        profiles = Array.isArray(data) ? data : data?.results || [];
      } catch {}

      if (users.length > 0) {
        const merged = users.map((u) => {
          const p = profiles.find((pr) => pr.userId === u.id || (pr.email && pr.email.toLowerCase() === u.email.toLowerCase()));
          return {
            id: u.id,
            name: u.display_name,
            displayName: u.display_name,
            email: u.email,
            vehicle: p?.vehicle || 'Moto Express',
            isActive: u.is_active !== undefined ? u.is_active : true,
            rating: p?.rating || '5.0',
            totalDeliveries: p?.totalDeliveries || 0,
            totalRevenue: p?.totalRevenue || 0,
          };
        });
        localList.forEach((l) => {
          if (!merged.some((m) => m.id === l.id || (m.email && l.email && m.email.toLowerCase() === l.email.toLowerCase()))) {
            merged.push(l);
          }
        });
        saveCouriersLocally(merged);
        return;
      }

      if (!localList || localList.length === 0) {
        localList = [
          { id: 'c-1', name: 'Youssef B.', displayName: 'Youssef B.', email: 'youssef.b@yoha.ma', vehicle: 'Scooter Honda 125', isActive: true, totalDeliveries: 142, totalRevenue: 2840, rating: 4.9 },
          { id: 'c-2', name: 'Amine K.', displayName: 'Amine K.', email: 'amine.k@yoha.ma', vehicle: 'Yamaha NMAX', isActive: true, totalDeliveries: 98, totalRevenue: 1960, rating: 4.8 },
          { id: 'c-3', name: 'Driss T.', displayName: 'Driss T.', email: 'driss.t@yoha.ma', vehicle: 'Peugeot Tweet', isActive: true, totalDeliveries: 64, totalRevenue: 1280, rating: 4.7 },
        ];
        saveCouriersLocally(localList);
      } else {
        setCourierList(localList);
      }
    } catch {
      setCourierList([]);
    }
  }, []);

  useEffect(() => {
    try { if (typeof window !== 'undefined') localStorage.removeItem('yoha_couriers'); } catch {}
    loadCouriers();
  }, [loadCouriers]);

  const handleAdd = useCallback(async () => {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    const nameVal = displayName.trim() || trimmedEmail.split('@')[0];

    if (!trimmedEmail || !password) { setError('Email et mot de passe requis'); return; }
    if (password.length < 6) { setError('Mot de passe (minimum 6 caractères)'); return; }

    setAdding(true);
    let createdCourier = null;

    try {
      const apiRes = await apiFetch('/auth/youssef/users/create/', {
        method: 'POST',
        body: { email: trimmedEmail, password, display_name: nameVal, role: 'courier' },
        auth: true,
      });
      if (apiRes) {
        createdCourier = {
          id: apiRes.id || `c-${Date.now()}`,
          name: apiRes.display_name || nameVal,
          displayName: apiRes.display_name || nameVal,
          email: trimmedEmail,
          vehicle: 'Moto Express',
          isActive: true,
          totalDeliveries: 0,
          totalRevenue: 0,
          rating: 5.0,
        };
      }
    } catch (e) {
      // If API fails or backend error occurs, construct local courier object to keep UI responsive
      createdCourier = {
        id: `c-${Date.now()}`,
        name: nameVal,
        displayName: nameVal,
        email: trimmedEmail,
        vehicle: 'Moto Express',
        isActive: true,
        totalDeliveries: 0,
        totalRevenue: 0,
        rating: 5.0,
      };
    }

    if (createdCourier) {
      const updated = [createdCourier, ...courierList];
      saveCouriersLocally(updated);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setShowForm(false);
      if (refreshOrders) refreshOrders();
    }
    setAdding(false);
  }, [email, password, displayName, courierList, refreshOrders]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce livreur ?')) return;
    const updated = courierList.filter(c => c.id !== id);
    saveCouriersLocally(updated);
    const isUuid = typeof id === 'string' && id.includes('-');
    try {
      if (isUuid) {
        await apiFetch(`/auth/youssef/users/${id}/`, { method: 'DELETE', auth: true });
      } else {
        await apiFetch(`/orders/couriers/${id}/`, { method: 'DELETE', auth: true });
      }
    } catch {}
  }, [courierList]);

  return (
    <div className="space-y-5">
      <GradientHeader
        title={`${courierList.length} livreur${courierList.length > 1 ? 's' : ''}`}
        subtitle="Gestion des livreurs actifs"
        icon="🚴"
        gradient="from-violet-500 via-fuchsia-500 to-pink-500"
        actions={
          <ActionButton onClick={() => setShowForm(!showForm)} icon={<I.Plus size={16} />}>
            Ajouter
          </ActionButton>
        }
      />

      {showForm && (
        <GlassCard className="p-5" hover={false}>
          <SectionHeader title="Nouveau livreur" icon="➕" />
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">Nom</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nom du livreur"
                className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="livreur@yoha.ma" type="email"
                className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">Mot de passe</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" type="password"
                className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
            </div>
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
          <div className="mt-4">
            <ActionButton onClick={handleAdd} disabled={adding} icon={adding ? <I.Loader size={14} /> : <I.Plus size={14} />}>
              {adding ? 'Création…' : 'Créer le livreur'}
            </ActionButton>
          </div>
        </GlassCard>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courierList.map((c) => (
          <GlassCard key={c.id} className="p-4" hover>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {c.avatar ? (
                  <img src={c.avatar} className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/50 dark:ring-ink-800 shrink-0" alt="" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
                    <I.Bike size={20} />
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="font-display font-bold truncate">{c.name || c.displayName || '—'}</h3>
                  <div className="text-xs text-ink-500 truncate">{c.vehicle || 'Véhicule non spécifié'}</div>
                  <div className="text-[10px] font-mono text-ink-400 truncate mt-0.5">{c.email || '—'}</div>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)}
                className="cursor-grow shrink-0 h-8 w-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center">
                <I.Trash size={14} />
              </button>
            </div>

            {/* Delivery stats */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-ink-50/50 dark:bg-ink-950/30 p-2.5 text-center">
                <div className="text-[10px] text-ink-400 font-bold">Livraisons</div>
                <div className="font-display font-black text-sm">{c.totalDeliveries || '—'}</div>
              </div>
              <div className="rounded-xl bg-ink-50/50 dark:bg-ink-950/30 p-2.5 text-center">
                <div className="text-[10px] text-ink-400 font-bold">Revenus générés</div>
                <div className="font-display font-black text-sm">{c.totalRevenue ? formatMAD(c.totalRevenue) : '—'}</div>
              </div>
            </div>

            {/* Rating + status */}
            <div className="mt-3 flex items-center justify-between">
              <StarRating rating={c.rating} />
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${c.isActive !== false ? 'bg-emerald-500/10 text-emerald-600' : 'bg-ink-200/50 text-ink-400 dark:bg-ink-800/50'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.isActive !== false ? 'bg-emerald-500' : 'bg-ink-400'}`} />
                {c.isActive !== false ? 'Actif' : 'Inactif'}
              </span>
            </div>

            {/* Live GPS Badge */}
            <AdminCourierLiveGpsBadge courier={c} orders={orders} />
          </GlassCard>
        ))}
      </div>

      {courierList.length === 0 && (
        <EmptyState
          icon="🚴"
          title="Aucun livreur"
          description="Ajoutez votre premier livreur pour commencer"
          action={<ActionButton onClick={() => setShowForm(true)} icon={<I.Plus size={14} />}>Ajouter un livreur</ActionButton>}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVENUE
   ═══════════════════════════════════════════════════════════════ */
export function AdminRevenue({ orders }) {
  const [expanded, setExpanded] = useState(null);
  const [dateRange, setDateRange] = useState('all');

  const filtered = useMemo(() => filterByDateRange(orders, dateRange), [orders, dateRange]);

  const totalRev = filtered.reduce((s, o) => s + (Number(o.totalDh) || 0), 0);
  const grossProf = filtered.reduce((s, o) => s + (Number(o.profitDh) || 0), 0);
  const netProf = filtered.reduce((s, o) => s + (Number(o.netDh) || 0), 0);
  const margin = totalRev > 0 ? ((netProf / totalRev) * 100).toFixed(1) : '0';
  const avgOrder = filtered.length > 0 ? (totalRev / filtered.length) : 0;

  const restaurantRevenue = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      const name = o.restaurantName || 'Inconnu';
      if (!map[name]) map[name] = { name, revenue: 0, commission: 0, orders: 0 };
      map[name].revenue += Number(o.totalDh) || 0;
      map[name].commission += Number(o.profitDh) || 0;
      map[name].orders++;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  return (
    <div className="space-y-5">
      <GradientHeader
        title="Revenus & Bénéfices"
        subtitle={`Détail financier · ${filtered.length} commandes`}
        icon="💰"
        gradient="from-emerald-500 via-teal-500 to-cyan-500"
      />

      <div className="flex justify-end">
        <PillTabs
          tabs={DATE_RANGES.map((r) => ({ id: r.id, label: r.label }))}
          current={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Profit breakdown cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Chiffre d'affaires" value={totalRev} suffix=" MAD" icon={<I.Star size={18} />} color="from-brand-500 to-pink-500" animate />
        <StatCard label="Bénéfice brut" value={grossProf} suffix=" MAD" icon={<I.Sparkle size={18} />} color="from-violet-500 to-fuchsia-500" animate />
        <StatCard label="Bénéfice net" value={netProf} suffix=" MAD" sub={`Marge ${margin}%`} icon={<I.Award size={18} />} color="from-emerald-500 to-teal-500" animate />
        <StatCard label="Panier moyen" value={Math.round(avgOrder)} suffix=" MAD" sub={`${filtered.length} commandes`} icon={<I.Bag size={18} />} color="from-sky-500 to-indigo-500" animate />
      </div>

      {/* Commission tracking by restaurant */}
      <GlassCard className="p-5" hover={false}>
        <SectionHeader
          title="Revenus par restaurant"
          subtitle="Détail des commissions et revenus"
          icon="🍽️"
          action={
            <span className="text-xs font-bold text-ink-500 dark:text-ink-400 bg-ink-100/80 dark:bg-ink-800/80 px-2.5 py-1 rounded-lg">
              {restaurantRevenue.length} restaurant{restaurantRevenue.length > 1 ? 's' : ''}
            </span>
          }
        />
        {restaurantRevenue.length > 0 ? (
          <div className="mt-4 space-y-2">
            {restaurantRevenue.map((r) => {
              const pct = totalRev > 0 ? Math.round((r.revenue / totalRev) * 100) : 0;
              return (
                <div key={r.name} className="rounded-xl bg-white/50 dark:bg-ink-900/50 p-3 border border-ink-100/50 dark:border-ink-800/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{r.name}</div>
                      <div className="text-[11px] text-ink-400">{r.orders} commandes</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold">{formatMAD(r.revenue)}</div>
                      <div className="text-[11px] text-violet-600 font-semibold">Commission: {formatMAD(r.commission)}</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 text-center text-sm text-ink-400 py-6">Aucune donnée de revenus</div>
        )}
      </GlassCard>

      {/* Detail per order */}
      <GlassCard className="p-5" hover={false}>
        <SectionHeader title="Détail par commande" subtitle="Calcul des profits" icon="📋" />

        <div className="hidden md:block overflow-x-auto mt-4">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-50/50 dark:bg-ink-950/30 text-xs uppercase tracking-wider text-ink-500">
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
            <tbody className="divide-y divide-ink-100/50 dark:divide-ink-800/50">
              {filtered.map((o) => (
                <React.Fragment key={o.id}>
                  <tr className="cursor-pointer hover:bg-ink-50/50 dark:hover:bg-ink-950/30 transition" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    <td className="px-4 py-3 font-bold text-xs">#{o.id}</td>
                    <td className="px-4 py-3 max-w-[120px] truncate">{o.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs">{o.customer?.phone || '—'}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-xs">{o.customer?.address || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatMAD(o.totalDh)}</td>
                    <td className="px-4 py-3 text-right text-violet-600 font-bold">+{formatMAD(o.profitDh)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{formatMAD(o.netDh)}</td>
                  </tr>
                  {expanded === o.id && (
                    <tr key={`detail-${o.id}`}>
                      <td colSpan={7} className="px-6 py-4 bg-ink-50/30 dark:bg-ink-950/20 border-b border-ink-100/50 dark:border-ink-800/50">
                        <div className="text-sm space-y-2">
                          <span className="font-semibold text-ink-700 dark:text-ink-200">Articles commandés :</span>
                          <div className="grid gap-2">
                            {(o.items || []).map((item, i) => (
                              <div key={i} className="flex items-center justify-between bg-white/80 dark:bg-ink-900/80 rounded-xl px-4 py-2 border border-ink-200/40 dark:border-ink-800/40">
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold">{item.name}</span>
                                  <span className="text-ink-500 ml-2">x{item.qty}</span>
                                  <span className="text-ink-400 ml-2 text-xs">{item.restaurantName}</span>
                                </div>
                                <span className="font-bold shrink-0 ml-2">{formatMAD(item.price * item.qty)}</span>
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

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden mt-4">
          {filtered.map((o) => (
            <div key={o.id} className="rounded-xl border border-ink-200/40 bg-white/50 p-3 dark:border-ink-800/40 dark:bg-ink-950/30 cursor-pointer" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-xs">#{o.id}</div>
                  <div className="mt-0.5 truncate text-sm text-ink-500">{o.customer?.name || '—'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm">{formatMAD(o.totalDh)}</div>
                  <div className="text-[11px] text-emerald-600 font-bold">+{formatMAD(o.netDh)}</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="min-w-0 rounded-lg bg-white/80 p-2 dark:bg-ink-900/80">
                  <div className="text-ink-400">Téléphone</div>
                  <div className="truncate font-semibold">{o.customer?.phone || '—'}</div>
                </div>
                <div className="min-w-0 rounded-lg bg-white/80 p-2 dark:bg-ink-900/80">
                  <div className="text-ink-400">Brut</div>
                  <div className="font-bold text-violet-600">+{formatMAD(o.profitDh)}</div>
                </div>
              </div>
              {expanded === o.id && (
                <div className="mt-3 pt-3 border-t border-ink-100/50 dark:border-ink-800/50 space-y-1.5">
                  <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">Articles :</span>
                  {(o.items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/80 dark:bg-ink-900/80 rounded-lg px-3 py-1.5 border border-ink-200/40 dark:border-ink-800/40 text-xs">
                      <span className="truncate min-w-0 flex-1">{item.name} <span className="text-ink-400">x{item.qty}</span></span>
                      <span className="font-bold shrink-0 ml-2">{formatMAD(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-4">
            <EmptyState icon="📊" title="Aucune donnée" description="Aucune commande pour cette période" />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROMOS
   ═══════════════════════════════════════════════════════════════ */
const DEFAULT_PROMOS = [
  { id: 'p-1', code: 'YOHA50', discount: 50, fixedAmount: true, section: 'all', active: true, usageCount: 24, label: '-50 MAD (1ère commande & connecté)' },
  { id: 'p-2', code: 'GROUPE0', discount: 0, freeDelivery: true, section: 'all', active: true, usageCount: 18, label: '0 MAD livraison dès 200 MAD' },
  { id: 'p-3', code: 'YOHA10', discount: 10, section: 'restaurant', active: true, usageCount: 42, label: '-10% Pizzas & Restos' },
  { id: 'p-4', code: 'EXCLU15', discount: 15, section: 'all', active: true, usageCount: 9, label: '-15% Exclusif YoHa' },
];

export function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);
  const [section, setSection] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const savePromosLocally = (newList) => {
    const unique = [];
    const seen = new Set();
    newList.forEach(item => {
      const c = (item.code || '').toUpperCase().trim();
      if (c && !seen.has(c)) {
        seen.add(c);
        // Ensure proper flags
        if (c === 'YOHA50') {
          item.fixedAmount = true;
          item.discount = 50;
        } else if (c === 'GROUPE0') {
          item.freeDelivery = true;
          item.discount = 0;
        }
        unique.push(item);
      }
    });
    setPromos(unique);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('yoha_promos', JSON.stringify(unique));
      }
    } catch {}
  };

  const loadFromApi = useCallback(async () => {
    try {
      setLoading(true);
      let localList = [];
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('yoha_promos') : null;
        if (raw) localList = JSON.parse(raw);
      } catch {}

      if (!localList || localList.length === 0) {
        localList = DEFAULT_PROMOS;
      }

      // Merge and sanitize with DEFAULT_PROMOS
      const merged = [...DEFAULT_PROMOS];
      localList.forEach(item => {
        const c = (item.code || '').toUpperCase().trim();
        const existingIdx = merged.findIndex(m => m.code === c);
        if (existingIdx >= 0) {
          merged[existingIdx] = { ...merged[existingIdx], ...item };
        } else if (c) {
          merged.push(item);
        }
      });

      savePromosLocally(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  const addPromo = useCallback(async () => {
    const c = code.trim().toUpperCase();
    if (!c) { setError('Code requis'); return; }
    if (discount < 1 || discount > 100) { setError('Remise entre 1 et 100 %'); return; }
    const newPromo = { id: `p-${Date.now()}`, code: c, discount, section, active: true, usageCount: 0 };
    const updated = [newPromo, ...promos];
    savePromosLocally(updated);
    setCode('');
    setError('');

    try {
      await apiFetch('/marketing/promos/', {
        method: 'POST',
        body: { code: c, discount, section },
        auth: true,
      });
    } catch {}
  }, [code, discount, section, promos]);

  const deletePromo = useCallback(async (id) => {
    const updated = promos.filter(p => p.id !== id);
    savePromosLocally(updated);
    try {
      await apiFetch(`/marketing/promos/${id}/`, { method: 'DELETE', auth: true });
    } catch {}
  }, [promos]);

  const toggleActive = useCallback(async (id, currentActive) => {
    const updated = promos.map(p => p.id === id ? { ...p, active: !currentActive } : p);
    savePromosLocally(updated);
    try {
      await apiFetch(`/marketing/promos/${id}/`, {
        method: 'PATCH',
        body: { active: !currentActive },
        auth: true,
      });
    } catch {}
  }, [promos]);

  const copyCode = useCallback((promoCode, id) => {
    navigator.clipboard?.writeText(promoCode).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  }, []);

  const activeCount = promos.filter((p) => p.active !== false).length;

  return (
    <div className="space-y-5">
      <GradientHeader
        title="Codes promo"
        subtitle={`${promos.length} codes · ${activeCount} actifs`}
        icon="🎫"
        gradient="from-amber-500 via-orange-500 to-red-500"
      />

      {/* Add form */}
      <GlassCard className="p-5" hover={false}>
        <SectionHeader title="Créer un code promo" icon="➕" />
        <div className="grid sm:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-ink-500 mb-1.5">Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EXCLU15"
              className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm font-bold tracking-wider text-ink-900 outline-none backdrop-blur-sm transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-500 mb-1.5">Remise (%)</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={1} max={100}
              className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm font-bold text-ink-900 outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-500 mb-1.5">Section ciblée</label>
            <select value={section} onChange={(e) => setSection(e.target.value)}
              className="w-full rounded-xl border border-ink-200/60 bg-white/80 px-3 py-2.5 text-sm font-semibold text-ink-900 outline-none backdrop-blur-sm transition focus:border-brand-400 dark:border-ink-700/50 dark:bg-ink-900/80 dark:text-white">
              {PROMO_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <ActionButton onClick={addPromo} className="w-full" icon={<I.Plus size={14} />}>
              Ajouter
            </ActionButton>
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
      </GlassCard>

      {/* Promo list */}
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="border-b border-ink-200/40 dark:border-ink-800/40 px-5 py-4">
          <SectionHeader
            title={loading ? 'Chargement…' : promos.length === 0 ? 'Aucun code promo' : `${promos.length} code${promos.length > 1 ? 's' : ''} promo`}
            icon="📋"
            action={
              <span className="text-xs font-bold text-ink-500 bg-ink-100/80 dark:bg-ink-800/80 px-2.5 py-1 rounded-lg">
                {activeCount} actifs
              </span>
            }
          />
        </div>

        {promos.length > 0 ? (
          <div className="divide-y divide-ink-100/50 dark:divide-ink-800/50">
            {promos.map((p) => {
              const codeUpper = (p.code || '').toUpperCase().trim();
              const sectionLabel = PROMO_SECTIONS.find((s) => s.id === p.section)?.label || p.section;
              const isExpired = p.expiresAt && daysSince(p.expiresAt) > 0;
              
              let discountBadge = `-${p.discount}%`;
              if (codeUpper === 'YOHA50' || p.fixedAmount) {
                discountBadge = '-50 MAD';
              } else if (codeUpper === 'GROUPE0' || p.freeDelivery) {
                discountBadge = 'Livraison 0 MAD';
              }

              return (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-ink-50/50 dark:hover:bg-ink-950/30 transition">
                  <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Code badge with copy */}
                    <button
                      onClick={() => copyCode(p.code, p.id)}
                      className={`group relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-black tracking-wider text-sm transition-all ${
                        p.active !== false
                          ? 'bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:hover:bg-brand-900/60'
                          : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400 opacity-60'
                      }`}
                      title="Cliquer pour copier"
                    >
                      {p.code}
                      <span className="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">
                        {copiedId === p.id ? '✓' : '📋'}
                      </span>
                    </button>

                    <span className="font-black text-base text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                      {discountBadge}
                    </span>

                    {/* Section pill */}
                    <span className="text-[11px] font-bold text-ink-500 bg-ink-100/80 dark:bg-ink-800/80 px-2.5 py-1 rounded-lg">
                      {sectionLabel}
                    </span>

                    {/* Description tag */}
                    {p.label && (
                      <span className="text-[11px] font-medium text-ink-400 hidden md:inline">
                        • {p.label}
                      </span>
                    )}

                    {/* Usage count */}
                    {p.usageCount != null && (
                      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded-lg">
                        {p.usageCount} utilisation{p.usageCount > 1 ? 's' : ''}
                      </span>
                    )}

                    {/* Expiry */}
                    {p.expiresAt && (
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${isExpired ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>
                        {isExpired ? 'Expiré' : `Exp. ${new Date(p.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Toggle
                      checked={p.active !== false}
                      onChange={() => toggleActive(p.id, p.active !== false)}
                      size="sm"
                    />
                    <button onClick={() => deletePromo(p.id)}
                      className="cursor-grow h-9 w-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center">
                      <I.Trash size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !loading && (
            <EmptyState
              icon="🎫"
              title="Aucun code promo"
              description="Créez votre premier code promo pour attirer des clients"
            />
          )
        )}
      </GlassCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVIEWS & RATINGS (AVIS CLIENTS)
   ═══════════════════════════════════════════════════════════════ */
export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const { push: pushToast } = useToast();

  const loadReviews = useCallback(() => {
    setReviews(getStoredReviews());
  }, []);

  useEffect(() => {
    loadReviews();
    window.addEventListener('yoha_reviews_updated', loadReviews);
    return () => window.removeEventListener('yoha_reviews_updated', loadReviews);
  }, [loadReviews]);

  const handleDelete = (id) => {
    if (confirm('Voulez-vous supprimer cet avis ?')) {
      const updated = deleteReview(id);
      if (updated) setReviews(updated);
      pushToast({ title: 'Avis supprimé', type: 'info' });
    }
  };

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        !search.trim() ||
        (r.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.restaurantName || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.courierName || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.orderId || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.comment || '').toLowerCase().includes(search.toLowerCase());

      const matchRating = filterRating === 'all' || String(r.rating) === String(filterRating);

      return matchSearch && matchRating;
    });
  }, [reviews, search, filterRating]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });
    return counts;
  }, [reviews]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header Banner */}
      <GradientHeader
        icon={<I.Star size={24} />}
        title="Avis & Évaluations Clients"
        subtitle="Retrouvez toutes les notes et remarques des clients avec le détail des livreurs et des restaurants."
      />

      {/* Overview Rating Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-display font-black text-2xl shrink-0 shadow-sm">
            ★
          </div>
          <div>
            <div className="text-xs font-bold text-ink-500 uppercase tracking-wider">Note moyenne globale</div>
            <div className="font-display font-black text-3xl text-ink-900 dark:text-white mt-0.5">
              {avgRating} <span className="text-sm font-bold text-ink-400">/ 5.0</span>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Basé sur {reviews.length} avis client{reviews.length > 1 ? 's' : ''}
            </div>
          </div>
        </GlassCard>

        {/* Rating Breakdown Bar */}
        <GlassCard className="p-5 sm:col-span-2 space-y-1.5 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((num) => {
            const cnt = ratingCounts[num] || 0;
            const pct = reviews.length ? Math.round((cnt / reviews.length) * 100) : 0;
            return (
              <div key={num} className="flex items-center gap-3 text-xs font-semibold">
                <span className="w-8 shrink-0 flex items-center gap-0.5 text-amber-500 font-bold">
                  {num} ★
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-ink-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-14 text-right text-ink-400 shrink-0">{cnt} ({pct}%)</span>
              </div>
            );
          })}
        </GlassCard>
      </div>

      {/* Filter & Search Bar */}
      <GlassCard className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Rechercher un livreur, un restau, un client ou une remarque..."
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-ink-400 mr-1 shrink-0">Filtrer par note :</span>
            {['all', '5', '4', '3', '2', '1'].map((val) => (
              <button
                key={val}
                onClick={() => setFilterRating(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  filterRating === val
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-slate-200 dark:hover:bg-ink-700'
                }`}
              >
                {val === 'all' ? 'Tous' : `${val} ★`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Cards List */}
        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4 pt-2">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow relative space-y-3"
              >
                {/* Header: Stars + Order ID + Date */}
                <div className="flex items-start justify-between gap-2 border-b border-ink-100 dark:border-ink-800 pb-3">
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 text-base">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s}>{s <= rev.rating ? '★' : '☆'}</span>
                      ))}
                      <span className="ml-1 text-xs font-black text-ink-900 dark:text-white">
                        {rev.rating}/5
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-400 font-semibold mt-0.5 block">
                      {new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono text-xs font-bold border border-brand-500/20">
                      #{rev.orderId}
                    </span>
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="cursor-grow h-8 w-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/40 transition-colors flex items-center justify-center"
                      title="Supprimer l'avis"
                    >
                      <I.Trash size={14} />
                    </button>
                  </div>
                </div>

                {/* Customer Remark Comment */}
                <p className="text-sm text-ink-800 dark:text-ink-100 font-medium leading-relaxed italic bg-slate-50 dark:bg-ink-950 p-3 rounded-xl border border-ink-100 dark:border-ink-800/60">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {/* Detailed Breakdown: Customer, Restaurant, Courier */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-ink-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">👤 Client</span>
                    <span className="font-bold text-ink-900 dark:text-white truncate block mt-0.5">
                      {rev.customerName || 'Client'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">🍽️ Restau</span>
                    <span className="font-bold text-ink-900 dark:text-white truncate block mt-0.5">
                      {rev.restaurantName || 'Restaurant'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-sky-500/10 dark:bg-sky-500/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 block">🛵 Livreur</span>
                    <span className="font-bold text-ink-900 dark:text-white truncate block mt-0.5">
                      {rev.courierName || 'Livreur'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="⭐"
            title="Aucun avis trouvé"
            description="Aucun avis client ne correspond à votre filtre actuel"
          />
        )}
      </GlassCard>
    </div>
  );
}
