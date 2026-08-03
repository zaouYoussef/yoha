'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { I } from '../icons/Icons.jsx';
import { MOCK_COURIER_GAIN_PER_DELIVERY_MAD, formatMad, isActiveOrderStatus } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  DashLayout,
  GlassCard,
  GradientHeader,
  EmptyState,
  StatCard,
  StatusPill,
  FilterChip,
  ActionButton,
  SectionHeader,
  RecentOrdersTable,
} from './DashShared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { RecentOrdersTable as AdminRecentOrdersTable } from './AdminPanel.jsx';
import { OrderRestaurantNotes } from '../components/ui/OrderRestaurantNotes.jsx';
import { CancelOrderButton, CancelPhaseBadge, OrderCancellationNote } from '../components/ui/CancelOrderButton.jsx';
import { ordersApi, getTokens } from '../lib/api.js';
import { updateCourierGps, clearCourierGps } from '../utils/courierGps.js';

function isOrderAssignedToCourier(order, courier) {
  if (!order || !courier) return false;
  const cId = String(courier.id || '').toLowerCase();
  const cName = (courier.name || courier.username || courier.displayName || '').toLowerCase();
  const cEmail = (courier.email || '').toLowerCase();

  const oCourierId = String(order.courierId || '').toLowerCase();
  const oCourierName = (order.courierName || '').toLowerCase();

  if (cId && oCourierId && oCourierId === cId) return true;
  if (cName && oCourierName && (oCourierName === cName || oCourierName.includes(cName) || cName.includes(oCourierName))) return true;
  if (cId && oCourierName && (oCourierName === cId || oCourierName.includes(cId))) return true;
  if (cEmail && (oCourierId === cEmail || oCourierName.includes(cEmail.split('@')[0]))) return true;

  return false;
}

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
    const opts = Array.isArray(item.options)
      ? item.options.map((o) => (typeof o === 'string' ? o : o?.name)).filter(Boolean)
      : [];
    const optSuffix = opts.length ? ` (${opts.join(' · ')})` : '';
    return `• ${qty}× ${item.name}${optSuffix} — ${formatMad(lineTotal, { decimals: 2 })}`;
  });

  return [
    `🛵 Commande YoHa #${order.id}`,
    `Restaurant : ${order.restaurantName}`,
    order.restaurantPhone ? `Tél restaurant : ${order.restaurantPhone}` : null,
    `Client : ${order.customer?.name || '—'}`,
    `Adresse : ${order.customer?.address || '—'}`,
    order.customer?.phone ? `Tél client : ${order.customer.phone}` : null,
    order.restaurantNotes?.trim()
      ? `Remarques restaurant : ${order.restaurantNotes.trim()}`
      : null,
    order.cancellationReason?.trim()
      ? `Annulation : ${order.cancellationReason.trim()}`
      : null,
    order.ordonnanceUrl ? '📎 Ordonnance jointe (à montrer à la pharmacie)' : null,
    '',
    'Articles :',
    ...(lines.length ? lines : ['• (détail indisponible)']),
    '',
    `Total : ${formatMad(order.totalDh, { decimals: 2 })}`,
    '',
    '— YoHa Livraison',
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

function buildMapsDirectionsUrl(address) {
  if (!address) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

function useDeliveryTimer(assignedAt) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!assignedAt) return;
    const update = () => {
      const diff = Date.now() - new Date(assignedAt).getTime();
      if (diff < 0) { setElapsed('0 min'); return; }
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      if (hrs > 0) setElapsed(`${hrs}h ${rem}min`);
      else setElapsed(`${mins} min`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [assignedAt]);
  return elapsed;
}

const DELIVERY_STEPS = [
  { key: 'placed', label: 'Assignée', icon: <I.Bell size={12} /> },
  { key: 'preparing', label: 'En préparation', icon: <I.Chef size={12} /> },
  { key: 'pickup_confirmed', label: 'Récupérée', icon: <I.Bike size={12} /> },
  { key: 'delivering', label: 'En livraison', icon: <I.MapPin size={12} /> },
  { key: 'delivered', label: 'Livrée', icon: <I.Check size={12} /> },
];

function DeliveryTimeline({ currentStatus }) {
  const activeIdx = DELIVERY_STEPS.findIndex((s) => s.key === currentStatus);
  const effectiveIdx = activeIdx >= 0 ? activeIdx : 0;

  return (
    <div className="flex items-center gap-0 w-full">
      {DELIVERY_STEPS.map((step, i) => {
        const done = i <= effectiveIdx;
        const isCurrent = i === effectiveIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all sm:h-7 sm:w-7 ${
                  done
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'bg-ink-200/60 text-ink-400 dark:bg-ink-700/50 dark:text-ink-500'
                } ${isCurrent ? 'ring-2 ring-emerald-400/40 ring-offset-1 dark:ring-offset-ink-900' : ''}`}
              >
                {done ? <I.Check size={10} /> : i + 1}
              </div>
              <span
                className={`hidden text-[9px] font-bold sm:block ${
                  done ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < DELIVERY_STEPS.length - 1 && (
              <div
                className={`mx-0.5 h-0.5 flex-1 rounded-full sm:mx-1 ${
                  i < effectiveIdx
                    ? 'bg-emerald-500'
                    : 'bg-ink-200/60 dark:bg-ink-700/50'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DeliveryTimerBadge({ assignedAt }) {
  const elapsed = useDeliveryTimer(assignedAt);
  if (!assignedAt) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
      <I.Clock size={10} />
      {elapsed}
    </span>
  );
}

function OrdonnanceCard({ url }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <>
      <div className="m-4 mt-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm">🩺</span>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-600 dark:text-ink-300">
            Ordonnance du client
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-50 text-left transition hover:border-brand-500 dark:border-ink-700 dark:bg-ink-900"
        >
          <img
            src={url}
            alt="Ordonnance"
            className="max-h-56 w-full object-cover object-top"
          />
          <span className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-brand-600 dark:text-brand-400">
            🔍 Agrandir l’ordonnance (à montrer à la pharmacie)
          </span>
        </button>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img src={url} alt="Ordonnance" className="h-auto w-full rounded-xl shadow-2xl" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 grid h-9 w-9 place-items-center rounded-full bg-white font-bold text-ink-900 shadow-lg"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function OrderItemsDetail({ order, restaurantPhone }) {
  const [copied, setCopied] = useState(false);
  const items = Array.isArray(order.items) ? order.items : [];
  const waDigits = whatsAppDigits(restaurantPhone);
  const phoneHref = restaurantPhone ? `tel:${String(restaurantPhone).replace(/\s/g, '')}` : null;

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
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl dark:border-ink-700/30 dark:bg-ink-900/70">
      <div className="flex flex-col gap-2 border-b border-ink-200/60 bg-white/60 px-3 py-2.5 dark:border-ink-800 dark:bg-ink-900/40 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <I.Receipt size={15} className="shrink-0 text-brand-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-600 dark:text-ink-300">
            Détail commande
          </span>
          <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-black text-brand-600 dark:text-brand-400">
            {items.reduce((s, i) => s + (i.qty || 1), 0)} art.
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2 text-[11px] font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-ink-900 sm:py-1.5"
          >
            {copied ? <I.Check size={13} /> : <I.Copy size={13} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            disabled={!waDigits}
            title={waDigits ? `WhatsApp ${restaurantPhone}` : 'Numéro restaurant indisponible'}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
          >
            <I.Phone size={12} />
            <span className="truncate">WhatsApp resto</span>
          </button>
        </div>
      </div>

      {phoneHref ? (
        <a
          href={phoneHref}
          className="flex items-center justify-between gap-3 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-3 transition hover:bg-emerald-500/15"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Sonner au restaurant
            </div>
            <div className="truncate text-sm font-bold text-ink-900 dark:text-white">{restaurantPhone}</div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black text-white shadow-sm">
            <I.Phone size={13} />
            Appeler
          </span>
        </a>
      ) : (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
          Numéro du restaurant indisponible — demandez-le à l&apos;accueil YoHa si besoin.
        </div>
      )}

      <ul className="divide-y divide-ink-200/50 dark:divide-ink-800/80">
        {items.length === 0 ? (
          <li className="px-4 py-3 text-sm text-ink-500">Aucun article listé</li>
        ) : (
          items.map((item, idx) => {
            const qty = item.qty || 1;
            const unit = parseAmount(item.price);
            const opts = Array.isArray(item.options)
              ? item.options.map((o) => (typeof o === 'string' ? o : o?.name)).filter(Boolean)
              : [];
            return (
              <li key={item.id || idx} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{qty}×</span>{' '}
                    <span className="font-semibold text-ink-900 dark:text-white">{item.name}</span>
                  </div>
                  {opts.length > 0 && (
                    <div className="mt-1 text-[11px] font-semibold leading-snug text-ink-500 dark:text-ink-400">
                      Options : {opts.join(' · ')}
                    </div>
                  )}
                </div>
                <span className="shrink-0 font-semibold text-ink-600 tabular-nums dark:text-ink-300">
                  {formatMad(unit * qty, { decimals: 2 })}
                </span>
              </li>
            );
          })
        )}
      </ul>

      {items.length > 0 && (
        <div className="flex items-center justify-between border-t border-ink-200/60 bg-white/40 px-4 py-2.5 text-sm dark:border-ink-800 dark:bg-ink-900/30">
          <span className="font-semibold text-ink-500">Total commande</span>
          <span className="font-display font-extrabold text-brand-600 dark:text-brand-400">
            {formatMad(order.totalDh, { decimals: 2 })}
          </span>
        </div>
      )}

      <OrderRestaurantNotes notes={order.restaurantNotes} className="m-4 mt-0" title="Remarques client (restaurant)" />
      <OrdonnanceCard url={order.ordonnanceUrl} />
    </div>
  );
}

function OrderActionButtons({ order }) {
  const [copied, setCopied] = useState(false);
  const phone = order.customer?.phone;

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(buildOrderCopyText(order));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [order]);

  const handleWhatsAppCustomer = useCallback(() => {
    const text = buildOrderCopyText(order);
    const url = whatsAppUrl(phone, text);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [order, phone]);

  const mapsUrl = buildMapsDirectionsUrl(order.customer?.address);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-bold text-violet-600 transition hover:bg-violet-500/20 dark:text-violet-400"
        >
          <I.MapPin size={11} />
          Itinéraire
        </a>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-lg bg-ink-900/5 px-2.5 py-1.5 text-[10px] font-bold text-ink-600 transition hover:bg-ink-900/10 dark:text-ink-400"
      >
        {copied ? <I.Check size={10} /> : <I.Copy size={10} />}
        {copied ? 'Copié' : 'Copier'}
      </button>
      {phone && (
        <button
          type="button"
          onClick={handleWhatsAppCustomer}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-400"
        >
          <I.Phone size={10} />
          WhatsApp
        </button>
      )}
      {phone && (
        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-bold text-violet-600 transition hover:bg-violet-500/20 dark:text-violet-400"
        >
          <I.Phone size={10} />
          Appeler
        </a>
      )}
    </div>
  );
}

function useCourierAutoGps(courier, orders) {
  const [gpsState, setGpsState] = useState({
    active: false,
    denied: false,
    coords: null,
  });

  const trackingOrders = useMemo(
    () =>
      (orders || []).filter(
        (o) =>
          isOrderAssignedToCourier(o, courier) &&
          o.status !== 'delivered' &&
          o.status !== 'cancelled' &&
          // Dès confirmation livreur jusqu'à livraison
          ['pickup_confirmed', 'preparing', 'delivering', 'placed'].includes(o.status),
      ),
    [orders, courier],
  );

  const syncGpsRemote = useCallback((o, lat, lng) => {
    ordersApi.updateLocation(o.id, lat, lng).catch(() => {});
  }, []);

  const handlePosition = useCallback((pos) => {
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setGpsState({ active: true, denied: false, coords });

    if (trackingOrders.length > 0) {
      trackingOrders.forEach((o) => {
        updateCourierGps(o.id, coords.lat, coords.lng, true);
        syncGpsRemote(o, coords.lat, coords.lng);
      });
    }
  }, [trackingOrders, syncGpsRemote]);

  const requestGps = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    if (trackingOrders.length === 0) return;

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      (err) => {
        console.warn('High accuracy mobile GPS failed, trying standard accuracy:', err);
        navigator.geolocation.getCurrentPosition(
          handlePosition,
          (err2) => {
            console.warn('Standard mobile GPS failed:', err2);
            if (err2?.code === 1) {
              setGpsState((prev) => ({ ...prev, denied: true }));
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 },
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }, [handlePosition, trackingOrders.length]);

  // Arrêt propre quand plus aucune course active
  useEffect(() => {
    const finished = (orders || []).filter(
      (o) =>
        isOrderAssignedToCourier(o, courier) &&
        (o.status === 'delivered' || o.status === 'cancelled'),
    );
    finished.forEach((o) => clearCourierGps(o.id));
  }, [orders, courier]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    if (trackingOrders.length === 0) {
      setGpsState((prev) => ({ ...prev, active: false, coords: null }));
      return undefined;
    }

    requestGps();

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        if (err?.code === 1) {
          setGpsState((prev) => ({ ...prev, denied: true }));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );

    const interval = setInterval(requestGps, 8000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [requestGps, handlePosition, trackingOrders.length]);

  return { ...gpsState, requestGps, trackingCount: trackingOrders.length };
}

export function DeliveryDashboard({ goto, dark, setDark }) {
  const [current, setCurrent] = useState('available');
  const { orders, couriers } = useOrders();
  const { user } = useAuth();
  const COURIER_ME =
    couriers.find((c) => c.userId === user?.id) ||
    couriers[0] ||
    { id: '0', name: user?.displayName || 'Livreur' };

  const { active: gpsActive, coords: gpsCoords, denied: gpsDenied, requestGps, trackingCount } = useCourierAutoGps(COURIER_ME, orders);

  const titles = {
    available: 'Commandes disponibles',
    mine: 'Mes courses en cours',
    history: 'Historique',
  };

  return (
    <DashLayout kind="delivery" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle={`Connecté en tant que ${COURIER_ME.name}`}>

      {/* Mobile-Friendly Active GPS Tracker Bar */}
      {trackingCount > 0 && (
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-sm flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gpsCoords ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${gpsCoords ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div>
            <div className="font-extrabold text-xs text-ink-900 dark:text-white flex items-center gap-2">
              <span>📍 Géolocalisation Mobile Live</span>
              {gpsCoords ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  Signal GPS actif ({gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)})
                </span>
              ) : gpsDenied ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30">
                  Permission GPS refusée sur le téléphone
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                  Recherche du signal GPS...
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-500 dark:text-ink-400 font-medium">
              Position transmise en direct dès confirmation — arrêt automatique à la livraison.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={requestGps}
          className="px-3.5 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-extrabold text-xs transition-all border border-brand-500/30 flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>📡 Activer / Réactualiser GPS</span>
        </button>
      </div>
      )}

      {current === 'available' && <DeliveryAvailable courier={COURIER_ME} />}
      {current === 'mine' && <DeliveryMine courier={COURIER_ME} />}
      {current === 'history' && <DeliveryHistory courier={COURIER_ME} />}
    </DashLayout>
  );
}

/* ═══════════════════════════════════════════════════
   AVAILABLE ORDERS
   ═══════════════════════════════════════════════════ */
export function DeliveryAvailable({ courier }) {
  const { orders, assignCourier, refreshOrders, cancelOrder } = useOrders();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const isDemo = !!(user && !getTokens()?.access);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
    } catch {}
    setRefreshing(false);
  }, [refreshOrders]);

  const available = orders.filter(
    (o) =>
      (!o.courierId || o.courierId === '0' || o.courierId === 'null' || o.courierId === null) &&
      o.status !== 'delivered' &&
      o.status !== 'cancelled' &&
      o.status !== 'COMPLETED' &&
      o.status !== 'LIVRÉ' &&
      o.status !== 'delivered_client',
  );

  useEffect(() => {
    handleRefresh();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      import('@/lib/webPush').then(({ subscribeWebPush }) => subscribeWebPush().catch(() => {}));
    }
  }, []);

  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const playProBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  const requestNotif = async () => {
    if (typeof window === 'undefined') return;
    playProBeep();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '');
    const isStandalone = window.navigator?.standalone === true;
    console.log('[Notif] requestNotif isIOS=%s standalone=%s', isIOS, isStandalone);
    if (!('Notification' in window) || typeof Notification.requestPermission !== 'function') {
      if (isIOS && !isStandalone) {
        alert('Sur iPhone, utilisez Safari et ajoutez YoHa à l\'écran d\'accueil (Partager → Sur l\'écran d\'accueil). Ouvrez-le depuis l\'écran d\'accueil pour activer les notifications.');
      } else if (isIOS) {
        alert('Les notifications push nécessitent iOS 16.4+ et l\'ouverture depuis l\'écran d\'accueil avec Safari.');
      } else {
        alert('Les notifications ne sont pas supportées sur ce navigateur.');
      }
      return;
    }
    try {
      const res = await Notification.requestPermission();
      console.log('[Notif] Permission result:', res);
      if (res === 'granted') {
        setNotifGranted(true);
        try {
          new Notification('YoHa', {
            body: 'Notifications activées !',
            icon: '/logo.png',
          });
        } catch {}
        // Abonnement Web Push
        try {
          const { subscribeWebPush } = await import('@/lib/webPush');
          const ok = await subscribeWebPush();
          if (!ok) throw new Error('Échec abonnement push (jeton ou SW)');
          console.log('[Notif] Web push subscribed successfully');
        } catch (e) {
          console.error('[Notif] Subscribe error:', e);
          var msg = 'Notifications activées, mais l\'abonnement push navigateur a échoué : ' + (e.message || 'erreur') + '.';
          if (isIOS && isStandalone) {
            msg += ' Sur iPhone, vérifiez iOS 16.4+ et ouvrez depuis l\'écran d\'accueil.';
          }
          alert(msg + ' Les notifications ne marcheront pas en arrière-plan.');
        }
      } else if (res === 'denied') {
        alert('Notifications bloquées. Activez-les dans les réglages de votre iPhone.');
      }
    } catch (e) {
      console.error('[Notif] requestNotif error:', e);
      if (isIOS) {
        alert('Bip activé. Pour les notifications, utilisez Safari depuis l\'écran d\'accueil (iOS 16.4+).');
      } else {
        alert('Impossible d\'activer les notifications : ' + (e.message || ''));
      }
    }
  };

  return (
    <div className="space-y-5">
      {isDemo && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg border border-orange-400/40">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-extrabold text-sm text-white">Mode démo — données non actualisées</p>
              <p className="text-xs text-amber-100 font-medium">
                Connectez-vous avec un compte livreur réel (<strong>livreur@yoha.ma</strong>) pour voir les commandes en direct.
              </p>
            </div>
          </div>
          <a
            href="/auth"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer text-center"
          >
            Connexion →
          </a>
        </div>
      )}
      {/* Notification Banner */}
      {!notifGranted && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg border border-violet-400/40">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl animate-bounce">🔔</span>
            <div>
              <p className="font-extrabold text-sm text-white">Activer les alertes sonores & notifications Chrome</p>
              <p className="text-xs text-violet-100 font-medium">Recevez des vibrations et bips en direct sur votre téléphone sans rafraîchir la page !</p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestNotif}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            Activer 🚀
          </button>
        </div>
      )}

      <GradientHeader
        title={`${available.length} commande${available.length > 1 ? 's' : ''} en attente`}
        subtitle="Confirmez en premier — la course est à vous. Les autres livreurs la verront disparaître."
        icon="🛵"
        gradient="from-violet-500 via-fuchsia-500 to-pink-500"
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-50"
          >
            <I.Refresh size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? '…' : 'Rafraîchir'}
          </button>
        }
      >
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Disponibles</div>
            <div className="font-display text-xl font-extrabold">{available.length}</div>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Prêtes</div>
            <div className="font-display text-xl font-extrabold">
              {available.filter((o) => o.status === 'preparing').length}
            </div>
          </div>
          <div className="hidden rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm sm:block">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Programmées</div>
            <div className="font-display text-xl font-extrabold">
              {available.filter((o) => o.scheduledDeliveryAt).length}
            </div>
          </div>
        </div>
      </GradientHeader>

      {available.length === 0 ? (
        <EmptyState
          icon="🍕"
          title="Pause bien méritée"
          description="Aucune commande disponible pour l'instant. Revenez dans quelques instants."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {available.map((o) => (
            <DeliveryOrderCard
              key={o.id}
              order={o}
              variant="available"
              action={
                <>
                  {o.status === 'preparing' && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-violet-500/10 px-3 py-2.5 text-xs font-bold text-violet-700 dark:text-violet-300">
                      <I.Chef size={14} />
                      Déjà prête au restaurant — confirmez pour récupérer
                    </div>
                  )}
                  <OrderActionButtons order={o} />
                  <ActionButton
                    onClick={() => assignCourier(o.id, courier)}
                    variant="success"
                    size="lg"
                    icon={<I.Check size={16} />}
                    className="mt-3 w-full justify-center"
                  >
                    Confirmer la course
                  </ActionButton>
                  <CancelOrderButton
                    phase="before_pickup"
                    onCancel={(reason) => cancelOrder(o.id, reason || 'Client injoignable après plusieurs appels du livreur')}
                    label="Annuler la commande (Client injoignable)"
                    variant="ghost"
                    className="mt-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold"
                  />
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVE DELIVERIES (Mine)
   ═══════════════════════════════════════════════════ */
function CourierStatusButton({ orderId, nextStatus, label, className, updateOrderStatus, icon }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateOrderStatus(orderId, nextStatus);
      if (nextStatus === 'delivered' || nextStatus === 'cancelled') {
        clearCourierGps(orderId);
      }
    } catch {
      /* toast géré dans AppProviders */
    } finally {
      setBusy(false);
    }
  };

  return (
    <ActionButton
      onClick={handleClick}
      disabled={busy}
      variant="success"
      size="lg"
      icon={icon}
      className={`w-full justify-center ${className || ''}`}
    >
      {busy ? 'Mise à jour…' : label}
    </ActionButton>
  );
}

export function DeliveryMine({ courier }) {
  const { orders, updateOrderStatus, cancelOrder } = useOrders();
  const [sendingId, setSendingId] = useState(null);
  const mine = orders.filter(
    (o) => isOrderAssignedToCourier(o, courier) && isActiveOrderStatus(o.status),
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

  const activeCount = mine.filter((o) => o.status !== 'placed').length;

  return (
    <div className="space-y-5">
      <GradientHeader
        title={`${mine.length} course${mine.length > 1 ? 's' : ''} en cours`}
        subtitle={activeCount > 0 ? `${activeCount} en livraison active` : 'En attente de progression'}
        icon="📍"
        gradient="from-violet-500 via-fuchsia-500 to-pink-500"
      >
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Assignées</div>
            <div className="font-display text-xl font-extrabold">{mine.length}</div>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">En livraison</div>
            <div className="font-display text-xl font-extrabold">{activeCount}</div>
          </div>
          <div className="hidden rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm sm:block">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Gain potentiel</div>
            <div className="font-display text-xl font-extrabold">+{mine.length * MOCK_COURIER_GAIN_PER_DELIVERY_MAD} MAD</div>
          </div>
        </div>
      </GradientHeader>

      {mine.length === 0 ? (
        <EmptyState
          icon="📍"
          title="Aucune course en cours"
          description="Allez prendre une commande dans « Disponibles »."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {mine.map((o) => (
            <DeliveryOrderCard
              key={o.id}
              order={o}
              showMap
              variant="active"
              action={
                <div className="space-y-3">
                  <DeliveryTimeline currentStatus={o.status} />

                  {o.status === 'placed' && o.scheduledDeliveryAt ? (
                    <>
                      <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
                        <I.Clock size={16} />
                        Commande programmée — envoyer au restaurant
                      </div>
                      <OrderActionButtons order={o} />
                      <ActionButton
                        onClick={() => handleSendToRestaurant(o.id)}
                        disabled={sendingId === o.id}
                        variant="warning"
                        size="lg"
                        icon={sendingId === o.id ? null : <I.Bell size={16} />}
                        className="w-full justify-center"
                      >
                        {sendingId === o.id ? 'Envoi…' : 'Envoyer au restaurant'}
                      </ActionButton>
                      <CancelOrderButton
                        phase="before_pickup"
                        onCancel={(reason) => cancelOrder(o.id, reason)}
                      />
                    </>
                  ) : null}

                  {(o.status === 'pickup_confirmed' || o.status === 'preparing') && (
                    <>
                      <div
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                          o.status === 'preparing'
                            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                            : 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
                        }`}
                      >
                        {o.status === 'preparing' ? (
                          <>
                            <I.Chef size={16} /> La commande vous attend au restaurant
                          </>
                        ) : (
                          <>
                            <I.Bike size={16} /> Direction le restaurant…
                          </>
                        )}
                      </div>
                      <OrderActionButtons order={o} />
                      <CourierStatusButton
                        orderId={o.id}
                        nextStatus="delivering"
                        label="J'ai récupéré la commande"
                        icon={<I.Check size={16} />}
                        updateOrderStatus={updateOrderStatus}
                      />
                      <CancelOrderButton
                        phase="before_pickup"
                        onCancel={(reason) => cancelOrder(o.id, reason)}
                      />
                    </>
                  )}

                  {o.status === 'delivering' && (
                    <>
                      <div className="flex items-center gap-2 rounded-xl bg-pink-500/10 px-3 py-2.5 text-sm font-semibold text-pink-600 dark:text-pink-400">
                        <I.MapPin size={16} /> Livraison en cours vers le client
                      </div>
                      {o.customer?.address && (
                        <a
                          href={buildMapsDirectionsUrl(o.customer.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl bg-violet-500/10 px-3 py-2.5 text-sm font-bold text-violet-600 transition hover:bg-violet-500/20 dark:text-violet-400"
                        >
                          <I.MapPin size={16} />
                          Ouvrir dans Google Maps
                        </a>
                      )}
                      <CourierGpsTrackerToggle orderId={o.id} />
                      <OrderActionButtons order={o} />
                      <CourierStatusButton
                        orderId={o.id}
                        nextStatus="delivered"
                        label="Marquer comme livré"
                        icon={<I.Check size={16} />}
                        updateOrderStatus={updateOrderStatus}
                      />
                      <CancelOrderButton
                        phase="after_pickup"
                        onCancel={(reason) => cancelOrder(o.id, reason)}
                      />
                    </>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourierGpsTrackerToggle({ orderId }) {
  const [active, setActive] = useState(false);

  const toggleGps = () => {
    if (active) {
      updateCourierGps(orderId, 0, 0, false);
      setActive(false);
    } else {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude, lng = pos.coords.longitude;
            updateCourierGps(orderId, lat, lng, true);
            ordersApi.updateLocation(orderId, lat, lng).catch(() => {});
            setActive(true);
          },
          () => {
            updateCourierGps(orderId, 35.68500, -5.92300, true);
            setActive(true);
          },
          { enableHighAccuracy: true }
        );
      } else {
        updateCourierGps(orderId, 35.68500, -5.92300, true);
        setActive(true);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleGps}
      className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
        active
          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100'
      }`}
    >
      <span className={active ? 'animate-pulse' : ''}>{active ? '🟢' : '📡'}</span>
      <span>{active ? 'GPS Live Activé (Position transmise au client)' : 'Activer le GPS Live pour le client'}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   HISTORY
   ═══════════════════════════════════════════════════ */
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

function getWeekStats(orders, gainMad) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const thisWeek = orders.filter((o) => {
    const d = new Date(o.createdAt || 0);
    return d >= weekStart && o.status === 'delivered';
  });

  const byDay = {};
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  for (let i = 0; i <= 6; i++) {
    const dt = new Date(weekStart);
    dt.setDate(weekStart.getDate() + i);
    const key = dt.toDateString();
    byDay[key] = { count: 0, day: dayNames[dt.getDay()] };
  }
  thisWeek.forEach((o) => {
    const d = new Date(o.createdAt || 0);
    const key = d.toDateString();
    if (byDay[key]) byDay[key].count++;
  });

  return {
    count: thisWeek.length,
    totalMad: thisWeek.length * gainMad,
    days: Object.values(byDay),
  };
}

function getMonthStats(orders, gainMad) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const delivered = orders.filter((o) => {
    const d = new Date(o.createdAt || 0);
    return d >= monthStart && o.status === 'delivered';
  });
  return {
    count: delivered.length,
    totalMad: delivered.length * gainMad,
  };
}

function WeekMiniChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="flex items-end gap-1 h-12">
      {days.map((d, i) => {
        const pct = max > 0 ? (d.count / max) * 100 : 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
            <div className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-teal-400 transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
            <span className="text-[8px] font-bold text-ink-400">{d.day}</span>
          </div>
        );
      })}
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
          (o) =>
            isOrderAssignedToCourier(o, courier) &&
            (o.status === 'delivered' || o.status === 'cancelled'),
        )
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [orders, courier],
  );

  const deliveredOnly = useMemo(
    () => done.filter((o) => o.status === 'delivered'),
    [done],
  );

  const todayStats = useMemo(() => getTodayCourierStats(deliveredOnly, gainMad), [deliveredOnly, gainMad]);
  const weekStats = useMemo(() => getWeekStats(deliveredOnly, gainMad), [deliveredOnly, gainMad]);
  const monthStats = useMemo(() => getMonthStats(deliveredOnly, gainMad), [deliveredOnly, gainMad]);

  const avgPerDay = weekStats.days.length > 0
    ? (weekStats.count / 7).toFixed(1)
    : '0';

  return (
    <div className="space-y-5">
      <GradientHeader
        title="Historique des livraisons"
        subtitle={`Total : ${deliveredOnly.length} livraison${deliveredOnly.length > 1 ? 's' : ''} effectuée${deliveredOnly.length > 1 ? 's' : ''}`}
        icon="📊"
        gradient="from-emerald-500 via-green-500 to-brand-500"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Aujourd'hui"
          value={`+${formatMad(todayStats.totalMad, { decimals: 0 })}`}
          sub={`${todayStats.count} livraison${todayStats.count > 1 ? 's' : ''}`}
          icon={<I.Bell size={18} />}
          color="from-emerald-500 to-teal-500"
          animate
        />
        <StatCard
          label="Cette semaine"
          value={`+${formatMad(weekStats.totalMad, { decimals: 0 })}`}
          sub={`${weekStats.count} livraisons`}
          icon={<I.Clock size={18} />}
          color="from-violet-500 to-fuchsia-500"
          animate
        />
        <StatCard
          label="Ce mois"
          value={`+${formatMad(monthStats.totalMad, { decimals: 0 })}`}
          sub={`${monthStats.count} livraisons`}
          icon={<I.Star size={18} />}
          color="from-amber-500 to-orange-500"
          animate
        />
        <StatCard
          label="Moy. / jour"
          value={`${avgPerDay}`}
          sub={`${MOCK_COURIER_GAIN_PER_DELIVERY_MAD} MAD / course`}
          icon={<I.Bike size={18} />}
          color="from-violet-500 to-fuchsia-500"
        />
      </div>

      <GlassCard className="p-4 sm:p-5" hover={false}>
        <SectionHeader title="Activité de la semaine" icon="📈" />
        <div className="mt-4">
          <WeekMiniChart days={weekStats.days} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
          <span>{weekStats.count} livraison{weekStats.count > 1 ? 's' : ''} cette semaine</span>
          <span className="font-bold text-emerald-600">+{formatMad(weekStats.totalMad, { decimals: 0 })} gagnés</span>
        </div>
      </GlassCard>

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

/* ═══════════════════════════════════════════════════
   ORDER CARD
   ═══════════════════════════════════════════════════ */
function AnimatedMapSvg() {
  return (
    <svg viewBox="0 0 300 120" className="absolute inset-0 h-full w-full">
      <defs>
        <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(100,116,139,.15)" strokeWidth="0.5" />
        </pattern>
        <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="300" height="120" fill="url(#map-grid)" />
      <path
        d="M 20 80 Q 90 30, 160 60 T 280 30"
        stroke="url(#route-grad)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6 6"
      />
      <circle cx="20" cy="80" r="6" fill="#ec4899" />
      <circle cx="20" cy="80" r="12" fill="#ec4899" opacity="0.15">
        <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x="20" y="103" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ec4899">
        Resto
      </text>
      <circle cx="280" cy="30" r="6" fill="#10b981" />
      <circle cx="280" cy="30" r="12" fill="#10b981" opacity="0.15">
        <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" begin="1s" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" begin="1s" />
      </circle>
      <text x="280" y="20" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#10b981">
        Client
      </text>
      <g style={{ offsetPath: "path('M 20 80 Q 90 30, 160 60 T 280 30')", animation: 'bike-go 4s ease-in-out infinite alternate' }}>
        <circle r="10" fill="white" stroke="#f97316" strokeWidth="2" />
        <text textAnchor="middle" y="3" fontSize="10">🛵</text>
      </g>
    </svg>
  );
}

export function DeliveryOrderCard({ order, action, showMap, variant = 'available' }) {
  const { restaurants } = useOrders();
  const restaurantPhone =
    order.restaurantPhone ||
    restaurants.find((r) => r.id === order.restaurantId)?.phone ||
    '';

  const customerPhone = order.customer?.phone || '';
  const mapsUrl = buildMapsDirectionsUrl(order.customer?.address);

  const isPrep = order.status === 'preparing';
  const isPreparingBadge = isPrep && variant === 'available';

  return (
    <GlassCard className="p-0" glow={variant === 'active' ? 'from-violet-500 to-fuchsia-500' : undefined}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="break-anywhere font-display text-lg font-extrabold sm:text-xl">#{order.id}</span>
              <DeliveryTimerBadge assignedAt={order.assignedAt} />
            </div>
            <div className="mt-0.5 truncate text-xs text-ink-500">{order.restaurantName}</div>
          </div>
          <StatusPill status={order.status} className="self-start" />
        </div>

        {showMap && (
          <div className="relative mt-4 h-28 overflow-hidden rounded-xl border border-ink-200/60 bg-gradient-to-br from-violet-100 to-pink-100 dark:border-ink-800 dark:from-violet-900/40 dark:to-pink-900/40 sm:h-32">
            <AnimatedMapSvg />
          </div>
        )}

        {isPrep && !showMap && (
          <div className="relative mt-4 h-20 overflow-hidden rounded-xl border border-ink-200/40 bg-gradient-to-br from-violet-100/50 to-fuchsia-100/50 dark:border-ink-800/50 dark:from-violet-900/20 dark:to-fuchsia-900/20">
            <svg viewBox="0 0 300 80" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="prep-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="8" cy="8" r="1" fill="rgba(139,92,246,0.15)" />
                </pattern>
              </defs>
              <rect width="300" height="80" fill="url(#prep-grid)" />
              <text x="150" y="45" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#8b5cf6" opacity="0.6">
                En préparation au restaurant...
              </text>
              <circle cx="40" cy="40" r="4" fill="#8b5cf6" opacity="0.3">
                <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="40" r="4" fill="#ec4899" opacity="0.3">
                <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" begin="0.7s" />
              </circle>
            </svg>
          </div>
        )}

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-pink-500/10 text-pink-600">
              <I.Chef size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Récupérer</div>
              <div className="break-words font-semibold">{order.restaurantName}</div>
              {restaurantPhone ? (
                <a
                  href={`tel:${restaurantPhone.replace(/\s/g, '')}`}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <I.Phone size={12} className="shrink-0" />
                  <span className="break-all">{restaurantPhone}</span>
                  <span className="opacity-70">· Appeler</span>
                </a>
              ) : (
                <div className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Tél. resto manquant
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <I.MapPin size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Livrer à</div>
              <div className="break-words font-semibold">
                {order.customer?.name}
                {order.customer?.address ? ` · ${order.customer.address}` : ''}
              </div>
              {customerPhone && (
                <a
                  href={`tel:${customerPhone.replace(/\s/g, '')}`}
                  className="mt-0.5 flex items-center gap-1 text-xs text-ink-500 hover:text-brand-600"
                >
                  <I.Phone size={11} className="shrink-0 text-violet-600" />
                  <span className="break-all">{customerPhone}</span>
                </a>
              )}
            </div>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 transition hover:bg-violet-500/20"
                title="Ouvrir dans Google Maps"
              >
                <I.MapPin size={15} />
              </a>
            )}
          </div>
        </div>

        {order.scheduledDeliveryAt && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/30">
            <span className="text-lg">🕐</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Livraison programmée
              </div>
              <div className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {formatScheduledRange(order.scheduledDeliveryAt)}
              </div>
            </div>
          </div>
        )}

        <OrderItemsDetail order={order} restaurantPhone={restaurantPhone} />

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-ink-200 pt-4 dark:border-ink-800">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Total</div>
            <div className="font-display font-bold tabular-nums">{formatMad(order.totalDh, { decimals: 2 })}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Vous gagnez</div>
            <div className="font-display font-bold text-emerald-600">+{MOCK_COURIER_GAIN_PER_DELIVERY_MAD} MAD</div>
          </div>
        </div>

        {action && <div className="mt-4">{action}</div>}
      </div>
    </GlassCard>
  );
}
