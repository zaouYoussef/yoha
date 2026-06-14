'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { I } from '../icons/Icons.jsx';
import { MOCK_COURIER_GAIN_PER_DELIVERY_MAD, formatMad, isActiveOrderStatus } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { DashLayout, StatusPill } from './DashShared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { spotlightHandler } from '../utils/spotlight.js';
import { RecentOrdersTable } from './AdminPanel.jsx';
import { OrderRestaurantNotes } from '../components/ui/OrderRestaurantNotes.jsx';
import { CancelOrderButton, CancelPhaseBadge, OrderCancellationNote } from '../components/ui/CancelOrderButton.jsx';
import { ordersApi } from '../lib/api.js';

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

function parseAmount(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function buildOrderCopyText(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = items.map((item) => {
    const qty = item.qty || 1;
    const unit = parseAmount(item.price);
    const lineTotal = unit * qty;
    return `• ${qty}× ${item.name} — ${formatMad(lineTotal, { decimals: 2 })}`;
  });

  return [
    `🛵 Commande YouHa #${order.id}`,
    `Restaurant : ${order.restaurantName}`,
    `Client : ${order.customer?.name || '—'}`,
    `Adresse : ${order.customer?.address || '—'}`,
    order.customer?.phone ? `Tél : ${order.customer.phone}` : null,
    order.restaurantNotes?.trim()
      ? `Remarques restaurant : ${order.restaurantNotes.trim()}`
      : null,
    order.cancellationReason?.trim()
      ? `Annulation : ${order.cancellationReason.trim()}`
      : null,
    '',
    'Articles :',
    ...(lines.length ? lines : ['• (détail indisponible)']),
    '',
    `Total : ${formatMad(order.totalDh, { decimals: 2 })}`,
    '',
    '— YouHa Livraison',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function whatsAppDigits(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `212${digits.slice(1)}`;
  else if (!digits.startsWith('212') && digits.length === 9) digits = `212${digits}`;
  return digits;
}

function whatsAppUrl(phone, text) {
  const digits = whatsAppDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function OrderItemsDetail({ order, restaurantPhone }) {
  const [copied, setCopied] = useState(false);
  const items = Array.isArray(order.items) ? order.items : [];
  const waDigits = whatsAppDigits(restaurantPhone);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(buildOrderCopyText(order));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [order]);

  const handleWhatsApp = useCallback(() => {
    const text = buildOrderCopyText(order);
    const url = whatsAppUrl(restaurantPhone, text);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [order, restaurantPhone]);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-ink-200/70 bg-ink-50/80 dark:border-ink-700 dark:bg-ink-950/40">
      <div className="flex flex-col gap-2 border-b border-ink-200/60 bg-white/60 px-3 py-2.5 dark:border-ink-800 dark:bg-ink-900/40 sm:flex-row sm:items-center sm:justify-between sm:px-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <I.Receipt size={15} className="shrink-0 text-brand-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-600 dark:text-ink-300">
            Détail commande
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink-900 px-2.5 py-2 text-[11px] font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-ink-900 sm:py-1.5"
          >
            {copied ? <I.Check size={13} /> : <I.Copy size={13} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            disabled={!waDigits}
            title={waDigits ? `WhatsApp ${restaurantPhone}` : 'Numéro restaurant indisponible'}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
          >
            <I.Phone size={12} />
            <span className="truncate">WhatsApp</span>
          </button>
        </div>
      </div>

      <ul className="divide-y divide-ink-200/50 dark:divide-ink-800/80">
        {items.length === 0 ? (
          <li className="px-3.5 py-3 text-sm text-ink-500">Aucun article listé</li>
        ) : (
          items.map((item, idx) => {
            const qty = item.qty || 1;
            const unit = parseAmount(item.price);
            return (
              <li key={item.id || idx} className="px-3.5 py-2.5 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-brand-600 dark:text-brand-400">{qty}×</span>{' '}
                  <span className="font-semibold text-ink-900 dark:text-white">{item.name}</span>
                </div>
                <span className="shrink-0 font-semibold text-ink-600 dark:text-ink-300 tabular-nums">
                  {formatMad(unit * qty, { decimals: 2 })}
                </span>
              </li>
            );
          })
        )}
      </ul>

      {items.length > 0 && (
        <div className="px-3.5 py-2.5 flex justify-between items-center border-t border-ink-200/60 dark:border-ink-800 bg-white/40 dark:bg-ink-900/30 text-sm">
          <span className="font-semibold text-ink-500">Total commande</span>
          <span className="font-display font-extrabold text-brand-600 dark:text-brand-400">
            {formatMad(order.totalDh, { decimals: 2 })}
          </span>
        </div>
      )}

      <OrderRestaurantNotes notes={order.restaurantNotes} className="m-3 mt-0" title="Remarques client (restaurant)" />
    </div>
  );
}

export function DeliveryDashboard({ goto, dark, setDark }) {
  const [current, setCurrent] = useState('available');
  const { orders, couriers } = useOrders();
  const { user } = useAuth();
  const COURIER_ME = couriers.find((c) => c.userId === user?.id)
    || couriers[0]
    || { id: '0', name: user?.displayName || 'Livreur' };

  const titles = {
    available:'Commandes disponibles',
    mine:'Mes courses en cours',
    history:'Historique',
  };

  return (
    <DashLayout kind="delivery" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle={`Connecté en tant que ${COURIER_ME.name}`}>
      {current === 'available' && <DeliveryAvailable courier={COURIER_ME}/>}
      {current === 'mine'      && <DeliveryMine courier={COURIER_ME}/>}
      {current === 'history'   && <DeliveryHistory courier={COURIER_ME}/>}
    </DashLayout>
  );
}

export function DeliveryAvailable({ courier }) {
  const { orders, assignCourier } = useOrders();
  const available = orders.filter(
    (o) => !o.courierId && (o.status === 'placed' || o.status === 'preparing'),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-4 text-white shadow-glow-lg sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl sm:h-12 sm:w-12">🛵</span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-extrabold sm:text-xl">
            {available.length} commande{available.length > 1 ? 's' : ''} en attente
          </div>
          <div className="text-sm text-white/80">
            Confirmez en premier — la course est à vous. Les autres livreurs la verront disparaître.
          </div>
        </div>
      </div>

      {available.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800">
          <div className="text-6xl mb-4 animate-float-med">🍕</div>
          <h3 className="font-display font-bold text-xl">Pause bien méritée</h3>
          <p className="mt-1 text-ink-500">Aucune commande disponible pour l'instant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {available.map(o => (
            <DeliveryOrderCard key={o.id} order={o} action={
              <>
                {o.status === 'preparing' && (
                  <div className="mb-2 px-3 py-2 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-bold text-center">
                    📦 Déjà prête au restaurant — confirmez pour récupérer
                  </div>
                )}
                <Button onClick={() => assignCourier(o.id, courier)} variant="primary" size="lg" className="w-full justify-center">
                  ✅ Confirmer la course
                </Button>
              </>
            }/>
          ))}
        </div>
      )}
    </div>
  );
}

function CourierStatusButton({ orderId, nextStatus, label, className, updateOrderStatus }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch {
      /* toast géré dans AppProviders */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={busy}
      variant="primary"
      size="lg"
      className={className}
    >
      {busy ? 'Mise à jour…' : label}
    </Button>
  );
}

export function DeliveryMine({ courier }) {
  const { orders, updateOrderStatus, cancelOrder } = useOrders();
  const [sendingId, setSendingId] = useState(null);
  const mine = orders.filter(
    (o) => String(o.courierId) === String(courier.id) && isActiveOrderStatus(o.status),
  );

  const handleSendToRestaurant = async (orderId) => {
    setSendingId(orderId);
    try {
      await ordersApi.sendToRestaurant(orderId);
    } catch {
      /* toast géré dans AppProviders */
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {mine.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800">
          <div className="text-6xl mb-4 animate-wiggle">📍</div>
          <h3 className="font-display font-bold text-xl">Aucune course en cours</h3>
          <p className="mt-1 text-ink-500">Allez prendre une commande dans "Disponibles".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {mine.map(o => (
            <DeliveryOrderCard key={o.id} order={o} showMap action={
              <div className="space-y-2">
                {o.status === 'placed' && o.scheduledDeliveryAt ? (
                  <>
                    <div className="px-4 py-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-semibold flex items-center gap-2">
                      🕐 Commande programmée — envoyer au restaurant
                    </div>
                    <Button
                      onClick={() => handleSendToRestaurant(o.id)}
                      disabled={sendingId === o.id}
                      variant="primary"
                      size="lg"
                      className="w-full justify-center bg-gradient-to-r from-amber-500 to-orange-500"
                    >
                      {sendingId === o.id ? 'Envoi…' : '📤 Envoyer au restaurant'}
                    </Button>
                    <CancelOrderButton
                      phase="before_pickup"
                      onCancel={(reason) => cancelOrder(o.id, reason)}
                    />
                  </>
                ) : null}
                {(o.status === 'pickup_confirmed' || o.status === 'preparing') && (
                  <>
                    <div className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                      o.status === 'preparing'
                        ? 'bg-violet-500/10 text-violet-600'
                        : 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                    }`}>
                      {o.status === 'preparing'
                        ? <>📦 La commande vous attend au restaurant</>
                        : <><I.Bike size={16}/> Direction le restaurant…</>}
                    </div>
                    <CourierStatusButton
                      orderId={o.id}
                      nextStatus="delivering"
                      label="✅ J'ai récupéré la commande"
                      updateOrderStatus={updateOrderStatus}
                      className="w-full justify-center bg-gradient-to-r from-brand-500 to-pink-500"
                    />
                    <CancelOrderButton
                      phase="before_pickup"
                      onCancel={(reason) => cancelOrder(o.id, reason)}
                    />
                  </>
                )}
                {o.status === 'delivering' && (
                  <>
                    <div className="px-4 py-3 rounded-xl bg-pink-500/10 text-pink-600 text-sm font-semibold flex items-center gap-2">
                      <I.MapPin size={16}/> Livraison en cours vers le client
                    </div>
                    <CourierStatusButton
                      orderId={o.id}
                      nextStatus="delivered"
                      label="✅ Marquer comme livré"
                      updateOrderStatus={updateOrderStatus}
                      className="w-full justify-center bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
                    <CancelOrderButton
                      phase="after_pickup"
                      onCancel={(reason) => cancelOrder(o.id, reason)}
                    />
                  </>
                )}
              </div>
            }/>
          ))}
        </div>
      )}
    </div>
  );
}

function getTodayCourierStats(orders, gainMad) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = orders.filter((o) => {
    const d = new Date(o.createdAt || 0);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;
  return { count, totalMad: count * gainMad };
}

function CourierTodayGains({ count, totalMad }) {
  return (
    <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-teal-950/30 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Aujourd&apos;hui
          </div>
          <div className="font-display text-2xl font-extrabold text-emerald-600 sm:text-3xl">
            +{formatMad(totalMad, { decimals: 0 })}
          </div>
          <div className="mt-0.5 text-sm text-ink-500">
            {count} livraison{count > 1 ? 's' : ''}
          </div>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-2xl">💰</span>
      </div>
    </div>
  );
}

export function DeliveryHistory({ courier }) {
  const { orders } = useOrders();
  const gainMad = MOCK_COURIER_GAIN_PER_DELIVERY_MAD;

  const done = useMemo(
    () =>
      orders
        .filter(
          (o) => String(o.courierId) === String(courier.id)
            && (o.status === 'delivered' || o.status === 'cancelled'),
        )
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [orders, courier.id],
  );

  const deliveredOnly = useMemo(
    () => done.filter((o) => o.status === 'delivered'),
    [done],
  );

  const todayStats = useMemo(() => getTodayCourierStats(deliveredOnly, gainMad), [deliveredOnly, gainMad]);

  return (
    <div className="space-y-4">
      <CourierTodayGains count={todayStats.count} totalMad={todayStats.totalMad} />
      <RecentOrdersTable
        orders={done}
        title={`${done.length} course${done.length > 1 ? 's' : ''} terminée${done.length > 1 ? 's' : ''}`}
        gainMad={gainMad}
        hideCourier
        hideViewAll
        showCancellation
      />
    </div>
  );
}

export function DeliveryOrderCard({ order, action, showMap }) {
  const { restaurants } = useOrders();
  const restaurantPhone =
    order.restaurantPhone
    || restaurants.find((r) => r.id === order.restaurantId)?.phone
    || '';

  return (
    <div
      className="lift-on-hover spotlight overflow-hidden rounded-2xl border border-ink-200/60 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900"
      onMouseMove={spotlightHandler}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="break-anywhere font-display text-lg font-extrabold sm:text-xl">#{order.id}</div>
            <div className="truncate text-xs text-ink-500">{order.restaurantName}</div>
          </div>
          <StatusPill status={order.status} className="self-start" />
        </div>

        {showMap && (
          <div className="relative mt-4 h-28 overflow-hidden rounded-xl border border-ink-200/60 bg-gradient-to-br from-sky-100 to-indigo-100 dark:border-ink-800 dark:from-sky-900/40 dark:to-indigo-900/40 sm:h-32">
            <svg viewBox="0 0 300 120" className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="g1" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(100,116,139,.2)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="300" height="120" fill="url(#g1)"/>
              <path d="M 20 80 Q 90 30, 160 60 T 280 30" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="6 6"/>
              <circle cx="20" cy="80" r="6" fill="#ec4899"/>
              <text x="20" y="103" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ec4899">Resto</text>
              <circle cx="280" cy="30" r="6" fill="#10b981"/>
              <text x="280" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#10b981">Client</text>
              <g style={{ offsetPath:"path('M 20 80 Q 90 30, 160 60 T 280 30')", animation:'bike-go 3s ease-in-out infinite alternate' }}>
                <circle r="10" fill="white" stroke="#f97316" strokeWidth="2"/>
                <text textAnchor="middle" y="3" fontSize="10">🛵</text>
              </g>
            </svg>
          </div>
        )}

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-start gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-pink-500/10 text-pink-600">
              <I.Chef size={14} />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-ink-500">Récupérer</div>
              <div className="break-words font-semibold">{order.restaurantName}</div>
              {restaurantPhone && (
                <a
                  href={`tel:${restaurantPhone.replace(/\s/g, '')}`}
                  className="mt-0.5 flex items-center gap-1 text-xs text-ink-500 hover:text-brand-600"
                >
                  <I.Phone size={12} className="shrink-0 text-emerald-600" />
                  <span className="break-all">{restaurantPhone}</span>
                </a>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <I.MapPin size={14} />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-ink-500">Livrer à</div>
              <div className="break-words font-semibold">
                {order.customer?.name}
                {order.customer?.address ? ` · ${order.customer.address}` : ''}
              </div>
              {order.customer?.phone && (
                <a
                  href={`tel:${order.customer.phone.replace(/\s/g, '')}`}
                  className="mt-0.5 block break-all text-xs text-ink-500 hover:text-brand-600"
                >
                  {order.customer.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {order.scheduledDeliveryAt ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 px-4 py-3">
            <span className="text-lg">🕐</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Livraison programmée</div>
              <div className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {formatScheduledRange(order.scheduledDeliveryAt)}
              </div>
            </div>
          </div>
        ) : null}

        <OrderItemsDetail order={order} restaurantPhone={restaurantPhone} />

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-ink-200 pt-4 dark:border-ink-800">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Total</div>
            <div className="font-bold tabular-nums">{formatMad(order.totalDh, { decimals: 2 })}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Vous gagnez</div>
            <div className="font-bold text-emerald-600">+{MOCK_COURIER_GAIN_PER_DELIVERY_MAD} MAD</div>
          </div>
        </div>

        <div className="mt-4">{action}</div>
      </div>
    </div>
  );
}
