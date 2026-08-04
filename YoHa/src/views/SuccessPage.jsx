'use client';

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import { ORDER_STATES, ORDER_STATUS_TOASTS } from '../data/orderConstants.js';
import { useOrders, useCart } from '../contexts/AppContexts.jsx';
import { useToast } from '../contexts/AppContexts.jsx';
import { Button } from '../components/ui/Button.jsx';
import { OrderTrackingTimeline, OrderStatusBadge } from '../components/ui/OrderStep.jsx';
import { formatMad } from '../data/index.js';
import { OrderRatingCard } from '../components/ui/OrderRatingCard.jsx';
import { getCourierGps, calculateHaversineDistance, resolveDestinationCoords } from '../utils/courierGps.js';
import { ordersApi } from '../lib/api.js';
import { subscribeWebPush } from '../lib/webPush.js';

function useNotificationPermission() {
  const [permitted, setPermitted] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') setPermitted(true);
  }, []);
  const request = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') { setPermitted(true); return true; }
    if (Notification.permission === 'denied') return false;
    const res = await Notification.requestPermission();
    if (res === 'granted') setPermitted(true);
    return res === 'granted';
  }, []);
  return { permitted, request };
}

/** Abonnement push unique : suivi commande + offres (côté serveur). */
async function enableClientPush() {
  try {
    await subscribeWebPush();
    return true;
  } catch {
    return false;
  }
}

const HERO = {
  placed:           { title: 'Commande confirmée', subtitle: 'On s’occupe de tout.', accent: 'from-brand-300 via-pink-400 to-violet-500' },
  pickup_confirmed: { title: 'Livreur en route', subtitle: 'Direction le restaurant.', accent: 'from-sky-200 via-sky-400 to-blue-500' },
  preparing:        { title: 'Commande prête', subtitle: 'Le restaurant a terminé.', accent: 'from-violet-200 via-pink-400 to-brand-500' },
  delivering:       { title: 'En route vers toi', subtitle: 'Suivi live activé.', accent: 'from-pink-300 via-brand-400 to-violet-500' },
  delivered:        { title: 'Commande livrée', subtitle: 'Bon appétit.', accent: 'from-emerald-200 via-emerald-400 to-teal-500' },
};

/** Plages de progression (0–100) pour les 4 étapes client. */
const STEP_PROGRESS_BAND = {
  1: { min: 8, max: 24 },
  2: { min: 26, max: 48 },
  3: { min: 50, max: 94 },
  4: { min: 100, max: 100 },
};

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** Progression GPS : plus le livreur se rapproche de la destination, plus la barre avance dans l’étape 3. */
function progressFromGpsDistance(distanceKm, refMaxKm, step = 3) {
  const band = STEP_PROGRESS_BAND[step] || STEP_PROGRESS_BAND[3];
  const ref = Math.max(1.2, Number(refMaxKm) || 4);
  const dist = Math.max(0, Number(distanceKm) || 0);
  const approach = 1 - clamp(dist / ref, 0, 1); // 0 loin → 1 arrivé
  // Courbe un peu accélérée en fin de parcours
  const eased = approach * approach * (3 - 2 * approach);
  return band.min + eased * (band.max - band.min);
}


function DeliveryWindowBanner({ liveEtaWindow, status }) {
  if (!liveEtaWindow || status === 'delivered') return null;
  const delayed = Boolean(liveEtaWindow.delayed);
  const scheduled = Boolean(liveEtaWindow.scheduled);
  return (
    <div className="mx-auto max-w-sm mt-5">
      <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md px-4 py-3.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-pink-200/90">
            {delayed ? 'Nouveau créneau' : scheduled ? 'Livraison planifiée' : 'Livraison estimée'}
          </div>
          <div className="font-display font-bold text-xl text-white tabular-nums tracking-tight mt-0.5">
            {liveEtaWindow.start} – {liveEtaWindow.end}
          </div>
          {scheduled && liveEtaWindow.dayLabel ? (
            <p className="mt-1.5 text-[12px] leading-snug text-white/75">{liveEtaWindow.dayLabel}</p>
          ) : null}
          {delayed && (
            <p className="mt-2 text-[12px] leading-snug text-white/80">
              Le livreur est proche — juste un peu de patience. Désolé pour l’attente.
            </p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full shrink-0 border ${
          delayed
            ? 'bg-amber-500/20 text-amber-100 border-amber-400/30'
            : scheduled
              ? 'bg-violet-500/20 text-violet-100 border-violet-400/30'
              : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/25'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${delayed ? 'bg-amber-300' : scheduled ? 'bg-violet-300' : 'bg-emerald-400'}`} />
          {delayed ? 'Bientôt' : scheduled ? 'Planifié' : 'Live'}
        </span>
      </div>
    </div>
  );
}

function CourierCard({ order, status }) {
  if (!order?.courierName || status === 'placed') return null;
  return (
    <div className="mx-4 sm:mx-5 mb-3">
      <div className="rounded-2xl bg-ink-50 dark:bg-ink-950 border border-ink-100 dark:border-white/8 px-4 py-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-ink-950 text-white dark:bg-white dark:text-ink-950 grid place-items-center shrink-0 font-display font-bold text-sm">
          {order.courierName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-ink-400 tracking-tight">Ton livreur</div>
          <div className="font-display font-bold text-sm text-ink-950 dark:text-white truncate">{order.courierName}</div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
          {status === 'delivering' ? 'En route' : 'Attribué'}
        </span>
      </div>
    </div>
  );
}

function ItemsSummary({ order, itemCount }) {
  if (!order?.items?.length) return null;
  const looksCustom = (it) => it.isCustom || (it.price <= 0 && /^\[(.+?)\]|^(.+?)\s+-\s+/.test(it.name || ''));
  const customItems = order.items.filter(looksCustom);
  const customStoreCount = new Set(customItems.map((it) => {
    const n = it.name || '';
    const b = n.match(/^\[(.+?)\]/);
    if (b) return b[1].trim().toLowerCase();
    const d = n.match(/^(.+?)\s+-\s+/);
    if (d) return d[1].trim().toLowerCase();
    return it.restaurantId || it.restaurantName?.trim().toLowerCase() || '';
  }).filter(Boolean)).size;
  const hasCustom = customItems.length > 0;

  return (
    <div className="px-4 pb-4 sm:px-5">
      <div className="rounded-2xl bg-ink-50/80 dark:bg-ink-950 border border-ink-100 dark:border-white/8 overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100 dark:border-white/8 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-ink-500">
            Articles ({itemCount})
          </span>
          <span className="text-[12px] font-medium text-ink-400">
            {order.items.length} plat{order.items.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="divide-y divide-ink-100 dark:divide-white/5">
          {order.items.map((it, idx) => (
            <div key={idx} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-800 dark:text-ink-200 font-medium truncate">
                  <span className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1 rounded-md bg-ink-950 text-white dark:bg-white dark:text-ink-950 font-bold text-[11px] mr-2">
                    {it.qty}
                  </span>
                  {it.name}
                </span>
                <span className="font-bold text-ink-950 dark:text-white shrink-0 tabular-nums">
                  {looksCustom(it) ? (
                    <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">Sur ticket</span>
                  ) : (
                    formatMad(it.price * (it.qty || 1))
                  )}
                </span>
              </div>
              {(it.options || []).length > 0 && (
                <div className="mt-1 pl-8 text-[12px] text-ink-400 truncate">
                  {it.options.map((o) => o.name).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-ink-100 dark:border-white/8 flex items-center justify-between bg-white dark:bg-ink-900">
          <span className="text-sm font-semibold text-ink-700 dark:text-ink-300">Total</span>
          <span className="font-display font-black text-lg text-ink-950 dark:text-white tabular-nums">
            {hasCustom
              ? `${formatMad(order.totalDh || order.total, { decimals: 2 })} + achats`
              : formatMad(order.totalDh || order.total, { decimals: 2 })}
          </span>
        </div>
        {hasCustom && (
          <div className="px-4 py-3 border-t border-ink-100 dark:border-white/8 text-[12px] text-ink-500 leading-relaxed">
            Sur-mesure · {customStoreCount > 1
              ? `${customStoreCount} établissements · ${customStoreCount * 20} MAD de course`
              : '20 MAD de course'}
            . Achats réglés à la livraison selon le ticket.
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBarSection({ status, stepNum, displayedProgressPct, gpsCalculated, destInfo, courierName }) {
  if (status === 'delivered') return null;
  const liveMove = status === 'pickup_confirmed' || status === 'preparing' || status === 'delivering';
  return (
    <div className="px-4 sm:px-5 pt-4 pb-1">
      <div className="flex items-center justify-between text-[12px] font-semibold text-ink-500 mb-2">
        <span className="text-ink-950 dark:text-white">Suivi en direct</span>
        <span className={gpsCalculated ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400'}>
          Étape {stepNum}/4
        </span>
      </div>

      <div className="relative h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden shadow-inner">
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-[width] duration-1000 ease-out"
          style={{ width: `${Math.max(8, displayedProgressPct)}%` }}
        >
          <div
            className={`h-full w-full ${liveMove ? 'yoha-snake-bar' : 'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500'}`}
            aria-hidden
          />
          {liveMove && (
            <span
              className="yoha-snake-head pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
              aria-hidden
            />
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[12px] font-medium">
        {gpsCalculated ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            GPS · {gpsCalculated.distanceKm.toFixed(1)} km de {gpsCalculated.destName || destInfo?.name || 'toi'}
            {' · ~'}{gpsCalculated.travelMins} min
            {courierName ? ` · ${courierName}` : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
            {liveMove && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shrink-0" />
            )}
            {liveMove ? `Livreur en mouvement vers ${destInfo?.name || 'toi'}…` : destInfo?.name}
          </span>
        )}
      </div>
    </div>
  );
}

function OrderHeader({ orderId, order }) {
  return (
    <div className="px-4 pt-5 pb-1 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-ink-400 tracking-tight">Commande</div>
          <h2 className="font-display font-bold text-base sm:text-lg text-ink-950 dark:text-white truncate tracking-tight mt-0.5">
            #{orderId || 'YH-8472-9136'}
          </h2>
          {order?.restaurantName && (
            <p className="text-[13px] text-ink-500 dark:text-ink-400 font-medium truncate mt-0.5">
              {order.restaurantName}
            </p>
          )}
        </div>
        <OrderStatusBadge status={order?.status || 'placed'} />
      </div>
    </div>
  );
}

function HeroSection({ hero, status, st }) {
  return (
    <div className="text-center px-4 pt-2">
      <p className={`font-display font-black text-transparent bg-clip-text bg-gradient-to-br ${hero.accent} text-4xl sm:text-5xl tracking-tight leading-none`}>
        YoHa
      </p>
      <h1 className="mt-4 font-display font-bold text-[clamp(1.85rem,5.5vw,2.6rem)] tracking-tight text-white leading-[1.05]">
        {hero.title}
      </h1>
      <p className="mt-2 text-sm text-white/60 font-medium max-w-sm mx-auto leading-relaxed">
        {hero.subtitle || st.clientMsg}
      </p>
      {status !== 'delivered' && (
        <p className="mt-2 text-[12px] text-white/40 font-medium">{st.clientMsg}</p>
      )}
    </div>
  );
}

function ActionButtons({ onMyOrders, onHome }) {
  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-2.5 px-4 sm:px-0 items-stretch sm:items-center justify-center">
      {onMyOrders && (
        <Button onClick={onMyOrders} variant="secondary" size="md" className="justify-center rounded-xl text-sm">
          Mes commandes
        </Button>
      )}
      <button
        type="button"
        onClick={onHome}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm px-5 py-3 transition-all active:scale-[0.98]"
      >
        Commander autre chose
      </button>
    </div>
  );
}

export function SuccessPage({ orderId, onHome, onMyOrders }) {
  const { orders, trackOrder } = useOrders();
  const { push: pushToast } = useToast();
  const { cart } = useCart();
  const order = orders.find((o) => o.id === orderId);
  const status = order?.status || 'placed';
  const hero = useMemo(() => {
    const base = HERO[status] || HERO.placed;
    if (status === 'placed' && (order?.scheduledDeliveryAt || order?.scheduled_delivery_at)) {
      return { ...base, subtitle: 'Livraison planifiée — on s’occupe du timing.' };
    }
    return base;
  }, [status, order?.scheduledDeliveryAt, order?.scheduled_delivery_at]);
  const st = ORDER_STATES[status] || ORDER_STATES.placed;
  const stepNum = st.step;
  const prevStatusRef = useRef(undefined);
  const [nowMs, setNowMs] = useState(Date.now());
  const [courierGps, setCourierGps] = useState(null);
  /** Offset aléatoire / crawl quand pas de GPS (reste dans la bande de l’étape). */
  const [wanderOffset, setWanderOffset] = useState(0);
  /** Distance max observée vers la destination (référence pour % d’approche). */
  const gpsRefMaxKm = useRef(null);
  const lastGpsPctRef = useRef(null);

  useEffect(() => {
    // Reset référence GPS à chaque changement d’étape / commande
    gpsRefMaxKm.current = null;
    lastGpsPctRef.current = null;
    setWanderOffset(0);
  }, [status, stepNum, orderId]);

  useEffect(() => {
    if (status === 'delivered' || status === 'cancelled') {
      setWanderOffset(0);
      return undefined;
    }
    // Crawl aléatoire : avance doucement, parfois un micro-recul, sans dépasser la bande
    const timer = setInterval(() => {
      setWanderOffset((prev) => {
        const band = STEP_PROGRESS_BAND[stepNum] || STEP_PROGRESS_BAND[1];
        const span = Math.max(4, band.max - band.min - 3);
        const jitter = (Math.random() - 0.28) * 1.35; // biais vers l’avant
        const next = clamp(prev + jitter, 0, span);
        return next;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, [status, stepNum]);

  const syncGps = useCallback(() => {
    if (!orderId || status === 'delivered' || status === 'cancelled') {
      setCourierGps(null);
      return;
    }
    const local = getCourierGps(orderId);
    if (local?.active) {
      setCourierGps(local);
      return;
    }
    ordersApi.getLocation(orderId).then((data) => {
      if (data?.active && data?.latitude != null && data?.longitude != null) {
        setCourierGps({
          active: true,
          lat: Number(data.latitude),
          lng: Number(data.longitude),
          updatedAt: Date.now(),
        });
      } else {
        setCourierGps(null);
      }
    }).catch(() => {});
  }, [orderId, status]);

  useEffect(() => {
    syncGps();
    const timer = setInterval(() => {
      setNowMs(Date.now());
      syncGps();
    }, 4000);
    window.addEventListener('yoha_courier_gps_updated', syncGps);
    return () => { clearInterval(timer); window.removeEventListener('yoha_courier_gps_updated', syncGps); };
  }, [syncGps]);

  const destInfo = useMemo(
    () => resolveDestinationCoords(
      order?.customerAddress
      || order?.customer?.address
      || order?.address
      || order?.delivery_instructions
      || '',
    ),
    [order],
  );

  const gpsCalculated = useMemo(() => {
    if (!courierGps || !courierGps.active || status === 'delivered') return null;
    const dist = calculateHaversineDistance(courierGps.lat, courierGps.lng, destInfo.lat, destInfo.lng);
    if (!Number.isFinite(dist)) return null;

    const stepForGps = status === 'delivering' ? 3 : status === 'pickup_confirmed' || status === 'preparing' ? 2 : 1;
    const band = STEP_PROGRESS_BAND[stepForGps] || STEP_PROGRESS_BAND[3];

    if (gpsRefMaxKm.current == null || dist > gpsRefMaxKm.current) {
      gpsRefMaxKm.current = Math.max(dist, 1.5);
    }
    const ref = Math.max(gpsRefMaxKm.current, dist, 1.5);
    gpsRefMaxKm.current = ref;

    let pct = progressFromGpsDistance(dist, ref, stepForGps);
    if (lastGpsPctRef.current != null && pct < lastGpsPctRef.current - 1.5) {
      pct = lastGpsPctRef.current - 0.4;
    }
    lastGpsPctRef.current =
      lastGpsPctRef.current == null || pct > lastGpsPctRef.current
        ? pct
        : Math.max(lastGpsPctRef.current - 0.15, pct);
    pct = lastGpsPctRef.current;

    return {
      distanceKm: dist,
      travelMins: Math.max(2, Math.ceil((dist / 22) * 60 + 2)),
      pct: clamp(pct, band.min, band.max),
      destName: destInfo.name,
    };
  }, [courierGps, destInfo, status]);

  const smartProgressPct = useMemo(() => {
    if (status === 'delivered') return 100;
    const band = STEP_PROGRESS_BAND[stepNum] || STEP_PROGRESS_BAND[1];
    if (gpsCalculated) {
      // GPS prioritaire : rapprochement réel vers Alliance / CHU / FMPT / ISPITS
      return gpsCalculated.pct;
    }
    // Sans GPS : base d’étape + crawl aléatoire dans la bande
    return clamp(band.min + wanderOffset, band.min, band.max - 1);
  }, [status, gpsCalculated, stepNum, wanderOffset]);

  const displayedProgressPct = useMemo(() => {
    if (status === 'delivered') return 100;
    return clamp(Math.round(smartProgressPct * 10) / 10, 6, 98);
  }, [status, smartProgressPct]);

  const liveEtaWindow = useMemo(() => {
    if (status === 'delivered') return null;
    const fmt = (ms) => {
      const d = new Date(ms);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // Créneau choisi au checkout (« Planifier »)
    const scheduledRaw = order?.scheduledDeliveryAt || order?.scheduled_delivery_at;
    if (scheduledRaw) {
      const startMs = new Date(scheduledRaw).getTime();
      if (Number.isFinite(startMs)) {
        const endMs = startMs + 30 * 60 * 1000;
        let delayed = false;
        let s = startMs;
        let e = endMs;
        while (nowMs > e && status !== 'delivered') {
          s = e;
          e += 15 * 60 * 1000;
          delayed = true;
        }
        const dayLabel = new Date(startMs).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        return {
          start: fmt(s),
          end: fmt(e),
          delayed,
          scheduled: !delayed,
          dayLabel: delayed ? null : dayLabel,
        };
      }
    }

    const baseTime = order?.createdAt ? new Date(order.createdAt).getTime() : Date.now();
    if (!Number.isFinite(baseTime)) return null;
    // Créneau fixe : 45–60 min après la commande
    let startMs = baseTime + 45 * 60 * 1000;
    let endMs = baseTime + 60 * 60 * 1000;
    let delayed = false;
    while (nowMs > endMs && status !== 'delivered') {
      startMs = endMs;
      endMs += 15 * 60 * 1000;
      delayed = true;
    }
    return { start: fmt(startMs), end: fmt(endMs), delayed, scheduled: false };
  }, [order?.createdAt, order?.scheduledDeliveryAt, order?.scheduled_delivery_at, status, nowMs]);

  useEffect(() => {
    if (!orderId) return undefined;
    trackOrder(orderId);
    const poll = setInterval(() => trackOrder(orderId), 3000);
    return () => clearInterval(poll);
  }, [orderId, trackOrder]);

  useEffect(() => {
    if (!order?.status) return;
    const prev = prevStatusRef.current;
    if (prev !== undefined && prev !== order.status) {
      const toast = ORDER_STATUS_TOASTS[order.status];
      if (toast) pushToast({ ...toast, type: 'success', duration: 5000 });
    }
    prevStatusRef.current = order.status;
  }, [order?.status, pushToast]);

  const itemCount = order?.items?.reduce((s, i) => s + i.qty, 0) ?? 0;
  const { permitted: notifPermitted, request: requestNotif } = useNotificationPermission();
  const hasCartItems = cart.length > 0;

  // Permission déjà OK → s'abonner silencieusement (suivi + offres)
  useEffect(() => {
    if (!notifPermitted) return;
    enableClientPush();
  }, [notifPermitted]);

  return (
    <div className="page-enter relative min-h-screen overflow-hidden bg-white dark:bg-ink-950">
      <Confetti active={status === 'placed'} />

      <section className="relative overflow-hidden bg-ink-950 text-white pb-10 sm:pb-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(80%_70%_at_20%_0%,rgba(249,115,22,0.28),transparent_55%),radial-gradient(60%_50%_at_85%_35%,rgba(236,72,153,0.22),transparent_50%),radial-gradient(50%_40%_at_60%_90%,rgba(139,92,246,0.18),transparent_55%)]"
        />
        <div className="relative max-w-lg mx-auto px-4 pt-8 sm:pt-10">
          {!notifPermitted && (
            <div className="mb-5 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15">
              <p className="text-[12px] font-medium text-white/80 flex-1">
                Active les notifications pour le suivi live.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const ok = await requestNotif();
                  if (ok) enableClientPush();
                }}
                className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-brand-500 text-white"
              >
                Activer
              </button>
            </div>
          )}

          <HeroSection hero={hero} status={status} st={st} />
          <DeliveryWindowBanner liveEtaWindow={liveEtaWindow} status={status} />
        </div>
      </section>

      <div className="relative max-w-lg mx-auto -mt-5 px-3 sm:px-0 pb-28 sm:pb-12">
        <div className="rounded-[1.5rem] bg-white dark:bg-ink-900 border border-ink-100 dark:border-white/8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] overflow-hidden">
          <OrderHeader orderId={orderId} order={order} />
          {status !== 'delivered' && (
            <ProgressBarSection
              status={status}
              stepNum={stepNum}
              displayedProgressPct={displayedProgressPct}
              gpsCalculated={gpsCalculated}
              destInfo={destInfo}
              courierName={order?.courierName}
            />
          )}
          <div className="px-2 sm:px-4 py-3">
            <OrderTrackingTimeline status={status} />
          </div>
          <CourierCard order={order} status={status} />
          <ItemsSummary order={order} itemCount={itemCount} />
        </div>

        <div className="mt-4">
          {order && <OrderRatingCard order={order} />}
        </div>

        <ActionButtons onMyOrders={onMyOrders} onHome={onHome} />
      </div>

      {!hasCartItems && (
        <div className="fixed bottom-0 inset-x-0 md:hidden z-40 p-3 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-xs rounded-2xl bg-ink-950 text-white px-4 py-3 flex items-center justify-between gap-3 border border-white/10 shadow-2xl">
            <div>
              <div className="text-[10px] font-semibold text-white/45 uppercase tracking-wider">En cours</div>
              <div className="font-bold text-xs text-white">#{orderId}</div>
            </div>
            <button
              type="button"
              onClick={onHome}
              className="text-[11px] font-bold px-3 py-2 rounded-xl bg-brand-500 text-white"
            >
              Recommander
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Confetti({ active = true }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2 + Math.random() * 2,
        color: ['#f97316', '#ec4899', '#8b5cf6', '#fb923c', '#f472b6', '#a78bfa'][i % 6],
        rotate: Math.random() * 360,
        shape: i % 3,
        size: 4 + Math.random() * 6,
      })),
    [],
  );
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-20">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.left}%`,
            width: p.size,
            height: p.shape === 0 ? p.size * 1.4 : p.size,
            background: p.color,
            borderRadius: p.shape === 2 ? '50%' : 2,
            transform: `rotate(${p.rotate}deg)`,
            opacity: 0.85,
            animation: `yoha-fall ${p.duration}s ${p.delay}s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
          }}
        />
      ))}
      <style>{`@keyframes yoha-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 0.85; } 100% { transform: translateY(105vh) rotate(520deg); opacity: 0; } }`}</style>
    </div>
  );
}
