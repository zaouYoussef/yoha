'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { apiFetch } from '../lib/api.js';
import {
  GlassCard, SectionHeader, EmptyState, StatusPill,
  GradientHeader, SearchBar, InsightCard, DataRow, KpiCard,
  DonutChart,
} from './DashShared.jsx';

function formatMAD(v) {
  try {
    return new Intl.NumberFormat('fr-MA', { style: 'decimal', maximumFractionDigits: 0 }).format(Number(v) || 0) + ' DH';
  } catch {
    return '0 DH';
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuration(sec) {
  if (!sec) return '—';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  return `${m}min`;
}

function initials(c) {
  const raw = (c.display_name || c.email || '?').trim();
  return raw[0]?.toUpperCase() || '?';
}

export default function AdminClientsEnhanced() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | buyers | guests | registered
  const [selected, setSelected] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/analytics/clients/', { auth: true });
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      setClients([]);
      setError(e?.message || 'Impossible de charger les clients');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter((c) => {
        if (filter === 'buyers' && !(c.total_orders > 0)) return false;
        if (filter === 'guests' && !c.is_guest) return false;
        if (filter === 'registered' && c.is_guest) return false;
        if (!q) return true;
        return (
          c.email?.toLowerCase().includes(q) ||
          c.display_name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.total_spent_mad || 0) - (a.total_spent_mad || 0));
  }, [clients, search, filter]);

  const stats = useMemo(() => {
    const totalSpent = clients.reduce((s, c) => s + (c.total_spent_mad || 0), 0);
    const totalOrders = clients.reduce((s, c) => s + (c.total_orders || 0), 0);
    const customersWithOrders = clients.filter((c) => c.total_orders > 0).length;
    const repeatCustomers = clients.filter((c) => (c.total_orders || 0) > 1).length;
    const guests = clients.filter((c) => c.is_guest).length;
    const registered = clients.filter((c) => !c.is_guest).length;

    const vip = clients.filter((c) => (c.total_spent_mad || 0) >= 200);
    const regular = clients.filter((c) => (c.total_spent_mad || 0) >= 50 && (c.total_spent_mad || 0) < 200);
    const newb = clients.filter((c) => (c.total_spent_mad || 0) > 0 && (c.total_spent_mad || 0) < 50);

    return {
      totalSpent,
      totalOrders,
      customersWithOrders,
      repeatCustomers,
      guests,
      registered,
      avgPerClient: customersWithOrders > 0 ? totalSpent / customersWithOrders : 0,
      avgPerOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
      repeatRate: customersWithOrders > 0 ? (repeatCustomers / customersWithOrders) * 100 : 0,
      vip,
      regular,
      newb,
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
        title={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        subtitle={`${stats.customersWithOrders} ont commandé · ${formatMAD(stats.totalSpent)} · ${stats.guests} invité${stats.guests !== 1 ? 's' : ''} · ${stats.registered} inscrit${stats.registered !== 1 ? 's' : ''}`}
        icon="👥"
        gradient="from-slate-800 via-slate-700 to-amber-600"
        actions={
          <button
            type="button"
            onClick={fetchClients}
            className="rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/25"
          >
            Actualiser
          </button>
        }
      />

      <div className="mt-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Nom, e-mail ou téléphone…" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'buyers', label: 'Acheteurs' },
            { id: 'guests', label: 'Invités' },
            { id: 'registered', label: 'Inscrits' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filter === f.id
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <I.Loader size={28} className="text-brand-500" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Clients"
              value={clients.length}
              sub={`${stats.customersWithOrders} ont commandé`}
              icon={<I.User size={16} />}
              color="from-slate-700 to-amber-600"
            />
            <KpiCard
              label="Commandes"
              value={stats.totalOrders}
              sub={`Moy. ${stats.customersWithOrders > 0 ? (stats.totalOrders / stats.customersWithOrders).toFixed(1) : 0}/acheteur`}
              icon={<I.Bag size={16} />}
              color="from-brand-500 to-orange-500"
            />
            <KpiCard
              label="Dépenses"
              value={stats.totalSpent}
              sub={`Avg. ${formatMAD(Math.round(stats.avgPerOrder))}/cmd`}
              icon={<I.Star size={16} />}
              color="from-emerald-500 to-teal-500"
              format={(v) => formatMAD(v)}
            />
            <KpiCard
              label="Ré-achat"
              value={stats.repeatRate.toFixed(0)}
              sub={`${stats.repeatCustomers} fidèles`}
              icon={<I.Award size={16} />}
              color="from-violet-500 to-fuchsia-500"
            />
          </div>

          <div className="mb-6 grid lg:grid-cols-3 gap-4">
            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Segmentation" icon="👥" />
              <div className="flex flex-col items-center mt-2">
                <DonutChart
                  data={[
                    { label: 'VIP', value: Math.max(stats.vip.length, 0) || 0.0001 },
                    { label: 'Régulier', value: Math.max(stats.regular.length, 0) || 0.0001 },
                    { label: 'Nouveau', value: Math.max(stats.newb.length, 0) || 0.0001 },
                  ]}
                  colors={['#b45309', '#334155', '#10b981']}
                  size={140}
                />
                <div className="w-full mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-amber-700" />
                    <span className="truncate flex-1">VIP (200+ DH)</span>
                    <span className="font-bold">{stats.vip.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-600" />
                    <span className="truncate flex-1">Régulier (50-200 DH)</span>
                    <span className="font-bold">{stats.regular.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500" />
                    <span className="truncate flex-1">Nouveau (&lt;50 DH)</span>
                    <span className="font-bold">{stats.newb.length}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Fréquence" icon="🔄" />
              {(() => {
                const data = Object.entries(stats.orderFrequencyBuckets).map(([label, value]) => ({ label, value }));
                const maxV = Math.max(1, ...data.map((d) => d.value));
                return (
                  <div className="mt-3 space-y-2">
                    {data.map((d) => (
                      <div key={d.label} className="flex items-center gap-2 text-xs">
                        <span className="w-14 shrink-0 text-ink-500">{d.label}</span>
                        <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-slate-700 to-amber-500 transition-all"
                            style={{ width: `${(d.value / maxV) * 100}%` }}
                          />
                        </div>
                        <span className="font-bold w-6 text-right">{d.value}</span>
                      </div>
                    ))}
                    <InsightCard icon="💡" color="border-l-amber-500" className="mt-2">
                      <b>{stats.repeatCustomers}</b> clients fidèles ({stats.repeatRate.toFixed(0)}% des acheteurs)
                    </InsightCard>
                  </div>
                );
              })()}
            </GlassCard>

            <GlassCard className="p-4 sm:p-5" hover={false}>
              <SectionHeader title="Dépenses" icon="💰" />
              {(() => {
                const data = Object.entries(stats.spendBuckets).map(([label, value]) => ({ label, value }));
                const maxV = Math.max(1, ...data.map((d) => d.value));
                return (
                  <div className="mt-3 space-y-2">
                    {data.map((d) => (
                      <div key={d.label} className="flex items-center gap-2 text-xs">
                        <span className="w-20 shrink-0 text-ink-500">{d.label}</span>
                        <div className="flex-1 h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                            style={{ width: `${(d.value / maxV) * 100}%` }}
                          />
                        </div>
                        <span className="font-bold w-6 text-right">{d.value}</span>
                      </div>
                    ))}
                    <DataRow label="Dép. moyenne / acheteur" value={formatMAD(Math.round(stats.avgPerClient))} color="text-brand-600" />
                  </div>
                );
              })()}
            </GlassCard>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun client trouvé"
              description={search ? 'Essayez un autre terme' : 'Les clients apparaîtront dès la première commande'}
            />
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-ink-500 mb-1">
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              </div>
              {filtered.slice(0, 100).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className="w-full cursor-grow rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-amber-500/40 hover:shadow-md dark:border-ink-700/50 dark:bg-ink-900 dark:hover:bg-ink-800/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-amber-300 dark:bg-amber-500 dark:text-slate-950">
                      {initials(c)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-display font-bold text-ink-900 dark:text-white">
                          {c.display_name || 'Sans nom'}
                        </span>
                        {c.is_guest ? (
                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                            Invité
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Inscrit
                          </span>
                        )}
                        {c.total_spent_mad >= 200 && (
                          <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                        <span className="font-semibold">{c.total_orders} cmd</span>
                        <span>·</span>
                        <span className="font-semibold text-emerald-600">{formatMAD(c.total_spent_mad)}</span>
                        {c.phone && (
                          <>
                            <span>·</span>
                            <span>{c.phone}</span>
                          </>
                        )}
                        {c.last_order_restaurant && (
                          <>
                            <span>·</span>
                            <span className="truncate">{c.last_order_restaurant}</span>
                          </>
                        )}
                      </div>
                      {c.favorite_restaurants?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {c.favorite_restaurants.slice(0, 3).map((r, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                            >
                              {r.restaurant_name} ×{r.cnt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      {c.last_order_status && <StatusPill status={c.last_order_status} />}
                      <span className="max-w-[160px] truncate text-[10px] text-ink-400">{c.email || '—'}</span>
                      {c.last_order_date && (
                        <span className="text-[10px] text-ink-400">{formatDate(c.last_order_date)}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length > 100 && (
                <p className="text-center text-xs text-ink-400 pt-2">+ {filtered.length - 100} autres clients</p>
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
    const id = encodeURIComponent(client.id);
    apiFetch(`/analytics/client/${id}/`, { auth: true })
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [client.id]);

  const avgOrder = client.total_orders > 0 ? (client.total_spent_mad || 0) / client.total_orders : 0;
  const phone = detail?.client?.phone || client.phone || '';
  const email = detail?.client?.email || client.email || '';

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex cursor-grow items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-ink-700"
      >
        <I.Left size={16} /> Retour aux clients
      </button>

      <GlassCard className="mb-6 p-5" hover={false}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-amber-300 dark:bg-amber-500 dark:text-slate-950">
            {initials(client)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-extrabold">{client.display_name || 'Sans nom'}</h2>
              {client.is_guest ? (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Invité</span>
              ) : (
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Inscrit</span>
              )}
            </div>
            <p className="text-sm text-ink-500">{email || 'Pas d’e-mail'}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-400">
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="font-bold text-emerald-600 hover:underline">
                  {phone}
                </a>
              )}
              {client.created_at && <span>Depuis : {formatDate(client.created_at)}</span>}
              {client.last_login && <span>· Connexion : {formatDate(client.last_login)}</span>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-display text-2xl font-black text-emerald-600">{formatMAD(client.total_spent_mad)}</div>
            <div className="text-[11px] text-ink-400">dépensé</div>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <I.Loader size={24} className="text-brand-500" />
        </div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Commandes" value={client.total_orders} icon={<I.Bag size={16} />} color="from-brand-500 to-orange-500" />
            <KpiCard
              label="Dépensé"
              value={client.total_spent_mad || 0}
              icon={<I.Star size={16} />}
              color="from-emerald-500 to-teal-500"
              format={(v) => formatMAD(v)}
            />
            <KpiCard
              label="Panier moyen"
              value={Math.round(avgOrder)}
              icon={<I.Card size={16} />}
              color="from-violet-500 to-fuchsia-500"
              format={(v) => formatMAD(v)}
            />
            <KpiCard
              label="Pages vues"
              value={client.total_page_views || 0}
              icon={<I.LayoutDashboard size={16} />}
              color="from-slate-700 to-amber-500"
            />
          </div>

          {detail.orders?.length > 0 && (
            <GlassCard className="p-4" hover={false}>
              <SectionHeader title={`Commandes (${detail.orders.length})`} icon="📦" />
              <div className="mt-3 space-y-1.5">
                {detail.orders.map((o, i) => (
                  <div
                    key={o.public_id || i}
                    className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 dark:bg-ink-950/50 px-3 py-2.5 text-xs"
                  >
                    <span className="shrink-0 font-mono font-bold text-ink-700 dark:text-ink-200">#{o.public_id}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{o.restaurant_name || '—'}</span>
                    <StatusPill status={o.status} />
                    <span className="shrink-0 font-mono font-bold text-emerald-600">{formatMAD(o.total_mad)}</span>
                    <span className="shrink-0 text-ink-400">{formatDate(o.created_at)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {detail.restaurants_viewed?.length > 0 && (
            <GlassCard className="p-4" hover={false}>
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

          {detail.events?.length > 0 && (
            <GlassCard className="p-4" hover={false}>
              <SectionHeader title="Activité récente" icon="📊" />
              <div className="mt-3 max-h-60 space-y-1 overflow-y-auto">
                {detail.events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 dark:bg-ink-900/50 px-3 py-1.5 text-xs">
                    <span className="shrink-0 rounded bg-ink-200/60 px-1.5 py-0.5 font-semibold text-ink-600 dark:bg-ink-700/60 dark:text-ink-300">
                      {e.category}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{e.label || e.path || '—'}</span>
                    <span className="shrink-0 text-ink-400">{formatDate(e.created_at)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      ) : (
        <EmptyState title="Détail indisponible" description="Impossible de récupérer les commandes de ce client" />
      )}
    </div>
  );
}
