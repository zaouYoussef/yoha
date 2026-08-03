'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { apiFetch } from '../lib/api.js';
import {
  GlassCard, StatCard, SectionHeader, EmptyState, StatusPill,
  GradientHeader, SearchBar, ActionButton, InsightCard, DataRow, KpiCard,
  BarChart, HorizontalBarChart, DonutChart, LegendRow, GaugeChart,
} from './DashShared.jsx';

function formatMAD(v) {
  try { return new Intl.NumberFormat('fr-MA', { style: 'decimal', maximumFractionDigits: 0 }).format(Number(v) || 0) + ' DH'; } catch { return '0 DH'; }
}

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
}

function formatDuration(sec) {
  if (!sec) return '—';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  return `${m}min`;
}

export default function AdminClientsEnhanced() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/analytics/clients/', { auth: true });
      setClients(Array.isArray(data) ? data : []);
    } catch { setClients([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = useMemo(() => {
    return clients.filter((c) =>
      !search || c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.display_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  const stats = useMemo(() => {
    const totalSpent = clients.reduce((s, c) => s + (c.total_spent_mad || 0), 0);
    const totalOrders = clients.reduce((s, c) => s + (c.total_orders || 0), 0);
    const totalTime = clients.reduce((s, c) => s + (c.total_time_seconds || 0), 0);
    const customersWithOrders = clients.filter((c) => c.total_orders > 0).length;
    const repeatCustomers = clients.filter((c) => (c.total_orders || 0) > 1).length;

    // Segment clients
    const vip = clients.filter((c) => (c.total_spent_mad || 0) >= 200);
    const regular = clients.filter((c) => (c.total_spent_mad || 0) >= 50 && (c.total_spent_mad || 0) < 200);
    const newb = clients.filter((c) => (c.total_spent_mad || 0) > 0 && (c.total_spent_mad || 0) < 50);

    return {
      totalSpent, totalOrders, totalTime, customersWithOrders, repeatCustomers,
      avgPerClient: clients.length > 0 ? totalSpent / clients.length : 0,
      avgPerOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
      repeatRate: customersWithOrders > 0 ? (repeatCustomers / customersWithOrders) * 100 : 0,
      vip, regular, newb,
      orderFrequencyBuckets: {
        '1 seule': clients.filter((c) => c.total_orders === 1).length,
        '2-3': clients.filter((c) => c.total_orders >= 2 && c.total_orders <= 3).length,
        '4+': clients.filter((c) => c.total_orders >= 4).length,
      },
      spendBuckets: {
        '< 50 DH': clients.filter((c) => (c.total_spent_mad || 0) > 0 && (c.total_spent_mad || 0) < 50).length,
        '50-200 DH': clients.filter((c) => (c.total_spent_mad || 0) >= 50 && (c.total_spent_mad || 0) < 200).length,
        '200+ DH': clients.filter((c) => (c.total_spent_mad || 0) >= 200).length,
      },
    };
  }, [clients]);

  if (selected) {
    return <ClientDetailView client={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <GradientHeader
        title={`${clients.length} client${clients.length > 1 ? 's' : ''}`}
        subtitle={`${stats.customersWithOrders} ont commandé · ${formatMAD(stats.totalSpent)} dépensé`}
        icon="👥"
        gradient="from-brand-500 via-pink-500 to-violet-500"
        actions={
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un client…" />
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20"><I.Loader size={28} className="text-brand-500" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Clients inscrits" value={clients.length} sub={`${stats.customersWithOrders} ont commandé`} icon={<I.User size={16} />} color="from-brand-500 to-pink-500" />
            <KpiCard label="Commandes total" value={stats.totalOrders} sub={`Moy. ${clients.length > 0 ? (stats.totalOrders / clients.length).toFixed(1) : 0}/client`} icon={<I.Bag size={16} />} color="from-brand-500 to-orange-500" />
            <KpiCard label="Dépenses total" value={stats.totalSpent} sub={`Avg. ${formatMAD(Math.round(stats.avgPerOrder))}/cmd`} icon={<I.Star size={16} />} color="from-emerald-500 to-teal-500" format={(v) => formatMAD(v)} />
            <KpiCard label="Taux de ré-achat" value={stats.repeatRate.toFixed(0)} sub={`${stats.repeatCustomers} clients fidèles`} icon={<I.Award size={16} />} color="from-violet-500 to-fuchsia-500" />
          </div>

          {/* Client segmentation + spending */}
          <div className="mb-6 grid lg:grid-cols-3 gap-4">
            {/* Segmentation donut */}
            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Segmentation clients" icon="👥" />
              <div className="flex flex-col items-center mt-2">
                <DonutChart
                  data={[
                    { label: 'VIP (200+ DH)', value: Math.max(1, stats.vip.length) },
                    { label: 'Régulier (50-200)', value: Math.max(1, stats.regular.length) },
                    { label: 'Nouveau (<50)', value: Math.max(1, stats.newb.length) },
                  ]}
                  colors={['#8b5cf6', '#3b82f6', '#10b981']}
                  size={140}
                />
                <div className="w-full mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#8b5cf6' }} />
                    <span className="truncate flex-1">VIP (200+ DH)</span>
                    <span className="font-bold">{stats.vip.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#3b82f6' }} />
                    <span className="truncate flex-1">Régulier (50-200 DH)</span>
                    <span className="font-bold">{stats.regular.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#10b981' }} />
                    <span className="truncate flex-1">Nouveau (&lt;50 DH)</span>
                    <span className="font-bold">{stats.newb.length}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Order frequency */}
            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Fréquence de commande" icon="🔄" />
              {(() => {
                const data = Object.entries(stats.orderFrequencyBuckets).map(([label, value]) => ({ label, value }));
                const maxV = Math.max(1, ...data.map((d) => d.value));
                return (
                  <div className="mt-3 space-y-2">
                    {data.map((d) => (
                      <div key={d.label} className="flex items-center gap-2 text-xs">
                        <span className="w-14 shrink-0 text-ink-500">{d.label}</span>
                        <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all" style={{ width: `${(d.value / maxV) * 100}%` }} />
                        </div>
                        <span className="font-bold w-6 text-right">{d.value}</span>
                      </div>
                    ))}
                    <InsightCard icon="💡" color="border-l-brand-500" className="mt-2">
                      <b>{stats.repeatCustomers}</b> clients fidèles ({stats.repeatRate.toFixed(0)}% des acheteurs)
                    </InsightCard>
                  </div>
                );
              })()}
            </GlassCard>

            {/* Spend distribution */}
            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Niveaux de dépense" icon="💰" />
              {(() => {
                const data = Object.entries(stats.spendBuckets).map(([label, value]) => ({ label, value }));
                const maxV = Math.max(1, ...data.map((d) => d.value));
                return (
                  <div className="mt-3 space-y-2">
                    {data.map((d) => (
                      <div key={d.label} className="flex items-center gap-2 text-xs">
                        <span className="w-20 shrink-0 text-ink-500">{d.label}</span>
                        <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${(d.value / maxV) * 100}%` }} />
                        </div>
                        <span className="font-bold w-6 text-right">{d.value}</span>
                      </div>
                    ))}
                    <DataRow label="Dép. moyenne" value={formatMAD(Math.round(stats.avgPerClient))} color="text-brand-600" />
                  </div>
                );
              })()}
            </GlassCard>
          </div>

          {/* Client list */}
          {filtered.length === 0 ? (
            <EmptyState title="Aucun client trouvé" desc={search ? 'Essayez un autre terme' : 'Aucun client inscrit'} />
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map((c) => (
                <button key={c.id} onClick={() => setSelected(c)}
                  className="w-full cursor-grow rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-left backdrop-blur-xl transition hover:bg-white hover:shadow-lg dark:border-ink-700/30 dark:bg-ink-900/70 dark:hover:bg-ink-800/70">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-pink-500 text-sm font-bold text-white">
                      {(c.display_name || c.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display font-bold">{c.display_name || 'Sans nom'}</span>
                        {c.total_spent_mad >= 200 && <span className="shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">VIP</span>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-ink-500">
                        <span>{c.total_orders} commande{c.total_orders > 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span className="font-semibold text-emerald-600">{formatMAD(c.total_spent_mad)}</span>
                        {c.last_order_date && <><span>·</span><span>Dernière : {formatDate(c.last_order_date)}</span></>}
                        {c.total_time_seconds ? <><span>·</span><span>{formatDuration(c.total_time_seconds)} sur site</span></> : ''}
                      </div>
                      {c.favorite_restaurants?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.favorite_restaurants.map((r, i) => (
                            <span key={i} className="rounded-lg bg-amber-100/60 px-2 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              {r.restaurant_name} ×{r.cnt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
                      {c.last_order_status && <StatusPill status={c.last_order_status} />}
                      <span className="text-[10px] text-ink-400">{c.email}</span>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length > 50 && (
                <p className="text-center text-xs text-ink-400 pt-2">+ {filtered.length - 50} autres clients</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ClientDetailView({ client, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/analytics/client/${client.id}/`, { auth: true })
      .then(setDetail).catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [client.id]);

  const avgOrder = client.total_orders > 0 ? (client.total_spent_mad || 0) / client.total_orders : 0;

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex cursor-grow items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-ink-700">
        <I.Left size={16} /> Retour aux clients
      </button>

      <GlassCard className="mb-6 p-5" hover={false}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-pink-500 text-xl font-bold text-white">
            {(client.display_name || client.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold">{client.display_name || 'Sans nom'}</h2>
            <p className="text-sm text-ink-500">{client.email}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-400">
              <span>Inscrit : {formatDate(client.created_at)}</span>
              <span>·</span>
              <span>Connexion : {formatDate(client.last_login)}</span>
              {client.phone && <><span>·</span><span>Tél : {client.phone}</span></>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-display text-2xl font-black text-emerald-600">{formatMAD(client.total_spent_mad)}</div>
            <div className="text-[11px] text-ink-400">dépensé</div>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex items-center justify-center py-16"><I.Loader size={24} className="text-brand-500" /></div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Commandes" value={client.total_orders} icon={<I.Bag size={16} />} color="from-brand-500 to-orange-500" />
            <KpiCard label="Dépensé" value={client.total_spent_mad || 0} icon={<I.Star size={16} />} color="from-emerald-500 to-teal-500" format={(v) => formatMAD(v)} />
            <KpiCard label="Panier moyen" value={Math.round(avgOrder)} icon={<I.Card size={16} />} color="from-violet-500 to-fuchsia-500" format={(v) => formatMAD(v)} />
            <KpiCard label="Pages vues" value={client.total_page_views || 0} icon={<I.LayoutDashboard size={16} />} color="from-brand-500 to-violet-500" />
          </div>

          {detail.restaurants_viewed?.length > 0 && (
            <GlassCard>
              <SectionHeader title="Restaurants consultés" icon="👀" />
              <div className="mt-3 space-y-1.5">
                {detail.restaurants_viewed.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-2 text-xs">
                    <span className="w-5 shrink-0 font-mono text-ink-400">{i + 1}</span>
                    <span className="min-w-0 flex-1 font-medium">{r.label}</span>
                    <span className="shrink-0 font-mono font-bold text-emerald-500">{r.cnt} visites</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {detail.orders?.length > 0 && (
            <GlassCard>
              <SectionHeader title={`Commandes (${detail.orders.length})`} icon="📦" />
              <div className="mt-3 space-y-1.5">
                {detail.orders.map((o, i) => (
                  <div key={o.public_id || i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-2 text-xs">
                    <span className="shrink-0 font-mono font-bold text-ink-600">#{o.public_id}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{o.restaurant_name}</span>
                    <StatusPill status={o.status} />
                    <span className="shrink-0 font-mono font-bold text-emerald-600">{formatMAD(o.total_mad)}</span>
                    <span className="shrink-0 text-ink-400">{formatDate(o.created_at)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {detail.events?.length > 0 && (
            <GlassCard>
              <SectionHeader title="Activité récente" icon="📊" />
              <div className="mt-3 max-h-60 space-y-1 overflow-y-auto">
                {detail.events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-1.5 text-xs">
                    <span className="shrink-0 rounded bg-ink-200/60 px-1.5 py-0.5 font-semibold text-ink-600 dark:bg-ink-700/60 dark:text-ink-300">{e.category}</span>
                    <span className="min-w-0 flex-1 truncate">{e.label || e.path || '—'}</span>
                    <span className="shrink-0 text-ink-400">{formatDate(e.created_at)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      ) : (
        <EmptyState title="Erreur de chargement" description="Impossible de récupérer les détails" />
      )}
    </div>
  );
}
