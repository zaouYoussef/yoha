'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import { apiFetch } from '../lib/api.js';
import {
  GlassCard, StatCard, SectionHeader, EmptyState, AnimatedCounter,
  BarChart, LineChart, HorizontalBarChart, GradientHeader,
  InsightCard, DataRow, KpiCard, FunnelStep, TimeDistribution,
} from './DashShared.jsx';

function formatNumber(v) {
  try { return new Intl.NumberFormat('fr-FR').format(Number(v) || 0); } catch { return String(v || 0); }
}

function formatDuration(sec) {
  if (!sec) return '—';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
}

const CATEGORY_LABELS = {
  pageview: 'Page vue', click: 'Clic', restaurant_view: 'Restaurant visité',
  menu_view: 'Menu consulté', checkout_start: 'Checkout',
  order_placed: 'Commande', search: 'Recherche', session: 'Session',
};

const CATEGORY_COLORS = {
  pageview: 'text-sky-500', click: 'text-amber-500', restaurant_view: 'text-emerald-500',
  menu_view: 'text-violet-500', checkout_start: 'text-orange-500',
  order_placed: 'text-green-500', search: 'text-pink-500', session: 'text-indigo-500',
};

export default function AdminAnalyticsEnhanced() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/analytics/dashboard/?days=${days}`, { auth: true });
      setData(res);
    } catch { setData(null); }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <GradientHeader
        title="Analytics · Trafic & Comportement"
        subtitle="Analyse détaillée des visiteurs"
        icon="📊"
        gradient="from-sky-500 via-blue-500 to-indigo-500"
        actions={
          <div className="flex gap-1 rounded-xl bg-white/15 p-0.5">
            {[7, 14, 30].map((n) => (
              <button key={n} onClick={() => setDays(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${days === n ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}>{n}j</button>
            ))}
          </div>
        }
      />

      {loading && !data && (
        <div className="flex items-center justify-center py-20"><I.Loader size={28} className="text-brand-500" /></div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Pages vues" value={formatNumber(data.total_pageviews)} icon={<I.Star size={16} />} color="from-brand-500 to-orange-500" />
            <KpiCard label="Visiteurs uniques" value={formatNumber(data.unique_visitors)} icon={<I.User size={16} />} color="from-sky-500 to-indigo-500" />
            <KpiCard label="Sessions" value={formatNumber(data.total_sessions)} icon={<I.Clock size={16} />} color="from-violet-500 to-fuchsia-500" />
            <KpiCard label="Durée moyenne" value={formatDuration(data.avg_duration_seconds)} icon={<I.Clock size={16} />} color="from-emerald-500 to-teal-500" />
          </div>

          {/* Funnel + Daily views */}
          <div className="mb-6 grid lg:grid-cols-2 gap-4">
            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Entonnoir de conversion" subtitle="Visite → Commande" icon="🔁" />
              <div className="mt-4 space-y-3">
                <FunnelStep label="Pages vues" value={data.total_pageviews || 0}
                  pct={100} color="from-brand-500 to-orange-500" />
                <div className="ml-5 pl-5 border-l-2 border-dashed border-ink-200 dark:border-ink-700 space-y-3 pb-1">
                  <FunnelStep label="Visiteurs uniques" value={data.unique_visitors || 0}
                    pct={data.total_pageviews > 0 ? Math.round(((data.unique_visitors || 0) / data.total_pageviews) * 100) : 0}
                    color="from-sky-500 to-indigo-500" />
                  <FunnelStep label="Sessions" value={data.total_sessions || 0}
                    pct={data.total_pageviews > 0 ? Math.round(((data.total_sessions || 0) / data.total_pageviews) * 100) : 0}
                    color="from-violet-500 to-fuchsia-500" />
                  <FunnelStep label="Restaurants consultés" value={(data.top_restaurants || []).reduce((s, r) => s + (r.count || 0), 0)}
                    pct={data.total_pageviews > 0 ? Math.round((((data.top_restaurants || []).reduce((s, r) => s + (r.count || 0), 0)) / data.total_pageviews) * 100) : 0}
                    color="from-emerald-500 to-teal-500" />
                </div>
              </div>
              <InsightCard icon="📊" color="border-l-brand-500" className="mt-3">
                {data.total_pageviews > 0
                  ? `Taux de conversion visite → restaurant : ${((data.top_restaurants || []).reduce((s, r) => s + (r.count || 0), 0) / data.total_pageviews * 100).toFixed(1)}%`
                  : 'Aucune donnée de conversion'}
              </InsightCard>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Vues par jour" icon="📈" />
              {data.daily_views?.length > 0 ? (
                <>
                  <div className="h-36">
                    <BarChart
                      data={data.daily_views.map((d) => d.count)}
                      labels={data.daily_views.map((d) => new Date(d.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }))}
                      color1="from-sky-500" color2="to-indigo-400"
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="rounded-lg bg-ink-50/50 dark:bg-ink-900/50 p-2">
                      <div className="text-ink-400">Moy. / jour</div>
                      <div className="font-bold">{(data.daily_views.reduce((s, d) => s + d.count, 0) / Math.max(data.daily_views.length, 1)).toFixed(0)}</div>
                    </div>
                    <div className="rounded-lg bg-ink-50/50 dark:bg-ink-900/50 p-2">
                      <div className="text-ink-400">Pic</div>
                      <div className="font-bold text-brand-600">{Math.max(...data.daily_views.map((d) => d.count))}</div>
                    </div>
                    <div className="rounded-lg bg-ink-50/50 dark:bg-ink-900/50 p-2">
                      <div className="text-ink-400">Total</div>
                      <div className="font-bold">{data.daily_views.reduce((s, d) => s + d.count, 0)}</div>
                    </div>
                  </div>
                </>
              ) : <EmptyState title="Aucune donnée" small />}
            </GlassCard>
          </div>

          {/* Top pages + Top restaurants */}
          <div className="mb-6 grid lg:grid-cols-2 gap-4">
            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Pages les plus vues" icon="📄" />
              {data.top_pages?.length > 0 ? (
                <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
                  {data.top_pages.map((p, i) => (
                    <div key={p.path} className="flex items-center gap-2 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-2 text-xs">
                      <span className="w-5 shrink-0 text-center font-mono text-ink-400">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{p.path}</span>
                      <span className="shrink-0 font-mono font-bold text-brand-500">{p.count}</span>
                      <div className="w-16 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all" style={{ width: `${(p.count / Math.max(1, data.top_pages[0]?.count)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="Aucune page" small />}
            </GlassCard>

            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Restaurants consultés" icon="🍽️" />
              {data.top_restaurants?.length > 0 ? (
                <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
                  {data.top_restaurants.map((r, i) => (
                    <div key={r.label} className="flex items-center gap-2 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-2 text-xs">
                      <span className="w-5 shrink-0 text-center font-mono text-ink-400">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                      <span className="shrink-0 font-mono font-bold text-emerald-500">{r.count}</span>
                      <div className="w-16 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${(r.count / Math.max(1, data.top_restaurants[0]?.count)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="Aucun restaurant visité" small />}
            </GlassCard>
          </div>

          {/* Recent events */}
          <GlassCard className="p-4 sm:p-5" hover={false}>
            <SectionHeader title="Événements récents" subtitle="Dernières actions des visiteurs" icon="⚡" />
            {data.recent_events?.length > 0 ? (
              <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
                {data.recent_events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-2 text-xs">
                    <span className={`shrink-0 font-semibold ${CATEGORY_COLORS[e.category] || 'text-ink-500'}`}>
                      {CATEGORY_LABELS[e.category] || e.category}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{e.label || e.path || '—'}</span>
                    <span className="shrink-0 text-ink-400">{formatDate(e.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="Aucun événement récent" small />}
          </GlassCard>
        </>
      )}

      {!loading && !data && (
        <EmptyState title="Impossible de charger les analytics" description="Vérifiez que le tracking est actif." />
      )}
    </div>
  );
}
