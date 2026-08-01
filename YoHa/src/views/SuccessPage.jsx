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
import { LiveMapTracker } from '../components/ui/LiveMapTracker.jsx';
import { getCourierGps, calculateHaversineDistance, resolveDestinationCoords } from '../utils/courierGps.js';
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
  placed:           { title: 'Commande confirmée !', emoji: '🎉', gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-400/40' },
  pickup_confirmed: { title: 'Livreur en route',     emoji: '🛵', gradient: 'from-sky-400 to-blue-500', ring: 'ring-sky-400/40' },
  preparing:        { title: 'Commande prête',       emoji: '👨‍🍳', gradient: 'from-violet-400 to-purple-500', ring: 'ring-violet-400/40' },
  delivering:       { title: 'En route vers vous',   emoji: '📦', gradient: 'from-pink-400 to-rose-500', ring: 'ring-pink-400/40' },
  delivered:        { title: 'Commande livrée !',    emoji: '✅', gradient: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-400/40' },
};

const STATUS_COLORS = {
  placed:           { badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25', dot: 'bg-amber-500' },
  pickup_confirmed: { badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25', dot: 'bg-sky-500' },
  preparing:        { badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25', dot: 'bg-violet-500' },
  delivering:       { badge: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/25', dot: 'bg-pink-500' },
  delivered:        { badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25', dot: 'bg-emerald-500' },
};

function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      emoji: ['🛵', '🍕', '🎉', '⭐', '🔥', '✨', '🚀', '💫', '🌟', '🍔', '🌮', '🥙'][i],
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 12 + Math.random() * 10,
      size: 14 + Math.random() * 16,
    })), []);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-float-particle"
          style={{
            left: `${p.left}%`,
            top: '-30px',
            fontSize: `${p.size}px`,
            opacity: 0.15,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(0) rotate(0deg) scale(0.5); opacity: 0; }
          10% { opacity: 0.2; }
          50% { opacity: 0.15; }
          90% { opacity: 0.2; }
          100% { transform: translateY(100vh) rotate(360deg) scale(1.1); opacity: 0; }
        }
        .animate-float-particle {
          animation: float-particle var(--dur, 18s) ease-in infinite;
        }
        @keyframes glow-ring {
          0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.2), 0 0 40px rgba(249,115,22,0.1); }
          50% { box-shadow: 0 0 35px rgba(249,115,22,0.4), 0 0 70px rgba(236,72,153,0.2); }
        }
        @keyframes glow-ring-sky {
          0%, 100% { box-shadow: 0 0 20px rgba(14,165,233,0.2), 0 0 40px rgba(14,165,233,0.1); }
          50% { box-shadow: 0 0 35px rgba(14,165,233,0.4), 0 0 70px rgba(99,102,241,0.2); }
        }
        @keyframes glow-ring-violet {
          0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.2), 0 0 40px rgba(139,92,246,0.1); }
          50% { box-shadow: 0 0 35px rgba(139,92,246,0.4), 0 0 70px rgba(236,72,153,0.2); }
        }
        @keyframes glow-ring-pink {
          0%, 100% { box-shadow: 0 0 20px rgba(236,72,153,0.2), 0 0 40px rgba(236,72,153,0.1); }
          50% { box-shadow: 0 0 35px rgba(236,72,153,0.4), 0 0 70px rgba(249,115,22,0.2); }
        }
        @keyframes glow-ring-emerald {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.2), 0 0 40px rgba(16,185,129,0.1); }
          50% { box-shadow: 0 0 35px rgba(16,185,129,0.4), 0 0 70px rgba(99,102,241,0.2); }
        }
        @keyframes glow-pulse-bar {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(249,115,22,0.3)); }
          50% { filter: drop-shadow(0 0 14px rgba(236,72,153,0.5)) drop-shadow(0 0 30px rgba(16,185,129,0.2)); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes card-entrance {
          0% { opacity: 0; transform: translateY(24px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes count-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-glow-pulse-bar { animation: glow-pulse-bar 2.4s ease-in-out infinite; }
        .animate-card-entrance { animation: card-entrance 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-card-entrance-1 { animation: card-entrance 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .animate-card-entrance-2 { animation: card-entrance 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .animate-card-entrance-3 { animation: card-entrance 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .animate-count-pulse { animation: count-pulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function GlowRing({ gradient }) {
  const ringKey = gradient.includes('sky') ? 'glow-ring-sky'
    : gradient.includes('violet') ? 'glow-ring-violet'
    : gradient.includes('pink') ? 'glow-ring-pink'
    : gradient.includes('emerald') ? 'glow-ring-emerald'
    : 'glow-ring';
  return (
    <style>{`
      .hero-glow {
        animation: ${ringKey} 2.4s ease-in-out infinite;
      }
    `}</style>
  );
}

function DeliveryWindowBanner({ liveEtaWindow, status }) {
  if (!liveEtaWindow || status === 'delivered') return null;
  return (
    <div className="animate-card-entrance-1 mx-auto max-w-xs sm:max-w-sm mt-3">
      <div className="relative rounded-xl bg-gradient-to-br from-white/80 via-brand-500/5 to-pink-500/5 dark:from-ink-900/90 dark:via-ink-900/80 dark:to-ink-900/90 border border-brand-500/30 dark:border-brand-500/20 shadow-lg backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-sweep pointer-events-none" style={{ animation: 'shimmer-sweep 3s ease-in-out infinite' }} />
        <div className="relative flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white grid place-items-center text-sm shrink-0 shadow-md animate-count-pulse">
            ⏰
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Livraison estimée
            </div>
            <div className="font-display font-black text-base text-ink-900 dark:text-white tabular-nums tracking-tight">
              {liveEtaWindow.start} – {liveEtaWindow.end}
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

function CourierCard({ order, status }) {
  if (!order?.courierName || status === 'placed') return null;
  const c = STATUS_COLORS[status] || STATUS_COLORS.placed;
  return (
    <div className="animate-card-entrance-2 mx-3 sm:mx-5 mb-3">
      <div className="relative rounded-xl bg-gradient-to-br from-white/90 via-sky-50/50 to-white/90 dark:from-ink-800/90 dark:via-ink-800/80 dark:to-ink-800/90 border border-sky-200/70 dark:border-sky-800/40 shadow-sm backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-3 p-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white grid place-items-center shrink-0 shadow-md text-sm font-black">
              {order.courierName.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-ink-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Votre livreur</div>
            <div className="font-display font-black text-sm text-ink-900 dark:text-white truncate">{order.courierName}</div>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg ${c.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-ping`} />
            {status === 'delivering' ? 'En route' : 'Attribué'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ItemsSummary({ order, itemCount }) {
  if (!order?.items?.length) return null;
  return (
    <div className="animate-card-entrance-3 px-3 pb-3 sm:px-5">
      <div className="rounded-xl bg-white/70 dark:bg-ink-900/70 border border-ink-200/60 dark:border-ink-800/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="px-3 py-2.5 border-b border-ink-100 dark:border-ink-800/60 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-ink-400">
            Articles <span className="text-brand-500">({itemCount})</span>
          </span>
          <span className="text-[9px] font-bold text-ink-400">{order.items.length} plat{order.items.length > 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-ink-100/60 dark:divide-ink-800/40">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
              <span className="text-ink-700 dark:text-ink-300 font-medium truncate mr-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold text-[10px] mr-1.5">{it.qty}</span>
                {it.name}
              </span>
              <span className="font-bold text-ink-900 dark:text-white shrink-0 tabular-nums">
                {formatMad(it.price * (it.qty || 1))}
              </span>
            </div>
          ))}
        </div>
        <div className="px-3 py-2.5 border-t border-dashed border-ink-200 dark:border-ink-700 flex items-center justify-between bg-gradient-to-r from-brand-500/5 to-transparent">
          <span className="text-xs font-bold text-ink-700 dark:text-ink-300">Total</span>
          <span className="text-sm font-black text-brand-600 dark:text-brand-400 tabular-nums animate-count-pulse">
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
        <span className="flex items-center gap-1.5 text-ink-800 dark:text-white">
          <span className="text-base animate-bounce-horizontal">🛵</span>
          Suivi en direct
        </span>
        <span className={`flex items-center gap-1.5 ${gpsCalculated ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400'}`}>
          {gpsCalculated && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
          Étape {stepNum}/4
        </span>
      </div>

      <div className="relative h-3 rounded-full bg-ink-100 dark:bg-ink-800 p-0.5 shadow-inner overflow-hidden">
        <div
          className="h-full rounded-full animate-glow-pulse-bar relative"
          style={{
            width: `${displayedProgressPct}%`,
            background: 'linear-gradient(90deg, #f97316, #ec4899, #eab308, #10b981)',
            backgroundSize: '200% 100%',
            animation: 'snake-flow 2.2s ease-in-out infinite, glow-pulse-bar 2.4s ease-in-out infinite',
            transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent" style={{ animation: 'shimmer-sweep 2.5s ease-in-out infinite' }} />
          {status !== 'delivered' && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
              <span className="block w-3 h-3 rounded-full bg-white border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-ping" />
              <span className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
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
          <div className="text-[8px] font-black uppercase tracking-widest text-ink-400">Commande</div>
          <h2 className="font-display font-black text-sm sm:text-base text-ink-900 dark:text-white truncate tracking-tight">
            #{orderId || 'YH-XXXX'}
          </h2>
          {order?.restaurantName && (
            <p className="text-[11px] text-ink-500 dark:text-ink-400 font-semibold flex items-center gap-1 mt-0.5">
              <I.Chef size={11} className="text-brand-500 shrink-0" />
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
    <div className="text-center px-4 pt-8 sm:pt-12 animate-card-entrance">
      <div className="relative inline-block">
        <div className={`hero-glow w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-gradient-to-br ${hero.gradient} shadow-xl grid place-items-center transition-transform hover:scale-105 cursor-default relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-2xl" />
          <span className="relative text-3xl sm:text-4xl" role="img" aria-hidden>{hero.emoji}</span>
        </div>
        {status !== 'delivered' && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          </span>
        )}
        {status === 'delivered' && (
          <div className="absolute -inset-4 rounded-3xl border-2 border-emerald-400/30 animate-pulse" style={{ animation: 'glow-ring-emerald 2s ease-in-out infinite' }} />
        )}
      </div>
      <h1 className="mt-3 font-display font-black text-2xl sm:text-3xl tracking-tight text-ink-900 dark:text-white animate-text-glow-slow">
        {hero.title}
      </h1>
      <p className="mt-1 text-xs sm:text-sm text-ink-500 dark:text-ink-400 font-medium max-w-xs mx-auto leading-relaxed">
        {st.clientMsg}
      </p>
    </div>
  );
}

function ActionButtons({ onMyOrders, onHome }) {
  return (
    <div className="mt-5 flex flex-col sm:flex-row gap-2 px-3 sm:px-0 items-center justify-center animate-card-entrance-3">
      {onMyOrders && (
        <Button onClick={onMyOrders} variant="secondary" size="md" className="justify-center rounded-xl text-xs sm:text-sm btn-shimmer">
          Mes commandes
        </Button>
      )}
      <Button onClick={onHome} variant="primary" size="md" className="justify-center rounded-xl text-xs sm:text-sm btn-shimmer shadow-lg shadow-brand-500/20">
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
    if (status === 'delivered') { setSmoothOffset(0); return; }
    const timer = setInterval(() => setSmoothOffset((prev) => (prev < 4.5 ? prev + 0.15 : prev)), 2000);
    return () => clearInterval(timer);
  }, [status, stepNum]);

  const syncGps = useCallback(() => {
    if (!orderId) return;
    setCourierGps(getCourierGps(orderId));
  }, [orderId]);

  useEffect(() => {
    syncGps();
    const timer = setInterval(() => { setNowMs(Date.now()); syncGps(); }, 5000);
    window.addEventListener('yoha_courier_gps_updated', syncGps);
    return () => { clearInterval(timer); window.removeEventListener('yoha_courier_gps_updated', syncGps); };
  }, [syncGps]);

  const destInfo = useMemo(() => resolveDestinationCoords(order?.customerAddress || order?.address || order?.delivery_instructions || ''), [order]);

  const gpsCalculated = useMemo(() => {
    if (!courierGps || !courierGps.active || status === 'delivered') return null;
    const dist = calculateHaversineDistance(courierGps.lat, courierGps.lng, destInfo.lat, destInfo.lng);
    return { distanceKm: dist, travelMins: Math.max(2, Math.ceil((dist / 22) * 60 + 2)), pct: Math.min(98, Math.max(30, Math.round(100 - (dist / 3.2) * 65))) };
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
      if (bracketed) {
        keys.add('n:' + bracketed[1].trim().toLowerCase());
      } else if (dashed) {
        keys.add('n:' + dashed[1].trim().toLowerCase());
      } else {
        const rid = it.restaurantId || it.restaurantName?.trim().toLowerCase();
        if (rid) keys.add('r:' + rid);
      }
    }
    return Math.max(1, keys.size);
  }, [order]);
  const isMultiStore = storeCount > 1;

  const liveEtaWindow = useMemo(() => {
    if (status === 'delivered') return null;
    const baseTime = order?.createdAt ? new Date(order.createdAt).getTime() : Date.now();
    if (gpsCalculated) {
      const remainingMs = (gpsCalculated.travelMins + (isMultiStore ? 15 : 0)) * 60 * 1000;
      const arrivalTargetMs = nowMs + remainingMs;
      const fmt = (ms) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
      return { start: fmt(Math.max(nowMs, arrivalTargetMs - 3 * 60 * 1000)), end: fmt(arrivalTargetMs + 7 * 60 * 1000) };
    }
    const etaMin = isMultiStore ? 45 : 20, etaMax = isMultiStore ? 60 : 35;
    let startMs = baseTime + etaMin * 60 * 1000, endMs = baseTime + etaMax * 60 * 1000;
    while (nowMs > endMs - 2 * 60 * 1000 && status !== 'delivered') { startMs += 10 * 60 * 1000; endMs += 10 * 60 * 1000; }
    const fmt = (ms) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    return { start: fmt(startMs), end: fmt(endMs) };
  }, [order?.createdAt, status, nowMs, gpsCalculated, isMultiStore]);

  const restoInfo = useMemo(() => {
    if (!order) return null;
    return restaurants.find((r) => String(r.id) === String(order.restaurantId) || r.name === order.restaurantName);
  }, [order, restaurants]);

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
    <div className="page-enter relative min-h-screen bg-gradient-to-b from-white via-ink-50/30 to-white dark:from-ink-950 dark:via-ink-900/30 dark:to-ink-950">
      <FloatingParticles />
      <Confetti active={status !== 'delivered'} />
      <GlowRing gradient={hero.gradient} />

      <div className="max-w-lg mx-auto pb-28 sm:pb-12">
        {!notifPermitted && (
          <div className="animate-card-entrance mx-3 mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-200 dark:border-sky-800/40 backdrop-blur-sm">
            <span className="text-sm">🔔</span>
            <p className="text-[10px] font-semibold text-sky-800 dark:text-sky-200 flex-1">Activez les notifications pour suivre en temps réel.</p>
            <button onClick={async () => { const ok = await requestNotif(); if (ok) subscribeWebPush().catch(() => {}); }} className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 transition-all shadow-md shadow-sky-500/20">
              Activer
            </button>
          </div>
        )}

        <HeroSection hero={hero} status={status} st={st} />
        <DeliveryWindowBanner liveEtaWindow={liveEtaWindow} status={status} />

        <div className="mt-4 mx-3 sm:mx-0 rounded-2xl bg-white/80 dark:bg-ink-900/80 border border-ink-200/60 dark:border-ink-800/50 shadow-lg backdrop-blur-xl overflow-hidden animate-card-entrance-1">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-pink-500 to-emerald-500" />
          <OrderHeader orderId={orderId} order={order} status={status} />
          {status !== 'delivered' && (
            <ProgressBarSection
              status={status} stepNum={stepNum} displayedProgressPct={displayedProgressPct}
              gpsCalculated={gpsCalculated} destInfo={destInfo} courierName={order?.courierName}
            />
          )}
          <div className="px-2 sm:px-5 py-3">
            <OrderTrackingTimeline status={status} />
          </div>
          <CourierCard order={order} status={status} />
          <ItemsSummary order={order} itemCount={itemCount} />
        </div>

        <div className="mx-3 sm:mx-0 mt-3 animate-card-entrance-2">
          {order && <OrderRatingCard order={order} />}
        </div>

        <ActionButtons onMyOrders={onMyOrders} onHome={onHome} />
      </div>

      {!hasCartItems && (
        <div className="fixed bottom-0 inset-x-0 md:hidden z-40 p-3 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-xs rounded-2xl bg-white/95 dark:bg-ink-900/95 backdrop-blur-xl border border-ink-200/60 dark:border-ink-800/60 shadow-2xl shadow-brand-500/10 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🎉</span>
              <div>
                <div className="text-[10px] font-bold text-ink-400">Commande en cours</div>
                <div className="font-extrabold text-xs text-ink-900 dark:text-white">#{orderId?.slice(0, 8)}</div>
              </div>
            </div>
            <button onClick={onHome} className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white hover:from-brand-600 hover:to-pink-600 transition-all shadow-lg shadow-brand-500/30 btn-shimmer">
              Re-commander
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Confetti({ active = true }) {
  const pieces = useMemo(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2 + Math.random() * 2.5,
      color: ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][i % 8],
      rotate: Math.random() * 360,
      shape: i % 3,
      size: 4 + Math.random() * 8,
    })), []);
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
            width: p.size,
            height: p.shape === 0 ? p.size * 1.4 : p.size,
            background: p.color,
            borderRadius: p.shape === 2 ? '50%' : 2,
            transform: `rotate(${p.rotate}deg)`,
            opacity: 0.9,
            animation: `fall ${p.duration}s ${p.delay}s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
          }}
        />
      ))}
      <style>{`@keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 0.9; } 100% { transform: translateY(105vh) rotate(720deg); opacity: 0.2; } }`}</style>
    </div>
  );
}
