'use client';

import React, { useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useOrders } from '../contexts/AppContexts.jsx';
import { ORDER_STATES, formatMad } from '../data/index.js';
import { Button } from '../components/ui/Button.jsx';
import { OrderStatusBadge } from '../components/ui/OrderStep.jsx';
import { getVisibleOrders } from '../utils/clientOrders.js';

const STATUS_EMOJI = {
  placed: '🎉',
  pickup_confirmed: '🛵',
  preparing: '👨‍🍳',
  delivering: '📦',
  delivered: '✅',
  cancelled: '✕',
};

const STATUS_GRADIENT = {
  placed: 'from-amber-400/20 to-orange-500/10',
  pickup_confirmed: 'from-sky-400/20 to-blue-500/10',
  preparing: 'from-violet-400/20 to-purple-500/10',
  delivering: 'from-pink-400/20 to-rose-500/10',
  delivered: 'from-emerald-400/15 to-teal-500/10',
  cancelled: 'from-red-400/15 to-orange-500/10',
};

function formatScheduledRange(iso) {
  if (!iso) return '';
  try {
    const s = new Date(iso);
    const e = new Date(s.getTime() + 30 * 60 * 1000);
    const day = s.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const sh = String(s.getHours()).padStart(2, '0');
    const sm = String(s.getMinutes()).padStart(2, '0');
    const eh = String(e.getHours()).padStart(2, '0');
    const em = String(e.getMinutes()).padStart(2, '0');
    return `${day}, ${sh}:${sm} → ${eh}:${em}`;
  } catch {
    return iso;
  }
}

function formatDate(ts) {
  if (!ts) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(ts));
  } catch {
    return '—';
  }
}

function itemCount(order) {
  return order?.items?.reduce((s, i) => s + (i.qty || 0), 0) ?? 0;
}

function coverImage(order) {
  const img = order?.items?.find((i) => i.img)?.img;
  return img || null;
}

function isActive(status) {
  return status && status !== 'delivered' && status !== 'cancelled';
}

function progressPct(status) {
  const st = ORDER_STATES[status];
  if (!st?.step) return 25;
  return (st.step / 4) * 100;
}

function OrderThumb({ order, size = 'md' }) {
  const img = coverImage(order);
  const emoji = STATUS_EMOJI[order.status] || '🍽️';
  const sz = size === 'lg' ? 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-3xl' : 'w-14 h-14 rounded-xl text-2xl';

  if (img) {
    return (
      <div className={`${sz} shrink-0 overflow-hidden bg-ink-100 dark:bg-ink-800 ring-2 ring-white dark:ring-ink-900 shadow-sm`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sz} shrink-0 grid place-items-center bg-gradient-to-br from-brand-500/15 to-pink-500/15 ring-2 ring-white dark:ring-ink-900`}>
      {emoji}
    </div>
  );
}

function MiniProgress({ status }) {
  const pct = progressPct(status);
  const live = isActive(status);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">
        <span>Progression</span>
        <span>{ORDER_STATES[status]?.step ?? 1}/4</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            live
              ? 'bg-gradient-to-r from-brand-500 via-pink-500 to-emerald-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OrderCard({ order, onOpenOrder, onReorder, featured = false }) {
  const st = ORDER_STATES[order.status] || ORDER_STATES.placed;
  const active = isActive(order.status);
  const count = itemCount(order);
  const gradient = STATUS_GRADIENT[order.status] || STATUS_GRADIENT.placed;

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-cardhover ${
        featured
          ? 'bg-gradient-to-br from-brand-500/12 via-pink-500/8 to-orange-500/5 border-brand-500/25 shadow-glow'
          : `bg-white dark:bg-ink-900 border-ink-200/70 dark:border-ink-800 shadow-card`
      }`}
    >
      {active && (
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient.replace('/20', '').replace('/10', '').replace('/15', '')} opacity-80`} />
      )}

      <div className={`p-5 sm:p-6 ${featured ? 'sm:flex sm:items-start sm:gap-6' : ''}`}>
        <div className={`flex gap-4 ${featured ? 'flex-1 min-w-0' : ''}`}>
          <OrderThumb order={order} size={featured ? 'lg' : 'md'} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {featured && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
                    {active ? 'Commande en cours' : 'Votre dernière commande'}
                  </p>
                )}
                <h3 className="font-display font-extrabold text-lg sm:text-xl truncate">
                  {order.restaurantName}
                </h3>
                <p className="text-xs text-ink-400 mt-0.5 font-mono">#{order.id}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 line-clamp-1">
              {order.status === 'cancelled'
                ? 'Cette commande a été annulée.'
                : active
                ? st.clientMsg
                : `${count} article${count > 1 ? 's' : ''} · ${formatDate(order.createdAt)}`}
            </p>

            {order.status === 'cancelled' && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                <div className="font-extrabold flex items-center gap-1.5">
                  <span>❌</span>
                  <span>Commande Annulée</span>
                </div>
                <p className="text-[11px] font-medium text-rose-600/90 dark:text-rose-300/90">
                  {order.cancellationReason
                    ? `Motif : ${order.cancellationReason}`
                    : "Cette commande a été annulée (ex. client injoignable par le livreur)."}
                </p>
              </div>
            )}

            {active && <MiniProgress status={order.status} />}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-display font-extrabold text-brand-600 dark:text-brand-400">
                {formatMad(order.totalDh, { decimals: 0 })}
              </span>
              {!active && (
                <span className="text-ink-400 text-xs">{formatDate(order.createdAt)}</span>
              )}
              {order.courierName && active && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                  <I.Bike size={12} className="text-sky-500" />
                  {order.courierName}
                </span>
              )}
              {order.scheduledDeliveryAt && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                  🕐 {formatScheduledRange(order.scheduledDeliveryAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-4 flex flex-col sm:flex-row gap-2 ${featured ? 'sm:mt-0 sm:shrink-0 sm:flex-col sm:min-w-[160px]' : ''}`}>
          {active ? (
            <Button
              variant="primary"
              size={featured ? 'lg' : 'md'}
              className="justify-center w-full"
              onClick={() => onOpenOrder(order.id)}
            >
              Suivre en direct <I.Right size={16} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="md"
              className="justify-center w-full"
              onClick={() => onOpenOrder(order.id)}
            >
              Voir le détail
            </Button>
          )}
          <Button
            variant={active ? 'ghost' : 'primary'}
            size="md"
            className="justify-center w-full"
            onClick={() => onReorder(order)}
          >
            {active ? 'Recommander' : 'Commander à nouveau'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function SectionTitle({ icon, title, count, live }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-10 h-10 rounded-2xl bg-ink-100 dark:bg-ink-800 grid place-items-center text-lg">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="font-display font-bold text-lg sm:text-xl">{title}</h2>
        {count > 0 && (
          <p className="text-xs text-ink-500">
            {count} commande{count > 1 ? 's' : ''}
            {live && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function FidelityBalanceCard() {
  const { user } = useAuth() || {};
  const { orders = [] } = useOrders() || {};

  const deliveredOrders = useMemo(() => {
    return orders.filter(o => o.status === 'delivered' || o.status === 'DELIVERED' || o.status === 'LIVRÉ' || o.status === 'COMPLETED');
  }, [orders]);

  const deliveredCount = deliveredOrders.length;
  const currentStep = deliveredCount % 6;
  const isGoalReached = currentStep === 0 && deliveredCount > 0;
  const activeStepCount = isGoalReached ? 6 : currentStep;
  const remaining = isGoalReached ? 0 : 6 - currentStep;

  return (
    <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 shadow-xl border border-emerald-400/30 relative">
      <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🎁
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-emerald-200">
                Solde & Récompense Fidélité
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase">
                {deliveredCount} commande{deliveredCount > 1 ? 's' : ''} livrée{deliveredCount > 1 ? 's' : ''}
              </span>
            </div>
            
            {isGoalReached ? (
              <h3 className="font-display font-black text-base sm:text-lg text-white mt-1">
                🎉 Félicitations ! Votre réduction de <span className="text-amber-300">-50 MAD</span> est débloquée avec le code <span className="text-amber-300 font-extrabold underline">YOHA50</span> !
              </h3>
            ) : (
              <h3 className="font-display font-black text-base sm:text-lg text-white mt-1">
                Encore <span className="underline decoration-amber-400 decoration-2 underline-offset-2 font-black">{remaining} commande{remaining > 1 ? 's' : ''}</span> pour débloquer <span className="text-amber-300 font-black">-50 MAD</span> !
              </h3>
            )}
          </div>
        </div>

        {/* 6 Cercles Liés Stamp Indicator */}
        <div className="shrink-0 max-w-full overflow-x-auto no-scrollbar bg-white/95 dark:bg-ink-900/95 text-ink-900 dark:text-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-md border border-white/50 flex items-center gap-1.5 sm:gap-2 self-start md:self-center">
          {[1, 2, 3, 4, 5, 6].map((step, idx) => {
            const isDone = activeStepCount >= step;
            const isCurrent = !isGoalReached && currentStep + 1 === step;
            return (
              <React.Fragment key={step}>
                {/* Circle Node */}
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm transition-all duration-300 ${
                    isDone
                      ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-sm scale-105'
                      : isCurrent
                      ? 'bg-emerald-500/20 border-2 border-amber-400 text-amber-500 dark:text-amber-300 animate-pulse'
                      : 'bg-slate-100 dark:bg-ink-800 border-2 border-slate-300 dark:border-ink-600 text-slate-400 dark:text-ink-400'
                  }`}
                  title={`Commande ${step}/6 ${isDone ? 'livrée' : ''}`}
                >
                  {isDone ? (
                    step === 6 ? '🎁' : '✓'
                  ) : (
                    step
                  )}
                </div>

                {/* Connecting Line (between circles) */}
                {idx < 5 && (
                  <div
                    className={`h-1 w-2 sm:w-4 rounded-full transition-colors duration-300 ${
                      activeStepCount > step ? 'bg-amber-400' : 'bg-slate-200 dark:bg-ink-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MyOrdersPage({ onBack, onOpenOrder, onReorder, onLogin, onBrowse, onAfterReorder }) {
  const { user } = useAuth();
  const { orders, loadingOrders } = useOrders();

  const mine = useMemo(
    () =>
      [...getVisibleOrders(orders, user)].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [orders, user],
  );

  const activeOrders = useMemo(() => mine.filter((o) => isActive(o.status)), [mine]);
  const pastOrders = useMemo(() => mine.filter((o) => !isActive(o.status)), [mine]);
  const lastOrder = mine[0] ?? null;
  const isGuest = !user || user.role !== 'client';

  const handleReorder = (order) => {
    if (onReorder?.(order)) onAfterReorder?.();
  };

  if (mine.length === 0 && !loadingOrders) {
    return (
      <div className="page-enter max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="text-6xl sm:text-7xl mb-4 animate-bounce-vertical flex items-center justify-center">
          🍽️
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-ink-900 dark:text-white">
          Aucune commande pour l&apos;instant
        </h2>
        <p className="mt-3 text-ink-500 dark:text-ink-400 text-sm leading-relaxed max-w-md mx-auto">
          {isGuest
            ? 'Commandez sans compte : vos commandes invité restent visibles sur cet appareil. Créez un compte pour les retrouver partout.'
            : 'Passez votre première commande depuis la carte des restaurants.'}
        </p>
        
        <div className="mt-8 space-y-3 max-w-sm mx-auto">
          <button
            type="button"
            onClick={onBrowse}
            className="cursor-grow w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-brand-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Voir les établissements</span>
            <I.Right size={18} />
          </button>

          {isGuest && onLogin && (
            <button
              type="button"
              onClick={onLogin}
              className="cursor-grow w-full py-3.5 px-6 rounded-2xl bg-white dark:bg-ink-900 text-ink-900 dark:text-white border border-ink-200 dark:border-ink-800 font-extrabold text-xs sm:text-sm shadow-sm hover:border-brand-500/50 hover:bg-brand-500/5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <I.User size={16} className="text-brand-500" />
              <span>Créer un compte / Se connecter</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBack}
            className="cursor-grow w-full py-3 px-6 rounded-xl text-ink-500 dark:text-ink-400 font-bold text-xs hover:text-ink-900 dark:hover:text-white transition-colors"
          >
            ← Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const showFeatured = lastOrder && (activeOrders.length <= 1 || lastOrder.status !== 'delivered' || mine.length === 1);
  const listOrders = showFeatured ? mine.slice(1) : mine;
  const listActive = listOrders.filter((o) => isActive(o.status));
  const listPast = listOrders.filter((o) => !isActive(o.status));

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="cursor-grow inline-flex items-center gap-2 mb-6 px-3 py-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition text-sm text-ink-600"
      >
        <I.Left size={18} /> Retour
      </button>

      {/* En-tête */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 dark:from-black dark:via-ink-950 dark:to-black text-white p-6 sm:p-8 mb-8">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-pink-500/15 blur-2xl" aria-hidden />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Espace client</p>
              <h1 className="mt-1 font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
                Mes commandes
              </h1>
              <p className="mt-2 text-sm text-white/70 max-w-md">
                {isGuest
                  ? 'Mode invité — historique enregistré sur cet appareil.'
                  : 'Suivez vos livraisons en direct et recommandez en un clic.'}
              </p>
            </div>
            <div className="shrink-0 text-center px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="font-display font-extrabold text-2xl">{mine.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">total</div>
            </div>
          </div>

          {activeOrders.length > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold ring-1 ring-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeOrders.length} en cours
            </div>
          )}
        </div>
      </div>

      {/* Solde & Récompense Fidélité */}
      <FidelityBalanceCard />

      {isGuest && onLogin && (
        <div className="mb-6 rounded-2xl bg-brand-500/10 border border-brand-500/25 px-4 py-3.5 text-sm text-ink-700 dark:text-ink-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="flex items-center gap-2">
            <I.User size={16} className="text-brand-500 shrink-0" />
            Connectez-vous pour garder l&apos;historique sur tous vos appareils.
          </span>
          <button type="button" onClick={onLogin} className="font-semibold text-brand-600 hover:underline shrink-0 text-left sm:text-right">
            Se connecter →
          </button>
        </div>
      )}

      {loadingOrders && mine.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-ink-500">Chargement de vos commandes…</p>
        </div>
      ) : (
        <div className="space-y-10">
          {showFeatured && lastOrder && (
            <section>
              <OrderCard
                order={lastOrder}
                featured
                onOpenOrder={onOpenOrder}
                onReorder={handleReorder}
              />
            </section>
          )}

          {listActive.length > 0 && (
            <section>
              <SectionTitle icon="🔴" title="En cours" count={listActive.length} live />
              <ul className="space-y-4">
                {listActive.map((o) => (
                  <li key={o.id}>
                    <OrderCard order={o} onOpenOrder={onOpenOrder} onReorder={handleReorder} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {listPast.length > 0 && (
            <section>
              <SectionTitle icon="📋" title="Historique" count={listPast.length} />
              <ul className="space-y-3">
                {listPast.map((o) => (
                  <li key={o.id}>
                    <OrderCard order={o} onOpenOrder={onOpenOrder} onReorder={handleReorder} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!showFeatured && listActive.length === 0 && listPast.length === 0 && (
            <ul className="space-y-4">
              {mine.map((o) => (
                <li key={o.id}>
                  <OrderCard order={o} onOpenOrder={onOpenOrder} onReorder={handleReorder} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-10 text-center">
        <Button variant="ghost" onClick={onBrowse}>
          Découvrir de nouveaux restaurants <I.Right size={16} />
        </Button>
      </div>
    </div>
  );
}
