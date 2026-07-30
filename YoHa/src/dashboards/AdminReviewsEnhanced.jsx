'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  GlassCard, StatCard, SectionHeader, SearchBar, EmptyState,
  GradientHeader, ActionButton, LineChart, BarChart, HorizontalBarChart,
  InsightCard, DataRow, StarRating, GaugeChart, MiniTrend,
} from './DashShared.jsx';
import { fetchReviewsFromApi, deleteReview, getStoredReviews } from '../utils/reviews.js';
import { useOrders, useToast } from '../contexts/AppContexts.jsx';

export default function AdminReviewsEnhanced() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [days, setDays] = useState(30);
  const { push: pushToast } = useToast();
  const { orders } = useOrders();

  const loadReviews = useCallback(async () => {
    const apiReviews = await fetchReviewsFromApi({ search, rating: filterRating !== 'all' ? filterRating : undefined });
    const stored = getStoredReviews();
    const mergedMap = new Map();
    [...stored, ...apiReviews].forEach((r) => mergedMap.set(String(r.id || r.orderId), r));
    setReviews(Array.from(mergedMap.values()));
  }, [search, filterRating]);

  useEffect(() => {
    loadReviews();
    window.addEventListener('yoha_reviews_updated', loadReviews);
    return () => window.removeEventListener('yoha_reviews_updated', loadReviews);
  }, [loadReviews]);

  const handleDelete = (id) => {
    if (confirm('Supprimer cet avis ?')) {
      const updated = deleteReview(id);
      if (updated) setReviews(updated);
      pushToast({ title: 'Avis supprimé', type: 'info' });
    }
  };

  const enrichedReviews = useMemo(() => {
    return reviews.map((r) => {
      const order = (orders || []).find(
        (o) => String(o.public_id || o.id) === String(r.orderId) || String(o.id) === String(r.orderId)
      );
      const nameCandidate = order?.customerName || order?.name || order?.customer_name;
      const finalName = (nameCandidate && !['Client', 'Client YoHa'].includes(nameCandidate) ? nameCandidate : null) ||
        (r.customerName && !['Client', 'Client YoHa'].includes(r.customerName) ? r.customerName : null) ||
        order?.customerPhone || r.customerPhone || 'Client #' + (r.orderId || r.id);
      return {
        ...r,
        customerName: finalName,
        customerPhone: order?.customerPhone || order?.phone || r.customerPhone || null,
        customerEmail: order?.customerEmail || order?.email || r.customerEmail || null,
        restaurantName: order?.restaurantName || r.restaurantName || 'Restaurant',
        courierName: order?.courierName || r.courierName || 'Livreur',
        createdAt: r.createdAt || r.created_at || new Date().toISOString(),
      };
    });
  }, [reviews, orders]);

  const filtered = useMemo(() => {
    return enrichedReviews.filter((r) => {
      if (filterRating !== 'all' && String(r.rating) !== String(filterRating)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (r.customerName || '').toLowerCase().includes(q) ||
          (r.customerPhone || '').toLowerCase().includes(q) ||
          (r.restaurantName || '').toLowerCase().includes(q) ||
          (r.courierName || '').toLowerCase().includes(q) ||
          (r.comment || '').toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [enrichedReviews, filterRating, search]);

  const stats = useMemo(() => {
    const avg = enrichedReviews.length > 0 ? enrichedReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / enrichedReviews.length : 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    enrichedReviews.forEach((r) => { if (counts[r.rating] !== undefined) counts[r.rating]++; });
    return { avg, counts, total: enrichedReviews.length };
  }, [enrichedReviews]);

  const ratingTrend = useMemo(() => {
    const dayMap = {};
    const now = Date.now();
    const limit = days * 86400000;
    enrichedReviews.forEach((r) => {
      const t = new Date(r.createdAt).getTime();
      if (now - t > limit) return;
      const day = new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      if (!dayMap[day]) dayMap[day] = { total: 0, sum: 0 };
      dayMap[day].total++;
      dayMap[day].sum += Number(r.rating) || 0;
    });
    const entries = Object.entries(dayMap).slice(-14);
    return {
      labels: entries.map(([d]) => d),
      values: entries.map(([, v]) => v.total > 0 ? +(v.sum / v.total).toFixed(1) : 0),
      volumes: entries.map(([, v]) => v.total),
    };
  }, [enrichedReviews, days]);

  const restaurantRatings = useMemo(() => {
    const map = {};
    enrichedReviews.forEach((r) => {
      const name = r.restaurantName || 'Inconnu';
      if (!map[name]) map[name] = { label: name, total: 0, sum: 0, count: 0 };
      map[name].total += Number(r.rating) || 0;
      map[name].count++;
    });
    return Object.values(map).map((m) => ({ ...m, avg: m.count > 0 ? (m.total / m.count).toFixed(1) : '0' })).sort((a, b) => b.count - a.count);
  }, [enrichedReviews]);

  const courierRatings = useMemo(() => {
    const map = {};
    enrichedReviews.forEach((r) => {
      const name = r.courierName || 'Inconnu';
      if (!map[name]) map[name] = { label: name, total: 0, sum: 0, count: 0 };
      map[name].total += Number(r.rating) || 0;
      map[name].count++;
    });
    return Object.values(map).map((m) => ({ ...m, avg: m.count > 0 ? (m.total / m.count).toFixed(1) : '0' })).sort((a, b) => b.count - a.count);
  }, [enrichedReviews]);

  return (
    <div className="space-y-5">
      <GradientHeader
        title="Avis & Évaluations"
        subtitle={`${stats.total} avis · Note moy. ${stats.avg.toFixed(1)}/5`}
        icon={<I.Star size={24} />}
        gradient="from-amber-500 via-orange-500 to-red-500"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Avis clients" value={stats.total} sub="Tous restaurants" icon={<I.Star size={16} />} color="from-amber-500 to-orange-500" animate />
        <StatCard label="Note moyenne" value={stats.avg.toFixed(1)} sub="/ 5.0" icon={<I.Award size={16} />} color="from-brand-500 to-pink-500" />
        <StatCard label="Avis 5★" value={stats.counts[5]} sub={`${stats.total > 0 ? Math.round((stats.counts[5] / stats.total) * 100) : 0}%`} icon={<I.Star size={16} />} color="from-emerald-500 to-teal-500" animate />
        <StatCard label="Avis négatifs (1-2★)" value={stats.counts[1] + stats.counts[2]} sub={`${stats.total > 0 ? Math.round(((stats.counts[1] + stats.counts[2]) / stats.total) * 100) : 0}%`} icon={<I.Trash size={16} />} color="from-red-500 to-rose-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Rating breakdown */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Distribution des notes" icon="📊" />
          <div className="mt-3 space-y-1.5">
            {[5, 4, 3, 2, 1].map((num) => {
              const cnt = stats.counts[num] || 0;
              const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0;
              return (
                <div key={num} className="flex items-center gap-2 text-xs font-semibold">
                  <span className="w-10 shrink-0 flex items-center gap-0.5 text-amber-500 font-bold">{num} ★</span>
                  <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-14 text-right text-ink-400 shrink-0">{cnt} ({pct}%)</span>
                </div>
              );
            })}
          </div>
          <InsightCard icon="💡" color="border-l-amber-500" className="mt-3">
            Note moyenne <b>{stats.avg.toFixed(1)}/5</b> sur {stats.total} avis · {stats.counts[4] + stats.counts[5]} avis positifs ({(stats.total > 0 ? Math.round(((stats.counts[4] + stats.counts[5]) / stats.total) * 100) : 0)}%)
          </InsightCard>
        </GlassCard>

        {/* Rating trend */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Tendance des notes" icon="📈" />
            <div className="flex gap-1 rounded-lg bg-ink-100 p-0.5 dark:bg-ink-800">
              {[7, 14, 30].map((n) => (
                <button key={n} onClick={() => setDays(n)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${days === n ? 'bg-white dark:bg-ink-700 shadow-sm' : ''}`}>{n}j</button>
              ))}
            </div>
          </div>
          {ratingTrend.values.length > 1 ? (
            <>
              <LineChart data={ratingTrend.values} color="#f59e0b" color2="#ef4444" height={100} />
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="rounded-lg bg-amber-50/50 dark:bg-amber-900/20 p-2 text-center">
                  <div className="text-ink-400 text-[10px]">Dernière note</div>
                  <div className="font-black text-lg">{ratingTrend.values[ratingTrend.values.length - 1] || '—'}</div>
                </div>
                <div className="rounded-lg bg-ink-50/50 dark:bg-ink-900/50 p-2 text-center">
                  <div className="text-ink-400 text-[10px]">Volume {days}j</div>
                  <div className="font-black text-lg">{ratingTrend.volumes.reduce((a, b) => a + b, 0)}</div>
                </div>
              </div>
            </>
          ) : <EmptyState title="Données insuffisantes" small />}
        </GlassCard>

        {/* Monthly volume */}
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Volume d'avis" subtitle={`${days} derniers jours`} icon="📦" />
          {ratingTrend.volumes.length > 1 ? (
            <BarChart data={ratingTrend.volumes} labels={ratingTrend.labels} color1="from-amber-500" color2="to-orange-400" />
          ) : <EmptyState title="Données insuffisantes" small />}
        </GlassCard>
      </div>

      {/* Restaurant + Courier ratings */}
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Notes par restaurant" icon="🍽️" />
          {restaurantRatings.length > 0 ? (
            <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5">
              {restaurantRatings.map((r) => (
                <div key={r.label} className="flex items-center gap-2.5 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                  <StarRating rating={r.avg} count={r.count} />
                </div>
              ))}
            </div>
          ) : <EmptyState title="Aucune donnée" small />}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5" hover={false}>
          <SectionHeader title="Notes par livreur" icon="🛵" />
          {courierRatings.length > 0 ? (
            <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5">
              {courierRatings.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-medium">{c.label}</span>
                  <StarRating rating={c.avg} count={c.count} />
                </div>
              ))}
            </div>
          ) : <EmptyState title="Aucune donnée" small />}
        </GlassCard>
      </div>

      {/* Reviews list */}
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="p-4 sm:p-5 border-b border-ink-200/40 dark:border-ink-800/40">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <SectionHeader title={`${filtered.length} avis`} icon="⭐" />
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', '5', '4', '3', '2', '1'].map((val) => (
                <button key={val} onClick={() => setFilterRating(val)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${filterRating === val ? 'bg-amber-500 text-white shadow-md' : 'bg-ink-100 dark:bg-ink-800 text-ink-600'}`}>
                  {val === 'all' ? 'Tous' : `${val}★`}
                </button>
              ))}
            </div>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher client, restaurant, livreur, commentaire…" className="mt-3" />
        </div>

        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4 p-4">
            {filtered.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 shadow-sm hover:shadow-md transition relative space-y-2.5">
                <div className="flex items-start justify-between gap-2 border-b border-ink-100 dark:border-ink-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => <span key={s} className="text-sm">{s <= rev.rating ? '★' : '☆'}</span>)}
                      <span className="ml-1 text-xs font-black">{rev.rating}/5</span>
                    </div>
                    <span className="text-[10px] text-ink-400">{new Date(rev.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button onClick={() => handleDelete(rev.id)} className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"><I.Trash size={12} /></button>
                </div>
                {rev.comment && (
                  <p className="text-sm text-ink-700 dark:text-ink-200 italic bg-slate-50 dark:bg-ink-950 p-2.5 rounded-xl border border-ink-100 dark:border-ink-800/60">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                )}
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div className="p-1.5 rounded-lg bg-slate-100/70 dark:bg-ink-800/40">
                    <div className="text-[9px] font-bold uppercase text-ink-400">👤 Client</div>
                    <div className="font-bold truncate">{rev.customerName}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-50/70 dark:bg-amber-900/20">
                    <div className="text-[9px] font-bold uppercase text-amber-600">🍽️ Restau</div>
                    <div className="font-bold truncate">{rev.restaurantName}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-sky-50/70 dark:bg-sky-900/20">
                    <div className="text-[9px] font-bold uppercase text-sky-600">🛵 Livreur</div>
                    <div className="font-bold truncate">{rev.courierName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="⭐" title="Aucun avis trouvé" description="Aucun avis ne correspond à votre filtre" className="py-10" />
        )}
      </GlassCard>
    </div>
  );
}
