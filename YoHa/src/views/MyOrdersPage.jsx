'use client';

import React, { useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useOrders } from '../contexts/AppContexts.jsx';
import { ORDER_STATES, formatMad } from '../data/index.js';
import { Button } from '../components/ui/Button.jsx';
import { OrderStatusBadge } from '../components/ui/OrderStep.jsx';
import { getVisibleOrders } from '../utils/clientOrders.js';

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
  return order?.items?.find((i) => i.img)?.img || null;
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
  const sz = size === 'lg' ? 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl' : 'w-14 h-14 rounded-xl';

  if (img) {
    return (
      <div className={`${sz} shrink-0 overflow-hidden bg-ink-100 dark:bg-ink-800 ring-1 ring-black/5 dark:ring-white/10`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sz} shrink-0 grid place-items-center bg-ink-950 text-white dark:bg-white dark:text-ink-950 font-display font-bold text-lg`}>
      {(order.restaurantName || 'Y').charAt(0).toUpperCase()}
    </div>
  );
}

function MiniProgress({ status }) {
  const pct = progressPct(status);
  const live = isActive(status);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[11px] font-semibold text-ink-400 mb-1.5">
        <span>Progression</span>
        <span>{ORDER_STATES[status]?.step ?? 1}/4</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            live ? 'bg-gradient-to-r from-brand-500 to-orange-600' : 'bg-emerald-500'
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

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.35rem] border transition-all duration-300 hover:-translate-y-0.5 ${
        featured
          ? 'bg-white dark:bg-ink-900 border-brand-500/25 shadow-[0_24px_50px_-28px_rgba(249,115,22,0.35)]'
          : 'bg-white dark:bg-ink-900 border-ink-100 dark:border-white/8 shadow-[0_14px_36px_-24px_rgba(15,23,42,0.4)]'
      }`}
    >
      {active && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-orange-600" />}

      <div className={`p-5 sm:p-6 ${featured ? 'sm:flex sm:items-start sm:gap-6' : ''}`}>
        <div className={`flex gap-4 ${featured ? 'flex-1 min-w-0' : ''}`}>
          <OrderThumb order={order} size={featured ? 'lg' : 'md'} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {featured && (
                  <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mb-1">
                    {active ? 'Commande en cours' : 'Dernière commande'}
                  </p>
                )}
                <h3 className="font-display font-bold text-lg sm:text-xl truncate text-ink-950 dark:text-white tracking-tight">
                  {order.restaurantName}
                </h3>
                <p className="text-[12px] text-ink-400 mt-0.5 font-mono">#{order.id}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 line-clamp-2">
              {order.status === 'cancelled'
                ? 'Cette commande a été annulée.'
                : active
                  ? st.clientMsg
                  : `${count} article${count > 1 ? 's' : ''} · ${formatDate(order.createdAt)}`}
            </p>

            {order.status === 'cancelled' && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                <div className="font-bold">Commande annulée</div>
                <p className="text-[12px] font-medium text-rose-600/90 dark:text-rose-300/90">
                  {order.cancellationReason
                    ? `Motif : ${order.cancellationReason}`
                    : 'Cette commande a été annulée.'}
                </p>
              </div>
            )}

            {active && <MiniProgress status={order.status} />}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-display font-bold text-ink-950 dark:text-white">
                {formatMad(order.totalDh, { decimals: 0 })}
              </span>
              {!active && (
                <span className="text-ink-400 text-xs">{formatDate(order.createdAt)}</span>
              )}
              {order.courierName && active && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                  <I.Bike size={12} className="text-brand-500" />
                  {order.courierName}
                </span>
              )}
              {order.scheduledDeliveryAt && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                  {formatScheduledRange(order.scheduledDeliveryAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-4 flex flex-col sm:flex-row gap-2 ${featured ? 'sm:mt-0 sm:shrink-0 sm:flex-col sm:min-w-[160px]' : ''}`}>
          {active ? (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm px-4 py-3 transition-all active:scale-[0.98]"
              onClick={() => onOpenOrder(order.id)}
            >
              Suivre en direct <I.Right size={16} />
            </button>
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

function SectionTitle({ title, count, live }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="font-display font-bold text-xl text-ink-950 dark:text-white tracking-tight">{title}</h2>
        {count > 0 && (
          <p className="text-[13px] text-ink-500 mt-1 font-medium">
            {count} commande{count > 1 ? 's' : ''}
            {live && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
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
  const { orders = [] } = useOrders() || {};

  const deliveredOrders = useMemo(() => {
    return orders.filter((o) =>
      ['delivered', 'DELIVERED', 'LIVRÉ', 'COMPLETED'].includes(o.status),
    );
  }, [orders]);

  const deliveredCount = deliveredOrders.length;
  const currentStep = deliveredCount % 6;
  const isGoalReached = currentStep === 0 && deliveredCount > 0;
  const activeStepCount = isGoalReached ? 6 : currentStep;
  const remaining = isGoalReached ? 0 : 6 - currentStep;

  return (
    <div className="mb-7 overflow-hidden rounded-[1.5rem] bg-ink-950 text-white p-5 sm:p-6 relative">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgba(249,115,22,0.35),transparent_55%)]"
      />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-300">
                Fidélité YoHa
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white/80">
                {deliveredCount} livrée{deliveredCount > 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="font-display font-bold text-base sm:text-lg text-white mt-1.5 leading-snug">
              {isGoalReached ? (
                <>
                  −50 MAD débloqués · code <span className="text-orange-300">YOHA50</span>
                </>
              ) : (
                <>
                  6 livraisons = <span className="text-orange-300">−50 MAD</span>
                </>
              )}
            </h3>
          </div>

          {!isGoalReached && (
            <div className="shrink-0 self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/10 text-[12px] font-semibold text-white/85">
              Plus que <strong className="text-orange-300">{remaining}</strong>
            </div>
          )}
        </div>

        <div className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl">
          <div className="w-full flex items-center justify-between max-w-lg mx-auto px-1">
            {[1, 2, 3, 4, 5, 6].map((step, idx) => {
              const isDone = activeStepCount >= step;
              const isCurrent = !isGoalReached && currentStep + 1 === step;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                        isDone
                          ? 'bg-brand-500 text-white'
                          : isCurrent
                            ? 'bg-white/15 border border-orange-300 text-orange-300'
                            : 'bg-white/10 text-white/40 border border-white/10'
                      }`}
                      title={`Commande ${step}/6`}
                    >
                      {isDone ? (step === 6 ? '−50' : '✓') : step}
                    </div>
                  </div>
                  {idx < 5 && (
                    <div
                      className={`h-1 flex-1 rounded-full mx-1 -mt-0 ${
                        activeStepCount > step ? 'bg-brand-500' : 'bg-white/10'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
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
  const isGuest = !user || user.role !== 'client';

  const handleReorder = (order) => {
    if (onReorder?.(order)) onAfterReorder?.();
  };

  if (mine.length === 0 && !loadingOrders) {
    return (
      <div className="page-enter relative max-w-lg mx-auto px-4 py-20 sm:py-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(249,115,22,0.16),transparent_60%)] pointer-events-none" aria-hidden />
        <div className="relative">
          <p className="font-display font-black text-4xl text-transparent bg-clip-text bg-gradient-to-br from-orange-300 via-brand-500 to-orange-700">
            YoHa
          </p>
          <h2 className="mt-4 font-display font-bold text-2xl sm:text-3xl text-ink-950 dark:text-white tracking-tight">
            Aucune commande
          </h2>
          <p className="mt-3 text-ink-500 dark:text-ink-400 text-sm leading-relaxed max-w-md mx-auto">
            {isGuest
              ? 'Commande sans compte : l’historique reste sur cet appareil. Crée un compte pour le retrouver partout.'
              : 'Passe ta première commande depuis les restaurants.'}
          </p>

          <div className="mt-8 space-y-3 max-w-sm mx-auto">
            <button
              type="button"
              onClick={onBrowse}
              className="cursor-pointer w-full py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Voir les restaurants</span>
              <I.Right size={18} />
            </button>

            {isGuest && onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="cursor-pointer w-full py-3.5 px-6 rounded-2xl bg-ink-950 dark:bg-white text-white dark:text-ink-950 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <I.User size={16} />
                <span>Se connecter</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer w-full py-3 px-6 rounded-xl text-ink-500 font-semibold text-xs hover:text-ink-900 dark:hover:text-white transition-colors"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showFeatured = lastOrderGuard(mine, activeOrders);
  const lastOrder = mine[0] ?? null;
  const listOrders = showFeatured ? mine.slice(1) : mine;
  const listActive = listOrders.filter((o) => isActive(o.status));
  const listPast = listOrders.filter((o) => !isActive(o.status));

  return (
    <div className="page-enter relative w-full overflow-x-hidden">
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(80%_70%_at_15%_0%,rgba(249,115,22,0.35),transparent_55%),radial-gradient(55%_45%_at_90%_40%,rgba(234,88,12,0.18),transparent_50%)]"
        />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-8 sm:pb-10">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold transition"
          >
            <I.Left size={16} /> Retour
          </button>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-200 via-brand-400 to-orange-600 text-3xl sm:text-4xl tracking-tight leading-none">
                YoHa
              </p>
              <h1 className="mt-3 font-display font-bold text-[clamp(1.75rem,5vw,2.5rem)] tracking-tight leading-[1.05]">
                Mes commandes
              </h1>
              <p className="mt-2 text-sm text-white/60 font-medium max-w-md">
                {isGuest
                  ? 'Mode invité — historique sur cet appareil.'
                  : 'Suivi live et recommande en un clic.'}
              </p>
            </div>
            <div className="shrink-0 text-center px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
              <div className="font-display font-bold text-2xl">{mine.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/55">total</div>
            </div>
          </div>

          {activeOrders.length > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-[12px] font-semibold border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeOrders.length} en cours
            </div>
          )}
        </div>
      </section>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FidelityBalanceCard />

        {isGuest && onLogin && (
          <div className="mb-6 rounded-2xl bg-ink-50 dark:bg-ink-900 border border-ink-100 dark:border-white/8 px-4 py-3.5 text-sm text-ink-700 dark:text-ink-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="flex items-center gap-2">
              <I.User size={16} className="text-brand-500 shrink-0" />
              Connecte-toi pour garder l&apos;historique partout.
            </span>
            <button type="button" onClick={onLogin} className="font-semibold text-brand-600 hover:underline shrink-0 text-left sm:text-right">
              Se connecter →
            </button>
          </div>
        )}

        {loadingOrders && mine.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-ink-500">Chargement…</p>
          </div>
        ) : (
          <div className="space-y-9">
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
                <SectionTitle title="En cours" count={listActive.length} live />
                <ul className="space-y-3.5">
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
                <SectionTitle title="Historique" count={listPast.length} />
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
              <ul className="space-y-3.5">
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
            Découvrir les restaurants <I.Right size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function lastOrderGuard(mine, activeOrders) {
  const lastOrder = mine[0] ?? null;
  return Boolean(lastOrder && (activeOrders.length <= 1 || lastOrder.status !== 'delivered' || mine.length === 1));
}
