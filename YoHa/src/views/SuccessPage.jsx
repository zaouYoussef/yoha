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
    <div className="page-enter relative max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <Confetti active={status !== 'delivered'} />

      {/* Hero */}
      <div className="text-center">
        <div
          className={`relative inline-grid place-items-center w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-br ${hero.gradient} shadow-cardhover`}
        >
          <span className="text-4xl sm:text-5xl" role="img" aria-hidden>{hero.emoji}</span>
          {status !== 'delivered' && (
            <span className="absolute -inset-1 rounded-3xl bg-gradient-to-br opacity-40 blur-md -z-10 from-brand-500 to-pink-500 animate-pulse" />
          )}
        </div>
        <h1 className="mt-6 font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-ink-900 dark:text-white">
          {hero.title}
        </h1>
        <p className="mt-3 text-ink-600 dark:text-ink-300 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          {st.clientMsg}
        </p>
        {etaText && (
          <p className="mt-2 text-sm font-semibold text-brand-600 dark:text-brand-400">{etaText}</p>
        )}
      </div>

      {/* Carte suivi */}
      <div className="mt-8 rounded-3xl bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 shadow-card overflow-hidden">
        {/* En-tête commande */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-brand-500/8 via-pink-500/5 to-transparent border-b border-ink-100 dark:border-ink-800">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-400">Commande</div>
              <div className="font-display font-extrabold text-xl text-ink-900 dark:text-white truncate">
                #{orderId || 'YH-XXXX'}
              </div>
              {order?.restaurantName && (
                <div className="text-sm text-ink-500 mt-0.5 flex items-center gap-1.5">
                  <I.Chef size={14} className="shrink-0 text-brand-500" />
                  <span className="truncate">{order.restaurantName}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <OrderStatusBadge status={status} />
              {status !== 'delivered' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Suivi live
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barre progression */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="flex justify-between text-xs text-ink-500 mb-1.5">
            <span>Progression</span>
            <span className="font-bold text-ink-700 dark:text-ink-200">{stepNum}/4</span>
          </div>
          <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-pink-500 to-emerald-500 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${(stepNum / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="px-3 sm:px-6 py-5 sm:py-6">
          <OrderTrackingTimeline status={status} />
        </div>

        {/* Récap + livreur */}
        <div className="px-5 sm:px-6 py-4 bg-ink-50/80 dark:bg-ink-950/50 border-t border-ink-100 dark:border-ink-800 space-y-3">
          {order && (
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
              <span className="font-display font-extrabold text-brand-600">
                {formatMad(order.totalDh, { decimals: 2 })}
              </span>
            </div>
          )}
          {order?.courierName && status !== 'placed' && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white grid place-items-center shrink-0">
                <I.Bike size={18} />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400">Votre livreur</div>
                <div className="font-semibold text-ink-900 dark:text-white truncate">{order.courierName}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        {onMyOrders && (
          <Button onClick={onMyOrders} variant="ghost" size="lg" className="justify-center">
            Mes commandes <I.Receipt size={18} />
          </Button>
        )}
        <Button onClick={onHome} variant="primary" size="lg" className="justify-center">
          Commander autre chose <I.Right size={18} />
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
