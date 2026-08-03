'use client';

import React, { useState, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  GlassCard, StatCard, SectionHeader, EmptyState, GradientHeader,
  LineChart, BarChart, HorizontalBarChart, PillTabs, DataRow,
  InsightCard, ComparisonBadge, SectionDivider, MiniTrend, KpiCard,
} from './DashShared.jsx';
import {
  bucketRevenueLast7Days, last7DayLabels,
  mergeSeries7, MOCK_ADMIN_REVENUE_7D,
} from '../data/index.js';

function formatMAD(v) {
  return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' DH';
}

function computeCommission(revenue, rate = 15) {
  return Math.round(revenue * rate / 100);
}

const DATE_RANGES = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: '7 jours' },
  { id: 'all', label: 'Tout' },
];

export default function AdminRevenueEnhanced({ orders }) {
  const [dateRange, setDateRange] = useState('all');

  const filtered = useMemo(() => {
    if (dateRange === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      return orders.filter((o) => new Date(o.createdAt) >= start);
    }
    if (dateRange === 'week') {
      const weekAgo = Date.now() - 604800000;
      return orders.filter((o) => new Date(o.createdAt).getTime() >= weekAgo);
    }
    return orders;
  }, [orders, dateRange]);

  const totalRev = useMemo(() => filtered.reduce((s, o) => s + (Number(o.totalDh) || 0), 0), [filtered]);
  const totalProfit = useMemo(() => filtered.reduce((s, o) => s + (Number(o.profitDh) || 0), 0), [filtered]);
  const totalNet = useMemo(() => filtered.reduce((s, o) => s + (Number(o.netDh) || 0), 0), [filtered]);
  const margin = totalRev > 0 ? ((totalNet / totalRev) * 100).toFixed(1) : '0';
  const avgOrder = filtered.length > 0 ? totalRev / filtered.length : 0;

  const commissionRate = 15;
  const totalCommission = useMemo(() => computeCommission(totalRev, commissionRate), [totalRev]);
  const courierCost = totalProfit - totalNet;
  const platformNet = totalNet;

  const restaurantRevenue = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      const name = o.restaurantName || 'Inconnu';
      if (!map[name]) map[name] = { name, revenue: 0, profit: 0, orders: 0, commission: 0 };
      map[name].revenue += Number(o.totalDh) || 0;
      map[name].profit += Number(o.profitDh) || 0;
      map[name].orders++;
      map[name].commission += computeCommission(Number(o.totalDh) || 0, commissionRate);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const rev7Raw = bucketRevenueLast7Days(orders);
  const rev7 = mergeSeries7(rev7Raw, MOCK_ADMIN_REVENUE_7D);
  const days = last7DayLabels();
  const revTrend = rev7.length > 1 ? ((rev7[rev7.length - 1] - rev7[rev7.length - 2]) / Math.max(rev7[rev7.length - 2], 1)) * 100 : 0;

  const revenueByDay = useMemo(() => {
    const dayMap = {};
    filtered.forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      dayMap[d] = (dayMap[d] || 0) + (Number(o.totalDh) || 0);
    });
    return Object.entries(dayMap).slice(-14).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  return (
    <div className="space-y-5">
      <GradientHeader
        title="Revenus & Analyse financière"
        subtitle={`${formatMAD(totalRev)} CA · ${formatMAD(totalNet)} net · Marge ${margin}%`}
        icon="💰"
        gradient="from-emerald-500 via-teal-500 to-cyan-500"
      />

      <div className="flex justify-end">
        <PillTabs tabs={DATE_RANGES.map((r) => ({ id: r.id, label: r.label }))} current={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Chiffre d'affaires" value={formatMAD(totalRev)} sub={`${filtered.length} commandes`} icon={<I.Star size={16} />} color="from-brand-500 to-pink-500" animate />
        <StatCard label="Bénéfice brut" value={formatMAD(totalProfit)} sub={`${commissionRate}% commission`} icon={<I.Sparkle size={16} />} color="from-violet-500 to-fuchsia-500" animate />
        <KpiCard label="Bénéfice net" value={totalNet} sub={`Marge ${margin}%`} icon={<I.Award size={16} />} color="from-emerald-500 to-teal-500" format={(v) => formatMAD(v)} />
        <StatCard label="Panier moyen" value={formatMAD(Math.round(avgOrder))} sub={`${filtered.length} commandes`} icon={<I.Bag size={16} />} color="from-brand-500 to-violet-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Revenue 7-day chart */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Revenus 7 jours" icon="📈" />
            <ComparisonBadge current={rev7[rev7.length - 1]} previous={rev7[rev7.length - 2] || 0} />
          </div>
          <LineChart data={rev7} color="#10b981" color2="#34d399" height={150} />
          <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-500 mt-1.5">
            {days.map((d, i) => <div key={i} className="text-center font-medium">{d}</div>)}
          </div>
        </GlassCard>

        {/* Revenue + profit breakdown */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Répartition des revenus" icon="🍰" />
          <div className="mt-4 space-y-3">
            <DataRow label="CA total" value={formatMAD(totalRev)} color="text-ink-900 dark:text-white font-bold" />
            <div className="pl-4 border-l-2 border-ink-200 dark:border-ink-700 space-y-2">
              <DataRow label={`Commission YoHa (${commissionRate}%)`} value={formatMAD(totalCommission)} color="text-violet-600" />
              <DataRow label="Coût livreurs" value={formatMAD(courierCost)} color="text-amber-600" />
              <DataRow label="Frais plateforme" value={formatMAD(0)} color="text-ink-400" />
            </div>
            <div className="border-t border-ink-200/40 dark:border-ink-800/40 pt-2">
              <DataRow label="Bénéfice net plateforme" value={formatMAD(platformNet)} color="text-emerald-600 font-bold text-base" />
              <DataRow label="Marge nette" value={`${margin}%`} color="text-brand-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Revenue by restaurant */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="CA par restaurant" icon="🍽️" />
          {restaurantRevenue.length > 0 ? (
            <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
              {restaurantRevenue.map((r) => {
                const pct = totalRev > 0 ? Math.round((r.revenue / totalRev) * 100) : 0;
                return (
                  <div key={r.name} className="rounded-lg bg-white/50 dark:bg-ink-900/50 p-2.5 border border-ink-100/50 dark:border-ink-800/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold">{r.name}</div>
                        <div className="text-[10px] text-ink-400">{r.orders} commandes</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold">{formatMAD(r.revenue)}</div>
                        <div className="text-[10px] text-violet-600">Com. {formatMAD(r.commission)}</div>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="Aucune donnée" small />}
        </GlassCard>

        {/* Revenue trend over days */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Évolution quotidienne" icon="📊" />
          {revenueByDay.length > 0 ? (
            <div className="mt-3 max-h-72 overflow-y-auto space-y-1.5">
              {revenueByDay.map((d, i) => {
                const maxRev = Math.max(1, ...revenueByDay.map((r) => r.value));
                const pct = Math.round((d.value / maxRev) * 100);
                return (
                  <div key={d.label} className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-ink-400 shrink-0">{d.label}</span>
                    <div className="flex-1 h-4 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all flex items-center justify-end pr-2" style={{ width: `${pct}%`, minWidth: d.value > 0 ? '20%' : '0%' }}>
                        {pct > 20 && <span className="text-[8px] text-white font-bold">{formatMAD(d.value)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="Aucune donnée" small />}
        </GlassCard>
      </div>

      {/* Order detail table */}
      <GlassCard className="p-5" hover={false}>
        <SectionHeader title="Détail par commande" icon="📋" />
        {filtered.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-ink-50/50 dark:bg-ink-950/30 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-3 py-2.5 text-left">#</th>
                  <th className="px-3 py-2.5 text-left">Client</th>
                  <th className="px-3 py-2.5 text-left">Restaurant</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-3 py-2.5 text-right">Commission</th>
                  <th className="px-3 py-2.5 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100/50 dark:divide-ink-800/50">
                {filtered.slice(0, 50).map((o) => (
                  <tr key={o.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-950/30 transition">
                    <td className="px-3 py-2 font-bold text-xs">#{o.id}</td>
                    <td className="px-3 py-2 max-w-[120px] truncate text-xs">{o.customer?.name || '—'}</td>
                    <td className="px-3 py-2 max-w-[120px] truncate text-xs">{o.restaurantName}</td>
                    <td className="px-3 py-2 text-right font-bold">{formatMAD(o.totalDh)}</td>
                    <td className="px-3 py-2 text-right text-violet-600 font-bold">+{formatMAD(o.profitDh)}</td>
                    <td className="px-3 py-2 text-right text-emerald-600 font-bold">+{formatMAD(o.netDh)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 50 && <p className="text-xs text-ink-400 text-center pt-3">+ {filtered.length - 50} autres commandes</p>}
          </div>
        ) : <EmptyState title="Aucune commande" small />}
      </GlassCard>
    </div>
  );
}
