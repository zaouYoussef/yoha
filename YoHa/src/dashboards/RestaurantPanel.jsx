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
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-indigo-400 to-blue-500',
  'from-cyan-400 to-sky-500',
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
            const stored = JSON.parse(localStorage.getItem('yoha_item_images') || '{}');
            const restoCover = localStorage.getItem('yoha_resto_cover');
            const restoLogo = localStorage.getItem('yoha_resto_logo');

            if (restoCover) resto.cover = restoCover;
            if (restoLogo) resto.logo = restoLogo;

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
    incoming: 'Commandes entrantes',
    profile: 'Mon établissement',
    menu: 'Mon menu',
    promos: 'Offres',
    stats: 'Statistiques',
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
      title={titles[current]} subtitle={`Connecté en tant que ${myResto.name}`}>
      {current === 'incoming' && <RestoIncoming restoId={restoId}/>}
      {current === 'profile' && <RestoProfile restaurant={myResto} onUpdated={setMyResto} />}
      {current === 'menu' && <RestoMenu restaurant={myResto} onRefresh={reloadResto} />}
      {current === 'promos' && <RestoPromos />}
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
        gradient="from-sky-500 via-blue-500 to-indigo-500"
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
    setForm((f) => ({
      ...f,
      opening_hours: {
        ...f.opening_hours,
        [day]: { ...f.opening_hours[day], ...patch },
      },
    }));
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
      const dataUrl = await fileToDataUrl(file);
      if (typeof window !== 'undefined') {
        localStorage.setItem('yoha_resto_cover', dataUrl);
      }
    } catch {}
    try {
      await restaurantsApi.uploadMedia('cover', file);
    } catch {}
    try {
      const updated = await restaurantsApi.me();
      if (onUpdated) onUpdated(updated);
    } catch {}
  };

  const uploadLogo = async (file) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      if (typeof window !== 'undefined') {
        localStorage.setItem('yoha_resto_logo', dataUrl);
      }
    } catch {}
    try {
      await restaurantsApi.uploadMedia('logo', file);
    } catch {}
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 shadow-glow-lg">
        {restaurant.cover && (
          <div className="absolute inset-0">
            <img src={restaurant.cover} alt="" className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {restaurant.logo && (
              <img src={restaurant.logo} alt="" className="h-20 w-20 rounded-2xl border-3 border-white/30 object-cover shadow-xl sm:h-24 sm:w-24" />
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
          />
          <ImageUpload
            label="Logo"
            hint="Carré recommandé — redimensionné à 256 px."
            currentUrl={restaurant.logo}
            onUpload={uploadLogo}
            aspect="aspect-square max-w-[200px]"
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
                className={`flex flex-wrap items-center gap-3 py-3 px-3 rounded-xl transition ${
                  slot.is_closed ? 'bg-ink-50/50 dark:bg-ink-800/30' : 'bg-emerald-50/30 dark:bg-emerald-500/5'
                }`}
              >
                <span className={`w-24 shrink-0 text-sm font-bold ${slot.is_closed ? 'text-ink-400 line-through' : 'text-ink-700 dark:text-ink-300'}`}>
                  {OPENING_DAY_LABELS[day]}
                </span>
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
          await subscribeWebPush();
        } catch {}
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
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-200/50 dark:border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-bold text-center">
            🛵 Livreur en route vers vous
          </div>
          <ActionButton onClick={() => updateOrderStatus(o.id, 'preparing')} variant="success" size="md" className="w-full justify-center" icon={<I.Check size={14} />}>
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
      {/* Notification Banner */}
      {!notifGranted && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg border border-violet-400/40">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-extrabold text-sm text-white">Activer les notifications push</p>
              <p className="text-xs text-violet-100 font-medium">Recevez les alertes de nouvelles commandes m&ecirc;me page ferm&eacute;e.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestNotif}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            Activer
          </button>
        </div>
      )}
      {/* Header with stats */}
      <GradientHeader
        title="Commandes"
        subtitle={`${activeOrders.length} en cours · ${cancelledOrders.length} annulées`}
        icon="🔔"
        gradient="from-sky-500 via-blue-500 to-indigo-500"
        actions={
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-bold backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
        }
      />

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
      className={`p-4 ${completed ? 'opacity-80' : ''}`}
      glow={!completed && isNew ? 'from-amber-400 to-orange-500' : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-sm">#{order.id}</span>
            {!completed && statusLabel && (
              <StatusPill status={order.status} className="text-[9px] px-2 py-0.5" />
            )}
          </div>
          <div className="text-xs text-ink-500 mt-0.5 truncate">{order.customer?.name}</div>
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
        <div className="text-right shrink-0">
          <div className="font-display font-black text-brand-600 dark:text-brand-400">
            {formatMad(orderFoodTotalMad(order), { decimals: 0 })}
          </div>
          <div className="text-[10px] text-ink-500 mt-0.5">
            {(order.items || []).reduce((s, i) => s + i.qty, 0)} art.
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-3 space-y-1 rounded-xl bg-ink-50/50 dark:bg-ink-800/30 p-2.5">
        {(order.items || []).map((it) => (
          <div key={it.db_id || it.id} className="flex items-center gap-2 text-xs">
            <span className="font-black text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded-md text-[10px]">
              {it.qty}×
            </span>
            <span className="truncate flex-1 text-ink-700 dark:text-ink-300">{it.name}</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      <OrderRestaurantNotes notes={order.restaurantNotes} className="mt-2" />

      {/* Courier */}
      {order.courierName && (
        <div className="mt-2 text-[10px] text-ink-500 flex items-center gap-1">
          <I.Bike size={10}/> {order.courierName}
        </div>
      )}

      {/* Action */}
      <div className="mt-3">{action}</div>
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

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      await restaurantsApi.createCategory({ name });
      setNewCat('');
      await onRefresh();
    } finally {
      setAddingCat(false);
    }
  };

  const renameCategory = async (catDbId) => {
    const name = editingCatName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await restaurantsApi.updateCategory(catDbId, { name });
      setEditingCatId(null);
      setEditingCatName('');
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (catDbId) => {
    setBusy(true);
    try {
      await restaurantsApi.deleteCategory(catDbId);
      setConfirmDeleteCat(null);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const moveCategory = async (catDbId, direction) => {
    setBusy(true);
    try {
      await restaurantsApi.updateCategory(catDbId, { sort_order: direction });
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const saveItem = async (categoryDbId, data, dbId) => {
    setBusy(true);
    try {
      if (dbId) {
        await restaurantsApi.updateMenuItem(dbId, {
          name: data.name,
          desc: data.desc,
          ingredients: data.ingredients,
          price: data.price,
          is_available: data.is_available,
        });
      } else {
        await restaurantsApi.createMenuItem(categoryDbId, {
          name: data.name,
          desc: data.desc,
          ingredients: data.ingredients,
          price: data.price,
        });
      }
      setDraftItem(null);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (dbId) => {
    if (!window.confirm('Supprimer ce plat ?')) return;
    setBusy(true);
    try {
      await restaurantsApi.deleteMenuItem(dbId);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const duplicateItem = async (item, categoryDbId) => {
    setBusy(true);
    try {
      await restaurantsApi.createMenuItem(categoryDbId, {
        name: `${item.name} (copie)`,
        desc: item.desc,
        ingredients: item.ingredients,
        price: item.price,
      });
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const toggleItemAvailability = async (dbId, current) => {
    setBusy(true);
    try {
      await restaurantsApi.updateMenuItem(dbId, { is_available: !current });
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const toggleAllInCategory = async (cat, available) => {
    setBusy(true);
    try {
      for (const it of cat.items) {
        await restaurantsApi.updateMenuItem(it.db_id, { is_available: available });
      }
      await onRefresh();
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

    try {
      if (dbId) await restaurantsApi.uploadMenuItemImage(dbId, file);
    } catch {}
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
          gradient="from-sky-500 via-blue-500 to-indigo-500"
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
    <div className="space-y-6">
      {/* Header */}
      <GradientHeader
        title="Mon menu"
        subtitle={`${totalItems} plats · ${availableItems} disponibles`}
        icon="🍽️"
        gradient="from-sky-500 via-blue-500 to-indigo-500"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un plat..." className="flex-1 min-w-[200px]" />
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            placeholder="Nouvelle catégorie"
            className="px-4 py-2.5 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
          <ActionButton onClick={addCategory} disabled={addingCat} variant="primary" size="sm" icon={<I.Plus size={14} />}>
            Catégorie
          </ActionButton>
        </div>
      </div>

      {/* Storage note */}
      <p className="text-xs text-ink-400">
        Photos compressées en WebP côté serveur — stockage objet, pas dans la base de données.
      </p>

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.items.map((it) => (
                <GlassCard
                  key={it.db_id || it.id}
                  className={`overflow-hidden ${it.is_available === false ? 'opacity-50' : ''}`}
                  glow={it.is_available !== false ? `from-sky-${300 + catIdx * 100} to-indigo-${300 + catIdx * 100}` : undefined}
                >
                  <ImageUpload
                    currentUrl={it.img}
                    onUpload={(file) => uploadItemPhoto(it.db_id, file, it)}
                    aspect="aspect-[4/3]"
                    busy={busy}
                  />
                  <div className="p-3.5 space-y-2">
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

                    {/* Price */}
                    <div className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500/10 to-pink-500/10 px-2.5 py-1">
                      <span className="font-display font-black text-brand-600 dark:text-brand-400 text-sm">
                        {formatMad(it.price)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <ActionButton size="sm" variant="secondary" onClick={() => setDraftItem({ ...it, categoryDbId: cat.db_id })} icon={<I.Sparkle size={10} />}>
                        Modifier
                      </ActionButton>
                      <ActionButton size="sm" variant="ghost" onClick={() => duplicateItem(it, cat.db_id)} icon={<I.Copy size={10} />}>
                        Dupliquer
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant={it.is_available !== false ? 'warning' : 'success'}
                        onClick={() => toggleItemAvailability(it.db_id, it.is_available !== false)}
                      >
                        {it.is_available !== false ? 'Masquer' : 'Afficher'}
                      </ActionButton>
                      <ActionButton size="sm" variant="ghost" onClick={() => removeItem(it.db_id)} className="text-red-500 hover:text-red-600" icon={<I.Trash size={10} />}>
                        Suppr.
                      </ActionButton>
                    </div>
                  </div>
                </GlassCard>
              ))}

              {/* Add Item Button */}
              <button
                type="button"
                onClick={() => setDraftItem({ categoryDbId: cat.db_id, name: '', desc: '', ingredients: '', price: '9.90' })}
                className="rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-700 min-h-[250px] flex flex-col items-center justify-center text-ink-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition group"
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
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <GlassCard
        className="p-6 w-full max-w-md space-y-4 max-h-[85vh] overflow-y-auto"
        hover={false}
        glow="from-brand-400 to-pink-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-pink-500 text-white shadow-lg">
            {item.db_id ? <I.Sparkle size={16} /> : <I.Plus size={16} />}
          </span>
          <div>
            <h3 className="font-display font-bold text-lg">{item.db_id ? 'Modifier le plat' : 'Nouveau plat'}</h3>
            <p className="text-xs text-ink-500">Remplissez les informations du plat</p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form); }}
          className="space-y-4"
        >
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
            <textarea rows={4} placeholder="Tomate, mozzarella, basilic frais..." value={form.ingredients}
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

          <div className="flex gap-2 justify-end pt-2">
            <ActionButton type="button" variant="ghost" onClick={onClose}>Annuler</ActionButton>
            <ActionButton type="submit" variant="primary" disabled={busy} icon={item.db_id ? <I.Check size={14} /> : <I.Plus size={14} />}>
              {busy ? '…' : item.db_id ? 'Enregistrer' : 'Créer le plat'}
            </ActionButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PROMOS / OFFERS
   ═══════════════════════════════════════════ */

export function RestoPromos() {
  const [offers, setOffers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await restaurantOffersApi.list();
      setOffers(Array.isArray(data) ? data : []);
    } catch {
      setOffers([]);
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
    try { await restaurantOffersApi.remove(offer.id); await loadOffers(); }
    catch (err) { setError(err.message || 'Erreur.'); }
    finally { setBusy(false); }
  };

  const handleToggle = async (offer) => {
    setBusy(true);
    try { await restaurantOffersApi.update(offer.id, { is_active: !offer.is_active }); await loadOffers(); }
    catch (err) { setError(err.message || 'Erreur.'); }
    finally { setBusy(false); }
  };

  const handleSave = async (formData) => {
    setBusy(true); setError('');
    try {
      if (editing) { await restaurantOffersApi.update(editing.id, formData); }
      else { await restaurantOffersApi.create(formData); }
      setShowForm(false); setEditing(null); await loadOffers();
    } catch (err) { setError(err.message || 'Erreur.'); }
    finally { setBusy(false); }
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

  const activeCount = offers.filter((o) => o.is_active).length;
  const inactiveCount = offers.length - activeCount;

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Offres promotionnelles"
        subtitle={`${activeCount} active${activeCount > 1 ? 's' : ''} · ${inactiveCount} inactive${inactiveCount > 1 ? 's' : ''}`}
        icon="🎉"
        gradient="from-amber-500 via-orange-500 to-red-500"
        actions={
          <ActionButton onClick={handleCreate} variant="secondary" size="sm" icon={<I.Plus size={14} />}>
            <span className="hidden sm:inline">Nouvelle offre</span>
            <span className="sm:hidden">Nouvelle</span>
          </ActionButton>
        }
      />

      <p className="text-sm text-ink-500">
        Créez des offres promotionnelles pour attirer vos clients. Les offres s&apos;affichent sur votre page restaurant.
      </p>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <I.X size={14} /> {error}
        </div>
      )}

      {offers.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="Aucune offre active"
          description="Créez votre première offre promotionnelle !"
          action={
            <ActionButton onClick={handleCreate} variant="primary" icon={<I.Plus size={14} />}>
              Créer une offre
            </ActionButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => (
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
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-2xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                          -{offer.discount_percent}%
                        </span>
                        <span className="text-xs text-ink-500">sur tout le menu</span>
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
                        Dès {formatMad(Number(offer.min_amount))} d&apos;achat →
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent font-black ml-1">
                          -{offer.discount_percent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Toggle checked={offer.is_active} onChange={() => handleToggle(offer)} disabled={busy} />
              </div>

              <div className="mt-4 flex gap-2">
                <ActionButton size="sm" variant="secondary" onClick={() => handleEdit(offer)} disabled={busy} icon={<I.Sparkle size={10} />}>
                  Modifier
                </ActionButton>
                <ActionButton size="sm" variant="ghost" onClick={() => handleDelete(offer)} disabled={busy} className="text-red-500 hover:text-red-600" icon={<I.Trash size={10} />}>
                  Supprimer
                </ActionButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showForm && (
        <OfferFormModal offer={editing} busy={busy} onClose={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} />
      )}
    </div>
  );
}

function OfferFormModal({ offer, busy, onClose, onSave }) {
  const [form, setForm] = useState({
    offer_type: offer?.offer_type || 'percentage',
    title: offer?.title || '',
    description: offer?.description || '',
    discount_percent: offer?.discount_percent ? String(offer.discount_percent) : '',
    buy_quantity: offer?.buy_quantity ? String(offer.buy_quantity) : '',
    get_quantity: offer?.get_quantity ? String(offer.get_quantity) : '',
    free_item_name: offer?.free_item_name || '',
    min_amount: offer?.min_amount ? String(offer.min_amount) : '',
  });

  const submit = (e) => {
    e.preventDefault();
    onSave({
      offer_type: form.offer_type,
      title: form.title.trim(),
      description: form.description.trim(),
      discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
      buy_quantity: form.buy_quantity ? Number(form.buy_quantity) : null,
      get_quantity: form.get_quantity ? Number(form.get_quantity) : null,
      free_item_name: form.free_item_name.trim(),
      min_amount: form.min_amount ? Number(form.min_amount) : null,
    });
  };

  const OFFER_TYPES = [
    { value: 'percentage', label: '💰 Réduction %', desc: 'Ex: -50% sur tout le menu', color: 'from-emerald-500 to-teal-500' },
    { value: 'buy_get_free', label: '🎁 Acheté X, offert Y', desc: 'Ex: 1 achetée, 1 offerte', color: 'from-violet-500 to-purple-500' },
    { value: 'min_spend', label: '🎯 Montant minimum', desc: 'Ex: Dès 100 MAD → -15%', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <GlassCard
        className="p-6 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4"
        hover={false}
        glow="from-amber-400 to-orange-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
            {offer ? <I.Sparkle size={16} /> : <I.Plus size={16} />}
          </span>
          <div>
            <h3 className="font-display font-bold text-lg">{offer ? 'Modifier l\'offre' : 'Nouvelle offre'}</h3>
            <p className="text-xs text-ink-500">Configurez votre promotion</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Type Selection */}
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

          {/* Title */}
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Titre de l&apos;offre</span>
            <input required maxLength={150} placeholder="Ex: -50% sur tout le menu"
              value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
          </label>

          {/* Description */}
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Description (optionnel)</span>
            <textarea rows={2} placeholder="Détails visibles par les clients"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none" />
          </label>

          {/* Type-specific fields */}
          {form.offer_type === 'percentage' && (
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Pourcentage de réduction</span>
              <div className="relative">
                <input required type="number" min="1" max="100" placeholder="50"
                  value={form.discount_percent} onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">%</span>
              </div>
              <p className="text-xs text-ink-400">La réduction s&apos;applique sur le total de la commande.</p>
            </label>
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
                <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Nom de l&apos;article offert (optionnel)</span>
                <input placeholder="Ex: Boisson 33cl"
                  value={form.free_item_name} onChange={(e) => setForm((f) => ({ ...f, free_item_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-ink-200/60 dark:border-ink-700/50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm text-sm font-medium transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none" />
              </label>
            </div>
          )}

          {form.offer_type === 'min_spend' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-ink-700 dark:text-ink-300">Montant minimum (MAD)</span>
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

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <ActionButton type="button" variant="ghost" onClick={onClose}>Annuler</ActionButton>
            <ActionButton type="submit" variant="primary" disabled={busy} icon={busy ? undefined : (offer ? <I.Check size={14} /> : <I.Plus size={14} />)}>
              {busy ? '…' : offer ? 'Enregistrer' : 'Créer l\'offre'}
            </ActionButton>
          </div>
        </form>
      </GlassCard>
    </div>
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
        gradient="from-sky-500 via-blue-500 to-indigo-500"
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
          color="from-sky-500 to-indigo-500"
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
            <BarChart data={barData} labels={days} color1="from-sky-500" color2="to-indigo-400" />
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
