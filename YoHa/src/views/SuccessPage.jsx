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
  placed:           { title: 'Commande confirmée !', emoji: '🎉', gradient: 'from-amber-400 to-orange-500' },
  pickup_confirmed: { title: 'Livreur en route',     emoji: '🛵', gradient: 'from-sky-400 to-blue-500' },
  preparing:        { title: 'Commande prête',       emoji: '👨‍🍳', gradient: 'from-violet-400 to-purple-500' },
  delivering:       { title: 'En route vers vous',   emoji: '📦', gradient: 'from-pink-400 to-rose-500' },
  delivered:        { title: 'Commande livrée !',    emoji: '✅', gradient: 'from-emerald-400 to-teal-500' },
};

const STATUS_COLORS = {
  placed:           { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-300' },
  pickup_confirmed: { bg: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200 dark:border-sky-800/50', text: 'text-sky-700 dark:text-sky-300' },
  preparing:        { bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-800/50', text: 'text-violet-700 dark:text-violet-300' },
  delivering:       { bg: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-pink-200 dark:border-pink-800/50', text: 'text-pink-700 dark:text-pink-300' },
  delivered:        { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-300' },
};

function DeliveryWindowBanner({ liveEtaWindow, status }) {
  if (!liveEtaWindow || status === 'delivered') return null;
  return (
    <div className="mx-auto max-w-md mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-pink-500/10 border border-brand-500/30">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-brand-500 text-white grid place-items-center text-sm shrink-0 shadow-sm">
          ⏰
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Livraison estimée
          </div>
          <div className="font-extrabold text-sm text-ink-900 dark:text-white">
            {liveEtaWindow.start} – {liveEtaWindow.end}
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
    </div>
  );
}

function CourierCard({ order, status }) {
  if (!order?.courierName || status === 'placed') return null;
  return (
    <div className={`mx-3 sm:mx-5 mb-3 p-3 rounded-xl ${STATUS_COLORS[status]?.bg || 'bg-ink-50 dark:bg-ink-900/50'} border ${STATUS_COLORS[status]?.border || 'border-ink-200 dark:border-ink-800/50'}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-sky-500 text-white grid place-items-center shrink-0 shadow-sm text-xs font-bold">
          {order.courierName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Livreur</div>
          <div className="font-extrabold text-sm text-ink-900 dark:text-white truncate">{order.courierName}</div>
        </div>
        <span className="text-[10px] font-bold text-ink-400 flex items-center gap-1">
          <I.Bike size={12} className="text-sky-500" />
          {status === 'delivering' ? 'En route' : 'Attribué'}
        </span>
      </div>
    </div>
  );
}

function ItemsSummary({ order, itemCount }) {
  if (!order?.items?.length) return null;
  return (
    <div className="px-3 pb-3 sm:px-5">
      <div className="rounded-xl bg-slate-50 dark:bg-ink-900/80 border border-ink-100 dark:border-ink-800/60 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-ink-100 dark:border-ink-800/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Articles ({itemCount})</span>
        </div>
        <div className="divide-y divide-ink-100 dark:divide-ink-800/40">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="text-ink-700 dark:text-ink-300 font-medium truncate mr-2">
                <span className="font-extrabold text-brand-600 dark:text-brand-400">{it.qty}×</span> {it.name}
              </span>
              <span className="font-bold text-ink-900 dark:text-white shrink-0 tabular-nums">
                {formatMad(it.price * (it.qty || 1))}
              </span>
            </div>
          ))}
        </div>
        <div className="px-3 py-2.5 border-t border-dashed border-ink-200 dark:border-ink-700 flex items-center justify-between bg-white/50 dark:bg-ink-950/30">
          <span className="text-xs font-bold text-ink-700 dark:text-ink-300">Total</span>
          <span className="text-sm font-black text-brand-600 dark:text-brand-400 tabular-nums">
            {formatMad(order.totalDh || order.total, { decimals: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProgressBarSection({ status, stepNum, displayedProgressPct, gpsCalculated, destInfo, courierName }) {
  if (status === 'delivered') return null;
  return (
    <div className="px-3 sm:px-5 pt-3 pb-1">
      <div className="flex items-center justify-between text-xs font-bold text-ink-500 mb-1.5">
        <span className="flex items-center gap-1.5">
          <span className="text-brand-500">🛵</span>
          <span className="text-ink-800 dark:text-white">Suivi en direct</span>
        </span>
        <span className={gpsCalculated ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : 'text-ink-400'}>
          {gpsCalculated && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
          Étape {stepNum}/4
        </span>
      </div>

      <div className="h-3 rounded-full bg-ink-100 dark:bg-ink-800 p-0.5 relative shadow-inner overflow-hidden">
        <div
          className="h-full bg-[linear-gradient(90deg,#f97316,#ec4899,#eab308,#10b981,#3b82f6,#f97316)] animate-snake-bar transition-all duration-1000 ease-out rounded-full shadow-md relative"
          style={{ width: `${displayedProgressPct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          {status !== 'delivered' && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-ink-900 shadow-[0_0_8px_#10b981] animate-ping" />
              <span className="absolute w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-ink-900" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold">
        {gpsCalculated ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            GPS {courierName || 'Livreur'} • {gpsCalculated.distanceKm.toFixed(1)} km • ~{gpsCalculated.travelMins} min
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
            {destInfo.icon} {destInfo.name}
          </span>
        )}
      </div>
    </div>
  );
}

function OrderHeader({ orderId, order, status }) {
  return (
    <div className="px-3 pt-3 pb-0 sm:px-5 sm:pt-5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Commande</div>
          <h2 className="font-extrabold text-sm sm:text-base text-ink-900 dark:text-white truncate">
            #{orderId || 'YH-XXXX'}
          </h2>
          {order?.restaurantName && (
            <p className="text-xs text-ink-500 dark:text-ink-400 font-medium flex items-center gap-1 mt-0.5">
              <I.Chef size={12} className="text-brand-500 shrink-0" />
              <span className="truncate">{order.restaurantName}</span>
            </p>
          )}
        </div>
        <OrderStatusBadge status={status} />
      </div>
    </div>
  );
}

function HeroSection({ hero, status, st }) {
  return (
    <div className="text-center px-4 pt-6 sm:pt-10">
      <div className="relative inline-block">
        <div
          className={`relative grid place-items-center w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br ${hero.gradient} shadow-lg transition-transform hover:scale-105`}
        >
          <span className="text-2xl sm:text-3xl" role="img" aria-hidden>{hero.emoji}</span>
        </div>
        {status !== 'delivered' && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        )}
      </div>
      <h1 className="mt-2 font-display font-black text-xl sm:text-2xl tracking-tight text-ink-900 dark:text-white">
        {hero.title}
      </h1>
      <p className="mt-0.5 text-xs sm:text-sm text-ink-500 dark:text-ink-400 font-medium max-w-xs mx-auto">
        {st.clientMsg}
      </p>
    </div>
  );
}

function ActionButtons({ onMyOrders, onHome }) {
  return (
    <div className="mt-5 flex flex-col sm:flex-row gap-2 px-3 sm:px-0">
      {onMyOrders && (
        <Button onClick={onMyOrders} variant="secondary" size="md" className="justify-center rounded-xl text-xs sm:text-sm">
          Mes commandes
        </Button>
      )}
      <Button onClick={onHome} variant="primary" size="md" className="justify-center rounded-xl text-xs sm:text-sm">
        Commander autre chose
      </Button>
    </div>
  );
}

export function SuccessPage({ orderId, onHome, onMyOrders }) {
  const { orders, restaurants = [], trackOrder } = useOrders();
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
    if (status === 'delivered') {
      setSmoothOffset(0);
      return;
    }
    const timer = setInterval(() => {
      setSmoothOffset((prev) => (prev < 4.5 ? prev + 0.15 : prev));
    }, 2000);
    return () => clearInterval(timer);
  }, [status, stepNum]);

  const syncGps = useCallback(() => {
    if (!orderId) return;
    setCourierGps(getCourierGps(orderId));
  }, [orderId]);

  useEffect(() => {
    syncGps();
    const timer = setInterval(() => {
      setNowMs(Date.now());
      syncGps();
    }, 5000);
    window.addEventListener('yoha_courier_gps_updated', syncGps);
    return () => {
      clearInterval(timer);
      window.removeEventListener('yoha_courier_gps_updated', syncGps);
    };
  }, [syncGps]);

  const destInfo = useMemo(() => {
    return resolveDestinationCoords(order?.customerAddress || order?.address || order?.delivery_instructions || '');
  }, [order]);

  const gpsCalculated = useMemo(() => {
    if (!courierGps || !courierGps.active || status === 'delivered') return null;
    const dist = calculateHaversineDistance(courierGps.lat, courierGps.lng, destInfo.lat, destInfo.lng);
    const estMins = Math.max(2, Math.ceil((dist / 22) * 60 + 2));
    const progressPct = Math.min(98, Math.max(30, Math.round(100 - (dist / 3.2) * 65)));
    return { distanceKm: dist, travelMins: estMins, pct: progressPct };
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

  const liveEtaWindow = useMemo(() => {
    if (status === 'delivered') return null;
    const baseTime = order?.createdAt ? new Date(order.createdAt).getTime() : Date.now();

    if (gpsCalculated) {
      const remainingMs = gpsCalculated.travelMins * 60 * 1000;
      const arrivalTargetMs = nowMs + remainingMs;
      const startMs = Math.max(nowMs, arrivalTargetMs - 3 * 60 * 1000);
      const endMs = arrivalTargetMs + 7 * 60 * 1000;
      const fmt = (ms) => {
        const d = new Date(ms);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };
      return { start: fmt(startMs), end: fmt(endMs) };
    }

    let startMs = baseTime + 20 * 60 * 1000;
    let endMs = baseTime + 35 * 60 * 1000;

    while (nowMs > endMs - 2 * 60 * 1000 && status !== 'delivered') {
      startMs += 10 * 60 * 1000;
      endMs += 10 * 60 * 1000;
    }

    const fmt = (ms) => {
      const d = new Date(ms);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return { start: fmt(startMs), end: fmt(endMs) };
  }, [order?.createdAt, status, nowMs, gpsCalculated]);

  const restoInfo = useMemo(() => {
    if (!order) return null;
    return restaurants.find((r) => String(r.id) === String(order.restaurantId) || r.name === order.restaurantName);
  }, [order, restaurants]);

  const restoEta = order?.restaurantEta || restoInfo?.eta || restoInfo?.deliveryTime || '30-45 min';

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
    <div className="page-enter relative min-h-screen bg-gradient-to-b from-white via-ink-50/50 to-white dark:from-ink-950 dark:via-ink-900/50 dark:to-ink-950">
      <Confetti active={status !== 'delivered'} />

      <div className="max-w-lg mx-auto pb-24 sm:pb-12">
        {/* Notif opt-in */}
        {!notifPermitted && (
          <div className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40">
            <span className="text-sm">🔔</span>
            <p className="text-[11px] font-semibold text-sky-800 dark:text-sky-200 flex-1">
              Activez les notifications pour suivre en temps réel.
            </p>
            <button
              onClick={requestNotif}
              className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
            >
              Activer
            </button>
          </div>
        )}

        {/* Hero */}
        <HeroSection hero={hero} status={status} st={st} />

        {/* Delivery window */}
        <DeliveryWindowBanner liveEtaWindow={liveEtaWindow} status={status} />

        {/* Main Card */}
        <div className="mt-4 mx-3 sm:mx-0 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 shadow-sm overflow-hidden">
          <OrderHeader orderId={orderId} order={order} status={status} />

          {/* Progress bar */}
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

          {/* Timeline */}
          <div className="px-2 sm:px-5 py-3">
            <OrderTrackingTimeline status={status} />
          </div>

          {/* Courier */}
          <CourierCard order={order} status={status} />

          {/* Items */}
          <ItemsSummary order={order} itemCount={itemCount} />
        </div>

        {/* Rating */}
        <div className="mx-3 sm:mx-0 mt-3">
          {order && <OrderRatingCard order={order} />}
        </div>

        {/* Actions */}
        <ActionButtons onMyOrders={onMyOrders} onHome={onHome} />
      </div>

      {/* Mobile bottom bar — only if cart empty */}
      {!hasCartItems && (
        <div className="fixed bottom-0 inset-x-0 md:hidden bg-white/90 dark:bg-ink-950/90 backdrop-blur-lg border-t border-ink-200 dark:border-ink-800 px-4 py-2.5 flex items-center justify-between gap-3 z-40">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">🎉</span>
            <span className="font-semibold text-ink-700 dark:text-ink-300">Commande #{orderId?.slice(0, 8)}</span>
          </div>
          <button
            onClick={onHome}
            className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            Re-commander
          </button>
        </div>
      )}
    </div>
  );
}

export function Confetti({ active = true }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 1.4,
        color: ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][i % 6],
        rotate: Math.random() * 360,
        shape: i % 3,
      })),
    [],
  );
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.left}%`,
            width: p.shape === 1 ? 8 : 6,
            height: p.shape === 0 ? 10 : 6,
            background: p.color,
            borderRadius: p.shape === 2 ? '50%' : 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(100vh) rotate(720deg); opacity: 0.3; } }`}</style>
    </div>
  );
}
