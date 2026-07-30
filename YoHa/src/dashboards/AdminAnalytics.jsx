'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import { apiFetch } from '../lib/api.js';
import {
  GlassCard, StatCard, SectionHeader, EmptyState, AnimatedCounter,
  BarChart,
} from './DashShared.jsx';

function formatMAD(v) {
  try { return new Intl.NumberFormat('fr-MA', { style: 'decimal', maximumFractionDigits: 0 }).format(Number(v) || 0) + ' DA'; } catch { return '0 DA'; }
}

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
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

const CATEGORY_LABELS = {
  pageview: 'Page vue',
  click: 'Clic',
  restaurant_view: 'Restaurant visité',
  menu_view: 'Menu consulté',
  checkout_start: 'Checkout',
  order_placed: 'Commande',
  search: 'Recherche',
  session: 'Session',
};

const CATEGORY_COLORS = {
  pageview: 'text-sky-500',
  click: 'text-amber-500',
  restaurant_view: 'text-emerald-500',
  menu_view: 'text-violet-500',
  checkout_start: 'text-orange-500',
  order_placed: 'text-green-500',
  search: 'text-pink-500',
  session: 'text-indigo-500',
};

export function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/analytics/dashboard/?days=${days}`, { auth: true });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionHeader title="Analytics" subtitle="Comportement des visiteurs" />
        <div className="flex gap-1 rounded-xl bg-ink-100 p-1 dark:bg-ink-800">
          {[7, 14, 30].map((n) => (
            <button key={n} onClick={() => setDays(n)}
              className={`cursor-grow rounded-lg px-3 py-1.5 text-xs font-bold transition ${days === n ? 'bg-white text-ink-900 shadow dark:bg-ink-700 dark:text-white' : 'text-ink-500 hover:text-ink-700 dark:text-ink-400'}`}>
              {n}j
            </button>
          ))}
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <I.Loader size={28} className="text-brand-500" />
        </div>
      )}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Pages vues" value={formatNumber(data.total_pageviews)} icon={<I.Star size={16} />} color="from-brand-500 to-orange-500" />
            <StatCard label="Visiteurs uniques" value={formatNumber(data.unique_visitors)} icon={<I.User size={16} />} color="from-sky-500 to-indigo-500" />
            <StatCard label="Sessions" value={formatNumber(data.total_sessions)} icon={<I.Clock size={16} />} color="from-violet-500 to-fuchsia-500" />
            <StatCard label="Durée moyenne" value={formatDuration(data.avg_duration_seconds)} icon={<I.Clock size={16} />} color="from-emerald-500 to-teal-500" />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <GlassCard>
              <div className="mb-3 flex items-center gap-2">
                <I.Star size={16} className="text-brand-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Pages les plus vues</span>
              </div>
              {data.top_pages?.length > 0 ? (
                <div className="space-y-1.5">
                  {data.top_pages.map((p, i) => (
                    <div key={p.path} className="flex items-center gap-2 rounded-lg bg-ink-50/50 px-3 py-2 text-xs dark:bg-ink-800/30">
                      <span className="w-5 shrink-0 text-center font-mono text-ink-400">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{p.path}</span>
                      <span className="shrink-0 font-mono font-bold text-brand-500">{p.count}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="Aucune page" small />}
            </GlassCard>

            <GlassCard>
              <div className="mb-3 flex items-center gap-2">
                <I.Chef size={16} className="text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Restaurants consultés</span>
              </div>
              {data.top_restaurants?.length > 0 ? (
                <div className="space-y-1.5">
                  {data.top_restaurants.map((r, i) => (
                    <div key={r.label} className="flex items-center gap-2 rounded-lg bg-ink-50/50 px-3 py-2 text-xs dark:bg-ink-800/30">
                      <span className="w-5 shrink-0 text-center font-mono text-ink-400">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                      <span className="shrink-0 font-mono font-bold text-emerald-500">{r.count}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="Aucun restaurant visité" small />}
            </GlassCard>
          </div>

          {data.daily_views?.length > 0 && (
            <GlassCard className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <I.History size={16} className="text-violet-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Vues par jour</span>
              </div>
              <div className="h-40">
                <BarChart
                  data={data.daily_views.map((d) => d.count)}
                  labels={data.daily_views.map((d) =>
                    new Date(d.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                  )}
                  color1="from-brand-500" color2="to-pink-400"
                />
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <div className="mb-3 flex items-center gap-2">
              <I.Bell size={16} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Événements récents</span>
            </div>
            {data.recent_events?.length > 0 ? (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {data.recent_events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 px-3 py-2 text-xs dark:bg-ink-800/30">
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
        <EmptyState title="Impossible de charger les analytics" desc="Vérifiez que le tracking est actif." />
      )}
    </div>
  );
}
