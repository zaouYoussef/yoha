'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { I } from '../icons/Icons.jsx';
import { ORDER_STATES, ORDER_STATUS_TOASTS } from '../data/orderConstants.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { useToast } from '../contexts/AppContexts.jsx';
import { Button } from '../components/ui/Button.jsx';
import { OrderTrackingTimeline, OrderStatusBadge } from '../components/ui/OrderStep.jsx';
import { formatMad } from '../data/index.js';

const HERO = {
  placed:           { title: 'Commande confirmée !', emoji: '🎉', gradient: 'from-amber-400 to-orange-500' },
  pickup_confirmed: { title: 'Livreur en route',     emoji: '🛵', gradient: 'from-sky-400 to-blue-500' },
  preparing:        { title: 'Commande prête',       emoji: '👨‍🍳', gradient: 'from-violet-400 to-purple-500' },
  delivering:       { title: 'En route vers vous',   emoji: '📦', gradient: 'from-pink-400 to-rose-500' },
  delivered:        { title: 'Commande livrée !',    emoji: '✅', gradient: 'from-emerald-400 to-teal-500' },
};

export function SuccessPage({ orderId, onHome, onMyOrders }) {
  const { orders, trackOrder } = useOrders();
  const { push: pushToast } = useToast();
  const order = orders.find((o) => o.id === orderId);
  const status = order?.status || 'placed';
  const hero = HERO[status] || HERO.placed;
  const st = ORDER_STATES[status] || ORDER_STATES.placed;
  const stepNum = st.step;
  const prevStatusRef = useRef(undefined);

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

  const etaText =
    status === 'delivered'
      ? null
      : order?.courierName && status !== 'placed'
        ? `${order.courierName} s'occupe de votre commande`
        : 'Arrivée estimée dans 15 à 22 min';

  const itemCount = order?.items?.reduce((s, i) => s + i.qty, 0) ?? 0;

  return (
    <div className="page-enter relative max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <Confetti active={status !== 'delivered'} />

      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div
            className={`relative grid place-items-center w-20 h-20 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-br ${hero.gradient} shadow-2xl transition-transform hover:scale-105`}
          >
            <span className="text-4xl sm:text-5xl" role="img" aria-hidden>{hero.emoji}</span>
            {status !== 'delivered' && (
              <span className="absolute -inset-2 rounded-3xl bg-gradient-to-br opacity-50 blur-lg -z-10 from-brand-500 via-pink-500 to-amber-500 animate-pulse" />
            )}
          </div>
          {status !== 'delivered' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
            </span>
          )}
        </div>

        <div>
          <h1 className="font-display font-black text-2xl sm:text-4xl tracking-tight text-ink-900 dark:text-white">
            {hero.title}
          </h1>
          <p className="mt-1.5 text-ink-600 dark:text-ink-300 text-sm sm:text-base max-w-md mx-auto font-medium">
            {st.clientMsg}
          </p>
        </div>

        {etaText && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-500/10 via-amber-500/10 to-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-extrabold shadow-xs">
            <span>⚡</span>
            <span>{etaText}</span>
          </div>
        )}
      </div>

      {/* Main Order Card */}
      <div className="mt-6 rounded-3xl bg-white dark:bg-ink-900 border border-ink-200/80 dark:border-ink-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-brand-500/10 via-pink-500/5 to-transparent border-b border-ink-100 dark:border-ink-800/60 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Commande Confirmée</span>
            <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900 dark:text-white truncate">
              #{orderId || 'YH-XXXX'}
            </h2>
            {order?.restaurantName && (
              <p className="text-xs text-ink-500 dark:text-ink-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <I.Chef size={14} className="text-brand-500 shrink-0" />
                <span className="truncate">{order.restaurantName}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <OrderStatusBadge status={status} />
            {status !== 'delivered' && (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Suivi Live
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-6 pt-5">
          <div className="flex justify-between text-xs font-bold text-ink-500 mb-2">
            <span>Progression</span>
            <span className="text-brand-600 dark:text-brand-400">{stepNum}/4</span>
          </div>
          <div className="h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-pink-500 to-emerald-500 transition-all duration-700 ease-out rounded-full shadow-xs"
              style={{ width: `${(stepNum / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Order Timeline */}
        <div className="px-2 sm:px-6 py-6">
          <OrderTrackingTimeline status={status} />
        </div>

        {/* Courier Badge */}
        {order?.courierName && status !== 'placed' && (
          <div className="mx-4 sm:mx-6 mb-4 p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <I.Bike size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300">Votre livreurYoHa</div>
              <div className="font-extrabold text-sm text-ink-900 dark:text-white truncate">{order.courierName}</div>
            </div>
          </div>
        )}

        {/* Items Summary & Totals */}
        {order?.items && order.items.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-slate-50/80 dark:bg-ink-950/60 border-t border-ink-100 dark:border-ink-800/60 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink-400 mb-1">Détails des articles ({itemCount})</div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-ink-700 dark:text-ink-200 truncate">
                    <strong className="text-brand-600 dark:text-brand-400 font-extrabold">{it.qty}×</strong> {it.name}
                  </span>
                  <span className="font-bold text-ink-900 dark:text-white shrink-0 ml-2">
                    {formatMad(it.price * (it.qty || 1))}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-dashed border-ink-200 dark:border-ink-800 flex items-center justify-between text-sm font-extrabold">
              <span className="text-ink-800 dark:text-ink-100">Total payé à la livraison (espèces)</span>
              <span className="text-base font-black text-brand-600 dark:text-brand-400">
                {formatMad(order.totalDh || order.total, { decimals: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        {onMyOrders && (
          <Button onClick={onMyOrders} variant="secondary" size="lg" className="justify-center rounded-2xl shadow-sm">
            <span>Mes commandes 📦</span>
          </Button>
        )}
        <Button onClick={onHome} variant="primary" size="lg" className="justify-center rounded-2xl shadow-md">
          <span>Commander autre chose 🚀</span>
        </Button>
      </div>
    </div>
  );
}

export function Confetti({ active = true }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.left}%`,
            width: p.shape === 1 ? 10 : 8,
            height: p.shape === 0 ? 14 : 8,
            background: p.color,
            borderRadius: p.shape === 2 ? '50%' : 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0.35; } }`}</style>
    </div>
  );
}
