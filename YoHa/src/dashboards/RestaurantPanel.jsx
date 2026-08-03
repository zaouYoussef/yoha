'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  formatMad,
  bucketOrderCountLast7DaysForRestaurant,
  bucketRevenueLast7DaysForRestaurant,
  last7DayLabels,
  orderFoodTotalMad,
  ORDER_STATES,
  isRestaurantActiveOrder,
  isRestaurantCancelledOrder,
  isRestaurantStatsOrder,
  defaultOpeningHours,
  normalizeOpeningHours,
  OPENING_DAY_KEYS,
  OPENING_DAY_LABELS,
} from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { restaurantsApi, restaurantOffersApi } from '@/lib/api';
import { offerScopeLabel } from '@/utils/restaurantOffers.js';
import {
  DashLayout,
  GlassCard,
  GradientHeader,
  SearchBar,
  EmptyState,
  StatCard,
  StatusPill,
  FilterChip,
  ActionButton,
  GlassTable,
  Toggle,
  PillTabs,
  SectionHeader,
  LineChart,
  BarChart,
  DonutChart,
  AnimatedCounter,
  DashSheet,
} from './DashShared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ImageUpload } from '../components/ui/ImageUpload.jsx';
import { OrderRestaurantNotes } from '../components/ui/OrderRestaurantNotes.jsx';
import { CancelOrderButton, CancelPhaseBadge, OrderCancellationNote } from '../components/ui/CancelOrderButton.jsx';

const CUISINES = [
  { value: 'pizza', label: 'Pizza' },
  { value: 'tacos', label: 'Tacos' },
  { value: 'kebab', label: 'Kebab' },
  { value: 'sushi', label: 'Sushi' },
  { value: 'burger', label: 'Burger' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'medical', label: 'Médical' },
  { value: 'asian', label: 'Asiatique' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drinks', label: 'Boissons' },
];

const CATEGORY_COLORS = [
  'from-brand-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-emerald-400 to-green-500',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-fuchsia-400 to-violet-500',
  'from-orange-400 to-pink-500',
  'from-lime-400 to-green-500',
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 800;
        if (width > max || height > max) {
          if (width > height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function useOrderTimer(createdAt) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!createdAt) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diff < 60) setElapsed("à l'instant");
      else if (diff < 3600) setElapsed(`il y a ${Math.floor(diff / 60)} min`);
      else if (diff < 86400) setElapsed(`il y a ${Math.floor(diff / 3600)}h`);
      else setElapsed(`il y a ${Math.floor(diff / 86400)}j`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [createdAt]);
  return elapsed;
}

export function RestaurantDashboard({ goto, dark, setDark }) {
  const [current, setCurrent] = useState('incoming');
  const [myResto, setMyResto] = useState(undefined);
  const [loadError, setLoadError] = useState('');

  const reloadResto = useCallback(() => {
    setLoadError('');
    return restaurantsApi.me()
      .then((resto) => {
        if (!resto) { setMyResto(null); return; }
        try {
          if (typeof window !== 'undefined') {
            // Nettoyer d'anciens overrides locaux qui masquaient les images Glovo
            localStorage.removeItem('yoha_resto_cover');
            localStorage.removeItem('yoha_resto_logo');

            const stored = JSON.parse(localStorage.getItem('yoha_item_images') || '{}');
            if (resto.menu && Array.isArray(resto.menu)) {
              resto.menu.forEach((cat) => {
                if (cat.items && Array.isArray(cat.items)) {
                  cat.items.forEach((it) => {
                    const kId = it.db_id || it.id;
                    const kName = (it.name || '').toLowerCase().trim();
                    if (stored[kId]) it.img = stored[kId];
                    else if (stored[kName]) it.img = stored[kName];
                  });
                }
              });
            }
          }
        } catch {}
        setMyResto(resto);
      })
      .catch((e) => {
        if (e.status === 404) {
          setMyResto(null);
          return;
        }
        setLoadError(e.message || 'Impossible de charger le restaurant.');
        setMyResto(null);
      });
  }, []);

  useEffect(() => {
    reloadResto();
  }, [reloadResto]);

  const restoId = myResto?.id;
  const titles = {
    incoming: 'Cuisine live',
    profile: 'Établissement',
    menu: 'Carte & menu',
    promos: 'Offres',
    stats: 'Analytics',
  };

  if (myResto === undefined) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-ink-500">Chargement du restaurant…</p>
        </div>
      </div>
    );
  }

  if (loadError && myResto === null) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-4">
        <GlassCard className="p-8 max-w-md" glow="from-red-400 to-red-500" hover={false}>
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-display font-bold text-lg mb-1">Erreur de chargement</p>
          <p className="text-sm text-ink-500 mb-4">{loadError}</p>
          <ActionButton onClick={reloadResto} variant="primary" icon={<I.Sparkle size={14} />}>
            Réessayer
          </ActionButton>
        </GlassCard>
      </div>
    );
  }

  if (!myResto) {
    return (
      <DashLayout kind="restaurant" current="profile" setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
        title="Créer mon restaurant" subtitle="Configurez votre établissement sur YoHa">
        <RestoCreate onCreated={(r) => { setMyResto(r); setCurrent('profile'); }} />
      </DashLayout>
    );
  }

  return (
    <DashLayout kind="restaurant" current={current} setCurrent={setCurrent} goto={goto} dark={dark} setDark={setDark}
      title={titles[current]} subtitle={myResto.name}>
      {current === 'incoming' && <RestoIncoming restoId={restoId}/>}
      {current === 'profile' && <RestoProfile restaurant={myResto} onUpdated={setMyResto} />}
      {current === 'menu' && <RestoMenu restaurant={myResto} onRefresh={reloadResto} />}
      {current === 'promos' && <RestoPromos restaurant={myResto} />}
      {current === 'stats' && <RestoStats restoId={restoId}/>}
    </DashLayout>
  );
}

/* ═══════════════════════════════════════════
   RESTAURANT CREATE
   ═══════════════════════════════════════════ */

export function RestoCreate({ onCreated }) {
  const [form, setForm] = useState({ name: '', cuisine: 'pizza', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const resto = await restaurantsApi.create({
        name: form.name.trim(),
        cuisine: form.cuisine,
        description: form.description.trim(),
      });
      onCreated(resto);
    } catch (err) {
      setError(err.message || 'Création impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <GradientHeader
        title="Nouveau restaurant"
        subtitle="Configurez votre établissement en quelques étapes"
        icon="🍽️"
        gradient="from-brand-500 via-pink-500 to-violet-500"
      />

      <GlassCard className="p-6" hover={false}>
        <form onSubmit={submit} className="space-y-5">
          <p className="text-sm text-ink-500">
            Les photos seront compressées automatiquement en WebP pour un chargement rapide.
          </p>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Nom du restaurant</span>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Le Petit Marrakech"
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Type de cuisine</span>
            <select value={form.cuisine} onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none">
              {CUISINES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Description</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez votre restaurant..."
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none" />
          </label>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <ActionButton type="submit" disabled={busy} variant="primary" size="lg" className="w-full justify-center">
            {busy ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Création…</>
            ) : (
              <><I.Plus size={16} /> Créer mon restaurant</>
            )}
          </ActionButton>
        </form>
      </GlassCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   RESTAURANT PROFILE
   ═══════════════════════════════════════════ */

export function RestoProfile({ restaurant, onUpdated }) {
  const [form, setForm] = useState({
    name: restaurant.name,
    description: restaurant.description || '',
    promo_label: restaurant.promo || '',
    phone: restaurant.phone || '',
    opening_hours: normalizeOpeningHours(restaurant.openingHours),
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [isTempOpen, setIsTempOpen] = useState(restaurant.isActive !== false);

  useEffect(() => {
    setForm({
      name: restaurant.name,
      description: restaurant.description || '',
      promo_label: restaurant.promo || '',
      phone: restaurant.phone || '',
      opening_hours: normalizeOpeningHours(restaurant.openingHours),
    });
    setIsTempOpen(restaurant.isActive !== false);
  }, [restaurant]);

  const setDayHours = (day, patch) => {
    setForm((f) => {
      const prev = f.opening_hours[day] || defaultOpeningHours()[day];
      const next = { ...prev, ...patch };
      if ('open' in patch || 'close' in patch || 'is_24h' in patch || 'is_closed' in patch) {
        if (next.is_closed) {
          next.slots = [];
        } else if (next.is_24h) {
          next.open = '00:00';
          next.close = '00:00';
          next.slots = [{ open: '00:00', close: '00:00' }];
        } else {
          next.slots = [{ open: next.open, close: next.close }];
        }
      }
      return {
        ...f,
        opening_hours: {
          ...f.opening_hours,
          [day]: next,
        },
      };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const updated = await restaurantsApi.updateMe({
        name: form.name.trim(),
        description: form.description.trim(),
        promo_label: form.promo_label.trim(),
        phone: form.phone.trim(),
        opening_hours: normalizeOpeningHours(form.opening_hours),
        is_active: isTempOpen,
      });
      onUpdated(updated);
      setMsg('Profil enregistré.');
    } catch (err) {
      setMsg(err.message || 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  const uploadCover = async (file) => {
    try {
      await restaurantsApi.uploadMedia('cover', file);
    } catch (e) {
      setMsg(`Cover non enregistré sur le serveur : ${e?.message || 'erreur'}`);
      throw e;
    }
    try {
      const updated = await restaurantsApi.me();
      if (onUpdated) onUpdated(updated);
    } catch {}
  };

  const uploadLogo = async (file) => {
    try {
      await restaurantsApi.uploadMedia('logo', file);
    } catch (e) {
      setMsg(`Logo non enregistré sur le serveur : ${e?.message || 'erreur'}`);
      throw e;
    }
    try {
      const updated = await restaurantsApi.me();
      if (onUpdated) onUpdated(updated);
    } catch {}
  };

  const openDaysCount = OPENING_DAY_KEYS.filter((day) => {
    const slot = form.opening_hours[day] || defaultOpeningHours()[day];
    return !slot.is_closed;
  }).length;

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Hero Cover */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 shadow-glow-lg">
        {restaurant.cover && (
          <div className="absolute inset-0">
            <img
              src={restaurant.cover}
              alt=""
              className="h-full w-full object-cover opacity-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {restaurant.logo && (
              <img
                src={restaurant.logo}
                alt=""
                className="h-20 w-20 rounded-2xl border-3 border-white/30 object-cover shadow-xl sm:h-24 sm:w-24 bg-white"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-black text-white sm:text-3xl truncate">{restaurant.name}</h2>
              {restaurant.description && (
                <p className="mt-1 text-sm text-white/70 line-clamp-1">{restaurant.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  {CUISINES.find((c) => c.value === restaurant.cuisine)?.label || restaurant.cuisine}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  📅 {openDaysCount}/{OPENING_DAY_KEYS.length} jours
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Open/Closed */}
      <GlassCard className="p-4 sm:p-5" hover={false} glow={isTempOpen ? 'from-emerald-400 to-teal-500' : 'from-red-400 to-rose-500'}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-lg ${
              isTempOpen ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-red-400 to-rose-500'
            }`}>
              {isTempOpen ? <I.Bell size={18} /> : <I.X size={18} />}
            </span>
            <div>
              <p className="font-display font-bold text-sm">
                {isTempOpen ? 'Restaurant ouvert' : 'Restaurant fermé'}
              </p>
              <p className="text-xs text-ink-500">
                {isTempOpen ? 'Les clients peuvent commander' : 'Aucune commande ne peut passer'}
              </p>
            </div>
          </div>
          <Toggle checked={isTempOpen} onChange={setIsTempOpen} size="lg" />
        </div>
      </GlassCard>

      {/* Photos */}
      <GlassCard className="p-5 sm:p-6" hover={false}>
        <SectionHeader title="Photos" subtitle="Couverture et logo de votre restaurant" icon="📸" />
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <ImageUpload
            label="Photo de couverture"
            hint="Max 8 Mo — convertie en WebP (~10× plus léger)."
            currentUrl={restaurant.cover}
            onUpload={uploadCover}
            aspect="aspect-[16/9]"
            fallback="cover"
          />
          <ImageUpload
            label="Logo"
            hint="Carré recommandé — redimensionné à 256 px."
            currentUrl={restaurant.logo}
            onUpload={uploadLogo}
            aspect="aspect-square max-w-[200px]"
            fallback="logo"
          />
        </div>
      </GlassCard>

      {/* Informations */}
      <GlassCard className="p-5 sm:p-6" hover={false}>
        <SectionHeader title="Informations" subtitle="Coordonnées et description" icon="ℹ️" />
        <div className="mt-4 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Nom</span>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Description</span>
            <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez votre établissement..."
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Promo affichée</span>
            <input value={form.promo_label} onChange={(e) => setForm((f) => ({ ...f, promo_label: e.target.value }))}
              placeholder="Ex: Livraison gratuite dès 50 MAD"
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">WhatsApp</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+212 6 12 34 56 78"
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
            <p className="text-xs text-ink-500">
              Visible par le livreur pour vous contacter lors d&apos;une course (bouton WhatsApp).
            </p>
          </label>
        </div>
      </GlassCard>

      {/* Horaires */}
      <GlassCard className="p-5 sm:p-6" hover={false}>
        <SectionHeader title="Horaires d'ouverture" subtitle={`${openDaysCount} jours ouverts`} icon="🕐" />
        <p className="text-sm text-ink-500 mt-2">
          Cochez <strong>24h/24</strong> pour ouvrir toute la journée, ou définissez une plage horaire.
        </p>
        <div className="mt-4 space-y-1">
          {OPENING_DAY_KEYS.map((day) => {
            const slot = form.opening_hours[day] || defaultOpeningHours()[day];
            const is24h = slot.is_24h || (!slot.is_closed && slot.open === slot.close);
            return (
              <div
                key={day}
                className={`flex flex-col gap-2 py-3 px-3 rounded-xl transition sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 ${
                  slot.is_closed ? 'bg-ink-50/50 dark:bg-ink-800/30' : 'bg-emerald-50/30 dark:bg-emerald-500/5'
                }`}
              >
                <span className={`w-full sm:w-24 shrink-0 text-sm font-bold ${slot.is_closed ? 'text-ink-400 line-through' : 'text-ink-700 dark:text-ink-300'}`}>
                  {OPENING_DAY_LABELS[day]}
                </span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={slot.is_closed}
                    onChange={(e) => setDayHours(day, {
                      is_closed: e.target.checked,
                      is_24h: e.target.checked ? false : slot.is_24h,
                    })}
                    className="accent-red-500"
                  />
                  <span className="text-xs text-ink-500">Fermé</span>
                </label>
                {!slot.is_closed ? (
                  <>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={is24h}
                        onChange={(e) => setDayHours(day, e.target.checked
                          ? { is_24h: true, open: '00:00', close: '00:00', is_closed: false }
                          : { is_24h: false, open: '10:00', close: '23:00' })}
                        className="accent-emerald-500"
                      />
                      <span className="text-xs text-ink-500">24h/24</span>
                    </label>
                    {!is24h ? (
                      <>
                        <label className="inline-flex items-center gap-1.5 text-sm">
                          <span className="text-xs text-ink-400">Ouverture</span>
                          <input
                            type="time"
                            required
                            value={slot.open}
                            onChange={(e) => setDayHours(day, { open: e.target.value, is_24h: false })}
                            className="px-2 py-1.5 rounded-lg border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 text-xs"
                          />
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-sm">
                          <span className="text-xs text-ink-400">Fermeture</span>
                          <input
                            type="time"
                            required
                            value={slot.close}
                            onChange={(e) => setDayHours(day, { close: e.target.value, is_24h: false })}
                            className="px-2 py-1.5 rounded-lg border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 text-xs"
                          />
                        </label>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        24h/24
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-ink-400">Journée de repos</span>
                )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Save */}
      <div className="flex items-center gap-3">
        {msg && (
          <p className={`text-sm font-medium ${msg.includes('Erreur') ? 'text-red-500' : 'text-emerald-600'}`}>{msg}</p>
        )}
        <div className="ml-auto">
          <ActionButton type="submit" disabled={busy} variant="primary" size="lg" icon={busy ? undefined : <I.Check size={16} />}>
            {busy ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Enregistrement…</>
            ) : 'Enregistrer'}
          </ActionButton>
        </div>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════
   INCOMING ORDERS
   ═══════════════════════════════════════════ */

function belongsToRestaurant(order, restoId) {
  if (!restoId) return true;
  return order.restaurantId === restoId;
}

function formatOrderWhen(createdAt) {
  if (!createdAt) return '';
  return new Date(createdAt).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RestoIncoming({ restoId }) {
  const { orders, loadingOrders, updateOrderStatus, cancelOrder } = useOrders();
  const { user } = useAuth();
  const [filter, setFilter] = useState('active');
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      import('@/lib/webPush').then(({ subscribeWebPush }) => {
        subscribeWebPush().then((ok) => {
          if (!ok) setNotifGranted(false);
        }).catch(() => setNotifGranted(false));
      }).catch(() => {});
    }
  }, []);

  const requestNotif = async () => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || typeof Notification.requestPermission !== 'function') {
      alert('Les notifications ne sont pas supportées sur ce navigateur.');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        setNotifGranted(true);
        try {
          new Notification('YoHa', {
            body: 'Notifications activées !',
            icon: '/logo.png',
          });
        } catch {}
        try {
          const { subscribeWebPush } = await import('@/lib/webPush');
          const ok = await subscribeWebPush();
          if (!ok) throw new Error('Échec abonnement push navigateur');
        } catch (e) {
          alert('Notifications activées, mais l\'abonnement push a échoué : ' + (e.message || '') + '. Les notifications ne marcheront pas en arrière-plan.');
        }
      } else if (res === 'denied') {
        alert('Notifications bloquées.');
      }
    } catch (e) {
      alert('Impossible d\'activer les notifications : ' + (e.message || ''));
    }
  };

  const activeOrders = orders
    .filter((o) => belongsToRestaurant(o, restoId) && isRestaurantActiveOrder(o.status))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const cancelledOrders = orders
    .filter((o) => belongsToRestaurant(o, restoId) && isRestaurantCancelledOrder(o))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const pickupOrders = activeOrders.filter((o) => o.status === 'pickup_confirmed');
  const preparingOrders = activeOrders.filter((o) => o.status === 'preparing');

  const actionForOrder = (o) => {
    if (o.status === 'pickup_confirmed') {
      return (
        <div className="space-y-2">
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold text-center">
            Livreur en route — à accepter
          </div>
          <ActionButton onClick={() => updateOrderStatus(o.id, 'preparing')} variant="success" size="md" className="w-full justify-center py-3 text-sm font-black" icon={<I.Check size={14} />}>
            Accepter & préparer
          </ActionButton>
          <CancelOrderButton
            phase="before_pickup"
            onCancel={(reason) => cancelOrder(o.id, reason)}
            label="Annuler la commande"
          />
        </div>
      );
    }
    if (o.status === 'preparing') {
      return (
        <div className="space-y-2">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-200/50 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold text-center">
            {o.courierName
              ? <>👨‍🍳 Prête — {o.courierName} va récupérer</>
              : <>👨‍🍳 En préparation — livreur en attente</>}
          </div>
          <CancelOrderButton
            phase="before_pickup"
            onCancel={(reason) => cancelOrder(o.id, reason)}
            label="Annuler (avant récupération)"
          />
        </div>
      );
    }
    return null;
  };

  if (loadingOrders && activeOrders.length === 0 && cancelledOrders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-ink-500">Chargement des commandes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!notifGranted && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-700">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-extrabold text-sm text-white">Notifications cuisine</p>
              <p className="text-xs text-slate-300 font-medium">Alertes nouvelles commandes même page fermée.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestNotif}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:bg-amber-400 transition-all cursor-pointer"
          >
            Activer
          </button>
        </div>
      )}

      {/* Kitchen Display header */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4 sm:p-5 shadow-lg dark:border-ink-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Kitchen Display</div>
            <h2 className="font-display text-xl font-black sm:text-2xl mt-0.5">Commandes en cuisine</h2>
            <p className="text-sm text-slate-300 mt-1">
              {activeOrders.length} active{activeOrders.length !== 1 ? 's' : ''} · {pickupOrders.length} à accepter · {preparingOrders.length} en prep
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">File</div>
            <div className="font-display text-2xl font-black text-white">{activeOrders.length}</div>
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">À accepter</div>
            <div className="font-display text-2xl font-black text-amber-300">{pickupOrders.length}</div>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">Prep</div>
            <div className="font-display text-2xl font-black text-emerald-300">{preparingOrders.length}</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <PillTabs
        tabs={[
          { id: 'active', label: 'En cours', count: activeOrders.length },
          { id: 'preparing', label: 'À préparer', count: preparingOrders.length },
          { id: 'pickup', label: 'En attente', count: pickupOrders.length },
          { id: 'cancelled', label: 'Annulées', count: cancelledOrders.length },
        ]}
        current={filter}
        onChange={setFilter}
      />

      {/* Active Orders */}
      {(filter === 'active' || filter === 'preparing' || filter === 'pickup') && (
        <section>
          <SectionHeader
            title={
              filter === 'preparing' ? 'En préparation' :
              filter === 'pickup' ? 'En attente de livreur' :
              'En cours'
            }
            subtitle={`${(filter === 'preparing' ? preparingOrders : filter === 'pickup' ? pickupOrders : activeOrders).length} commande(s)`}
            icon={
              filter === 'preparing' ? '👨‍🍳' :
              filter === 'pickup' ? '🛵' :
              '📋'
            }
          />
          {(() => {
            const filtered = filter === 'preparing' ? preparingOrders : filter === 'pickup' ? pickupOrders : activeOrders;
            if (filtered.length === 0) {
              return (
                <EmptyState
                  icon="📭"
                  title="Aucune commande active"
                  description="Les commandes apparaîtront ici en temps réel"
                />
              );
            }
            return (
              <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((o) => (
                  <RestoOrderCard key={o.id} order={o} action={actionForOrder(o)} />
                ))}
              </div>
            );
          })()}
        </section>
      )}

      {/* Cancelled Orders */}
      {filter === 'cancelled' && (
        <section>
          <SectionHeader
            title="Annulées"
            subtitle="Annulées avant récupération par le livreur"
            icon="🚫"
          />
          {cancelledOrders.length === 0 ? (
            <EmptyState
              icon="✅"
              title="Aucune commande annulée"
              description="C'est bien parti !"
            />
          ) : (
            <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cancelledOrders.map((o) => (
                <RestoOrderCard
                  key={o.id}
                  order={o}
                  completed
                  action={
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status="cancelled" />
                        {o.cancelledPhase && <CancelPhaseBadge phase={o.cancelledPhase} />}
                      </div>
                      <OrderCancellationNote reason={o.cancellationReason} />
                      {o.courierName && (
                        <span className="text-[10px] text-ink-500 inline-flex items-center gap-1">
                          <I.Bike size={10}/> {o.courierName}
                        </span>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function RestoOrderCard({ order, action, completed = false }) {
  const statusLabel = ORDER_STATES[order.status]?.label;
  const timer = useOrderTimer(order.createdAt);
  const isNew = order.createdAt && (Date.now() - new Date(order.createdAt).getTime()) < 120000;

  return (
    <GlassCard
      className={`p-0 overflow-hidden ${completed ? 'opacity-80' : ''} ${!completed && isNew ? 'ring-2 ring-amber-400/60' : ''}`}
      hover={false}
      glow={undefined}
    >
      <div className={`px-4 py-2.5 flex items-center justify-between gap-2 border-b ${
        order.status === 'pickup_confirmed'
          ? 'bg-amber-500 text-slate-950 border-amber-600'
          : order.status === 'preparing'
            ? 'bg-slate-800 text-white border-slate-700'
            : 'bg-ink-100 dark:bg-ink-800 border-ink-200 dark:border-ink-700'
      }`}>
        <div className="min-w-0 flex items-center gap-2">
          <span className="font-display font-black text-sm truncate">#{order.id}</span>
          {!completed && statusLabel && (
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 truncate">{statusLabel}</span>
          )}
        </div>
        <div className="shrink-0 font-display font-black tabular-nums">
          {formatMad(orderFoodTotalMad(order), { decimals: 0 })}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-sm text-ink-900 dark:text-white truncate">{order.customer?.name}</div>
            <div className="flex items-center gap-2 mt-1">
              {timer && (
                <span className="text-[10px] text-ink-400 inline-flex items-center gap-1">
                  <I.Clock size={10} /> {timer}
                </span>
              )}
              {order.createdAt && (
                <span className="text-[10px] text-ink-400">{formatOrderWhen(order.createdAt)}</span>
              )}
            </div>
          </div>
          <div className="text-[10px] font-bold text-ink-500 shrink-0">
            {(order.items || []).reduce((s, i) => s + i.qty, 0)} art.
          </div>
        </div>

        <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 dark:bg-ink-950/50 border border-slate-100 dark:border-ink-800 p-3">
          {(order.items || []).map((it) => (
            <div key={it.db_id || it.id} className="flex items-start gap-2 text-sm">
              <span className="font-black text-amber-700 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 px-1.5 py-0.5 rounded-md text-[11px] shrink-0">
                {it.qty}×
              </span>
              <span className="font-semibold text-ink-800 dark:text-ink-200 leading-snug">{it.name}</span>
            </div>
          ))}
        </div>

        <OrderRestaurantNotes notes={order.restaurantNotes} className="mt-2" />

        {order.courierName && (
          <div className="mt-2 text-[11px] font-semibold text-ink-500 flex items-center gap-1.5">
            <I.Bike size={12} /> Livreur : {order.courierName}
          </div>
        )}

        <div className="mt-3">{action}</div>
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   MENU MANAGEMENT
   ═══════════════════════════════════════════ */

export function RestoMenu({ restaurant, onRefresh }) {
  const [newCat, setNewCat] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [draftItem, setDraftItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  const [menuError, setMenuError] = useState('');

  const fail = (err) => {
    setMenuError(err?.message || err || 'Erreur inattendue.');
  };

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    setAddingCat(true);
    setMenuError('');
    try {
      await restaurantsApi.createCategory({ name });
      setNewCat('');
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setAddingCat(false);
    }
  };

  const renameCategory = async (catDbId) => {
    const name = editingCatName.trim();
    if (!name) return;
    setBusy(true);
    setMenuError('');
    try {
      await restaurantsApi.updateCategory(catDbId, { name });
      setEditingCatId(null);
      setEditingCatName('');
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (catDbId) => {
    setBusy(true);
    setMenuError('');
    try {
      await restaurantsApi.deleteCategory(catDbId);
      setConfirmDeleteCat(null);
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const moveCategory = async (catDbId, direction) => {
    setBusy(true);
    setMenuError('');
    try {
      await restaurantsApi.updateCategory(catDbId, { sort_order: direction });
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const saveItem = async (categoryDbId, data, dbId) => {
    setBusy(true);
    setMenuError('');
    try {
      if (dbId) {
        await restaurantsApi.updateMenuItem(dbId, {
          name: data.name,
          desc: data.desc,
          ingredients: data.ingredients,
          price: data.price,
          is_available: data.is_available,
          modifierGroups: data.modifierGroups || [],
        });
      } else {
        await restaurantsApi.createMenuItem(categoryDbId, {
          name: data.name,
          desc: data.desc,
          ingredients: data.ingredients,
          price: data.price,
          modifierGroups: data.modifierGroups || [],
        });
      }
      setDraftItem(null);
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (dbId) => {
    if (!window.confirm('Supprimer ce plat ?')) return;
    setBusy(true);
    setMenuError('');
    try {
      await restaurantsApi.deleteMenuItem(dbId);
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const duplicateItem = async (item, categoryDbId) => {
    setBusy(true);
    setMenuError('');
    try {
      await restaurantsApi.createMenuItem(categoryDbId, {
        name: `${item.name} (copie)`,
        desc: item.desc,
        ingredients: item.ingredients,
        price: item.price,
        modifierGroups: (item.modifierGroups || []).map((g) => ({
          name: g.name,
          min: Number(g.min || 0),
          max: Number(g.max || 1),
          options: (g.options || []).map((o) => ({
            name: o.name,
            price: Number(o.price || 0),
          })),
        })),
      });
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const toggleItemAvailability = async (dbId, current) => {
    setBusy(true);
    setMenuError('');
    try {
      await restaurantsApi.updateMenuItem(dbId, { is_available: !current });
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const toggleAllInCategory = async (cat, available) => {
    setBusy(true);
    setMenuError('');
    try {
      for (const it of cat.items) {
        await restaurantsApi.updateMenuItem(it.db_id, { is_available: available });
      }
      await onRefresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const uploadItemPhoto = async (dbId, file, item) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('yoha_item_images') || '{}');
        if (dbId) stored[dbId] = dataUrl;
        if (item?.id) stored[item.id] = dataUrl;
        if (item?.name) stored[item.name.toLowerCase().trim()] = dataUrl;
        localStorage.setItem('yoha_item_images', JSON.stringify(stored));
      }
    } catch {}

    if (dbId) {
      try {
        await restaurantsApi.uploadMenuItemImage(dbId, file);
      } catch (e) {
        setMenuError(`Photo non enregistrée sur le serveur : ${e?.message || 'erreur'}`);
        throw e;
      }
    }
    await onRefresh();
  };

  const menu = restaurant?.menu || [];
  const filteredMenu = search
    ? menu.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) =>
            it.name.toLowerCase().includes(search.toLowerCase()) ||
            (it.desc && it.desc.toLowerCase().includes(search.toLowerCase()))
        ),
      })).filter((cat) => cat.items.length > 0)
    : menu;

  if (!menu.length) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <GradientHeader
          title="Mon menu"
          subtitle="Commencez par créer des catégories"
          icon="🍽️"
          gradient="from-brand-500 via-pink-500 to-violet-500"
        />

        <GlassCard className="p-6" hover={false}>
          <EmptyState
            icon="📋"
            title="Menu vide"
            description="Commencez par créer une catégorie (ex. « Entrées », « Plats »)."
          />
          <div className="flex gap-2 mt-4">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
              placeholder="Nom de la catégorie"
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1 px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
            <ActionButton onClick={addCategory} disabled={addingCat} variant="primary" icon={<I.Plus size={14} />}>
              Ajouter
            </ActionButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  const totalItems = menu.reduce((s, c) => s + c.items.length, 0);
  const availableItems = menu.reduce((s, c) => s + c.items.filter((i) => i.is_available !== false).length, 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <GradientHeader
        title="Mon menu"
        subtitle={`${totalItems} plats · ${availableItems} disponibles`}
        icon="🍽️"
        gradient="from-brand-500 via-pink-500 to-violet-500"
      />

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un plat..." className="w-full min-w-0 flex-1" />
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            placeholder="Nouvelle catégorie"
            className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none sm:px-4 sm:min-w-[11rem]"
          />
          <ActionButton onClick={addCategory} disabled={addingCat} variant="primary" size="sm" icon={<I.Plus size={14} />} className="shrink-0">
            <span className="hidden xs:inline sm:inline">Catégorie</span>
            <span className="sm:hidden">Cat.</span>
          </ActionButton>
        </div>
      </div>

      {/* Storage note */}
      <p className="text-[11px] text-ink-400 sm:text-xs">
        Photos compressées en WebP côté serveur — stockage objet, pas dans la base de données.
      </p>

      {menuError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
          <I.X size={14} className="mt-0.5 shrink-0" />
          <span>{menuError}</span>
          <button type="button" onClick={() => setMenuError('')} className="ml-auto text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
        </div>
      )}

      {/* Categories */}
      {filteredMenu.map((cat, catIdx) => {
        const colorClass = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length];
        const catAvailableCount = cat.items.filter((i) => i.is_available !== false).length;
        const allAvailable = cat.items.length > 0 && catAvailableCount === cat.items.length;
        const catDbId = cat.db_id;

        return (
          <div key={catDbId || cat.category} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${colorClass} text-white text-sm shadow-md`}>
                  {catIdx + 1}
                </span>

                {editingCatId === catDbId ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameCategory(catDbId);
                        if (e.key === 'Escape') setEditingCatId(null);
                      }}
                      autoFocus
                      className="flex-1 px-3 py-1.5 rounded-lg border border-brand-400 bg-white/80 dark:bg-ink-900/80 text-sm font-bold outline-none ring-2 ring-brand-500/20"
                    />
                    <ActionButton onClick={() => renameCategory(catDbId)} variant="success" size="sm" icon={<I.Check size={12} />}>
                      OK
                    </ActionButton>
                    <ActionButton onClick={() => setEditingCatId(null)} variant="ghost" size="sm">
                      ✕
                    </ActionButton>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <h2 className="font-display font-extrabold text-lg truncate">{cat.category}</h2>
                    <p className="text-xs text-ink-500">
                      {cat.items.length} plat{cat.items.length > 1 ? 's' : ''} · {catAvailableCount} disponible{catAvailableCount > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Category actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleAllInCategory(cat, !allAvailable)}
                  disabled={busy || cat.items.length === 0}
                  title={allAvailable ? 'Masquer tous' : 'Afficher tous'}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-300 transition disabled:opacity-40"
                >
                  {allAvailable ? <I.Check size={14} /> : <I.X size={14} />}
                </button>
                {catDbId && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setEditingCatId(catDbId); setEditingCatName(cat.category); }}
                      title="Renommer"
                      className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-300 transition"
                    >
                      <I.Sparkle size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(catDbId, 'up')}
                      disabled={catIdx === 0 || busy}
                      title="Monter"
                      className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-300 transition disabled:opacity-30"
                    >
                      <span className="rotate-180 inline-block"><I.ArrowDown size={14} /></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(catDbId, 'down')}
                      disabled={catIdx === menu.length - 1 || busy}
                      title="Descendre"
                      className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-300 transition disabled:opacity-30"
                    >
                      <I.ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCat(catDbId)}
                      title="Supprimer la catégorie"
                      className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition"
                    >
                      <I.Trash size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {cat.items.map((it) => (
                <GlassCard
                  key={it.db_id || it.id}
                  className={`overflow-hidden ${it.is_available === false ? 'opacity-50' : ''}`}
                  glow={it.is_available !== false ? (CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length]) : undefined}
                >
                  <ImageUpload
                    currentUrl={it.img}
                    onUpload={(file) => uploadItemPhoto(it.db_id, file, it)}
                    aspect="aspect-[16/10] sm:aspect-[4/3]"
                    busy={busy}
                  />
                  <div className="p-3 space-y-2.5 sm:p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-sm truncate">{it.name}</h3>
                        {it.desc && (
                          <p className="text-[11px] text-ink-500 line-clamp-2 mt-0.5">{it.desc}</p>
                        )}
                      </div>
                      {it.is_available === false && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 dark:bg-red-500/10">
                          Masqué
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500/10 to-pink-500/10 px-2.5 py-1">
                        <span className="font-display font-black text-brand-600 dark:text-brand-400 text-sm">
                          {formatMad(it.price)}
                        </span>
                      </div>
                      {(it.modifierGroups || []).length > 0 ? (
                        <span className="inline-flex items-center rounded-lg bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-600 dark:text-violet-300">
                          {(it.modifierGroups || []).length} option{(it.modifierGroups || []).length > 1 ? 's' : ''}
                        </span>
                      ) : null}
                    </div>

                    {/* Actions — grille compacte mobile */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <ActionButton
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => setDraftItem({ ...it, categoryDbId: cat.db_id })}
                        icon={<I.Sparkle size={12} />}
                      >
                        Modifier
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="w-full"
                        onClick={() => duplicateItem(it, cat.db_id)}
                        icon={<I.Copy size={12} />}
                      >
                        Dupliquer
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant={it.is_available !== false ? 'warning' : 'success'}
                        className="w-full"
                        onClick={() => toggleItemAvailability(it.db_id, it.is_available !== false)}
                      >
                        {it.is_available !== false ? 'Masquer' : 'Afficher'}
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="w-full text-red-500 hover:text-red-600"
                        onClick={() => removeItem(it.db_id)}
                        icon={<I.Trash size={12} />}
                      >
                        Suppr.
                      </ActionButton>
                    </div>
                  </div>
                </GlassCard>
              ))}

              {/* Add Item Button */}
              <button
                type="button"
                onClick={() => setDraftItem({ categoryDbId: cat.db_id, name: '', desc: '', ingredients: '', price: '9.90', modifierGroups: [] })}
                className="rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-700 min-h-[180px] sm:min-h-[250px] flex flex-col items-center justify-center text-ink-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition group"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 dark:bg-ink-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-500/10 transition mb-2">
                  <I.Plus size={20} />
                </div>
                <span className="text-sm font-bold">Ajouter un plat</span>
              </button>
            </div>
          </div>
        );
      })}

      {/* Delete Category Confirmation */}
      {confirmDeleteCat && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setConfirmDeleteCat(null)}>
          <GlassCard className="p-6 w-full max-w-sm" hover={false} glow="from-red-400 to-rose-500" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-3">
              <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-red-100 dark:bg-red-500/10">
                <I.Trash size={20} className="text-red-500" />
              </div>
              <h3 className="font-display font-bold text-lg">Supprimer la catégorie ?</h3>
              <p className="text-sm text-ink-500">
                Tous les plats de cette catégorie seront supprimés. Cette action est irréversible.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <ActionButton variant="ghost" onClick={() => setConfirmDeleteCat(null)}>Annuler</ActionButton>
                <ActionButton variant="danger" disabled={busy} onClick={() => deleteCategory(confirmDeleteCat)} icon={<I.Trash size={12} />}>
                  {busy ? 'Suppression…' : 'Supprimer'}
                </ActionButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Item Draft Modal */}
      {draftItem && (
        <ItemDraftModal
          item={draftItem}
          busy={busy}
          onClose={() => setDraftItem(null)}
          onSave={(data) => saveItem(draftItem.categoryDbId, data, draftItem.db_id)}
        />
      )}
    </div>
  );
}

function ItemDraftModal({ item, busy, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item.name || '',
    desc: item.desc || '',
    ingredients: item.ingredients || '',
    price: String(item.price ?? '9.90'),
    is_available: item.is_available !== false,
    modifierGroups: (item.modifierGroups || []).map((g) => ({
      name: g.name || '',
      min: Number(g.min ?? 0),
      max: Number(g.max ?? 1),
      options: (g.options || []).map((o) => ({
        name: o.name || '',
        price: String(o.price ?? '0'),
      })),
    })),
  });

  const updateGroup = (gi, patch) => {
    setForm((f) => ({
      ...f,
      modifierGroups: f.modifierGroups.map((g, i) => (i === gi ? { ...g, ...patch } : g)),
    }));
  };

  const updateOption = (gi, oi, patch) => {
    setForm((f) => ({
      ...f,
      modifierGroups: f.modifierGroups.map((g, i) => {
        if (i !== gi) return g;
        return {
          ...g,
          options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)),
        };
      }),
    }));
  };

  const addGroup = () => {
    setForm((f) => ({
      ...f,
      modifierGroups: [
        ...f.modifierGroups,
        { name: '', min: 0, max: 1, options: [{ name: '', price: '0' }] },
      ],
    }));
  };

  const removeGroup = (gi) => {
    setForm((f) => ({
      ...f,
      modifierGroups: f.modifierGroups.filter((_, i) => i !== gi),
    }));
  };

  const addOption = (gi) => {
    setForm((f) => ({
      ...f,
      modifierGroups: f.modifierGroups.map((g, i) =>
        i === gi ? { ...g, options: [...g.options, { name: '', price: '0' }] } : g,
      ),
    }));
  };

  const removeOption = (gi, oi) => {
    setForm((f) => ({
      ...f,
      modifierGroups: f.modifierGroups.map((g, i) => {
        if (i !== gi) return g;
        const options = g.options.filter((_, j) => j !== oi);
        return { ...g, options: options.length ? options : [{ name: '', price: '0' }] };
      }),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const modifierGroups = (form.modifierGroups || [])
      .map((g) => ({
        name: (g.name || '').trim(),
        min: Math.max(0, Number(g.min) || 0),
        max: Math.max(0, Number(g.max) || 0),
        options: (g.options || [])
          .map((o) => ({
            name: (o.name || '').trim(),
            price: Number(o.price) || 0,
          }))
          .filter((o) => o.name),
      }))
      .filter((g) => g.name && g.options.length > 0)
      .map((g) => ({
        ...g,
        max: Math.max(g.max, g.min || 0),
      }));
    onSave({ ...form, modifierGroups });
  };

  return (
    <DashSheet
      open
      onClose={onClose}
      wide
      title={item.db_id ? 'Modifier le plat' : 'Nouveau plat'}
      subtitle="Infos, sauces et suppléments"
      icon={item.db_id ? <I.Sparkle size={16} /> : <I.Plus size={16} />}
      footer={(
        <div className="flex gap-2">
          <ActionButton type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </ActionButton>
          <ActionButton
            type="submit"
            form="item-draft-form"
            variant="primary"
            className="flex-[1.4]"
            disabled={busy}
            icon={item.db_id ? <I.Check size={14} /> : <I.Plus size={14} />}
          >
            {busy ? '…' : item.db_id ? 'Enregistrer' : 'Créer'}
          </ActionButton>
        </div>
      )}
    >
      <form id="item-draft-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Nom du plat</span>
          <input required placeholder="Ex: Pizza Margherita" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Accroche courte</span>
          <input placeholder="Ex: Spécialité maison, depuis 1985" value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Ingrédients et description détaillée</span>
          <p className="text-[11px] text-ink-400">Visible quand le client clique sur le plat</p>
          <textarea rows={3} placeholder="Tomate, mozzarella, basilic frais..." value={form.ingredients}
            onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none" />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Prix (MAD)</span>
          <div className="relative">
            <input required type="number" step="0.01" min="0" placeholder="9.90" value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">MAD</span>
          </div>
        </label>

        {item.db_id && (
          <div className="flex items-center justify-between rounded-xl bg-ink-50/50 dark:bg-ink-800/30 px-4 py-3">
            <div>
              <p className="text-sm font-bold">Visible dans le menu</p>
              <p className="text-[11px] text-ink-500">Masqué = invisible pour les clients</p>
            </div>
            <Toggle checked={form.is_available} onChange={(v) => setForm((f) => ({ ...f, is_available: v }))} />
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-brand-500/20 bg-brand-500/[0.04] p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-ink-900 dark:text-white">Sauces & suppléments</p>
              <p className="text-[11px] text-ink-500 mt-0.5">
                Groupes proposés au client (ex. sauce, extras). Min &gt; 0 = obligatoire.
              </p>
            </div>
            <ActionButton type="button" size="sm" variant="secondary" onClick={addGroup} icon={<I.Plus size={12} />} className="shrink-0">
              Groupe
            </ActionButton>
          </div>

          {form.modifierGroups.length === 0 ? (
            <p className="text-xs text-ink-400 py-2">Aucun groupe. Exemple : &quot;Choisissez votre sauce&quot;.</p>
          ) : (
            <div className="space-y-3">
              {form.modifierGroups.map((g, gi) => (
                <div key={gi} className="rounded-xl border border-ink-200/70 dark:border-ink-700/60 bg-white/70 dark:bg-ink-900/60 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      required
                      placeholder="Nom du groupe (ex: Sauce)"
                      value={g.name}
                      onChange={(e) => updateGroup(gi, { name: e.target.value })}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-ink-200/60 dark:border-ink-700/50 bg-white dark:bg-ink-950 text-sm font-semibold outline-none focus:border-brand-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeGroup(gi)}
                      className="shrink-0 w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 grid place-items-center"
                      aria-label="Supprimer le groupe"
                    >
                      <I.Trash size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Min</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={g.min}
                        onChange={(e) => updateGroup(gi, { min: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-ink-200/60 dark:border-ink-700/50 bg-white dark:bg-ink-950 text-sm outline-none focus:border-brand-400"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Max</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={g.max}
                        onChange={(e) => updateGroup(gi, { max: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-ink-200/60 dark:border-ink-700/50 bg-white dark:bg-ink-950 text-sm outline-none focus:border-brand-400"
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Options</span>
                      <button
                        type="button"
                        onClick={() => addOption(gi)}
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-500"
                      >
                        + option
                      </button>
                    </div>
                    {g.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          required
                          placeholder="Ex: Algérienne"
                          value={o.name}
                          onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-ink-200/60 dark:border-ink-700/50 bg-white dark:bg-ink-950 text-sm outline-none focus:border-brand-400"
                        />
                        <div className="relative w-[4.5rem] sm:w-24 shrink-0">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            value={o.price}
                            onChange={(e) => updateOption(gi, oi, { price: e.target.value })}
                            className="w-full pl-2 pr-7 py-2 rounded-lg border border-ink-200/60 dark:border-ink-700/50 bg-white dark:bg-ink-950 text-sm outline-none focus:border-brand-400"
                            title="Surcoût MAD"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-400">+</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(gi, oi)}
                          className="shrink-0 w-8 h-8 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 grid place-items-center"
                          aria-label="Supprimer l option"
                        >
                          <I.X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </DashSheet>
  );
}

/* ═══════════════════════════════════════════
   PROMOS / OFFERS
   ═══════════════════════════════════════════ */

export function RestoPromos({ restaurant }) {
  const [offers, setOffers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const menuCategories = useMemo(
    () =>
      (restaurant?.menu || [])
        .map((c) => ({ id: Number(c.db_id), name: c.category }))
        .filter((c) => c.id > 0 && c.name),
    [restaurant?.menu],
  );
  const menuItems = useMemo(
    () =>
      (restaurant?.menu || []).flatMap((c) =>
        (c.items || [])
          .map((it) => ({
            id: Number(it.db_id),
            name: it.name,
            categoryId: Number(c.db_id),
            categoryName: c.category,
            price: it.price,
          }))
          .filter((it) => it.id > 0 && it.name),
      ),
    [restaurant?.menu],
  );

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await restaurantOffersApi.list();
      setOffers(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setOffers([]);
      setError(err?.message || 'Impossible de charger les offres.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const handleCreate = () => { setEditing(null); setShowForm(true); setError(''); };
  const handleEdit = (offer) => { setEditing(offer); setShowForm(true); setError(''); };

  const handleDelete = async (offer) => {
    if (!window.confirm(`Supprimer l'offre "${offer.title}" ?`)) return;
    setBusy(true);
    try {
      await restaurantOffersApi.remove(offer.id);
      await loadOffers();
    } catch (err) {
      setError(err.message || 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (offer) => {
    setBusy(true);
    try {
      await restaurantOffersApi.update(offer.id, { is_active: !offer.is_active });
      await loadOffers();
    } catch (err) {
      setError(err.message || 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (formData) => {
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await restaurantOffersApi.update(editing.id, formData);
      } else {
        await restaurantOffersApi.create(formData);
      }
      setShowForm(false);
      setEditing(null);
      await loadOffers();
    } catch (err) {
      const msg = err.message || 'Erreur lors de l’enregistrement.';
      setError(msg);
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const OFFER_ICONS = { percentage: '💰', buy_get_free: '🎁', min_spend: '🎯' };
  const OFFER_LABELS = { percentage: 'Réduction %', buy_get_free: 'Acheté X, offert Y', min_spend: 'Montant minimum' };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-ink-500">Chargement des offres…</p>
        </div>
      </div>
    );
  }

  const list = Array.isArray(offers) ? offers : [];
  const activeCount = list.filter((o) => o.is_active).length;
  const inactiveCount = list.length - activeCount;

  return (
    <div className="space-y-5 sm:space-y-6">
      <GradientHeader
        title="Offres promotionnelles"
        subtitle={`${activeCount} active${activeCount > 1 ? 's' : ''} · ${inactiveCount} inactive${inactiveCount > 1 ? 's' : ''}`}
        icon="🎉"
        gradient="from-amber-500 via-orange-500 to-red-500"
        actions={
          <ActionButton onClick={handleCreate} variant="secondary" size="sm" icon={<I.Plus size={14} />}>
            Nouvelle offre
          </ActionButton>
        }
      />

      <p className="text-sm text-ink-500">
        Les offres actives s&apos;affichent sur votre page restaurant. Pour une réduction %, choisissez
        des catégories et/ou des plats précis : les clients voient le prix barré et le badge −X%.
      </p>

      {error && !showForm && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
          <I.X size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} className="text-xs shrink-0">✕</button>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="Aucune offre"
          description="Créez une réduction %, une offre 1 acheté 1 offert, ou un seuil minimum."
          action={
            <ActionButton onClick={handleCreate} variant="primary" icon={<I.Plus size={14} />}>
              Créer une offre
            </ActionButton>
          }
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {list.map((offer) => (
            <GlassCard
              key={offer.id}
              className={`p-4 ${!offer.is_active ? 'opacity-60' : ''}`}
              glow={offer.is_active ? 'from-amber-400 to-orange-500' : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{OFFER_ICONS[offer.offer_type] || '🏷️'}</span>
                    <span className={`font-display font-bold text-sm ${!offer.is_active ? 'text-ink-400' : 'text-ink-900 dark:text-white'}`}>
                      {offer.title}
                    </span>
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ink-100 dark:bg-ink-800 text-ink-500">
                    {OFFER_LABELS[offer.offer_type]}
                  </div>

                  {offer.description && (
                    <p className="mt-1.5 text-xs text-ink-400 line-clamp-2">{offer.description}</p>
                  )}

                  <div className="mt-2.5 rounded-xl bg-ink-50/50 dark:bg-ink-800/30 px-3 py-2">
                    {offer.offer_type === 'percentage' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-black text-2xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                          -{offer.discount_percent}%
                        </span>
                        <span className="text-xs text-ink-500">sur {offerScopeLabel(offer)}</span>
                      </div>
                    )}
                    {offer.offer_type === 'buy_get_free' && (
                      <div className="text-sm font-semibold text-ink-600 dark:text-ink-300">
                        Achetez {offer.buy_quantity}, {offer.get_quantity} offert{offer.get_quantity > 1 ? 's' : ''}
                        {offer.free_item_name && (
                          <span className="text-ink-400"> ({offer.free_item_name})</span>
                        )}
                      </div>
                    )}
                    {offer.offer_type === 'min_spend' && (
                      <div className="text-sm font-semibold text-ink-600 dark:text-ink-300">
                        Dès {formatMad(Number(offer.min_amount))} →
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent font-black ml-1">
                          -{offer.discount_percent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Toggle checked={!!offer.is_active} onChange={() => handleToggle(offer)} disabled={busy} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <ActionButton size="sm" variant="secondary" className="w-full" onClick={() => handleEdit(offer)} disabled={busy} icon={<I.Sparkle size={10} />}>
                  Modifier
                </ActionButton>
                <ActionButton size="sm" variant="ghost" className="w-full text-red-500 hover:text-red-600" onClick={() => handleDelete(offer)} disabled={busy} icon={<I.Trash size={10} />}>
                  Supprimer
                </ActionButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showForm && (
        <OfferFormModal
          offer={editing}
          busy={busy}
          categories={menuCategories}
          items={menuItems}
          onClose={() => { setShowForm(false); setEditing(null); setError(''); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function buildOfferPayload(form) {
  const categoryIds = Array.isArray(form.category_ids)
    ? form.category_ids.map(Number).filter((id) => id > 0)
    : [];
  const itemIds = Array.isArray(form.item_ids)
    ? form.item_ids.map(Number).filter((id) => id > 0)
    : [];
  const base = {
    offer_type: form.offer_type,
    title: form.title.trim(),
    description: (form.description || '').trim(),
  };
  if (form.offer_type === 'percentage') {
    return {
      ...base,
      discount_percent: Number(form.discount_percent),
      category_ids: categoryIds,
      item_ids: itemIds,
    };
  }
  if (form.offer_type === 'buy_get_free') {
    return {
      ...base,
      buy_quantity: Number(form.buy_quantity),
      get_quantity: Number(form.get_quantity),
      free_item_name: (form.free_item_name || '').trim(),
      category_ids: [],
      item_ids: [],
    };
  }
  return {
    ...base,
    min_amount: Number(form.min_amount),
    discount_percent: Number(form.discount_percent),
    category_ids: [],
    item_ids: [],
  };
}

function OfferFormModal({ offer, busy, categories = [], items = [], onClose, onSave }) {
  const formRef = useRef(null);
  const [itemQuery, setItemQuery] = useState('');
  const [form, setForm] = useState({
    offer_type: offer?.offer_type || 'percentage',
    title: offer?.title || '',
    description: offer?.description || '',
    discount_percent: offer?.discount_percent != null ? String(offer.discount_percent) : '',
    buy_quantity: offer?.buy_quantity != null ? String(offer.buy_quantity) : '',
    get_quantity: offer?.get_quantity != null ? String(offer.get_quantity) : '',
    free_item_name: offer?.free_item_name || '',
    min_amount: offer?.min_amount != null ? String(offer.min_amount) : '',
    category_ids: Array.isArray(offer?.category_ids)
      ? offer.category_ids.map(Number).filter((id) => id > 0)
      : [],
    item_ids: Array.isArray(offer?.item_ids)
      ? offer.item_ids.map(Number).filter((id) => id > 0)
      : [],
  });
  const [localError, setLocalError] = useState('');

  const toggleCategory = (id) => {
    setForm((f) => {
      const has = f.category_ids.includes(id);
      return {
        ...f,
        category_ids: has
          ? f.category_ids.filter((x) => x !== id)
          : [...f.category_ids, id],
      };
    });
  };

  const toggleItem = (id) => {
    setForm((f) => {
      const has = f.item_ids.includes(id);
      return {
        ...f,
        item_ids: has
          ? f.item_ids.filter((x) => x !== id)
          : [...f.item_ids, id],
      };
    });
  };

  const filteredItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.categoryName || '').toLowerCase().includes(q),
    );
  }, [items, itemQuery]);

  const selectedItems = useMemo(
    () => items.filter((it) => form.item_ids.includes(it.id)),
    [items, form.item_ids],
  );

  const validateClient = (payload) => {
    if (!payload.title) return 'Le titre est obligatoire.';
    if (payload.offer_type === 'percentage') {
      const n = Number(payload.discount_percent);
      if (!Number.isFinite(n) || n < 1 || n > 100) return 'Indiquez un pourcentage entre 1 et 100.';
    }
    if (payload.offer_type === 'buy_get_free') {
      if (!Number.isFinite(Number(payload.buy_quantity)) || Number(payload.buy_quantity) < 1) {
        return 'Indiquez la quantité à acheter (≥ 1).';
      }
      if (!Number.isFinite(Number(payload.get_quantity)) || Number(payload.get_quantity) < 1) {
        return 'Indiquez la quantité offerte (≥ 1).';
      }
    }
    if (payload.offer_type === 'min_spend') {
      if (!Number.isFinite(Number(payload.min_amount)) || Number(payload.min_amount) <= 0) {
        return 'Indiquez un montant minimum valide.';
      }
      const n = Number(payload.discount_percent);
      if (!Number.isFinite(n) || n < 1 || n > 100) return 'Indiquez un pourcentage entre 1 et 100.';
    }
    return '';
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    setLocalError('');
    const payload = buildOfferPayload(form);
    const clientErr = validateClient(payload);
    if (clientErr) {
      setLocalError(clientErr);
      return;
    }
    try {
      await onSave(payload);
    } catch (err) {
      setLocalError(err?.message || 'Impossible d’enregistrer l’offre.');
    }
  };

  const OFFER_TYPES = [
    { value: 'percentage', label: '💰 Réduction %', desc: 'Ex: -10% sur le menu', color: 'from-emerald-500 to-teal-500' },
    { value: 'buy_get_free', label: '🎁 Acheté X, offert Y', desc: 'Ex: 1 achetée, 1 offerte', color: 'from-violet-500 to-purple-500' },
    { value: 'min_spend', label: '🎯 Montant minimum', desc: 'Ex: Dès 100 MAD → -15%', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <DashSheet
      open
      onClose={onClose}
      title={offer ? "Modifier l'offre" : 'Nouvelle offre'}
      subtitle="Visible sur votre page restaurant"
      icon={offer ? <I.Sparkle size={16} /> : <I.Plus size={16} />}
      footer={(
        <div className="space-y-2">
          {localError && (
            <p className="text-xs font-semibold text-red-500 text-center">{localError}</p>
          )}
          <div className="flex gap-2">
            <ActionButton type="button" variant="ghost" className="flex-1" onClick={onClose}>Annuler</ActionButton>
            <ActionButton
              type="button"
              variant="primary"
              className="flex-[1.4]"
              disabled={busy}
              onClick={() => submit()}
              icon={busy ? undefined : (offer ? <I.Check size={14} /> : <I.Plus size={14} />)}
            >
              {busy ? 'Enregistrement…' : offer ? 'Enregistrer' : "Créer l'offre"}
            </ActionButton>
          </div>
        </div>
      )}
    >
      <form ref={formRef} id="offer-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Type d&apos;offre</span>
          <div className="grid gap-2">
            {OFFER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, offer_type: t.value }))}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                  form.offer_type === t.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-2 ring-brand-500/20'
                    : 'border-ink-200/60 dark:border-ink-700/50 hover:border-ink-300 dark:hover:border-ink-600'
                }`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white text-sm ${
                  form.offer_type === t.value ? t.color : 'from-ink-300 to-ink-400 dark:from-ink-600 dark:to-ink-700'
                }`}>
                  {t.label.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-bold">{t.label}</div>
                  <div className="text-xs text-ink-500">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Titre de l&apos;offre</span>
          <input required maxLength={150} placeholder="Ex: -10% sur les bowls"
            value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Description (optionnel)</span>
          <textarea rows={2} placeholder="Détails visibles par les clients"
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none" />
        </label>

        {form.offer_type === 'percentage' && (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Pourcentage de réduction</span>
              <div className="relative">
                <input required type="number" min="1" max="100" placeholder="10"
                  value={form.discount_percent} onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">%</span>
              </div>
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Catégories concernées</span>
                {(form.category_ids.length > 0 || form.item_ids.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category_ids: [], item_ids: [] }))}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400"
                  >
                    Tout le menu
                  </button>
                )}
              </div>
              <p className="text-xs text-ink-500">
                Catégories et/ou plats précis. Aucune sélection = réduction sur tout le menu.
              </p>
              {categories.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2">
                  Aucune catégorie menu pour le moment. Ajoutez des catégories dans Menu.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = form.category_ids.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/50'
                            : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-ink-300'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink-700 dark:text-ink-300">
                  Plats précis {form.item_ids.length > 0 ? `(${form.item_ids.length})` : ''}
                </span>
                {form.item_ids.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, item_ids: [] }))}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400"
                  >
                    Effacer les plats
                  </button>
                )}
              </div>
              <p className="text-xs text-ink-500">
                Idéal pour une promo sur un seul produit (ex. un bowl signature). Combinable avec les catégories.
              </p>
              {items.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2">
                  Aucun plat dans le menu pour le moment.
                </p>
              ) : (
                <>
                  <input
                    type="search"
                    value={itemQuery}
                    onChange={(e) => setItemQuery(e.target.value)}
                    placeholder="Rechercher un plat…"
                    className="w-full px-3 py-2.5 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
                  />
                  {selectedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItems.map((it) => (
                        <button
                          key={`sel-${it.id}`}
                          type="button"
                          onClick={() => toggleItem(it.id)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          title="Retirer"
                        >
                          ✓ {it.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-ink-200/60 dark:border-ink-700/50 divide-y divide-ink-100 dark:divide-ink-800">
                    {filteredItems.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-ink-400">Aucun plat trouvé.</p>
                    ) : (
                      filteredItems.slice(0, 80).map((it) => {
                        const selected = form.item_ids.includes(it.id);
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => toggleItem(it.id)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition ${
                              selected
                                ? 'bg-emerald-50/80 dark:bg-emerald-500/10'
                                : 'hover:bg-ink-50 dark:hover:bg-ink-800/40'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className={`font-semibold block truncate ${selected ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                                {selected ? '✓ ' : ''}{it.name}
                              </span>
                              <span className="text-[10px] text-ink-400 font-medium">{it.categoryName}</span>
                            </span>
                            <span className="text-xs font-bold text-ink-500 shrink-0 tabular-nums">
                              {formatMad(Number(it.price) || 0)}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {form.offer_type === 'buy_get_free' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Achetez (qté)</span>
              <input required type="number" min="1" placeholder="2"
                value={form.buy_quantity} onChange={(e) => setForm((f) => ({ ...f, buy_quantity: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Offert (qté)</span>
              <input required type="number" min="1" placeholder="1"
                value={form.get_quantity} onChange={(e) => setForm((f) => ({ ...f, get_quantity: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
            </label>
            <label className="block space-y-1.5 col-span-2">
              <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Article offert (optionnel)</span>
              <input placeholder="Ex: Boisson 33cl"
                value={form.free_item_name} onChange={(e) => setForm((f) => ({ ...f, free_item_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
            </label>
          </div>
        )}

        {form.offer_type === 'min_spend' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Montant min. (MAD)</span>
              <input required type="number" step="0.01" min="0" placeholder="100"
                value={form.min_amount} onChange={(e) => setForm((f) => ({ ...f, min_amount: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Réduction (%)</span>
              <input required type="number" min="1" max="100" placeholder="15"
                value={form.discount_percent} onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
            </label>
          </div>
        )}
      </form>
    </DashSheet>
  );
}

/* ═══════════════════════════════════════════
   STATISTICS
   ═══════════════════════════════════════════ */

export function RestoStats({ restoId }) {
  const { orders, loadingOrders } = useOrders();
  const myOrders = orders.filter((o) => o.restaurantId === restoId && isRestaurantStatsOrder(o));
  const totalRev = myOrders.reduce((s, o) => s + orderFoodTotalMad(o), 0);
  const days = last7DayLabels();
  const barData = bucketOrderCountLast7DaysForRestaurant(orders, restoId);
  const lineData = bucketRevenueLast7DaysForRestaurant(orders, restoId);
  const hasData = myOrders.length > 0;

  const avgOrderValue = myOrders.length > 0 ? totalRev / myOrders.length : 0;

  const topItems = useMemo(() => {
    const counts = {};
    myOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        counts[it.name] = (counts[it.name] || 0) + it.qty;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [myOrders]);

  const categoryRevenue = useMemo(() => {
    const catCounts = {};
    myOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const cat = it.category || 'Autre';
        catCounts[cat] = (catCounts[cat] || 0) + (it.price || 0) * it.qty;
      });
    });
    return Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [myOrders]);

  const donutColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  if (loadingOrders && !hasData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-ink-500">Chargement des statistiques…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Statistiques"
        subtitle={`${myOrders.length} commandes · ${formatMad(totalRev, { decimals: 0 })} de CA`}
        icon="📊"
        gradient="from-brand-500 via-pink-500 to-violet-500"
      />

      {!hasData && (
        <EmptyState
          icon="📊"
          title="Aucune commande pour l'instant"
          description="Les graphiques se rempliront dès que des clients commanderont chez vous."
        />
      )}

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Commandes"
          value={myOrders.length}
          icon={<I.Bag size={18} />}
          color="from-brand-500 to-violet-500"
          animate
        />
        <StatCard
          label="CA total"
          value={Math.round(totalRev)}
          icon={<I.Star size={18} />}
          color="from-brand-500 to-pink-500"
          animate
        />
        <StatCard
          label="Panier moyen"
          value={Math.round(avgOrderValue)}
          icon={<I.Chef size={18} />}
          color="from-emerald-500 to-teal-500"
          animate
          sub="MAD par commande"
        />
        <StatCard
          label="Articles vendus"
          value={myOrders.reduce((s, o) => s + (o.items || []).reduce((ss, i) => ss + i.qty, 0), 0)}
          icon={<I.Bell size={18} />}
          color="from-amber-500 to-orange-500"
          animate
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard className="p-5 sm:p-6" hover={false}>
          <SectionHeader title="Commandes par jour" subtitle="7 derniers jours" icon="📈" />
          <div className="mt-4">
            <BarChart data={barData} labels={days} color1="from-brand-500" color2="to-violet-400" />
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6" hover={false}>
          <SectionHeader title="Chiffre d'affaires" subtitle="7 derniers jours" icon="💰" />
          <div className="mt-4">
            <LineChart data={lineData} color="#3b82f6" color2="#06b6d4" />
            <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-500 mt-2">
              {days.map((d, i) => (
                <div key={i} className="text-center">{d}</div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Top Selling Items & Revenue by Category */}
      {(topItems.length > 0 || categoryRevenue.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Top Items */}
          {topItems.length > 0 && (
            <GlassCard className="p-5 sm:p-6" hover={false} glow="from-brand-400 to-pink-500">
              <SectionHeader title="Top ventes" subtitle="Les plats les plus commandés" icon="🏆" />
              <div className="mt-4 space-y-2">
                {topItems.map(([name, count], idx) => (
                  <div key={name} className="flex items-center gap-3 p-2.5 rounded-xl bg-ink-50/50 dark:bg-ink-800/30">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white text-xs font-black shadow-md ${
                      idx === 0 ? 'from-amber-400 to-orange-500' :
                      idx === 1 ? 'from-ink-300 to-ink-400 dark:from-ink-500 dark:to-ink-600' :
                      'from-amber-600 to-amber-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{name}</p>
                      <p className="text-[10px] text-ink-500">{count} vendu{count > 1 ? 's' : ''}</p>
                    </div>
                    <div className="w-16 h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500"
                        style={{ width: `${(count / topItems[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Revenue by Category */}
          {categoryRevenue.length > 0 && (
            <GlassCard className="p-5 sm:p-6" hover={false} glow="from-emerald-400 to-teal-500">
              <SectionHeader title="CA par catégorie" subtitle="Répartition du chiffre d'affaires" icon="🍕" />
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
                <DonutChart
                  data={categoryRevenue.map(([, v]) => ({ value: v }))}
                  colors={donutColors}
                  size={160}
                />
                <div className="flex-1 space-y-2 w-full">
                  {categoryRevenue.map(([cat, rev], idx) => (
                    <div key={cat} className="flex items-center gap-2 text-xs">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: donutColors[idx] }} />
                      <span className="truncate flex-1 font-medium">{cat}</span>
                      <span className="font-bold shrink-0">{formatMad(rev, { decimals: 0 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
