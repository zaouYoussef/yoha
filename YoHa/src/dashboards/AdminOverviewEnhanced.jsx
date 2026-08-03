'use client';

import React, { useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  GlassCard, StatCard, KpiCard, LineChart, BarChart, DonutChart,
  HorizontalBarChart, LegendRow, InsightCard, DataRow,
  SectionDivider, TimeDistribution, DayComparison, FunnelStep,
  ComparisonBadge, SectionHeader, StatusPill, AnimatedCounter,
  GradientHeader, MiniTrend,
} from './DashShared.jsx';
import {
  bucketRevenueLast7Days, bucketOrderCountLast7Days,
  last7DayLabels, mergeSeries7, mergeDonutFromOrders,
  MOCK_ADMIN_REVENUE_7D, MOCK_ADMIN_ORDERS_7D, MOCK_ADMIN_DONUT,
  isActiveOrderStatus,
} from '../data/index.js';

function formatMAD(v) {
  return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' DH';
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function weekTrendPct(series) {
  if (series.length < 2) return 0;
  const prev = series[series.length - 2] || 0;
  const curr = series[series.length - 1] || 0;
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
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

function computeWeekdayDistribution(orders) {
  const days = Array(7).fill(0);
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const wd = d.getDay();
    days[wd]++;
  });
  return days;
}

function computeStatusDistribution(orders) {
  const map = {};
  orders.forEach((o) => {
    const s = o.status || 'unknown';
    map[s] = (map[s] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

export default function AdminOverviewEnhanced({ orders, restaurantCount = 0 }) {
  const dayAgo = Date.now() - 86400000;
  const weekAgo = Date.now() - 604800000;

  const todayOrders = useMemo(() => orders.filter((o) => new Date(o.createdAt).getTime() >= dayAgo), [orders]);
  const weekOrders = useMemo(() => orders.filter((o) => new Date(o.createdAt).getTime() >= weekAgo), [orders]);
  const activeOrders = useMemo(() => orders.filter((o) => isActiveOrderStatus(o.status)), [orders]);
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === 'delivered'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter((o) => o.status === 'cancelled'), [orders]);

  const totalRev = useMemo(() => orders.reduce((s, o) => s + (Number(o.totalDh) || 0), 0), [orders]);
  const totalNet = useMemo(() => orders.reduce((s, o) => s + (Number(o.netDh) || 0), 0), [orders]);
  const totalProfit = useMemo(() => orders.reduce((s, o) => s + (Number(o.profitDh) || 0), 0), [orders]);
  const todayRev = useMemo(() => todayOrders.reduce((s, o) => s + (Number(o.totalDh) || 0), 0), [todayOrders]);
  const todayNet = useMemo(() => todayOrders.reduce((s, o) => s + (Number(o.netDh) || 0), 0), [todayOrders]);
  const weekRev = useMemo(() => weekOrders.reduce((s, o) => s + (Number(o.totalDh) || 0), 0), [weekOrders]);
  const lastWeekOrders = useMemo(() => orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t < weekAgo && t >= weekAgo - 604800000;
  }), [orders]);

  const avgOrderValue = orders.length > 0 ? totalRev / orders.length : 0;
  const cancelRate = orders.length > 0 ? (cancelledOrders.length / orders.length) * 100 : 0;
  const repeatRate = useMemo(() => {
    const customerOrders = {};
    orders.forEach((o) => {
      const name = o.customer?.name || 'anon';
      customerOrders[name] = (customerOrders[name] || 0) + 1;
    });
    const repeat = Object.values(customerOrders).filter((c) => c > 1).length;
    const total = Object.keys(customerOrders).length;
    return total > 0 ? (repeat / total) * 100 : 0;
  }, [orders]);

  const rev7Raw = bucketRevenueLast7Days(orders);
  const ord7Raw = bucketOrderCountLast7Days(orders);
  const rev7 = mergeSeries7(rev7Raw, MOCK_ADMIN_REVENUE_7D);
  const ord7 = mergeSeries7(ord7Raw, MOCK_ADMIN_ORDERS_7D);
  const days = last7DayLabels();
  const revTrendPct = weekTrendPct(rev7);
  const orderTrendPct = weekTrendPct(ord7);

  const donutData = mergeDonutFromOrders(orders, MOCK_ADMIN_DONUT);
  const donutColors = ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#eab308'];

  const hourlyDist = useMemo(() => computeHourlyDistribution(weekOrders), [weekOrders]);
  const weekdayDist = useMemo(() => computeWeekdayDistribution(weekOrders), [weekOrders]);
  const weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const statusDist = useMemo(() => computeStatusDistribution(orders), [orders]);

  const peakHour = useMemo(() => {
    let max = 0, peak = 0;
    hourlyDist.forEach((v, i) => { if (v > max) { max = v; peak = i; } });
    return peak;
  }, [hourlyDist]);

  const topRestaurants = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const name = o.restaurantName || 'Inconnu';
      if (!map[name]) map[name] = { name, orders: 0, revenue: 0, profit: 0 };
      map[name].orders++;
      map[name].revenue += Number(o.totalDh) || 0;
      map[name].profit += Number(o.netDh) || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8);
  }, [orders]);

  const customerFunnel = useMemo(() => {
    const uniqueCustomers = new Set(orders.map((o) => o.customer?.name || o.customer?.email)).size;
    const restaurantsViewed = new Set();
    orders.forEach((o) => { if (o.restaurantName) restaurantsViewed.add(o.restaurantName); });
    return {
      uniqueCustomers: Math.max(uniqueCustomers, orders.length),
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length,
    };
  }, [orders, deliveredOrders]);

  return (
    <div className="space-y-6 page-enter">
      <GradientHeader
        title="Tableau de bord · Vue d'ensemble"
        subtitle={`${orders.length} commandes cumulées · ${activeOrders.length} en cours · ${restaurantCount} restaurants partenaires`}
        icon="📊"
        gradient="from-brand-500 via-pink-500 to-violet-500"
      />

      {/* ROW 1: KPIs principaux (8 cartes) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Commandes cumulées" value={orders.length} sub="Depuis le lancement" icon={<I.Bag size={16} />} color="from-brand-500 to-orange-500" />
        <KpiCard label="Aujourd'hui" value={todayOrders.length} sub="Dernières 24h" icon={<I.Bell size={16} />} color="from-pink-500 to-rose-500" />
        <KpiCard label="Chiffre d'affaires" value={totalRev} sub={`Moy. ${formatMAD(Math.round(avgOrderValue))}/cmd`} icon={<I.Star size={16} />} color="from-violet-500 to-fuchsia-500" format={(v) => formatMAD(v)} />
        <KpiCard label="Bénéfice net" value={totalNet} sub={totalRev > 0 ? `Marge ${((totalNet / totalRev) * 100).toFixed(1)}%` : ''} icon={<I.Award size={16} />} color="from-emerald-500 to-teal-500" format={(v) => formatMAD(v)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Commandes actives" value={activeOrders.length} sub={`${deliveredOrders.length} livrées · ${cancelledOrders.length} annulées`} icon={<I.Bike size={16} />} color="from-violet-500 to-fuchsia-500" />
        <KpiCard label="Taux d'annulation" value={cancelRate.toFixed(1)} sub={`${cancelledOrders.length}/${orders.length} commandes`} icon={<I.Trash size={16} />} color="from-red-500 to-rose-500" />
        <KpiCard label="Clients fidèles" value={repeatRate.toFixed(0)} sub="% commandent plusieurs fois" icon={<I.User size={16} />} color="from-amber-500 to-yellow-500" />
        <KpiCard label="Restaurants" value={restaurantCount} sub="Partenaires actifs" icon={<I.Chef size={16} />} color="from-emerald-500 to-teal-500" />
      </div>

      {/* ROW 2: Revenue Chart + Today Summary + Profit */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-4 sm:p-5" hover={false}>
          <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
            <div>
              <SectionHeader title="Revenus 7 jours" subtitle={`${rev7.reduce((a, b) => a + b, 0).toLocaleString('fr-FR')} DH cumulé`} icon="📈" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-400 font-medium">Semaine</span>
              <ComparisonBadge current={rev7[rev7.length - 1]} previous={rev7[rev7.length - 2] || 0} />
            </div>
          </div>
          <LineChart data={rev7} color="#f97316" color2="#ec4899" height={160} />
          <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-500 mt-1.5">
            {days.map((d, i) => <div key={i} className="text-center font-medium">{d}</div>)}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-ink-50/50 dark:bg-ink-900/50 p-2 text-center">
              <div className="text-ink-400">Meilleur jour</div>
              <div className="font-bold">{days[rev7.indexOf(Math.max(...rev7))]}</div>
              <div className="font-black text-brand-600">{Math.max(...rev7).toLocaleString('fr-FR')} DH</div>
            </div>
            <div className="rounded-lg bg-ink-50/50 dark:bg-ink-900/50 p-2 text-center">
              <div className="text-ink-400">Moyenne/jour</div>
              <div className="font-bold">{(rev7.reduce((a, b) => a + b, 0) / Math.max(rev7.filter(Boolean).length, 1)).toFixed(0)}</div>
              <div className="font-black text-brand-600">DH</div>
            </div>
            <div className="rounded-lg bg-ink-50/50 dark:bg-ink-900/50 p-2 text-center">
              <div className="text-ink-400">Tendance</div>
              <div className="font-bold">{revTrendPct >= 0 ? '↗ Hausse' : '↘ Baisse'}</div>
              <div className={`font-black ${revTrendPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{revTrendPct >= 0 ? '+' : ''}{revTrendPct}%</div>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-4 sm:p-5" glow="from-brand-500 to-pink-500">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3">Résumé du jour</div>
            <div className="space-y-2.5">
              <DataRow label={<span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Commandes</span>} value={<span className="font-display text-lg font-black">{todayOrders.length}</span>} />
              <DataRow label={<span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Revenus</span>} value={<span className="font-display text-lg font-black">{formatMAD(todayRev)}</span>} />
              <DataRow label={<span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" /> Profit net</span>} value={<span className="font-display text-lg font-black text-emerald-600">{formatMAD(todayNet)}</span>} />
              <DataRow label={<span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> En livraison</span>} value={<span className="font-display text-lg font-black">{activeOrders.length}</span>} />
            </div>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5">
            <SectionHeader title="Rentabilité globale" icon="💰" />
            <div className="mt-3 space-y-2">
              <DataRow label="CA total" value={formatMAD(totalRev)} color="text-ink-900 dark:text-white" />
              <DataRow label="Bénéfice brut (com.)" value={formatMAD(totalProfit)} color="text-violet-600" />
              <DataRow label="Bénéfice net" value={formatMAD(totalNet)} color="text-emerald-600" />
              <div className="border-t border-ink-200/40 dark:border-ink-800/40 pt-2">
                <DataRow label="Marge nette" value={`${totalRev > 0 ? ((totalNet / totalRev) * 100).toFixed(1) : 0}%`} color="text-brand-600" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ROW 3: Hourly Distribution + Weekday + Status Distribution */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Commandes par heure" subtitle={`Pic à ${String(peakHour).padStart(2, '0')}h`} icon="🕐" />
          <div className="mt-2 max-h-64 overflow-y-auto pr-1">
            <TimeDistribution data={hourlyDist} />
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Commandes par jour" subtitle="Cette semaine" icon="📅" />
          <div className="mt-2">
            <DayComparison data={weekdayDist} labels={weekdayLabels} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {weekdayDist.map((v, i) => (
              <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${v === Math.max(...weekdayDist) ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-500'}`}>
                {weekdayLabels[i]}: {v}
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Statut des commandes" icon="📊" />
          <div className="mt-3 space-y-2">
            {statusDist.map((s, i) => {
              const pct = orders.length > 0 ? Math.round((s.value / orders.length) * 100) : 0;
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <StatusPill status={s.label} />
                  <div className="flex-1 h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right">{s.value}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* ROW 4: Customer Funnel + Orders/Day + Donut */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Entonnoir de conversion" icon="🔁" />
          <div className="mt-3 space-y-3">
            <FunnelStep label="Commandes totales" value={customerFunnel.totalOrders} pct={100} color="from-brand-500 to-orange-500" />
            <div className="relative ml-5 pl-5 border-l-2 border-dashed border-ink-200 dark:border-ink-700 space-y-3 pb-1">
              <FunnelStep label="Commandes livrées" value={customerFunnel.deliveredOrders}
                pct={customerFunnel.totalOrders > 0 ? Math.round((customerFunnel.deliveredOrders / customerFunnel.totalOrders) * 100) : 0}
                color="from-emerald-500 to-teal-500" />
              <FunnelStep label="En cours / actives" value={activeOrders.length}
                pct={customerFunnel.totalOrders > 0 ? Math.round((activeOrders.length / customerFunnel.totalOrders) * 100) : 0}
                color="from-brand-500 to-violet-500" />
              <FunnelStep label="Annulées" value={cancelledOrders.length}
                pct={customerFunnel.totalOrders > 0 ? Math.round((cancelledOrders.length / customerFunnel.totalOrders) * 100) : 0}
                color="from-red-500 to-rose-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Commandes / 7j" icon="📊" />
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600">
              7j · {ord7.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <BarChart data={ord7} labels={days} color1="from-brand-500" color2="to-pink-400" />
          <InsightCard icon={<I.Bell size={14} />} color="border-l-brand-500" className="mt-3">
            <b>{ord7[ord7.length - 1] || 0}</b> commande{ord7[ord7.length - 1] > 1 ? 's' : ''} aujourd'hui. Tendance <b>{orderTrendPct >= 0 ? '↗ +' : '↘ '}{Math.abs(orderTrendPct)}%</b> vs hier.
          </InsightCard>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Répartition par resto" icon="🍩" />
          <div className="flex flex-col items-center gap-3 mt-2">
            <DonutChart data={donutData} colors={donutColors} size={150} />
            <div className="w-full space-y-1">
              {donutData.map((d, i) => (
                <div key={`${d.label}-${i}`} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: donutColors[i % donutColors.length] }} />
                  <span className="truncate flex-1">{d.label}</span>
                  <span className="font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ROW 5: Activité en direct + Top restaurants + Insights */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="p-4 sm:p-5" glow="from-emerald-500 to-teal-500">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Activité en direct" icon="⚡" />
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {recentOrders.length} dernières
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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
                    <div className="flex items-center gap-2 text-[10px] text-ink-400 mt-0.5">
                      <span>{formatRelativeDate(o.createdAt)}</span>
                      {o.totalDh && <span className="font-bold text-ink-600">{formatMAD(o.totalDh)}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <SectionHeader title="Top restaurants" subtitle="Par chiffre d'affaires" icon="🏆" />
          <div className="mt-3 space-y-2">
            {topRestaurants.slice(0, 6).map((r, i) => {
              const pct = totalRev > 0 ? Math.round((r.revenue / totalRev) * 100) : 0;
              return (
                <div key={r.name} className="flex items-center gap-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white ${i < 3 ? 'bg-gradient-to-br from-brand-500 to-pink-500' : 'bg-ink-400'}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-bold">{r.name}</span>
                      <span className="text-[11px] font-black text-brand-600">{formatMAD(r.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-ink-400">
                      <span>{r.orders} commandes</span>
                      <span>·</span>
                      <span className="text-emerald-600 font-semibold">{formatMAD(r.profit)} net</span>
                    </div>
                    <div className="mt-0.5 h-1 w-full rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {topRestaurants.length === 0 && <div className="text-xs text-ink-400 text-center py-4">Aucune donnée</div>}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <SectionHeader title="Indicateurs clés" icon="🎯" />
          <div className="mt-3 space-y-3">
            <InsightCard icon={totalRev > 1000 ? '🚀' : '📈'} color={totalRev > 1000 ? 'border-l-emerald-500' : 'border-l-brand-500'}>
              <b>{orders.length} commandes</b> traitées depuis le lancement pour un CA de <b>{formatMAD(totalRev)}</b>.
              {avgOrderValue > 0 && ` Panier moyen : ${formatMAD(Math.round(avgOrderValue))}.`}
            </InsightCard>
            <InsightCard icon={activeOrders.length > 0 ? '🔄' : '✅'} color={activeOrders.length > 0 ? 'border-l-amber-500' : 'border-l-emerald-500'}>
              {activeOrders.length > 0
                ? <><b>{activeOrders.length}</b> commande{activeOrders.length > 1 ? 's' : ''} en cours de livraison.</>
                : <><b>Aucune commande active</b> pour le moment. Toutes les commandes sont livrées.</>}
            </InsightCard>
            <InsightCard icon={repeatRate > 30 ? '💎' : '🌱'} color={repeatRate > 30 ? 'border-l-violet-500' : 'border-l-sky-500'}>
              Taux de fidélité : <b>{repeatRate.toFixed(0)}%</b> des clients commandent plusieurs fois.
              {repeatRate > 30 ? ' Excellente rétention !' : ' Potentiel de fidélisation.'}
            </InsightCard>
            <InsightCard icon="🕐" color="border-l-brand-500">
              Heure de pointe : <b>{String(peakHour).padStart(2, '0')}h</b> avec {Math.max(...hourlyDist)} commande{Math.max(...hourlyDist) > 1 ? 's' : ''}.
              Jour le plus actif : <b>{weekdayLabels[weekdayDist.indexOf(Math.max(...weekdayDist))]}</b>.
            </InsightCard>
          </div>
        </GlassCard>
      </div>

      {/* ROW 6: Stats semantics supplémentaires */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard className="p-4 text-center" hover={false}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Taux de livraison</div>
          <div className="font-display text-2xl font-black text-emerald-600 mt-1">
            {orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0}%
          </div>
          <div className="text-[11px] text-ink-400">{deliveredOrders.length}/{orders.length} livrées</div>
        </GlassCard>
        <GlassCard className="p-4 text-center" hover={false}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Panier moyen</div>
          <div className="font-display text-2xl font-black text-brand-600 mt-1">{formatMAD(Math.round(avgOrderValue))}</div>
          <div className="text-[11px] text-ink-400">Toutes commandes confondues</div>
        </GlassCard>
        <GlassCard className="p-4 text-center" hover={false}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Marge nette</div>
          <div className="font-display text-2xl font-black text-violet-600 mt-1">{totalRev > 0 ? ((totalNet / totalRev) * 100).toFixed(1) : '0'}%</div>
          <div className="text-[11px] text-ink-400">Sur l'ensemble des ventes</div>
        </GlassCard>
        <GlassCard className="p-4 text-center" hover={false}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Taux d'annulation</div>
          <div className="font-display text-2xl font-black text-red-500 mt-1">{cancelRate.toFixed(1)}%</div>
          <div className="text-[11px] text-ink-400">{cancelledOrders.length} commande{cancelledOrders.length > 1 ? 's' : ''} annulée{cancelledOrders.length > 1 ? 's' : ''}</div>
        </GlassCard>
      </div>
    </div>
  );
}
