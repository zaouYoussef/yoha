'use client';

import React, { useState, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  GlassCard, StatCard, SectionHeader, SearchBar, EmptyState,
  GradientHeader, ActionButton, HorizontalBarChart, LegendRow,
  InsightCard, DataRow, SectionDivider, MiniTrend,
} from './DashShared.jsx';
import { useOrders } from '../contexts/AppContexts.jsx';
import { apiFetch } from '../lib/api.js';
import { CUISINE_CATEGORIES } from '../data/index.js';

function formatMAD(v) {
  return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' DH';
}

export default function AdminRestaurantsEnhanced() {
  const { restaurants, orders } = useOrders();
  const [search, setSearch] = useState('');

  const restaurantStats = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const rn = o.restaurantName;
      if (!rn) return;
      if (!map[rn]) map[rn] = { name: rn, orders: 0, revenue: 0, profit: 0, items: [] };
      map[rn].orders++;
      if (o.status !== 'cancelled') {
        map[rn].revenue += Number(o.totalDh) || 0;
        map[rn].profit += Number(o.netDh) || 0;
      }
      if (o.items) map[rn].items.push(...o.items);
    });
    return map;
  }, [orders]);

  const enriched = useMemo(() => {
    return restaurants.map((r) => {
      const stats = restaurantStats[r.name] || { orders: 0, revenue: 0, profit: 0 };
      const avgOrder = stats.orders > 0 ? stats.revenue / stats.orders : 0;
      const rating = Number(r.rating || 0);
      return { ...r, ...stats, avgOrder, rating };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [restaurants, restaurantStats]);

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched;
    const q = search.toLowerCase();
    return enriched.filter((r) => r.name?.toLowerCase().includes(q));
  }, [enriched, search]);

  const totalRevenue = enriched.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = enriched.reduce((s, r) => s + r.orders, 0);
  const totalProfit = enriched.reduce((s, r) => s + r.profit, 0);
  const avgRating = enriched.length > 0 ? enriched.reduce((s, r) => s + r.rating, 0) / enriched.length : 0;

  const categoryDist = useMemo(() => {
    const catMap = {};
    enriched.forEach((r) => {
      const tags = r.tags || [r.cuisine].filter(Boolean);
      tags.forEach((tag) => {
        if (!catMap[tag]) catMap[tag] = { label: tag, orders: 0, revenue: 0 };
        catMap[tag].orders += r.orders || 0;
        catMap[tag].revenue += r.revenue || 0;
      });
    });
    return Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
  }, [enriched]);

  const itemsPopularity = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const key = item.name || 'Article';
        if (!map[key]) map[key] = { label: key, orders: 0, revenue: 0 };
        map[key].orders += item.qty || 1;
        map[key].revenue += (item.price || 0) * (item.qty || 1);
      });
    });
    return Object.values(map).sort((a, b) => b.orders - a.orders);
  }, [orders]);

  return (
    <div className="space-y-5">
      <GradientHeader
        title={`${restaurants.length} restaurant${restaurants.length > 1 ? 's' : ''} partenaires`}
        subtitle={`${totalOrders} commandes · ${formatMAD(totalRevenue)} CA · Note moy. ${avgRating.toFixed(1)}/5`}
        icon="🍽️"
        gradient="from-brand-500 via-pink-500 to-rose-500"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Restaurants" value={restaurants.length} sub="Partenaires" icon={<I.Chef size={16} />} color="from-brand-500 to-orange-500" animate />
        <StatCard label="Commandes total" value={totalOrders} sub="Tous restaurants" icon={<I.Bag size={16} />} color="from-violet-500 to-fuchsia-500" animate />
        <StatCard label="CA total" value={formatMAD(totalRevenue)} sub="Somme des commandes" icon={<I.Star size={16} />} color="from-emerald-500 to-teal-500" />
        <StatCard label="Bénéfice net" value={formatMAD(totalProfit)} sub={`Marge ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%`} icon={<I.Award size={16} />} color="from-sky-500 to-indigo-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Category breakdown */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Par catégorie" icon="📂" />
          <div className="mt-3 max-h-60 overflow-y-auto">
            {categoryDist.length > 0 ? (
              <HorizontalBarChart data={categoryDist.map((c) => ({ label: c.label, value: c.revenue }))} color="from-brand-500 to-pink-400" />
            ) : <EmptyState title="Aucune donnée" small />}
          </div>
        </GlassCard>

        {/* Performance comparison bars */}
        <GlassCard className="p-4 sm:p-5 lg:col-span-2" hover={false}>
          <SectionHeader title="Performance par restaurant" icon="📊" />
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {enriched.slice(0, 10).map((r, i) => {
              const revPct = totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 100) : 0;
              return (
                <div key={r.name} className="flex items-center gap-2">
                  <span className="w-5 text-[10px] font-bold text-ink-400 shrink-0">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-bold">{r.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-ink-400">{r.orders} cmd</span>
                        <span className="font-bold text-brand-600">{formatMAD(r.revenue)}</span>
                      </div>
                    </div>
                    <div className="mt-0.5 h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all" style={{ width: `${revPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Popular items */}
      <GlassCard className="p-4 sm:p-5" hover={false}>
        <SectionHeader title="Articles les plus commandés" subtitle="Tous restaurants confondus" icon="🔥" />
        <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
          {itemsPopularity.slice(0, 16).map((item, i) => (
            <div key={item.label} className="flex items-center gap-2 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-2 text-xs">
              <span className="w-4 text-center font-mono text-ink-400">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
              <span className="shrink-0 font-bold text-brand-600">{item.orders}×</span>
              <span className="shrink-0 text-ink-400">{formatMAD(item.revenue)}</span>
            </div>
          ))}
          {itemsPopularity.length === 0 && <EmptyState title="Aucun article" small />}
        </div>
      </GlassCard>

      {/* Restaurant detailed cards */}
      {search && <SearchBar value={search} onChange={setSearch} placeholder="Filtrer par nom…" className="mb-2" />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <GlassCard key={r.id} className="overflow-hidden" hover>
            <div className="relative h-28 w-full bg-gradient-to-br from-brand-500/20 to-pink-500/20 flex items-center justify-center">
              {r.cover ? <img src={r.cover} className="h-full w-full object-cover" alt="" /> : r.logo ? <img src={r.logo} className="h-12 w-12 rounded-2xl object-cover opacity-80" alt="" /> : <span className="text-3xl font-black text-white/30">{r.name?.charAt(0) || '?'}</span>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <h3 className="font-display font-bold text-white text-sm truncate">{r.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-white/70">
                  <span>{r.tags?.join(' · ') || r.cuisine || ''}</span>
                  <span>·</span>
                  <span>⭐ {r.rating || '—'}</span>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                <div className="rounded-lg bg-brand-50/80 dark:bg-brand-900/20 p-1.5">
                  <div className="text-ink-400 font-bold">Commandes</div>
                  <div className="font-black">{r.orders}</div>
                </div>
                <div className="rounded-lg bg-emerald-50/80 dark:bg-emerald-900/20 p-1.5">
                  <div className="text-ink-400 font-bold">Revenu</div>
                  <div className="font-black text-emerald-600">{formatMAD(r.revenue)}</div>
                </div>
                <div className="rounded-lg bg-violet-50/80 dark:bg-violet-900/20 p-1.5">
                  <div className="text-ink-400 font-bold">Moy.</div>
                  <div className="font-black">{formatMAD(Math.round(r.avgOrder))}</div>
                </div>
              </div>
              <DataRow label="Bénéfice net" value={formatMAD(r.profit)} color="text-emerald-600" />
              <div className="flex items-center justify-between text-[10px] text-ink-400">
                <span>📏 {r.distance || '—'}</span>
                <span>🕐 {r.delivery || '—'}</span>
                <span>👤 {r.ownerEmail || '—'}</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon="🍽️" title="Aucun restaurant trouvé" />}
    </div>
  );
}
