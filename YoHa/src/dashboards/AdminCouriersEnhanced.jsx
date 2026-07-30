'use client';

import React, { useState, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  GlassCard, StatCard, SectionHeader, SearchBar, EmptyState,
  GradientHeader, ActionButton, HorizontalBarChart, StarRating,
  InsightCard, DataRow, GaugeChart, MiniTrend, ComparisonBadge,
} from './DashShared.jsx';
import { useOrders } from '../contexts/AppContexts.jsx';

function formatMAD(v) {
  return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' DH';
}

export default function AdminCouriersEnhanced() {
  const { orders } = useOrders();
  const [search, setSearch] = useState('');

  // We'll use the data from localStorage + context (same as existing)
  const [courierList, setCourierList] = useState([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('yoha_couriers');
      if (raw) setCourierList(JSON.parse(raw));
    } catch {}
  }, []);

  const courierStats = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const name = o.courierName || 'Non assigné';
      if (!map[name]) map[name] = { name, deliveries: 0, revenue: 0, profit: 0, cancelled: 0 };
      map[name].deliveries++;
      if (o.status === 'cancelled') map[name].cancelled++;
      map[name].revenue += Number(o.totalDh) || 0;
      map[name].profit += Number(o.netDh) || 0;
    });
    return map;
  }, [orders]);

  const enriched = useMemo(() => {
    const combined = {};
    courierList.forEach((c) => {
      const key = (c.name || c.displayName || '').toLowerCase();
      const stats = courierStats[key] || courierStats[c.name] || { deliveries: 0, revenue: 0, profit: 0, cancelled: 0 };
      combined[key] = {
        name: c.name || c.displayName || c.email || 'Inconnu',
        email: c.email || '',
        vehicle: c.vehicle || 'Moto Express',
        isActive: c.isActive !== false,
        rating: c.rating ? Number(c.rating) : 5.0,
        totalDeliveries: c.totalDeliveries || 0,
        ...stats,
        successRate: stats.deliveries > 0 ? Math.round(((stats.deliveries - stats.cancelled) / stats.deliveries) * 100) : 100,
        avgOrderValue: stats.deliveries > 0 ? stats.revenue / stats.deliveries : 0,
      };
    });
    // Also add couriers found in orders but not in stored list
    Object.entries(courierStats).forEach(([name, stats]) => {
      const key = name.toLowerCase();
      if (!combined[key] && name !== 'Non assigné') {
        combined[key] = { name, email: '', vehicle: '—', isActive: true, rating: 5.0, totalDeliveries: 0, ...stats, successRate: stats.deliveries > 0 ? Math.round(((stats.deliveries - stats.cancelled) / stats.deliveries) * 100) : 100, avgOrderValue: stats.deliveries > 0 ? stats.revenue / stats.deliveries : 0 };
      }
    });
    return Object.values(combined).sort((a, b) => b.deliveries - a.deliveries);
  }, [courierList, courierStats]);

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched;
    const q = search.toLowerCase();
    return enriched.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [enriched, search]);

  const totalDeliveries = enriched.reduce((s, c) => s + c.deliveries, 0);
  const totalRevenue = enriched.reduce((s, c) => s + c.revenue, 0);
  const avgRating = enriched.length > 0 ? enriched.reduce((s, c) => s + c.rating, 0) / enriched.length : 0;
  const activeCount = enriched.filter((c) => c.isActive).length;

  return (
    <div className="space-y-5">
      <GradientHeader
        title={`${enriched.length} livreur${enriched.length > 1 ? 's' : ''}`}
        subtitle={`${activeCount} actifs · ${totalDeliveries} livraisons · ${formatMAD(totalRevenue)} généré`}
        icon="🚴"
        gradient="from-violet-500 via-fuchsia-500 to-pink-500"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Livreurs" value={enriched.length} sub="Connectés" icon={<I.User size={16} />} color="from-violet-500 to-fuchsia-500" animate />
        <StatCard label="Livraisons" value={totalDeliveries} sub="Toutes commandes" icon={<I.Bike size={16} />} color="from-sky-500 to-indigo-500" animate />
        <StatCard label="Revenus générés" value={formatMAD(totalRevenue)} sub="Somme commandes" icon={<I.Star size={16} />} color="from-emerald-500 to-teal-500" />
        <StatCard label="Note moyenne" value={avgRating.toFixed(1)} sub="/ 5.0" icon={<I.Award size={16} />} color="from-amber-500 to-orange-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Leaderboard */}
        <GlassCard className="lg:col-span-2 p-4 sm:p-5" hover={false}>
          <SectionHeader title="Classement performance" icon="🏆" />
          {filtered.length > 0 ? (
            <div className="mt-3 space-y-2">
              {filtered.map((c, i) => {
                const maxDel = Math.max(1, ...filtered.map((x) => x.deliveries));
                const pct = Math.round((c.deliveries / maxDel) * 100);
                return (
                  <div key={c.name} className="flex items-center gap-2.5 rounded-xl bg-white/50 dark:bg-ink-900/50 p-2.5 border border-ink-100/50 dark:border-ink-800/50">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white ${i < 3 ? 'bg-gradient-to-br from-brand-500 to-pink-500' : 'bg-ink-400'}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold">{c.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${c.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-ink-100 text-ink-400'}`}>
                            {c.isActive ? 'Actif' : 'Inactif'}
                          </span>
                          <GaugeChart value={c.rating} max={5} size={36} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-ink-400 mt-0.5">
                        <span>{c.deliveries} livraison{c.deliveries > 1 ? 's' : ''}</span>
                        <span>{formatMAD(c.revenue)}</span>
                        <span>✅ {c.successRate}% succès</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-bold text-ink-700">{c.deliveries}</div>
                      <div className="text-[10px] text-ink-400">livr.</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="Aucun livreur" small />}
        </GlassCard>

        {/* Summary + insights */}
        <div className="space-y-4">
          <GlassCard className="p-4 sm:p-5" hover={false}>
            <SectionHeader title="Distribution" icon="📊" />
            <div className="mt-3 space-y-2 text-xs">
              <DataRow label="Livraisons totales" value={totalDeliveries} />
              <DataRow label="Moy. par livreur" value={enriched.length > 0 ? (totalDeliveries / enriched.length).toFixed(1) : '0'} />
              <DataRow label="Revenu moyen / livreur" value={enriched.length > 0 ? formatMAD(Math.round(totalRevenue / enriched.length)) : '0 DH'} />
              <DataRow label="Note moyenne" value={`${avgRating.toFixed(1)} / 5.0`} color="text-amber-600" />
              <DataRow label="Taux d'activité" value={`${enriched.length > 0 ? Math.round((activeCount / enriched.length) * 100) : 0}%`} color="text-emerald-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5" hover={false}>
            <SectionHeader title="Véhicules" icon="🛵" />
            {(() => {
              const vehicleMap = {};
              enriched.forEach((c) => {
                const v = c.vehicle || 'Autre';
                vehicleMap[v] = (vehicleMap[v] || 0) + 1;
              });
              return (
                <div className="mt-3 space-y-1.5">
                  {Object.entries(vehicleMap).map(([v, count]) => (
                    <div key={v} className="flex items-center gap-2 text-xs">
                      <span className="w-24 truncate">{v}</span>
                      <div className="flex-1 h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${(count / enriched.length) * 100}%` }} />
                      </div>
                      <span className="font-bold w-4 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </GlassCard>
        </div>
      </div>

      {/* Courier cards */}
      {search && <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un livreur…" />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <GlassCard key={c.name} className="p-4" hover>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
                  <I.Bike size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display font-bold truncate text-sm">{c.name}</h3>
                  <div className="text-[11px] text-ink-500">{c.vehicle}</div>
                  {c.email && <div className="text-[10px] text-ink-400 truncate">{c.email}</div>}
                </div>
              </div>
              <GaugeChart value={c.rating} max={5} size={40} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px]">
              <div className="rounded-lg bg-ink-50/50 dark:bg-ink-900/50 p-1.5">
                <div className="text-ink-400 font-bold">Livr.</div>
                <div className="font-black">{c.deliveries}</div>
              </div>
              <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 p-1.5">
                <div className="text-ink-400 font-bold">Revenu</div>
                <div className="font-black text-emerald-600">{formatMAD(c.revenue)}</div>
              </div>
              <div className="rounded-lg bg-sky-50/50 dark:bg-sky-900/20 p-1.5">
                <div className="text-ink-400 font-bold">Succès</div>
                <div className="font-black text-sky-600">{c.successRate}%</div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon="🚴" title="Aucun livreur trouvé" />}
    </div>
  );
}
