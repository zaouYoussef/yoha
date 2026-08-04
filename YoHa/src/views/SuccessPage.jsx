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

const HERO = {
  placed:           { title: 'Commande confirmée', subtitle: 'On s’occupe de tout.', accent: 'from-orange-300 via-brand-400 to-orange-600' },
  pickup_confirmed: { title: 'Livreur en route', subtitle: 'Direction le restaurant.', accent: 'from-sky-200 via-sky-400 to-blue-500' },
  preparing:        { title: 'Commande prête', subtitle: 'Le restaurant a terminé.', accent: 'from-amber-200 via-orange-400 to-brand-600' },
  delivering:       { title: 'En route vers toi', subtitle: 'Suivi live activé.', accent: 'from-orange-200 via-brand-400 to-orange-600' },
  delivered:        { title: 'Commande livrée', subtitle: 'Bon appétit.', accent: 'from-emerald-200 via-emerald-400 to-teal-500' },
};

function DeliveryWindowBanner({ liveEtaWindow, status }) {
  if (!liveEtaWindow || status === 'delivered') return null;
  return (
    <div className="mx-auto max-w-sm mt-5">
      <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md px-4 py-3.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-200/90">
            Livraison estimée
          </div>
          <div className="font-display font-bold text-xl text-white tabular-nums tracking-tight mt-0.5">
            {liveEtaWindow.start} – {liveEtaWindow.end}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/25 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
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
  return (
    <div className="px-4 sm:px-5 pt-4 pb-1">
      <div className="flex items-center justify-between text-[12px] font-semibold text-ink-500 mb-2">
        <span className="text-ink-950 dark:text-white">Suivi en direct</span>
        <span className={gpsCalculated ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400'}>
          Étape {stepNum}/4
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-orange-600 transition-[width] duration-1000 ease-out"
          style={{ width: `${displayedProgressPct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center gap-2 text-[12px] font-medium">
        {gpsCalculated ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            GPS {courierName || 'Livreur'} · {gpsCalculated.distanceKm.toFixed(1)} km · ~{gpsCalculated.travelMins} min
          </span>
        ) : (
          <span className="text-ink-500 dark:text-ink-400">
            {destInfo.name}
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
            #{orderId || 'YH-XXXX'}
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
  const hero = HERO[status] || HERO.placed;
  const st = ORDER_STATES[status] || ORDER_STATES.placed;
  const stepNum = st.step;
  const prevStatusRef = useRef(undefined);
  const [nowMs, setNowMs] = useState(Date.now());
  const [courierGps, setCourierGps] = useState(null);
  const [smoothOffset, setSmoothOffset] = useState(0);

  useEffect(() => {
    if (status === 'delivered') { setSmoothOffset(0); return; }
    const timer = setInterval(() => setSmoothOffset((prev) => (prev < 4.5 ? prev + 0.15 : prev)), 2000);
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
    () => resolveDestinationCoords(order?.customerAddress || order?.address || order?.delivery_instructions || ''),
    [order],
  );

  const gpsCalculated = useMemo(() => {
    if (!courierGps || !courierGps.active || status === 'delivered') return null;
    const dist = calculateHaversineDistance(courierGps.lat, courierGps.lng, destInfo.lat, destInfo.lng);
    return {
      distanceKm: dist,
      travelMins: Math.max(2, Math.ceil((dist / 22) * 60 + 2)),
      pct: Math.min(98, Math.max(30, Math.round(100 - (dist / 3.2) * 65))),
    };
  }, [courierGps, destInfo, status]);

  const smartProgressPct = useMemo(() => {
    if (status === 'delivered') return 100;
    if (gpsCalculated) return gpsCalculated.pct;
    return Math.min(95, Math.max(15, (stepNum / 4) * 100));
  }, [status, gpsCalculated, stepNum]);

  const displayedProgressPct = useMemo(() => {
    if (status === 'delivered') return 100;
    return Math.min(98, Math.round(smartProgressPct + smoothOffset));
  }, [status, smartProgressPct, smoothOffset]);

  const storeCount = useMemo(() => {
    if (!order?.items?.length) return 1;
    const keys = new Set();
    for (const it of order.items) {
      const n = it.name || '';
      const bracketed = n.match(/^\[(.+?)\]/);
      const dashed = n.match(/^(.+?)\s+-\s+/);
      if (bracketed) keys.add(`n:${bracketed[1].trim().toLowerCase()}`);
      else if (dashed) keys.add(`n:${dashed[1].trim().toLowerCase()}`);
      else {
        const rid = it.restaurantId || it.restaurantName?.trim().toLowerCase();
        if (rid) keys.add(`r:${rid}`);
      }
    }
    return Math.max(1, keys.size);
  }, [order]);
  const isMultiStore = storeCount > 1;

  const liveEtaWindow = useMemo(() => {
    if (status === 'delivered') return null;
    const baseTime = order?.createdAt ? new Date(order.createdAt).getTime() : Date.now();
    const fmt = (ms) => {
      const d = new Date(ms);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    if (gpsCalculated) {
      const remainingMs = (gpsCalculated.travelMins + (isMultiStore ? 15 : 0)) * 60 * 1000;
      const arrivalTargetMs = nowMs + remainingMs;
      return {
        start: fmt(Math.max(nowMs, arrivalTargetMs - 3 * 60 * 1000)),
        end: fmt(arrivalTargetMs + 7 * 60 * 1000),
      };
    }
    const etaMin = isMultiStore ? 45 : 20;
    const etaMax = isMultiStore ? 60 : 35;
    let startMs = baseTime + etaMin * 60 * 1000;
    let endMs = baseTime + etaMax * 60 * 1000;
    while (nowMs > endMs - 2 * 60 * 1000 && status !== 'delivered') {
      startMs += 10 * 60 * 1000;
      endMs += 10 * 60 * 1000;
    }
    return { start: fmt(startMs), end: fmt(endMs) };
  }, [order?.createdAt, status, nowMs, gpsCalculated, isMultiStore]);

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

  return (
    <div className="page-enter relative min-h-screen overflow-hidden bg-white dark:bg-ink-950">
      <Confetti active={status === 'placed'} />

      <section className="relative overflow-hidden bg-ink-950 text-white pb-10 sm:pb-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(80%_70%_at_20%_0%,rgba(249,115,22,0.38),transparent_55%),radial-gradient(60%_50%_at_90%_40%,rgba(234,88,12,0.2),transparent_50%)]"
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
                  if (ok) subscribeWebPush().catch(() => {});
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
              <div className="font-bold text-xs text-white">#{orderId?.slice(0, 10)}</div>
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
        color: ['#f97316', '#fb923c', '#ea580c', '#fdba74', '#fff7ed', '#f59e0b'][i % 6],
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
