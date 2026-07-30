'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import { apiFetch } from '../lib/api.js';
import {
  GlassCard, StatCard, SectionHeader, EmptyState, StatusPill,
  GradientHeader, SearchBar, ActionButton,
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

export function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/analytics/clients/', { auth: true });
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter((c) =>
    !search || c.email?.toLowerCase().includes(search.toLowerCase()) || c.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = clients.reduce((s, c) => s + (c.total_spent_mad || 0), 0);
  const totalOrders = clients.reduce((s, c) => s + (c.total_orders || 0), 0);

  if (selected) {
    return (
      <ClientDetailView
        client={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <GradientHeader
        title={`${clients.length} client${clients.length > 1 ? 's' : ''}`}
        subtitle="Tous les clients inscrits"
        icon="👥"
        gradient="from-sky-500 via-blue-500 to-indigo-500"
        actions={
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un client…" />
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <I.Loader size={28} className="text-brand-500" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Clients" value={clients.length} sub="Inscrits" icon={<I.User size={16} />} color="from-sky-500 to-blue-500" />
            <StatCard label="Commandes total" value={totalOrders} icon={<I.Bag size={16} />} color="from-brand-500 to-orange-500" />
            <StatCard label="Dépenses total" value={formatMAD(totalSpent)} icon={<I.Star size={16} />} color="from-emerald-500 to-teal-500" />
            <StatCard label="Moy. par client" value={formatMAD(clients.length ? totalSpent / clients.length : 0)} icon={<I.Card size={16} />} color="from-violet-500 to-fuchsia-500" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Aucun client trouvé" desc={search ? 'Essayez un autre terme' : 'Aucun client inscrit pour le moment'} />
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <button key={c.id} onClick={() => setSelected(c)}
                  className="w-full cursor-grow rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-left backdrop-blur-xl transition hover:bg-white hover:shadow-lg dark:border-ink-700/30 dark:bg-ink-900/70 dark:hover:bg-ink-800/70">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-sm font-bold text-white">
                      {(c.display_name || c.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display font-bold">{c.display_name || 'Sans nom'}</span>
                        <span className="hidden shrink-0 rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500 dark:bg-ink-800 sm:inline">{c.email}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-ink-500">
                        <span>{c.total_orders} commandes</span>
                        <span>·</span>
                        <span className="font-semibold text-emerald-600">{formatMAD(c.total_spent_mad)}</span>
                        {c.last_order_date && (
                          <>
                            <span>·</span>
                            <span>Dernière : {formatDate(c.last_order_date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
                      {c.last_order_status && <StatusPill status={c.last_order_status} />}
                      <span className="text-[10px] text-ink-400">
                        {c.total_time_seconds ? `${formatDuration(c.total_time_seconds)} sur le site` : ''}
                      </span>
                    </div>
                  </div>
                  {c.favorite_restaurants?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.favorite_restaurants.map((r, i) => (
                        <span key={i} className="rounded-lg bg-amber-100/60 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {r.restaurant_name} ×{r.cnt}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
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
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [client.id]);

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex cursor-grow items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-ink-700 dark:hover:text-ink-300">
        <I.Left size={16} /> Retour aux clients
      </button>

      <GlassCard className="mb-6 p-5" hover={false}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 text-xl font-bold text-white">
            {(client.display_name || client.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold">{client.display_name || 'Sans nom'}</h2>
            <p className="text-sm text-ink-500">{client.email}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-400">
              <span>Inscrit : {formatDate(client.created_at)}</span>
              <span>·</span>
              <span>Dernière connexion : {formatDate(client.last_login)}</span>
              {client.phone && <><span>·</span><span>Tél : {client.phone}</span></>}
            </div>
          </div>
          <div className="shrink-0">
            <StatusPill status={client.is_active ? 'active' : 'inactive'} label={client.is_active ? 'Actif' : 'Inactif'} />
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <I.Loader size={24} className="text-brand-500" />
        </div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Commandes" value={client.total_orders} icon={<I.Bag size={16} />} color="from-brand-500 to-orange-500" />
            <StatCard label="Dépensé" value={formatMAD(client.total_spent_mad)} icon={<I.Star size={16} />} color="from-emerald-500 to-teal-500" />
            <StatCard label="Panier moyen" value={formatMAD(client.avg_order_mad)} icon={<I.Card size={16} />} color="from-violet-500 to-fuchsia-500" />
            <StatCard label="Pages vues" value={client.total_page_views} icon={<I.LayoutDashboard size={16} />} color="from-sky-500 to-indigo-500" />
          </div>

          {detail.restaurants_viewed?.length > 0 && (
            <GlassCard>
              <SectionHeader title="Restaurants consultés" icon="👀" />
              <div className="mt-3 space-y-1.5">
                {detail.restaurants_viewed.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 px-3 py-2 text-xs dark:bg-ink-800/30">
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
                  <div key={o.public_id || i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 px-3 py-2 text-xs dark:bg-ink-800/30">
                    <span className="shrink-0 font-mono text-ink-400">#{o.public_id}</span>
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
              <SectionHeader title="Activité récente (100 derniers events)" icon="📊" />
              <div className="mt-3 max-h-60 space-y-1 overflow-y-auto">
                {detail.events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50/50 px-3 py-1.5 text-xs dark:bg-ink-800/30">
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
        <EmptyState title="Erreur de chargement" desc="Impossible de récupérer les détails du client" />
      )}
    </div>
  );
}
