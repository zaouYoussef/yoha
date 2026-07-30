'use client';

import React, { useState, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  GlassCard, StatCard, SectionHeader, StatusPill, SearchBar, EmptyState,
  GradientHeader, FilterChip, DonutChart, HorizontalBarChart,
  TimeDistribution, DayComparison, InsightCard, DataRow, ComparisonBadge,
  GlassTable, LegendRow, DateRangeSelector, formatOrderDateTime,
} from './DashShared.jsx';
import { isActiveOrderStatus, ORDER_STATES } from '../data/index.js';

function formatMAD(v) {
  return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' DH';
}

function computeHourlyDistribution(orders) {
  const hours = Array(24).fill(0);
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const h = d.getHours();
    if (h >= 0 && h < 24) hours[h]++;
  });
  return hours;
}

function computeRestaurantDistribution(orders) {
  const map = {};
  orders.forEach((o) => {
    const name = o.restaurantName || 'Inconnu';
    if (!map[name]) map[name] = 0;
    map[name]++;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

export default function AdminOrdersEnhanced({ orders }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const filtered = useMemo(() => {
    let list = orders;
    if (dateRange === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      list = list.filter((o) => new Date(o.createdAt) >= start);
    } else if (dateRange === 'custom' && startDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = endDate ? new Date(`${endDate}T23:59:59`) : new Date(864e14);
      list = list.filter((o) => {
        const t = new Date(o.createdAt);
        return t >= start && t <= end;
      });
    }
    if (filter !== 'all') list = list.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
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
    const counts = { all: filtered.length };
    Object.keys(ORDER_STATES).forEach((k) => { counts[k] = filtered.filter((o) => o.status === k).length; });
    return counts;
  }, [filtered]);

  const activeOrders = useMemo(() => filtered.filter((o) => isActiveOrderStatus(o.status)), [filtered]);
  const deliveredOrders = useMemo(() => filtered.filter((o) => o.status === 'delivered'), [filtered]);
  const cancelledOrders = useMemo(() => filtered.filter((o) => o.status === 'cancelled'), [filtered]);
  const totalRev = useMemo(() => filtered.reduce((s, o) => s + (Number(o.totalDh) || 0), 0), [filtered]);
  const avgOrder = filtered.length > 0 ? totalRev / filtered.length : 0;

  const hourlyDist = useMemo(() => computeHourlyDistribution(filtered), [filtered]);
  const restaurantDist = useMemo(() => computeRestaurantDistribution(filtered), [filtered]);
  const peakHour = useMemo(() => {
    let max = 0, peak = 0;
    hourlyDist.forEach((v, i) => { if (v > max) { max = v; peak = i; } });
    return peak;
  }, [hourlyDist]);

  const statusDistData = useMemo(() => {
    return Object.entries(ORDER_STATES).map(([k, s]) => ({
      label: s.label,
      value: statusCounts[k] || 0,
    }));
  }, [statusCounts]);

  return (
    <div className="space-y-5">
      <GradientHeader
        title="Commandes · Analyse détaillée"
        subtitle={`${filtered.length} commandes affichées · ${activeOrders.length} en cours`}
        icon="📦"
        gradient="from-brand-500 via-pink-500 to-rose-500"
      />

      {/* KPIs row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Commandes" value={filtered.length} sub="Filtrées" icon={<I.Bag size={16} />} color="from-brand-500 to-orange-500" animate />
        <StatCard label="Actives" value={activeOrders.length} sub="En cours" icon={<I.Bike size={16} />} color="from-sky-500 to-indigo-500" animate />
        <StatCard label="Livrées" value={deliveredOrders.length} sub={`${filtered.length ? Math.round((deliveredOrders.length / filtered.length) * 100) : 0}% du total`} icon={<I.Award size={16} />} color="from-emerald-500 to-teal-500" animate />
        <StatCard label="CA total" value={formatMAD(totalRev)} sub={`Moy. ${formatMAD(Math.round(avgOrder))}/cmd`} icon={<I.Star size={16} />} color="from-violet-500 to-fuchsia-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par ID, client, restaurant, livreur..." className="lg:w-80" />
        <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} count={statusCounts.all}>Toutes</FilterChip>
        {Object.entries(ORDER_STATES).map(([k, s]) => (
          <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)} count={statusCounts[k] || 0}>{s.label}</FilterChip>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Status distribution */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Répartition par statut" icon="📊" />
          <div className="mt-3 space-y-2">
            {statusDistData.map((s) => {
              const pct = filtered.length > 0 ? Math.round((s.value / filtered.length) * 100) : 0;
              return (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <StatusPill status={s.label} />
                  <div className="flex-1 h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-bold w-8 text-right">{s.value}</span>
                  <span className="text-ink-400 w-8">{pct}%</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Hourly distribution */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Par heure de la journée" subtitle={`Pic à ${String(peakHour).padStart(2, '0')}h`} icon="🕐" />
          <div className="mt-2 max-h-56 overflow-y-auto pr-1">
            <TimeDistribution data={hourlyDist} />
          </div>
        </GlassCard>

        {/* By restaurant */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Par restaurant" icon="🍽️" />
          <div className="mt-2 max-h-56 overflow-y-auto pr-1">
            <HorizontalBarChart data={restaurantDist} color="from-violet-500 to-fuchsia-400" />
          </div>
        </GlassCard>
      </div>

      {/* Courier stats + Order value distribution */}
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Couverture livreurs" subtitle="Commandes assignées" icon="🛵" />
          {(() => {
            const courierMap = {};
            filtered.forEach((o) => {
              const name = o.courierName || 'Non assigné';
              if (!courierMap[name]) courierMap[name] = { label: name, orders: 0, revenue: 0 };
              courierMap[name].orders++;
              courierMap[name].revenue += Number(o.totalDh) || 0;
            });
            const courierList = Object.values(courierMap).sort((a, b) => b.orders - a.orders);
            return courierList.length > 0 ? (
              <div className="mt-3 space-y-2">
                {courierList.map((c, i) => {
                  const maxOrders = courierList[0]?.orders || 1;
                  const pct = Math.round((c.orders / maxOrders) * 100);
                  return (
                    <div key={c.label} className="flex items-center gap-2 text-xs">
                      <span className="w-20 truncate shrink-0 font-medium">{c.label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-bold w-6 text-right">{c.orders}</span>
                      <span className="text-ink-400 w-16 text-right">{formatMAD(c.revenue)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState title="Aucune donnée" small />;
          })()}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Valeur des commandes" icon="💰" />
          {(() => {
            const brackets = [
              { label: '< 30 DH', min: 0, max: 30 },
              { label: '30-50 DH', min: 30, max: 50 },
              { label: '50-80 DH', min: 50, max: 80 },
              { label: '80-120 DH', min: 80, max: 120 },
              { label: '120+ DH', min: 120, max: Infinity },
            ];
            const dist = brackets.map((b) => ({
              label: b.label,
              value: filtered.filter((o) => {
                const v = Number(o.totalDh) || 0;
                return v >= b.min && v < b.max;
              }).length,
            }));
            const maxVal = Math.max(1, ...dist.map((d) => d.value));
            return (
              <div className="mt-3 space-y-2">
                {dist.map((d) => {
                  const pct = maxVal > 0 ? Math.round((d.value / maxVal) * 100) : 0;
                  return (
                    <div key={d.label} className="flex items-center gap-2 text-xs">
                      <span className="w-16 shrink-0 text-ink-500">{d.label}</span>
                      <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-bold w-6 text-right">{d.value}</span>
                    </div>
                  );
                })}
                <InsightCard icon="📊" color="border-l-brand-500" className="mt-2">
                  Valeur moyenne : <b>{formatMAD(Math.round(avgOrder))}</b> · Médiane estimée : <b>{formatMAD(Math.round(avgOrder * 0.85))}</b>
                </InsightCard>
              </div>
            );
          })()}
        </GlassCard>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Aucune commande trouvée" description="Essayez de modifier vos filtres ou votre recherche" />
      ) : (
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="border-b border-ink-200/40 dark:border-ink-800/40 px-5 py-3 flex items-center justify-between">
            <SectionHeader title={`${filtered.length} commande${filtered.length > 1 ? 's' : ''}`} icon="📋" />
            <div className="flex gap-1 rounded-lg bg-ink-100 dark:bg-ink-800 p-0.5">
              <button onClick={() => setViewMode('table')} className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${viewMode === 'table' ? 'bg-white dark:bg-ink-700 shadow-sm' : ''}`}>Tableau</button>
              <button onClick={() => setViewMode('cards')} className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${viewMode === 'cards' ? 'bg-white dark:bg-ink-700 shadow-sm' : ''}`}>Cartes</button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-ink-50/50 text-xs uppercase tracking-wider text-ink-500 dark:bg-ink-950/30">
                  <tr>
                    <th className="px-4 py-3 text-left sm:px-5">Commande</th>
                    <th className="px-4 py-3 text-left sm:px-5">Date</th>
                    <th className="px-4 py-3 text-left sm:px-5">Client</th>
                    <th className="px-4 py-3 text-left sm:px-5">Restaurant</th>
                    <th className="px-4 py-3 text-left sm:px-5">Livreur</th>
                    <th className="px-4 py-3 text-right sm:px-5">Total</th>
                    <th className="px-4 py-3 text-right sm:px-5">Net</th>
                    <th className="px-4 py-3 text-left sm:px-5">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/50 dark:divide-ink-800/50">
                  {filtered.map((o) => (
                    <tr key={o.id} className="transition hover:bg-ink-50/50 dark:hover:bg-ink-950/30">
                      <td className="px-4 py-3 font-bold sm:px-5">#{o.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-ink-600 font-mono">{formatOrderDateTime(o.createdAt)}</td>
                      <td className="max-w-[8rem] truncate px-4 py-3">{o.customer?.name || '—'}</td>
                      <td className="max-w-[8rem] truncate px-4 py-3">{o.restaurantName}</td>
                      <td className="max-w-[7rem] truncate px-4 py-3 text-ink-500">{o.courierName || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatMAD(o.totalDh)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">+{formatMAD(o.netDh)}</td>
                      <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className={`${viewMode === 'table' ? 'md:hidden' : ''} space-y-3 p-3`}>
            {filtered.map((o) => (
              <div key={o.id} className="rounded-xl border border-ink-200/40 bg-white/50 p-3 dark:border-ink-800/40 dark:bg-ink-950/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">#{o.id}</span>
                      <span className="text-[11px] text-ink-400">{formatOrderDateTime(o.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 text-sm text-ink-500">{o.restaurantName} · {o.customer?.name || '—'}</div>
                  </div>
                  <StatusPill status={o.status} />
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
                  {o.courierName && <span>🛵 {o.courierName}</span>}
                  <span className="font-bold text-ink-700">{formatMAD(o.totalDh)}</span>
                  {o.netDh > 0 && <span className="text-emerald-600 font-semibold">Net: +{formatMAD(o.netDh)}</span>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
