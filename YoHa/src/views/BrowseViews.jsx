'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { I } from '../icons/Icons.jsx';
import { CUISINES, CATEGORIES_BANNERS, CATEGORY_GROUPS, CUISINE_CATEGORIES, STATIC_STORES } from '../data/index.js';
import { useOrders, useCart } from '../contexts/AppContexts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { motion } from 'framer-motion';
import { Reveal } from '../components/ui/Reveal.jsx';
import { Tilt } from '../components/ui/Tilt.jsx';

import { useYohaNav } from '../contexts/YohaNavContext.jsx';
import { spotlightHandler } from '../utils/spotlight.js';
import { formatMad, restaurantOpenStatus } from '../data/index.js';
import { MenuItemImage, restaurantCover, restaurantLogo } from '../components/ui/MenuItemImage.jsx';
import { MenuItemDetailModal } from '../components/ui/MenuItemDetailModal.jsx';
import { withItemOfferPricing, offerScopeLabel } from '../utils/restaurantOffers.js';
import PlaceAutocomplete from '../components/ui/PlaceAutocomplete.jsx';
import { OrdonnanceUpload } from '../components/ui/OrdonnanceUpload.jsx';
import { pharmaciesApi } from '../lib/api.js';
import { browsePathForFilter, normalizeBrowseFilter } from '../data/browseSlugs.js';
import { foldText } from '@/utils/textNormalize.js';
import { publicRestaurantBio } from '@/utils/restaurantBio.js';

function shuffleWithSeed(array, seed) {
  if (!array || !array.length) return [];
  const arr = [...array];
  let m = arr.length;
  let t, i;
  let s = seed;

  function random() {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  }

  while (m) {
    i = Math.floor(random() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}


const norm = (s) => foldText(s);

/** Texte indexé pour la recherche browse (nom, tags, cuisine, menu si présent). */
function restaurantSearchHaystack(r) {
  if (!r) return '';
  const parts = [
    r.name,
    r.cuisine,
    r.description,
    r.subtitle,
    r.promo,
    ...(Array.isArray(r.tags) ? r.tags : []),
    ...(Array.isArray(r.menuHints) ? r.menuHints : []),
  ];
  if (Array.isArray(r.menu)) {
    r.menu.forEach((cat) => {
      parts.push(cat.category);
      (cat.items || []).forEach((it) => {
        parts.push(it.name, it.desc, it.ingredients);
      });
    });
  }
  return foldText(parts.filter(Boolean).join(' '));
}

function matchesBrowseSearch(r, rawQuery) {
  const q = foldText(rawQuery);
  if (!q) return true;
  return restaurantSearchHaystack(r).includes(q);
}

const SUB_CATEGORIES = {
  dessert: [
    { id: 'gateaux', label: 'Gâteaux', emoji: '🎂', image: '/chain-img/sub-gateaux.jpg', match: ['gateau', 'cake', 'gourmand', 'creation', 'creatif', 'art', 'diamant', 'cadeaux'] },
    { id: 'macarons', label: 'Macarons', emoji: '🍬', image: '/chain-img/sub-macarons.jpg', match: ['macaron'] },
    { id: 'croissant', label: 'Croissants', emoji: '🥐', image: '/chain-img/sub-bread.avif', match: ['croissant', 'viennoiserie', 'pain', 'baguette', 'boulangerie'] },
    { id: 'glaces', label: 'Glaces', emoji: '🍦', image: '/chain-img/sub-glaces.jpg', match: ['glacier', 'glace', 'cream', 'banquise'] },
    { id: 'cupcakes', label: 'Cupcakes', emoji: '🧁', image: '/chain-img/sub-cupcakes.jpg', match: ['muffin', 'cupcake', 'tiramisu', 'italien', 'pasteis', 'nata'] },
    { id: 'traditionnel', label: 'Pain', emoji: '🇲🇦', image: '/chain-img/sub-traditionnel.jpg', match: ['traiteur', 'traditionnel', 'marocain', 'marrakech', 'artisanal', 'kasbah'] },
    { id: 'douceurs', label: 'Douceurs', emoji: '🍮', image: '/chain-img/sub-douceurs.jpg', match: ['douceurs', 'dessert', 'royal', 'luxe', 'signature'] },
    { id: 'petit-dej', label: 'Petit-déj', emoji: '☕', image: '/chain-img/sub-croissant.jpg', match: ['petit', 'breakfast', 'francilien', 'parisien'] },
  ],
  patisserie: [
    { id: 'gateaux', label: 'Gâteaux', emoji: '🎂', image: '/chain-img/sub-gateaux.jpg', match: ['gateau', 'cake', 'gourmand', 'creation', 'creatif', 'art', 'diamant', 'cadeaux'] },
    { id: 'macarons', label: 'Macarons', emoji: '🍬', image: '/chain-img/sub-macarons.jpg', match: ['macaron'] },
    { id: 'croissant', label: 'Croissants', emoji: '🥐', image: '/chain-img/sub-bread.avif', match: ['croissant', 'viennoiserie', 'pain', 'baguette', 'boulangerie'] },
    { id: 'glaces', label: 'Glaces', emoji: '🍦', image: '/chain-img/sub-glaces.jpg', match: ['glacier', 'glace', 'cream', 'banquise'] },
    { id: 'cupcakes', label: 'Cupcakes', emoji: '🧁', image: '/chain-img/sub-cupcakes.jpg', match: ['muffin', 'cupcake', 'tiramisu', 'italien', 'pasteis', 'nata'] },
    { id: 'traditionnel', label: 'Pain', emoji: '🇲🇦', image: '/chain-img/sub-traditionnel.jpg', match: ['traiteur', 'traditionnel', 'marocain', 'marrakech', 'artisanal', 'kasbah'] },
    { id: 'douceurs', label: 'Douceurs', emoji: '🍮', image: '/chain-img/sub-douceurs.jpg', match: ['douceurs', 'dessert', 'royal', 'luxe', 'signature'] },
    { id: 'petit-dej', label: 'Petit-déj', emoji: '☕', image: '/chain-img/sub-croissant.jpg', match: ['petit', 'breakfast', 'francilien', 'parisien'] },
  ],
  parapharmacy: [
    { id: 'beaute', label: 'Beauté', emoji: '💄', image: '/chain-img/sub-beaute.jpg', match: ['beaute', 'cosmetique', 'beauty', 'maquillage', 'parfumerie'] },
    { id: 'visage', label: 'Soin visage', emoji: '🧴', image: '/chain-img/sub-visage.jpg', match: ['soin', 'visage', 'dermato', 'creme', 'cosmetique'] },
    { id: 'complement', label: 'Compléments', emoji: '💊', image: '/chain-img/sub-complement.jpg', match: ['complement', 'vitamine'] },
    { id: 'cheveux', label: 'Cheveux', emoji: '💆', image: '/chain-img/sub-cheveux.jpg', match: ['cheveux', 'hair', 'coiffure'] },
    { id: 'solaire', label: 'Solaire', emoji: '☀️', image: '/chain-img/sub-solaire.jpg', match: ['solaire', 'soleil', 'sun'] },
    { id: 'hygiene', label: 'Hygiène', emoji: '🧼', image: '/chain-img/sub-hygiene.jpg', match: ['hygiene', 'propre', 'savon'] },
    { id: 'bebe', label: 'Bébé', emoji: '👶', image: '/chain-img/sub-bebe.jpg', match: ['bebe', 'baby', 'puericulture', 'enfant'] },
    { id: 'bio', label: 'Bio', emoji: '🌿', image: '/chain-img/sub-bio.png', match: ['bio', 'nature'] },
  ],
  supermarket: [
    { id: 'fruits', label: 'Fruits', emoji: '🍎', image: '/chain-img/sub-fruits.jpg', match: ['fruit', 'frais', 'alimentaire', 'produit'] },
    { id: 'legumes', label: 'Légumes', emoji: '🥦', image: '/chain-img/sub-legumes.jpg', match: ['legume', 'frais', 'bio'] },
    { id: 'epicerie', label: 'Épicerie', emoji: '🛒', image: '/chain-img/sub-epicerie.jpg', match: ['epicerie', 'alimentaire', 'proximite', 'hypermarche', 'supermarch'] },
    { id: 'fraisbio', label: 'Frais & Bio', emoji: '🥑', image: '/chain-img/sub-fraisbio.jpg', match: ['bio', 'frais'] },
    { id: 'boissons', label: 'Boissons', emoji: '🥤', image: '/chain-img/sub-boissons.jpg', match: ['boisson', 'drink', 'sucrerie'] },
    { id: 'surgeles', label: 'Surgelés', emoji: '🧊', image: '/chain-img/sub-surgeles.jpg', match: ['surgel', 'congele'] },
  ],
  shop: [
    { id: 'mode', label: 'Mode', emoji: '👗', image: '/chain-img/sub-mode.jpg', match: ['mode', 'femme', 'homme', 'vetement', 'textile'] },
    { id: 'chaussures', label: 'Chaussures', emoji: '👟', image: '/chain-img/sub-chaussures.jpg', match: ['chaussure', 'sneaker'] },
    { id: 'electronique', label: 'Électronique', emoji: '📱', image: '/chain-img/sub-electronique.jpg', match: ['electronique', 'tech', 'telephonie', 'electromenager'] },
    { id: 'maison', label: 'Maison', emoji: '🏠', image: '/chain-img/sub-maison.jpg', match: ['maison', 'deco', 'meuble', 'bricolage'] },
    { id: 'sport', label: 'Sport', emoji: '⚽', image: '/chain-img/sub-sport.avif', match: ['sport'] },
    { id: 'accessoires', label: 'Accessoires', emoji: '🕶️', image: '/chain-img/sub-accessoires.jpg', match: ['accessoire'] },
    { id: 'bijoux', label: 'Bijoux', emoji: '💎', image: '/chain-img/sub-bijoux.jpg', match: ['bijou', 'montre'] },
    { id: 'cadeaux', label: 'Cadeaux', emoji: '🎁', image: '/chain-img/sub-cadeaux.jpg', match: ['cadeau', 'parfumerie', 'boutique'] },
  ],
};

const SUB_BY_ID = {};
Object.entries(SUB_CATEGORIES).forEach(([group, list]) => {
  list.forEach((s) => { SUB_BY_ID[s.id] = { ...s, group }; });
});

const PLACE_CATEGORY = {
  restaurant: 'restaurant',
  pharmacy: 'pharmacy',
  parapharmacy: 'parapharmacie',
  dessert: 'patisserie',
  patisserie: 'patisserie',
  supermarket: 'supermarche',
  shop: 'magasin',
};

const AUTOCOMPLETE_INPUT_CLASS = 'w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-ink-900 dark:text-white';

function greetingName(user) {
  const raw = user?.displayName?.trim();
  if (!raw) return 'toi';
  return raw.split(/\s+/)[0];
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function isRestaurantOpen(r) {
  // Prefer real schedules when present (static stores used to hardcode isOpen: true).
  if (r?.openingHours && typeof r.openingHours === 'object') {
    return restaurantOpenStatus(r.openingHours).isOpen;
  }
  if (typeof r?.isOpen === 'boolean') return r.isOpen;
  return restaurantOpenStatus(r?.openingHours).isOpen;
}

function restoKey(r) {
  return String(r?.id || r?.slug || r?.name || '').toLowerCase().trim();
}

function prioritizeOpenFirst(list, enabled = true) {
  if (!enabled || !Array.isArray(list) || list.length <= 1) return list || [];
  const open = [];
  const closed = [];
  for (const r of list) {
    (isRestaurantOpen(r) ? open : closed).push(r);
  }
  return [...open, ...closed];
}

/** Prend jusqu'à `limit` restos d'une liste en évitant les déjà utilisés. */
function takeUnique(list, used, limit = 10) {
  const out = [];
  for (const r of list || []) {
    const key = restoKey(r);
    if (!key || used.has(key)) continue;
    used.add(key);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

function ratingOf(r) {
  const n = Number(String(r?.rating || '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function formatTag(tag) {
  if (!tag || typeof tag !== 'string') return '';
  const trimmed = tag.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function formatTags(tags, separator = ' • ') {
  if (!tags) return '';
  const list = Array.isArray(tags) ? tags : [tags];
  return list.map(formatTag).filter(Boolean).join(separator);
}

/** Store sur-mesure ouvert par la bannière « Commande sur-mesure », selon la catégorie active. */
const CUSTOM_STORE_BY_FILTER = {
  all: 'custom-restaurant',
  restaurants: 'custom-restaurant',
  pharmacy: 'custom-pharmacy',
  parapharmacy: 'custom-parapharmacy',
  dessert: 'custom-patisserie',
  patisserie: 'custom-patisserie',
  supermarket: 'custom-supermarket',
  shop: 'custom-shop',
};

/** Visuels des pharmacies : photo unique en local. */
const PHARMACY_COVER_POOL = ['/chain-img/pharmacie.jpg'];

/** Point de référence Alliance / CHU Tanger pour les distances. */
const ALLIANCE_REF = { lat: 35.7595, lng: -5.83395 };

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (Number(d) * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceKm(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return '';
  const km = haversineKm(ALLIANCE_REF.lat, ALLIANCE_REF.lng, la, lo);
  if (!Number.isFinite(km)) return '';
  return `≈ ${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

function pharmacyCoverFor(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PHARMACY_COVER_POOL[h % PHARMACY_COVER_POOL.length];
}

/** Transforme une pharmacie de garde (API) en objet affichable comme une carte. */
export function toDutyPharmacyItem(p) {
  const guard = p.guard === '24h' ? '24h' : p.guard || '24h';
  const dist = formatDistanceKm(p.lat, p.lng);
  return {
    id: `duty-${p.slug || p.id}`,
    name: p.name,
    nameAr: p.name_ar || '',
    addressAr: p.address_ar || '',
    cuisine: 'pharmacy',
    isStatic: true,
    isDutyPharmacy: true,
    isOpen: true,
    rating: 4.9,
    logo: '💊',
    cover: pharmacyCoverFor(p.slug || String(p.id)),
    description: 'Pharmacie de garde. Dites-nous ce que vous cherchez, notre livreur s\u2019occupe de tout !',
    tags: [`Garde ${guard === '24h' ? '24H' : guard === 'night' ? 'de nuit' : 'de jour'}`],
    distance: dist || '',
    address: p.address || '',
    phone: p.phone || '',
    lat: p.lat,
    lng: p.lng,
    guard,
    hoursLabel: p.hours_label || '',
    fee: '20 DH',
  };
}

/** Extrait la partie française des horaires de garde (le label brut contient FR + AR). */
function frDutyHours(label) {
  const s = String(label || '');
  const m = s.match(/^[^\u0600-\u06FF]+/);
  return (m ? m[0] : s).trim();
}

const CATEGORY_GLOW = {
  pizza: '#f97316',
  tacos: '#d97706',
  kebab: '#ea580c',
  healthy: '#10b981',
  burger: '#f59e0b',
  sushi: '#ec4899',
  asian: '#a855f7',
  medical: '#0ea5e9',
  dessert: '#ec4899',
  pharmacy: '#10b981',
  parapharmacy: '#34d399',
  supermarket: '#06b6d4',
  shop: '#c084fc',
  drinks: '#06b6d4',
};

function BrowseHero({ name, search, onSearchChange, openCount, totalCount }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(249,115,22,0.22),transparent_55%),radial-gradient(90%_70%_at_100%_10%,rgba(236,72,153,0.16),transparent_50%),radial-gradient(70%_60%_at_50%_100%,rgba(139,92,246,0.12),transparent_55%)] dark:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(249,115,22,0.28),transparent_55%),radial-gradient(90%_70%_at_100%_10%,rgba(236,72,153,0.18),transparent_50%),radial-gradient(70%_60%_at_50%_100%,rgba(139,92,246,0.2),transparent_55%)]"
      />
      <div className="absolute inset-0 bg-white/55 dark:bg-ink-950/70 pointer-events-none" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-6 sm:pt-8 sm:pb-8">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-900 text-white dark:bg-white dark:text-ink-950 text-xs font-bold shadow-sm">
            <I.MapPin size={13} />
            Alliance · CHU
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {openCount} ouverts
            {totalCount ? <span className="text-ink-400 font-semibold">/ {totalCount}</span> : null}
          </span>
        </div>

        <h1 className="font-display font-black tracking-tight text-[2.15rem] sm:text-4xl lg:text-5xl leading-[1.05] text-ink-900 dark:text-white max-w-3xl">
          <span className="block text-gradient text-[0.72em] sm:text-[0.78em] mb-1">YoHa</span>
          {timeGreeting()}, {name}
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-ink-500 dark:text-ink-400 max-w-xl">
          Livraison offerte · frais offerts sur toute l&apos;Alliance Tangéroise
        </p>

        <div className="mt-5 sm:mt-6">
          <SearchBar value={search} onChange={onSearchChange} variant="hero" />
        </div>
      </div>
    </section>
  );
}

function FeaturedSpotlight({ restaurant, onClick }) {
  const tags = Array.isArray(restaurant.tags) ? restaurant.tags : [];
  const open = isRestaurantOpen(restaurant);

  return (
    <Reveal>
      <Tilt max={3} className="rounded-[2rem]">
        <button
          type="button"
          onClick={onClick}
          className="cursor-grow group relative w-full text-left overflow-hidden rounded-[2rem] border border-brand-500/20 shadow-glow-lg transition-shadow duration-500 hover:shadow-glow card-glow-hover"
          style={{ '--glow-color': 'rgba(249,115,22,0.45)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-transparent z-10" />
          <img
            src={restaurantCover(restaurant.cover)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          {/* Animated gradient mesh visible only on hover */}
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.15)_0%,rgba(236,72,153,0.1)_30%,transparent_50%)] animate-rotate-slow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />

          <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6 p-6 sm:p-8 min-h-[220px] sm:min-h-[260px] w-full">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-brand-500 via-pink-500 to-brand-600 text-white border border-white/25 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-border-glow">
                <I.Flame size={12} className="animate-pulse text-yellow-300" /> Coup de cœur
              </span>
              <h3 className="mt-4 font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-none text-glow-slow">{restaurant.name}</h3>
              <p className="mt-2 text-sm sm:text-base text-white/75 line-clamp-2">{formatTags(tags, ' · ')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {restaurant.promo && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-white border border-white/20">
                    🎁 {restaurant.promo}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  open
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-100 border-amber-400/30'
                }`}>
                  {open ? '● Ouvert' : 'Fermé'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/90 border border-white/15">
                  <I.MapPin size={12} className="inline mr-1" />{restaurant.distance}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto sm:shrink-0">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/90 shadow-lg bg-white shrink-0">
                <img src={restaurantLogo(restaurant.logo)} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-ink-900 font-extrabold text-sm group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors shadow-xl w-full sm:w-auto border border-white/20 select-none">
                Voir le menu <I.Right size={16} />
              </span>
            </div>
          </div>
        </button>
      </Tilt>
    </Reveal>
  );
}

export function Home({ onPickRestaurant, initialFilter = 'all' }) {
  const { user } = useAuth();
  const { restaurants: catalog, loadingRestaurants, restaurantsError, refreshRestaurants } = useOrders();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(() => normalizeBrowseFilter(initialFilter));
  const [dutyPharmacies, setDutyPharmacies] = useState([]);

  const router = useRouter();
  const applyFilter = useCallback(
    (f) => {
      const next = normalizeBrowseFilter(f);
      setFilter(next);
      const url = browsePathForFilter(next);
      if (typeof window !== 'undefined' && url !== window.location.pathname + window.location.search) {
        router.push(url);
      }
    },
    [router]
  );

  useEffect(() => {
    setFilter(normalizeBrowseFilter(initialFilter));
  }, [initialFilter]);

  useEffect(() => {
    let cancelled = false;
    pharmaciesApi
      .duty()
      .then((list) => {
        if (!cancelled) setDutyPharmacies(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setDutyPharmacies([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const customResto = useMemo(() => STATIC_STORES.find((s) => s.id === 'custom-restaurant'), []);

  /** Catalogue complet searchable : restos API + magasins statiques + pharmacies de garde. */
  const searchPool = useMemo(() => {
    const seen = new Set();
    const out = [];
    const push = (r) => {
      if (!r?.name) return;
      const key = String(r.id || r.slug || r.name).toLowerCase().trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(r);
    };
    (catalog || []).forEach(push);
    (STATIC_STORES || []).forEach(push);
    (dutyPharmacies || []).map(toDutyPharmacyItem).forEach(push);
    return out;
  }, [catalog, dutyPharmacies]);

  const searchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    return searchPool.filter((r) => matchesBrowseSearch(r, q));
  }, [search, searchPool]);

  const loading = loadingRestaurants && !['dessert', 'pharmacy', 'parapharmacy', 'supermarket', 'shop'].includes(filter);
  const name = greetingName(user);
  const filterLabel = filter === 'all' ? 'Tous les partenaires' : CUISINES.find((c) => c.id === filter)?.label;

  const openCount = useMemo(
    () => catalog.filter((r) => isRestaurantOpen(r)).length,
    [catalog],
  );

  const featured = useMemo(() => {
    const openList = catalog.filter((r) => isRestaurantOpen(r));
    return openList.find((r) => r.promo) || openList[0] || catalog[0] || null;
  }, [catalog]);

  const showFeatured = featured && filter === 'all' && !search.trim();

  const categoryContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateScrollArrows = () => {
    const el = categoryContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 5);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    const el = categoryContainerRef.current;
    if (!el) return;

    updateScrollArrows();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollArrows();
      });
      resizeObserver.observe(el);
      if (el.firstElementChild) {
        resizeObserver.observe(el.firstElementChild);
      }
    }

    const handleScroll = () => {
      updateScrollArrows();
    };

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      el.removeEventListener('scroll', handleScroll);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [catalog]);

  const scrollCategories = (direction) => {
    const el = categoryContainerRef.current;
    if (!el) return;
    const scrollAmount = 320;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Food partners from catalog (exclude pharmacies / supermarchés / shops only)
  const foodRestaurants = useMemo(() => {
    const nonFoodCuisines = ['pharmacy', 'parapharmacy', 'supermarket', 'shop'];
    const seen = new Set();
    return catalog.filter((r) => {
      if (!r || !r.name) return false;
      if (nonFoodCuisines.includes(r.cuisine)) return false;
      const key = r.id || r.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [catalog]);

  const [homeSeed, setHomeSeed] = useState(0);
  useEffect(() => {
    setHomeSeed(Date.now() + Math.random());
  }, []);

  // Toujours ouverts d'abord (surtout quand beaucoup sont fermés).
  const prioritizeOpen = true;
  const prioritizedFoodRestaurants = useMemo(
    () => prioritizeOpenFirst(shuffleWithSeed(foodRestaurants, homeSeed + 11), true),
    [foodRestaurants, homeSeed],
  );

  const openNowList = useMemo(
    () => shuffleWithSeed(foodRestaurants.filter((r) => isRestaurantOpen(r)), homeSeed + 21),
    [foodRestaurants, homeSeed],
  );

  /** Rails curated sans doublon entre elles (hors cuisines & grille finale). */
  const homeRails = useMemo(() => {
    const used = new Set();
    const shuffled = shuffleWithSeed(foodRestaurants, homeSeed + 31);

    // 1) Ouverts maintenant — priorité absolue
    const openRail = [];
    for (const r of openNowList) {
      const k = restoKey(r);
      if (!k || used.has(k)) continue;
      used.add(k);
      openRail.push(r);
    }

    // 2) Mieux notés (parmi le reste)
    const topRail = takeUnique(
      shuffled.filter((r) => ratingOf(r) >= 4.5).sort((a, b) => ratingOf(b) - ratingOf(a)),
      used,
      8,
    );

    // 3) Offres / promo
    const promoRail = takeUnique(
      shuffled.filter((r) => r.promo || (Array.isArray(r.offers) && r.offers.some((o) => o?.is_active !== false))),
      used,
      8,
    );

    // 4) À découvrir — restos pas encore montrés (souvent fermés mais utiles)
    const discoverRail = takeUnique(shuffled, used, 10);

    return { openRail, topRail, promoRail, discoverRail, used };
  }, [foodRestaurants, openNowList, homeSeed]);

  const freeDeliveryList = prioritizedFoodRestaurants;
  const featuredList = homeRails.openRail;
  const popularRestaurants = homeRails.openRail.length ? homeRails.openRail : prioritizedFoodRestaurants;
  const fastDelivery = homeRails.discoverRail;
  const promoRestaurants = homeRails.promoRail.length ? homeRails.promoRail : prioritizedFoodRestaurants.filter((r) => r.promo);
  const topRatedList = homeRails.topRail.length
    ? homeRails.topRail
    : prioritizeOpenFirst(
        [...foodRestaurants].sort((a, b) => ratingOf(b) - ratingOf(a)).filter((r) => ratingOf(r) >= 4.5),
        true,
      );
  const favoritesList = homeRails.discoverRail;

  const matchCuisine = (r, predicates) => predicates.some((fn) => fn(r));
  const burgerList = useMemo(() => prioritizeOpenFirst(foodRestaurants.filter((r) => matchCuisine(r, [
    (x) => x.cuisine === 'burger',
    (x) => x.tags?.includes('Burgers') || x.tags?.includes('Burger'),
    (x) => x.name.toLowerCase().includes('burger'),
  ])), true), [foodRestaurants]);
  const pizzaList = useMemo(() => prioritizeOpenFirst(foodRestaurants.filter((r) => matchCuisine(r, [
    (x) => x.cuisine === 'pizza',
    (x) => x.tags?.includes('Pizza'),
    (x) => x.name.toLowerCase().includes('pizza'),
  ])), true), [foodRestaurants]);
  const asianList = useMemo(() => prioritizeOpenFirst(foodRestaurants.filter((r) => matchCuisine(r, [
    (x) => x.cuisine === 'sushi' || x.cuisine === 'asian',
    (x) => x.tags?.includes('Sushi') || x.tags?.includes('Japonais'),
    (x) => /sushi|wok|asian|japonais/i.test(x.name),
  ])), true), [foodRestaurants]);
  const tacosList = useMemo(() => prioritizeOpenFirst(foodRestaurants.filter((r) => matchCuisine(r, [
    (x) => x.cuisine === 'tacos',
    (x) => x.tags?.includes('Tacos'),
    (x) => /tacos|wrap/i.test(x.name),
  ])), true), [foodRestaurants]);
  const kebabList = useMemo(() => prioritizeOpenFirst(foodRestaurants.filter((r) => matchCuisine(r, [
    (x) => x.cuisine === 'kebab',
    (x) => x.tags?.includes('Kebab') || x.tags?.includes('Shawarma'),
    (x) => /kebab|shawarma|mevlana|bomo/i.test(x.name),
  ])), true), [foodRestaurants]);
  const sandwichList = useMemo(() => prioritizeOpenFirst(foodRestaurants.filter((r) => matchCuisine(r, [
    (x) => x.cuisine === 'sandwich',
    (x) => x.tags?.includes('Sandwich') || x.tags?.includes('Snack'),
    (x) => /snack|roma|subway|sandwich/i.test(x.name),
  ])), true), [foodRestaurants]);
  const healthyList = useMemo(() => prioritizeOpenFirst(foodRestaurants.filter((r) => matchCuisine(r, [
    (x) => x.cuisine === 'healthy' || x.cuisine === 'medical',
    (x) => x.tags?.includes('Healthy') || x.tags?.includes('Salades'),
    (x) => /healthy|bowl|medeat|salade/i.test(x.name),
  ])), true), [foodRestaurants]);
  const chickenList = useMemo(() => prioritizeOpenFirst(foodRestaurants.filter((r) => matchCuisine(r, [
    (x) => x.cuisine === 'chicken',
    (x) => x.tags?.includes('Chicken') || x.tags?.includes('Poulet'),
    (x) => /chicken|poulet/i.test(x.name),
  ])), true), [foodRestaurants]);

  const dessertItems = useMemo(() => {
    const fromApi = foodRestaurants.filter((r) => r.cuisine === 'dessert' || r.cuisine === 'patisserie');
    const fromStatic = STATIC_STORES.filter((s) => s.cuisine === 'dessert' || s.cuisine === 'patisserie');
    const seen = new Set(fromApi.map((r) => String(r.id || r.slug || '')));
    return [...fromApi, ...fromStatic.filter((s) => !seen.has(String(s.id)))];
  }, [foodRestaurants]);
  const customPharmacy = useMemo(() => STATIC_STORES.find((s) => s.id === 'custom-pharmacy'), []);
  const chainsList = useMemo(() => STATIC_STORES.filter((s) => s.isChain), []);
  const pharmacyItems = useMemo(
    () => [customPharmacy, ...dutyPharmacies.map(toDutyPharmacyItem)].filter(Boolean),
    [customPharmacy, dutyPharmacies],
  );
  const dutyGroups = useMemo(() => {
    const order = ['day', 'night', '24h'];
    const titles = { day: 'GARDE DE JOUR', night: 'GARDE DE NUIT', '24h': 'GARDE 24H' };
    const items = dutyPharmacies.map(toDutyPharmacyItem);
    return order
      .map((guard) => {
        const list = items.filter((it) => it.guard === guard);
        if (!list.length) return null;
        return { guard, title: titles[guard], hours: frDutyHours(list[0].hoursLabel), items: list };
      })
      .filter(Boolean);
  }, [dutyPharmacies]);
  const paraItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'parapharmacy'), []);
  const marketItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'supermarket'), []);
  const shopItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'shop'), []);

  const displayedList = useMemo(() => {
    if (filter === 'offers') return promoRestaurants.length ? promoRestaurants : prioritizedFoodRestaurants;
    if (filter === 'popular') return popularRestaurants;
    if (filter === 'fast') return fastDelivery.length ? fastDelivery : prioritizedFoodRestaurants;
    if (filter === 'free_delivery') return prioritizedFoodRestaurants;
    if (filter === 'top_rated') return topRatedList.length ? topRatedList : prioritizedFoodRestaurants;
    if (filter === 'favorites') return favoritesList.length ? favoritesList : prioritizedFoodRestaurants;
    if (filter === 'burgers_sec') return burgerList.length ? burgerList : prioritizeOpenFirst(foodRestaurants.filter(r => r.cuisine === 'burger'), prioritizeOpen);
    if (filter === 'pizzas_sec') return pizzaList.length ? pizzaList : prioritizeOpenFirst(foodRestaurants.filter(r => r.cuisine === 'pizza'), prioritizeOpen);
    if (filter === 'asian_sec') return asianList.length ? asianList : prioritizeOpenFirst(foodRestaurants.filter(r => r.cuisine === 'sushi' || r.cuisine === 'asian'), prioritizeOpen);
    if (filter === 'tacos_sec') return tacosList.length ? tacosList : prioritizedFoodRestaurants;
    if (filter === 'kebab_sec') return kebabList.length ? kebabList : prioritizedFoodRestaurants;
    if (filter === 'sandwich_sec') return sandwichList.length ? sandwichList : prioritizedFoodRestaurants;
    if (filter === 'healthy_sec') return healthyList.length ? healthyList : prioritizedFoodRestaurants;
    if (filter === 'chicken_sec') return chickenList.length ? chickenList : prioritizedFoodRestaurants;
    if (filter === 'dessert' || filter === 'patisserie') return dessertItems;
    if (filter === 'pharmacy') return pharmacyItems;
    if (filter === 'parapharmacy') return paraItems;
    if (filter === 'supermarket') return marketItems;
    if (filter === 'shop') return shopItems;
    if (SUB_BY_ID[filter]) {
      const sub = SUB_BY_ID[filter];
      const pool = sub.group === 'dessert' || sub.group === 'patisserie'
        ? dessertItems
        : sub.group === 'parapharmacy'
          ? paraItems
          : sub.group === 'supermarket'
            ? marketItems
            : shopItems;
      const matched = pool.filter(r => Array.isArray(r.tags) && r.tags.some(t => sub.match.some(k => norm(t).includes(k))));
      return matched.length ? matched : pool;
    }
    if (['pizza', 'tacos', 'kebab', 'healthy', 'burger', 'sushi', 'asian', 'sandwich', 'grillades', 'breakfast', 'snacks', 'moroccan', 'shawarma', 'bakery', 'chicken', 'italian', 'sweets'].includes(filter)) {
      return prioritizeOpenFirst(foodRestaurants.filter(r =>
        r.cuisine === filter ||
        (Array.isArray(r.tags) && r.tags.some(t => {
          const clean = t.toLowerCase().replace(/[^a-z0-9]/g, '');
          return clean === filter || clean === filter.toLowerCase().replace(/[^a-z0-9]/g, '');
        }))
      ), prioritizeOpen);
    }
    if (filter === 'dessert' || filter === 'patisserie') return dessertItems;
    if (filter === 'pharmacy') return pharmacyItems;
    if (filter === 'parapharmacy') return paraItems;
    if (filter === 'supermarket') return marketItems;
    if (filter === 'shop') return shopItems;
    return prioritizeOpenFirst(foodRestaurants.filter(r =>
      filter === 'all' ||
      r.cuisine === filter ||
      (Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase() === filter.toLowerCase()))
    ), prioritizeOpen);
  }, [filter, promoRestaurants, popularRestaurants, fastDelivery, prioritizedFoodRestaurants, topRatedList, favoritesList, burgerList, pizzaList, asianList, dessertItems, pharmacyItems, paraItems, marketItems, shopItems, foodRestaurants, prioritizeOpen, tacosList, kebabList, sandwichList, healthyList, chickenList]);

  const cuisineRails = useMemo(() => {
    const rails = [
      { key: 'burger', title: 'Burgers', subtitle: `${burgerList.length} restaurants`, list: burgerList, filterId: 'burgers_sec' },
      { key: 'pizza', title: 'Pizzas', subtitle: `${pizzaList.length} restaurants`, list: pizzaList, filterId: 'pizzas_sec' },
      { key: 'asian', title: 'Asian & Sushi', subtitle: `${asianList.length} restaurants`, list: asianList, filterId: 'asian_sec' },
      { key: 'kebab', title: 'Shawarma & Kebab', subtitle: `${kebabList.length} restaurants`, list: kebabList, filterId: 'kebab_sec' },
      { key: 'tacos', title: 'Tacos & Wraps', subtitle: `${tacosList.length} restaurants`, list: tacosList, filterId: 'tacos_sec' },
      { key: 'sandwich', title: 'Sandwichs & Snacks', subtitle: `${sandwichList.length} restaurants`, list: sandwichList, filterId: 'sandwich_sec' },
      { key: 'healthy', title: 'Bowls & Healthy', subtitle: `${healthyList.length} restaurants`, list: healthyList, filterId: 'healthy_sec' },
      { key: 'chicken', title: 'Poulet & Crispy', subtitle: `${chickenList.length} restaurants`, list: chickenList, filterId: 'chicken_sec' },
    ].filter((rail) => (rail.list || []).length > 0);

    // Prefers rails that still have open restos, then shuffle.
    const withOpen = rails.filter((rail) => rail.list.some((r) => isRestaurantOpen(r)));
    const closedOnly = rails.filter((rail) => !rail.list.some((r) => isRestaurantOpen(r)));
    return [
      ...shuffleWithSeed(withOpen, homeSeed + 77),
      ...shuffleWithSeed(closedOnly, homeSeed + 88),
    ];
  }, [burgerList, pizzaList, asianList, kebabList, tacosList, sandwichList, healthyList, chickenList, homeSeed]);

  const homeSections = useMemo(() => {
    const { openRail, topRail, promoRail, discoverRail } = homeRails;

    const sections = [
      openRail.length > 0 && (
        <HorizontalRow
          key="open-now"
          title="Disponibles maintenant"
          subtitle={`${openRail.length} restaurant${openRail.length > 1 ? 's' : ''}`}
          count={openRail.length}
        >
          {openRail.map((r) => (
            <RestaurantCardHorizontal key={`open-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
          ))}
        </HorizontalRow>
      ),

      chainsList.length > 0 && (
        <HorizontalRow
          key="chains"
          title="Les grandes enseignes"
          subtitle={`${chainsList.length} restaurant${chainsList.length > 1 ? 's' : ''}`}
          count={chainsList.length}
        >
          {chainsList.map((r) => (
            <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
          ))}
        </HorizontalRow>
      ),

      topRail.length > 0 && (
        <HorizontalRow
          key="top"
          title="Coups de cœur"
          subtitle={`${topRail.length} restaurant${topRail.length > 1 ? 's' : ''}`}
          count={topRail.length}
          onSeeAll={() => applyFilter('top_rated')}
        >
          {topRail.map((r) => (
            <RestaurantCardHorizontal key={`top-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
          ))}
        </HorizontalRow>
      ),

      promoRail.length > 0 && (
        <HorizontalRow
          key="promo"
          title="Offres du moment"
          subtitle={`${promoRail.length} restaurant${promoRail.length > 1 ? 's' : ''}`}
          count={promoRail.length}
          onSeeAll={() => applyFilter('offers')}
        >
          {promoRail.map((r) => (
            <RestaurantCardHorizontal key={`promo-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} promo />
          ))}
        </HorizontalRow>
      ),

      discoverRail.length > 0 && (
        <HorizontalRow
          key="discover"
          title="À découvrir"
          subtitle={`${discoverRail.length} restaurant${discoverRail.length > 1 ? 's' : ''}`}
          count={discoverRail.length}
        >
          {discoverRail.map((r) => (
            <RestaurantCardHorizontal key={`disc-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
          ))}
        </HorizontalRow>
      ),

      ...cuisineRails.map((rail) => (
        <HorizontalRow
          key={rail.key}
          title={rail.title}
          subtitle={rail.subtitle}
          count={rail.list.length}
          onSeeAll={() => applyFilter(rail.filterId)}
        >
          {rail.list.slice(0, 8).map((r) => (
            <RestaurantCardHorizontal key={`${rail.key}-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
          ))}
        </HorizontalRow>
      )),

      prioritizedFoodRestaurants.length > 0 && (
        <section key="all-grid" className="px-4 sm:px-0">
          <div className="mb-4">
            <h2 className="font-display font-bold text-lg sm:text-xl text-ink-900 dark:text-white tracking-tight">
              Tous les restaurants
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 font-medium">
              {openRail.length} ouvert{openRail.length > 1 ? 's' : ''} · {prioritizedFoodRestaurants.length} au total
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {prioritizedFoodRestaurants.map((r, i) => (
              <div key={`all-${r.id}`} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <RestaurantCard restaurant={r} onClick={() => onPickRestaurant(r)} />
              </div>
            ))}
          </div>
        </section>
      ),
    ].filter(Boolean);

    return sections;
  }, [
    homeRails,
    chainsList,
    cuisineRails,
    prioritizedFoodRestaurants,
    onPickRestaurant,
    applyFilter,
  ]);

  const isDefault = filter === 'all' && !search.trim();

  return (
    <div className="page-enter">
      <BrowseHero name={name} search={search} onSearchChange={setSearch} openCount={openCount} totalCount={catalog.length} />

      <div className="bg-white dark:bg-ink-950 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6 sm:space-y-7 stagger-children">

          {/* ═══ SMART INTELLIGENT RE-ORDER BANNER ═══ */}
          {!search && <SmartReorderBanner catalog={catalog} onPickRestaurant={onPickRestaurant} />}

          {/* ═══ TOP TABS BAR (6 Main Services) ═══ */}
          {!search && (
            <div className="border-b border-ink-100 dark:border-ink-800 -mx-4 px-4 sm:mx-0 sm:px-0 mb-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-6 text-sm font-bold text-ink-600 dark:text-ink-300 min-w-max">
                {[
                  { id: 'all', label: 'Restos 🍔' },
                  { id: 'pharmacy', label: 'Pharmacies 💊' },
                  { id: 'parapharmacy', label: 'Parapharma 🌿' },
                  { id: 'dessert', label: 'Pâtisseries 🥐' },
                  { id: 'supermarket', label: 'Supermarché 🛒' },
                  { id: 'shop', label: 'Magasins 🛍️' },
                ].map((tab) => {
                  const active = (tab.id === 'all' && (filter === 'all' || filter === 'restaurants')) || filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => applyFilter(tab.id)}
                      className={`py-3 relative transition-colors ${
                        active ? 'text-brand-600 dark:text-brand-400 font-extrabold' : 'hover:text-ink-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {active && (
                        <motion.span
                          layoutId="browse-tab-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 rounded-full"
                          transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ 🔥 OFFRES — IMAGE PROMO BANNERS CAROUSEL ═══ */}
          {!search && (
            <DeliverooPromoBannersCarousel onSelectFilter={applyFilter} />
          )}

          {/* ═══ CUISINE CATEGORIES CAROUSEL (High Quality AI Food Imagery) ═══ */}
          {isDefault && (
            <section className="relative">
              <div className="flex gap-3.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
                {CUISINE_CATEGORIES.map((c) => {
                  const active = filter === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => applyFilter(active ? 'all' : c.id)}
                      className="cursor-pointer shrink-0 flex flex-col items-center gap-2 w-[4.8rem] sm:w-[5.2rem] group"
                    >
                      <div
                        className={`relative w-[4.4rem] h-[4.4rem] sm:w-[4.8rem] sm:h-[4.8rem] rounded-2xl overflow-hidden transition-all duration-300 shadow-md ${
                          active
                            ? 'ring-3 ring-brand-500 scale-105 shadow-xl border-2 border-white'
                            : 'border-2 border-slate-100 dark:border-ink-800 group-hover:border-brand-400 group-hover:shadow-lg group-hover:scale-105'
                        }`}
                      >
                        <MenuItemImage
                          src={c.image}
                          alt={c.label}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className={`absolute inset-0 transition-colors duration-300 ${
                          active ? 'bg-brand-500/10' : 'bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/10'
                        }`} />
                      </div>
                      <span className={`text-xs font-black text-center leading-tight truncate w-full tracking-tight ${
                        active ? 'text-brand-600 dark:text-brand-400 font-extrabold' : 'text-slate-900 dark:text-white font-extrabold'
                      }`}>
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ SUB-CAROUSEL per filter (décoratif, non cliquable) ═══ */}
          {!isDefault && !search.trim() && (() => {
            const items = SUB_CATEGORIES[filter];
            if (!items || items.length === 0) return null;
            return (
              <section className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                {items.map((c, i) => (
                  <div
                    key={c.id}
                    className="shrink-0 flex flex-col items-center gap-2 w-[4.6rem] sm:w-[5rem] group select-none animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                  >
                    <div className="relative w-[4.4rem] h-[4.4rem] sm:w-[4.8rem] sm:h-[4.8rem] rounded-[1.25rem] overflow-hidden shadow-md border-2 border-slate-100 dark:border-ink-800 group-hover:border-brand-400 transition-colors duration-300">
                      <img src={c.image} alt={c.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                    <span className="text-[11px] font-bold text-center leading-tight truncate w-full tracking-tight text-slate-900 dark:text-white">
                      {c.label}
                    </span>
                  </div>
                ))}
              </section>
            );
          })()}

          {/* ═══ FILTERED / CATEGORY GRID VIEW (pas pendant une recherche texte) ═══ */}
          {filter !== 'all' && !search.trim() && (
            <section className="px-4 sm:px-0">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-ink-100 dark:border-ink-800">
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900 dark:text-white flex items-center gap-2">
                    <span>
                      {filter === 'restaurants' ? '🍕 Restaurants' :
                       filter === 'offers' ? '🎁 Offres près de chez vous' :
                       filter === 'popular' ? '🔥 Populaires dans votre quartier' :
                       filter === 'fast' ? '⚡ Frais de livraison tout doux' :
                       filter === 'free_delivery' ? '🛵 Frais de livraison offerts' :
                       filter === 'top_rated' ? '🌟 Mieux notés' :
                       filter === 'favorites' ? '❤️ Favoris les plus populaires' :
                       filter === 'burgers_sec' ? '🍔 Burgers' :
                       filter === 'pizzas_sec' ? '🍕 Pizzas' :
                       filter === 'asian_sec' ? '🍣 Asian & Sushi' :
                       filter === 'dessert' || filter === 'patisserie' ? '🥐 Pâtisseries' :
                       filter === 'pharmacy' ? '💊 Pharmacies' :
                       filter === 'parapharmacy' ? '🌿 Parapharmacies' :
                       filter === 'supermarket' ? '🛒 Supermarchés' :
                       filter === 'shop' ? '🛍️ Magasins' :
                       SUB_BY_ID[filter] ? `${SUB_BY_ID[filter].emoji} ${SUB_BY_ID[filter].label}` :
                       `Résultats pour « ${filter.charAt(0).toUpperCase() + filter.slice(1)} »`}
                    </span>
                  </h2>
                </div>
                {!['pharmacy', 'parapharmacy', 'dessert', 'patisserie', 'supermarket', 'shop'].includes(filter) && (
                  <button
                    type="button"
                    onClick={() => { applyFilter('all'); setSearch(''); }}
                    className="cursor-grow px-3.5 py-2 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-white font-bold text-xs hover:bg-brand-500 hover:text-white active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>Toutes les catégories</span>
                    <span>✕</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)}
                </div>
              ) : filter === 'pharmacy' ? (
                dutyGroups.length || customPharmacy ? (
                  <div className="space-y-10">
                    {customPharmacy && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        <div className="animate-fade-up">
                          <RestaurantCard restaurant={customPharmacy} onClick={() => onPickRestaurant(customPharmacy)} />
                        </div>
                      </div>
                    )}
                    {dutyGroups.map((group) => (
                      <section key={group.guard}>
                        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wide px-3 py-1.5">
                            🕐 {group.title}
                          </span>
                          {group.hours && (
                            <span className="text-xs sm:text-sm font-semibold text-ink-600 dark:text-ink-300">
                              {group.hours}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                          {group.items.map((r, i) => (
                            <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 9) * 55}ms` }}>
                              <RestaurantCard restaurant={r} onClick={() => onPickRestaurant(r)} />
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <EmptyState catalogEmpty={catalog.length === 0} filter={filter || search} onShowAll={() => { applyFilter('all'); setSearch(''); }} />
                )
              ) : displayedList.length === 0 ? (
                <EmptyState catalogEmpty={catalog.length === 0} filter={filter || search} onShowAll={() => { applyFilter('all'); setSearch(''); }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {displayedList.map((r, i) => (
                    <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 9) * 55}ms` }}>
                      <RestaurantCard restaurant={r} onClick={() => onPickRestaurant(r)} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ═══ DEFAULT HOME SECTIONS (DELIVEROO STRUCTURE) ═══ */}
          {filter === 'all' && !search.trim() && (
            <>
              {/* 0. Restaurant sur-mesure (case dédiée, visible dès le haut) */}
              {customResto && (
                <section className="px-4 sm:px-0">
                  <button
                    type="button"
                    onClick={() => onPickRestaurant(customResto)}
                    className="cursor-pointer w-full text-left group"
                  >
                    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border border-brand-500/30 group-hover:border-brand-500/60 group-hover:shadow-xl transition-all">
                      <img
                        src={restaurantCover(customResto.cover)}
                        alt={customResto.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/30" />
                      <div className="relative p-6 sm:p-8 text-white">
                        <span className="inline-flex items-center rounded-full bg-brand-500/20 border border-brand-400/40 text-brand-300 text-[11px] font-bold px-2.5 py-1 uppercase tracking-wide">
                          ✨ Sur-mesure
                        </span>
                        <h2 className="font-display font-black text-2xl sm:text-3xl mt-3">Restaurant sur-mesure</h2>
                        <p className="mt-2 max-w-md text-sm text-ink-200 leading-relaxed">
                          Un resto, un snack ou un plat bien précis en tête ? Dites-nous tout, le livreur y va et vous livre.
                        </p>
                        <span className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-extrabold text-sm shadow-glow group-hover:scale-[1.02] active:scale-95 transition-all">
                          Décrire ma demande <I.Right size={16} />
                        </span>
                      </div>
                    </div>
                  </button>
                </section>
              )}

              {homeSections}

              {/* Search results error */}
              {restaurantsError && <ApiErrorState message={restaurantsError} onRetry={refreshRestaurants} />}
            </>
          )}

          {/* ═══ COMMANDE SUR-MESURE ═══ */}
          {!search.trim() && (
            <section className="px-4 sm:px-0">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-ink-950 via-slate-900 to-ink-950 text-white p-6 sm:p-8 shadow-xl border border-brand-500/40 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex-1">
                  <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-brand-400 block">
                    Tu ne trouves pas ?
                  </span>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white mt-2">
                    Commande sur-mesure
                  </h3>
                  <p className="mt-3 max-w-md text-sm text-ink-300">
                    Dis-nous le commerce et ce que tu veux. Le livreur y va, achète, et te livre. +20 DH.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const customId = CUSTOM_STORE_BY_FILTER[filter] || 'custom-restaurant';
                    const customStore = STATIC_STORES.find((s) => s.id === customId);
                    if (customStore) onPickRestaurant(customStore);
                  }}
                  className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white font-extrabold text-sm shadow-glow hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Décrire ma demande
                </button>
              </div>
            </section>
          )}

          {/* ═══ SEARCH RESULTS ═══ */}
          {search.trim() && (
            <section className="px-4 sm:px-0">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-ink-100 dark:border-ink-800 gap-3">
                <div className="min-w-0">
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900 dark:text-white truncate">
                    Résultats pour « {search.trim()} »
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-ink-500">
                    {loading ? 'Recherche…' : `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="cursor-grow shrink-0 px-3.5 py-2 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-white font-bold text-xs hover:bg-brand-500 hover:text-white active:scale-95 transition-all"
                >
                  Effacer
                </button>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)}
                </div>
              ) : searchResults.length === 0 ? (
                <EmptyState catalogEmpty={false} filter={search} onShowAll={() => { setSearch(''); applyFilter('all'); }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {searchResults.map((r, i) => (
                    <div key={r.id || `${r.name}-${i}`} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 9) * 55}ms` }}>
                      <RestaurantCard restaurant={r} onClick={() => onPickRestaurant(r)} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function HorizontalRow({ title, subtitle, count, children, onSeeAll }) {
  return (
    <Reveal>
      <section className="px-4 sm:px-0">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg sm:text-xl text-ink-900 dark:text-white tracking-tight leading-snug">{title}</h2>
            {subtitle && (
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 font-medium">{subtitle}</p>
            )}
          </div>
          {count > 0 && onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 hover:underline cursor-pointer flex items-center gap-1 active:scale-95 transition-transform shrink-0 mb-0.5"
            >
              <span>Tout voir ({count})</span>
              <span>→</span>
            </button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 snap-x snap-mandatory">
          {children}
        </div>
      </section>
    </Reveal>
  );
}

const CUISINE_GLOW_MAP = {
  pizza: 'from-orange-500 to-red-500',
  tacos: 'from-amber-500 to-orange-500',
  kebab: 'from-red-500 to-pink-500',
  healthy: 'from-emerald-500 to-teal-500',
  burger: 'from-yellow-500 to-amber-500',
  sushi: 'from-pink-500 to-rose-500',
  asian: 'from-purple-500 to-violet-500',
  dessert: 'from-pink-400 to-rose-400',
  patisserie: 'from-pink-400 to-rose-400',
  pharmacy: 'from-emerald-500 to-green-500',
  parapharmacy: 'from-teal-500 to-emerald-500',
  supermarket: 'from-blue-500 to-cyan-500',
  shop: 'from-violet-500 to-purple-500',
};

export function SmartReorderBanner({ catalog = [], onPickRestaurant }) {
  const cartContext = useCart();
  const setCart = cartContext?.setCart;
  const { orders = [] } = useOrders() || {};
  const [lastOrder, setLastOrder] = useState(null);

  const { user } = useAuth() || {};

  useEffect(() => {
    if (orders && orders.length > 0) {
      setLastOrder(orders[0]);
    } else if (!user) {
      try {
        const stored = localStorage.getItem('yoha_last_order');
        if (stored) setLastOrder(JSON.parse(stored));
      } catch {}
    } else {
      setLastOrder(null);
    }
  }, [orders, user]);

  if (!lastOrder) return null;

  const items = lastOrder.items || [];
  const storeKeys = new Map();
  for (const it of items) {
    const n = it.name || it.title || '';
    const bracketed = n.match(/^\[(.+?)\]/);
    const dashed = n.match(/^(.+?)\s+-\s+/);
    let store = '';
    if (bracketed) store = bracketed[1].trim();
    else if (dashed) store = dashed[1].trim();
    else store = it.restaurantName || it.restaurant_name || '';
    if (!store) continue;
    storeKeys.set(store.toLowerCase(), store);
  }
  const storeNames = [...storeKeys.values()];
  const storeName = storeNames.length > 0
    ? (storeNames.length > 2
      ? `${storeNames.slice(0, 2).join(', ')} & ${storeNames.length - 2} autre${storeNames.length - 2 > 1 ? 's' : ''}`
      : storeNames.join(' & '))
    : (lastOrder.restaurantName || lastOrder.restaurant_name || lastOrder.storeName || 'votre restaurant favori');
  const itemsSummary = items.map(i => `${i.name || i.title} (x${i.qty || 1})`).join(', ') || 'Menu sélectionné';
  const totalAmount = Math.round((lastOrder.total || lastOrder.total_amount || 0) * 100) / 100;

  const handleReorderCheckout = () => {
    if (items.length > 0) {
      if (setCart) setCart(items);
      try {
        localStorage.setItem('yoha_cart', JSON.stringify(items));
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open_checkout'));
      }
    }
  };

  const handleNewOrder = () => {
    const found = catalog.find(c => c.name?.toLowerCase() === storeName.toLowerCase() || c.id === lastOrder.restaurantId);
    if (found && onPickRestaurant) {
      onPickRestaurant(found);
    } else if (catalog.length > 0 && onPickRestaurant) {
      onPickRestaurant(catalog[0]);
    }
  };

  return (
    <div className="w-full mb-3 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-ink-950 via-slate-900 to-ink-950 text-white p-3.5 sm:p-5 shadow-xl border border-brand-500/40">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-lg shadow-brand-500/20">
              ⚡
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-brand-300 font-extrabold uppercase tracking-wider block">
                Votre dernière commande
              </span>
              <h3 className="font-display font-black text-sm sm:text-lg text-white truncate leading-tight">
                Recommander chez <span className="text-amber-300 font-extrabold">{storeName}</span> ?
              </h3>
              <p className="text-[11px] sm:text-xs text-ink-300 truncate max-w-md font-medium mt-0.5">
                {itemsSummary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto shrink-0 pt-1 lg:pt-0 border-t border-white/10 lg:border-t-0">
            <button
              type="button"
              onClick={handleReorderCheckout}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white font-extrabold text-xs shadow-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              <span>⚡ Recommander {totalAmount > 0 ? `(${totalAmount.toFixed(2)} MAD)` : ''}</span>
            </button>

            <button
              type="button"
              onClick={handleNewOrder}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center truncate"
            >
              <span>🍽️ Nouvelle commande chez {storeName}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RestaurantCardHorizontal({ restaurant, onClick, promo = false }) {
  const router = useRouter();
  const open = isRestaurantOpen(restaurant);
  const isCustom = restaurant.isCustomRequest;
  const isService = isServiceStore(restaurant);
  const prefetch = () => {
    if (restaurant?.id && !restaurant.isCustomRequest) {
      try { router.prefetch(`/restaurant/${restaurant.id}`); } catch { /* ignore */ }
    }
  };

  return (
    <div
      onClick={onClick}
      onPointerEnter={prefetch}
      onTouchStart={prefetch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
      className="cursor-grow card-glow-hover group relative shrink-0 w-[78vw] max-w-[300px] sm:w-[270px] lg:w-[290px] h-[240px] sm:h-[250px] snap-center overflow-hidden rounded-[1.4rem] sm:rounded-2xl border border-ink-200/60 dark:border-white/[0.08] bg-ink-950 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.5)] hover:shadow-cardhover transition-[box-shadow,border-color,filter] duration-500 active:brightness-95"
    >
      <img
        src={restaurantCover(restaurant.cover)}
        alt={restaurant.name}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08] ${
          restaurant.coverBlend === 'screen' ? 'mix-blend-screen' : ''
        } ${
          !open ? 'filter blur-[2px] grayscale opacity-50' : ''
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />

      {/* Time Badge */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="px-2.5 py-1 rounded-full bg-white text-ink-950 font-extrabold text-xs shadow-md">
          {restaurant.eta || '45-60 min'}
        </span>
      </div>

      {/* Closed overlay */}
      {!open && (
        <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
          <span className="px-3.5 py-1.5 rounded-full bg-black/80 text-white text-xs font-bold border border-white/20 shadow-xl">
            Fermé
          </span>
        </div>
      )}

      {/* Contenu ancré en bas, sur le voile */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col gap-1 text-left text-white z-10">
        <h3 className="font-extrabold text-base truncate transition-colors group-hover:text-brand-400">
          {restaurant.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-white/75 font-medium truncate">
          {restaurant.isChain ? (
            <span className="text-brand-400 font-bold">⚡ Rapide</span>
          ) : isService || isCustom ? null : (
            <>
              <span className="text-amber-300 font-extrabold">★</span>
              <span className="font-bold text-white">{(restaurant.rating ?? 4.4).toString().replace('.', ',')}</span>
              <span>·</span>
              <span>{restaurant.distance || '—'}</span>
              <span>·</span>
              <span className="text-brand-300 font-bold">⚡ Rapide</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs mt-0.5 font-bold">
          {isCustom || isService ? (
            <span className="text-amber-400 text-[11px]">20 MAD de livraison</span>
          ) : (
            <>
              <span className="line-through text-white/40 font-normal">19,99 MAD</span>
              <span className="text-emerald-400 font-bold">0,00 MAD livraison</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RestaurantCardSkeletonHorizontal() {
  return (
    <div className="shrink-0 w-[72vw] sm:w-[270px] lg:w-[290px] h-[210px] sm:h-[230px] relative rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800">
      <div className="absolute inset-0 bg-ink-200 dark:bg-ink-800 skeleton" />
      <div className="absolute inset-x-0 bottom-0 p-3.5 space-y-2">
        <div className="h-4 w-2/3 rounded-lg bg-white/20 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-white/15 animate-pulse" />
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, variant = 'default' }) {
  const [focused, setFocused] = useState(false);
  const isHero = variant === 'hero';

  return (
    <div className={`group relative rounded-2xl transition-all duration-300 ${
      focused 
        ? 'shadow-glow-lg scale-[1.015]' 
        : isHero ? 'shadow-cardhover ring-gradient' : 'shadow-card'
    }`}>
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 transition-opacity duration-300 ${focused ? 'opacity-[0.65] blur-md' : 'opacity-0'}`}
      />
      <div
        className={`relative z-10 flex items-center gap-3 px-4 sm:px-5 h-[3.65rem] sm:h-[3.85rem] rounded-2xl border transition-all duration-300 ${
          isHero
            ? focused
              ? 'bg-white dark:bg-ink-950 border-brand-500 dark:border-brand-500'
              : 'bg-white/95 dark:bg-ink-900/90 backdrop-blur-md border-white/30 dark:border-ink-800'
            : focused
              ? 'bg-white dark:bg-ink-950 border-brand-500 dark:border-brand-500'
              : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-800'
        }`}
      >
        <I.Search size={20} className={`shrink-0 transition-all duration-300 ${focused ? 'text-brand-500 scale-110' : 'text-ink-400'}`} />
        <input
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Pizza, sushi, tacos, bowls…"
          className="relative z-10 flex-1 min-w-0 bg-transparent outline-none placeholder:text-ink-400/70 text-base text-ink-900 dark:text-white"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="cursor-grow relative z-10 p-1.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500 transition-colors"
          >
            <I.X size={16} />
          </button>
        )}
        {!value && isHero && (
          <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-ink-400 px-2 py-1 rounded-lg bg-ink-100/80 dark:bg-ink-800/80 pointer-events-none">
            ⌘K
          </span>
        )}
      </div>
    </div>
  );
}
export function RestaurantPage({ restaurant, onBack, onAdd }) {
  if (!restaurant) return null;
  const r = restaurant;
  const openStatus = r.openingHours ? restaurantOpenStatus(r.openingHours) : { isOpen: true, openLabel: 'Ouvert' };
  const isOpen = r.isOpen ?? openStatus.isOpen ?? true;
  const openLabel = r.openLabel ?? openStatus.openLabel ?? 'Ouvert';
  const [activeCat, setActiveCat] = useState(r.menu?.[0]?.category ?? '');
  const [selectedItem, setSelectedItem] = useState(null);
  const [compactNav, setCompactNav] = useState(false);
  const sectionRefs = useRef({});
  const catsRef = useRef(null);

  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [orderDetails, setOrderDetails] = useState('');
  const [ordonnanceUrl, setOrdonnanceUrl] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  const tags = Array.isArray(r.tags) ? r.tags : [];
  const isDuty = r.isDutyPharmacy;
  const isChain = r.isChain;
  const isServiceDetail = isServiceStore(r) || r.isCustomRequest;
  const needsCustomStoreInfo = r.isCustomRequest && !isChain;
  const dutyHoursFr = frDutyHours(r.hoursLabel);

  const scrollToCat = (cat) => {
    setActiveCat(cat);
    const el = sectionRefs.current[cat];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 118;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    const btn = catsRef.current?.querySelector(`[data-cat="${String(cat).replace(/"/g, '')}"]`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  useEffect(() => {
    if (!r.menu) return;
    const onScroll = () => {
      setCompactNav(window.scrollY > 220);
      const offsets = r.menu.map((c) => ({
        cat: c.category,
        top: sectionRefs.current[c.category]?.getBoundingClientRect().top || 0,
      }));
      const visible = offsets.filter((o) => o.top < 170).pop();
      if (visible) setActiveCat(visible.cat);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [r]);

  const CUISINE_ICONS = {
    pizza: '🍕', tacos: '🌮', kebab: '🥙', sushi: '🍣', burger: '🍔',
    healthy: '🥗', asian: '🥢', dessert: '🍰', drinks: '🥤',
    pharmacy: '💊', parapharmacy: '🌿', supermarket: '🛒', shop: '🛍️', medical: '⚕️',
    patisserie: '🥐',
  };

  const populaires = (r.menu || []).flatMap((c) =>
    (c.items || [])
      .filter((it) => Number(it.price) > 12)
      .slice(0, 3)
      .map((it) => ({ ...it, categoryId: it.categoryId || c.db_id })),
  ).slice(0, 8);

  const feeLabel = r.fee
    ? (r.fee.includes('DH') || r.fee.includes('MAD') || /offerte/i.test(r.fee) ? r.fee : `${r.fee} MAD`)
    : 'Livraison offerte';

  return (
    <div className="page-enter relative min-h-screen bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-ink-950 dark:via-ink-950 dark:to-ink-950 overflow-x-hidden">
      <div className="pointer-events-none absolute top-0 right-[-20%] w-[420px] h-[420px] rounded-full bg-brand-500/[0.08] dark:bg-brand-500/10 blur-[100px]" aria-hidden />
      <div className="pointer-events-none absolute top-[40%] left-[-25%] w-[360px] h-[360px] rounded-full bg-pink-500/[0.06] dark:bg-pink-500/8 blur-[90px]" aria-hidden />
      <div className="yoha-ambient opacity-50" aria-hidden />

      {/* Compact nav on scroll */}
      <div
        className={`fixed top-14 inset-x-0 z-40 transition-all duration-300 ${
          compactNav ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'
        }`}
      >
        <div className="bg-white/90 dark:bg-ink-950/90 backdrop-blur-xl border-b border-ink-100/80 dark:border-ink-800 px-4 py-2.5 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-ink-100 dark:bg-ink-800 flex items-center justify-center shrink-0 active:scale-95"
            title="Retour"
          >
            <I.Left size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-sm text-ink-900 dark:text-white truncate">{r.name}</p>
          </div>
          {!isChain && !isServiceDetail && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <I.Star size={11} className="fill-emerald-500 text-emerald-500" />
              {(r.rating ?? 4.5).toString().replace('.', ',')}
            </span>
          )}
        </div>
      </div>

      {/* HERO — full bleed, brand in the photo */}
      <section
        className={`relative h-[min(62vh,520px)] sm:h-[min(56vh,560px)] overflow-hidden ${
          r.coverBlend === 'screen' ? 'bg-ink-950' : 'bg-ink-200 dark:bg-ink-900'
        }`}
      >
        <img
          src={restaurantCover(r.cover)}
          alt={r.name || ''}
          className={`absolute inset-0 w-full h-full animate-fade-in scale-[1.02] ${
            r.coverBlend === 'screen' ? 'object-contain mix-blend-screen' : 'object-cover'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/80" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-transparent to-pink-500/10 pointer-events-none" />

        <button
          onClick={onBack}
          className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center active:scale-95 transition shadow-lg"
          title="Retour"
        >
          <I.Left size={18} />
        </button>

        {typeof r.logo === 'string' && (r.logo.startsWith('http') || r.logo.startsWith('/')) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/80 shadow-xl bg-white"
          >
            <img src={r.logo} alt="" className="w-full h-full object-cover" />
          </motion.div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 px-5 sm:px-8 pb-8 max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300"
          >
            {formatTag(r.cuisine) || tags[0] || 'Restaurant'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 font-display font-black text-[clamp(2.1rem,8.5vw,3.5rem)] leading-[0.95] tracking-tight text-white"
          >
            {r.name}
          </motion.h1>

          {tags.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-3 text-sm text-white/65"
            >
              {tags.map(formatTag).filter(Boolean).join(' · ')}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white">
              <span className="relative flex h-1.5 w-1.5">
                {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isOpen ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </span>
              {isOpen ? (openLabel || 'Ouvert') : (openLabel || 'Fermé')}
            </span>
            {!isChain && !isServiceDetail && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white">
                <I.MapPin size={11} /> {r.distance || 'Tanger'}
              </span>
            )}
            {!isChain && !isServiceDetail && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/25 backdrop-blur-md border border-emerald-400/30 text-[11px] font-bold text-emerald-100">
                <I.Star size={11} className="fill-emerald-300 text-emerald-300" />
                {(r.rating ?? 4.5).toString().replace('.', ',')}
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-500/35 backdrop-blur-md border border-brand-300/35 text-[11px] font-bold text-brand-50">
              {feeLabel}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/80">
              Min. {formatMad(40, { decimals: 0 })}
            </span>
          </motion.div>

          {(publicRestaurantBio(r.description, r.name) || (!isDuty && r.name)) && (
            <p className="mt-3 text-[13px] text-white/50 leading-relaxed line-clamp-2 max-w-lg">
              {isDuty && dutyHoursFr
                ? dutyHoursFr
                : publicRestaurantBio(r.description, r.name) ||
                  `${r.name}, disponible en livraison directement chez vous ! ${CUISINE_ICONS[r.cuisine] || '🍽️'}`}
            </p>
          )}

          {isDuty && r.phone && (
            <a
              href={`tel:${r.phone.replace(/\s/g, '')}`}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg active:scale-95 transition"
            >
              <I.Phone size={12} /> {r.phone}
            </a>
          )}
        </div>
      </section>

      {/* Offres actives du restaurant */}
      {Array.isArray(r.offers) && r.offers.filter((o) => o.is_active !== false).length > 0 && (
        <div className="relative z-10 -mt-4 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-2">
            {r.offers.filter((o) => o.is_active !== false).map((offer) => (
              <div
                key={offer.id}
                className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm dark:from-amber-500/15 dark:to-orange-500/10 dark:border-amber-500/30"
              >
                <span className="text-xl shrink-0" aria-hidden>
                  {offer.offer_type === 'buy_get_free' ? '🎁' : offer.offer_type === 'min_spend' ? '🎯' : '💰'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-sm text-ink-900 dark:text-white">{offer.title}</p>
                  {offer.description && (
                    <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400 line-clamp-2">{offer.description}</p>
                  )}
                  <p className="mt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    {offer.offer_type === 'percentage' &&
                      `−${offer.discount_percent}% sur ${offerScopeLabel(offer)}`}
                    {offer.offer_type === 'buy_get_free' &&
                      `Achetez ${offer.buy_quantity}, ${offer.get_quantity} offert${Number(offer.get_quantity) > 1 ? 's' : ''}${offer.free_item_name ? ` (${offer.free_item_name})` : ''}`}
                    {offer.offer_type === 'min_spend' &&
                      `Dès ${formatMad(Number(offer.min_amount))} → −${offer.discount_percent}%`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky categories */}
      {!r.isStatic && (r.menu || []).length > 0 && (
        <div className="sticky top-14 z-30 bg-white/85 dark:bg-ink-950/85 backdrop-blur-xl border-b border-ink-100/70 dark:border-ink-800/80">
          <div
            ref={catsRef}
            className="max-w-3xl mx-auto px-3 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar h-[54px] items-center"
          >
            {(r.menu || []).map((c) => {
              const active = activeCat === c.category;
              return (
                <button
                  key={c.category}
                  data-cat={c.category}
                  onClick={() => scrollToCat(c.category)}
                  className={`relative shrink-0 px-4 h-9 rounded-full text-[12px] sm:text-[13px] font-bold whitespace-nowrap transition-all duration-200 ${
                    active
                      ? 'bg-brand-500 text-white shadow-glow dark:bg-brand-500'
                      : 'text-ink-500 dark:text-ink-400 bg-ink-100/70 dark:bg-ink-900 hover:text-ink-800 dark:hover:text-white'
                  }`}
                >
                  {c.category}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!r.isStatic ? (
        <div className="relative max-w-3xl mx-auto px-0 sm:px-6 py-7 pb-36">
          {!isOpen && (
            <div className="mx-4 sm:mx-0 mb-6 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-500/5 px-4 py-3 text-center">
              <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">{openLabel || 'Fermé'}</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-300/70 mt-0.5">
                Consulte le menu, la commande reprend à l&apos;ouverture.
              </p>
            </div>
          )}

          {populaires.length > 0 && (
            <section className="mb-11">
              <div className="px-4 sm:px-0 mb-4">
                <h2 className="font-display font-bold text-lg sm:text-xl text-ink-900 dark:text-white tracking-tight">
                  Populaires
                </h2>
              </div>
              <div className="flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 px-4 sm:px-0">
                {populaires.map((it, i) => (
                  <DeliverooItemCard
                    key={it.db_id || it.id || i}
                    item={it}
                    restaurant={r}
                    onAdd={onAdd}
                    onOpen={() => setSelectedItem(it)}
                    orderingDisabled={!isOpen}
                    compact
                    index={i}
                  />
                ))}
              </div>
            </section>
          )}

          {(r.menu || []).map((cat, catIdx) => (
            <section
              key={cat.category}
              ref={(el) => { sectionRefs.current[cat.category] = el; }}
              className="mb-12 scroll-mt-28"
            >
              <div className="px-4 sm:px-0 mb-4">
                <div className="inline-flex items-baseline gap-2.5 max-w-full flex-wrap">
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.35, delay: Math.min(catIdx * 0.03, 0.15) }}
                    className="font-display font-black text-xl sm:text-2xl text-ink-900 dark:text-white tracking-tight"
                  >
                    {cat.category}
                  </motion.h2>
                  <span className="text-[11px] font-semibold text-ink-400 dark:text-ink-500 shrink-0">
                    {(cat.items || []).length} plat{(cat.items || []).length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-2 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500" />
              </div>
              <div className="px-3 sm:px-0 space-y-2.5">
                {(cat.items || []).map((it, i) => (
                  <DeliverooItemCard
                    key={it.db_id || it.id || i}
                    item={{ ...it, categoryId: it.categoryId || cat.db_id }}
                    restaurant={r}
                    onAdd={onAdd}
                    onOpen={() => setSelectedItem({ ...it, categoryId: it.categoryId || cat.db_id })}
                    orderingDisabled={!isOpen}
                    index={i}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 sm:p-8 shadow-sm">
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-3">
              Commander sur-mesure
            </h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed mb-6">
              {isDuty
                ? "Commandez vos médicaments depuis cette pharmacie de garde, notre livreur s'occupe de tout !"
                : "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !"}
            </p>

            {isDuty && (
              <div className="mb-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/5 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    🕐 {r.guard === '24h' ? 'Garde 24H' : r.guard === 'night' ? 'Garde de nuit' : 'Garde de jour'}
                  </span>
                  {r.phone && (
                    <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                      <I.Phone size={12} /> {r.phone}
                    </a>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <I.MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-700 dark:text-ink-200 leading-relaxed">{r.address}</p>
                </div>
                {dutyHoursFr && (
                  <p className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed border-t border-emerald-100 dark:border-emerald-500/15 pt-2">
                    🕐 {dutyHoursFr}
                  </p>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (needsCustomStoreInfo && (!storeName.trim() || !storeAddress.trim())) {
                  alert("Veuillez renseigner le nom et l'adresse de l'établissement.");
                  return;
                }
                if (!orderDetails.trim()) {
                  alert('Veuillez préciser votre commande.');
                  return;
                }
                const targetStoreName = isChain ? r.name : (r.isCustomRequest ? storeName.trim() : r.name);
                // Adresse réelle pour l'itinéraire livreur (pas la distance type « 2.8 km »).
                const targetStoreAddress = r.isCustomRequest
                  ? storeAddress.trim()
                  : ((r.address || '').trim() || 'Tanger');
                const customItem = {
                  id: `custom-${r.id}-${Date.now()}`,
                  name: r.isCustomRequest || isDuty
                    ? `[${targetStoreName}] ${orderDetails.trim()}`
                    : `${r.name} - ${orderDetails.trim()}`,
                  price: 0,
                  img: r.isChain && r.cover ? r.cover :
                    r.cuisine === 'pharmacy' ? 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=500&auto=format&fit=crop&q=75' :
                    r.cuisine === 'parapharmacy' ? 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75' :
                    r.cuisine === 'supermarket' ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=75' :
                    r.cuisine === 'shop' ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=75' :
                    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75',
                  restaurantId: r.id,
                  restaurantName: targetStoreName,
                  restaurantAddress: targetStoreAddress,
                  restaurantCuisine: r.cuisine,
                  isCustom: true,
                  customDetails: {
                    storeName: targetStoreName,
                    storeAddress: targetStoreAddress,
                    details: orderDetails.trim(),
                    ordonnanceUrl: r.cuisine === 'pharmacy' ? ordonnanceUrl : '',
                  },
                };
                onAdd(customItem, { id: r.id, name: targetStoreName });
                setOrderDetails('');
                setOrdonnanceUrl('');
                if (r.isCustomRequest) {
                  setStoreName('');
                  setStoreAddress('');
                }
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
              }}
              className="space-y-4"
            >
              {needsCustomStoreInfo && (
                <>
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">Nom de l&apos;établissement *</span>
                    <PlaceAutocomplete
                      value={storeName}
                      onChange={setStoreName}
                      onPick={(place) => { if (place.address) setStoreAddress(place.address); }}
                      mode="name"
                      category={PLACE_CATEGORY[r.cuisine]}
                      placeholder="Ex: Pharmacie du Progrès"
                      className={AUTOCOMPLETE_INPUT_CLASS}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">Adresse *</span>
                    <PlaceAutocomplete
                      value={storeAddress}
                      onChange={setStoreAddress}
                      mode="address"
                      placeholder="Ex: Boulevard Mohammed V, Tanger"
                      className={AUTOCOMPLETE_INPUT_CLASS}
                    />
                  </label>
                </>
              )}
              {isChain && (
                <div className="rounded-xl bg-brand-500/10 border border-brand-500/20 p-3 text-xs text-brand-800 dark:text-brand-300">
                  <p className="font-bold mb-0.5">🏪 {r.name}</p>
                  <p>Le livreur se rendra à la succursale la plus proche à Tanger et achètera votre commande.</p>
                </div>
              )}
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">Détaillez votre commande *</span>
                <textarea
                  required
                  value={orderDetails}
                  onChange={(e) => setOrderDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-ink-900 dark:text-white resize-none"
                  rows={4}
                  placeholder={isChain
                    ? 'Ex: 2 Big Mac, 1 grande frite, 2 boissons…'
                    : r.cuisine === 'pharmacy' || r.cuisine === 'parapharmacy'
                      ? 'Ex: 2 boîtes de Doliprane 1000mg…'
                      : 'Ex: 1 plat de couscous, 2 brochettes…'}
                />
              </label>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-0.5">💵 Frais de livraison fixes : 20 MAD</p>
                <p>Le prix d&apos;achat réel sera ajouté à la livraison.</p>
              </div>
              {r.cuisine === 'pharmacy' && (
                <OrdonnanceUpload value={ordonnanceUrl} onChange={setOrdonnanceUrl} />
              )}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-900 hover:bg-brand-500 dark:hover:bg-brand-500 dark:hover:text-white font-bold transition shadow-md active:scale-[0.98]"
              >
                <I.Bag size={18} />
                {isAdded ? 'Ajouté ! ✓' : 'Ajouter à mon panier'}
              </button>
            </form>
          </div>
        </section>
      )}

      {selectedItem && (
        <MenuItemDetailModal
          item={selectedItem}
          restaurant={r}
          onClose={() => setSelectedItem(null)}
          onAdd={onAdd}
          orderingDisabled={!isOpen}
        />
      )}
    </div>
  );
}

function DeliverooItemCard({ item, restaurant, onAdd, onOpen, orderingDisabled = false, compact = false, index = 0 }) {
  const [adding, setAdding] = useState(false);
  const priced = withItemOfferPricing(item, restaurant);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (orderingDisabled) return;
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      onOpen?.();
      return;
    }
    onAdd(item, restaurant);
    setAdding(true);
    setTimeout(() => setAdding(false), 1200);
  };

  const priceBlock = (
    <div className="flex items-center gap-2 flex-wrap">
      {priced.discountPercent ? (
        <>
          <span className="font-display font-black text-emerald-600 dark:text-emerald-400">
            {formatMad(priced.price)}
          </span>
          <span className="text-xs text-ink-400 line-through font-semibold">
            {formatMad(priced.originalPrice)}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500 text-white">
            −{priced.discountPercent}%
          </span>
        </>
      ) : (
        <span className="font-display font-black">{formatMad(item.price)}</span>
      )}
    </div>
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onOpen?.()}
        className="yoha-card-cv cursor-grow shrink-0 w-[78vw] max-w-[300px] sm:w-[250px] snap-center text-left group animate-fade-up"
      >
        <div className="relative rounded-[1.35rem] overflow-hidden aspect-[5/4] bg-ink-100 dark:bg-ink-800 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] dark:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.65)] ring-1 ring-ink-200/60 dark:ring-white/10">
          <MenuItemImage
            src={item.img}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent" />
          {priced.discountPercent ? (
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
              −{priced.discountPercent}%
            </span>
          ) : (
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/80 dark:bg-ink-900/80 text-[9px] font-bold uppercase tracking-wider text-brand-600/90 dark:text-brand-400/90 backdrop-blur-sm border border-brand-500/15">
              Top
            </span>
          )}
          {!orderingDisabled && (
            <button
              type="button"
              onClick={handleAdd}
              className={`absolute top-3 right-3 w-11 h-11 rounded-full grid place-items-center text-lg font-black shadow-lg transition-all ${
                adding
                  ? 'bg-emerald-500 text-white scale-110'
                  : 'bg-white text-ink-900 active:scale-90 dark:bg-ink-900 dark:text-white'
              }`}
            >
              {adding ? '✓' : '+'}
            </button>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-display font-bold text-[16px] text-white leading-tight line-clamp-2 drop-shadow">
              {item.name}
            </h3>
            <div className="mt-1.5 text-sm text-brand-300 [&_*]:text-brand-300 [&_.line-through]:text-white/60 [&_.bg-emerald-500]:bg-emerald-500">
              {priceBlock}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.();
        }
      }}
      className="yoha-card-cv flex gap-3.5 p-3 rounded-2xl bg-white/95 dark:bg-ink-900/85 ring-1 ring-ink-100 dark:ring-ink-800 shadow-sm hover:shadow-cardhover hover:ring-brand-500/25 active:brightness-95 transition-all duration-300 cursor-grow group animate-fade-up"
    >
      <div className="shrink-0 w-[112px] h-[112px] sm:w-[124px] sm:h-[124px] rounded-xl overflow-hidden bg-ink-100 dark:bg-ink-800 relative shadow-sm">
        <MenuItemImage
          src={item.img}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <h3 className="font-display font-bold text-[15px] sm:text-base text-ink-900 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {item.name}
        </h3>
        {item.desc && item.desc.trim() !== item.name ? (
          <p className="text-[12px] text-ink-400 dark:text-ink-500 line-clamp-2 mt-1.5 leading-relaxed">{item.desc}</p>
        ) : null}
        <div className="mt-auto pt-2.5 flex items-center gap-2 flex-wrap">
          {priced.discountPercent ? (
            <>
              <span className="font-display font-black text-[15px] text-emerald-600 dark:text-emerald-400">
                {formatMad(priced.price)}
              </span>
              <span className="text-xs text-ink-400 line-through font-semibold">
                {formatMad(priced.originalPrice)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500 text-white">
                −{priced.discountPercent}%
              </span>
            </>
          ) : (
            <span className="font-display font-black text-[15px] text-ink-900 dark:text-white">
              {formatMad(item.price)}
            </span>
          )}
          {!orderingDisabled && (
            <button
              type="button"
              onClick={handleAdd}
              className={`ml-auto w-11 h-11 rounded-full grid place-items-center text-base font-black shadow-md transition-all ${
                adding
                  ? 'bg-emerald-500 text-white scale-110'
                  : 'bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:bg-brand-500 dark:hover:bg-brand-500 dark:hover:text-white active:scale-90'
              }`}
            >
              {adding ? '✓' : '+'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export function MenuItem({ item, restaurant, onAdd, onOpen, orderingDisabled = false }) {
  const [adding, setAdding] = useState(false);
  const imgRef = useRef();
  const priced = withItemOfferPricing(item, restaurant);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (orderingDisabled) return;
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      onOpen?.();
      return;
    }
    onAdd(item, restaurant, imgRef.current);
    setAdding(true);
    setTimeout(() => setAdding(false), 1200);
  };

  const isBestseller = Number(item.price) > 80;
  const itemGlow = CATEGORY_GLOW[restaurant.cuisine] || '#f97316';

  return (
    <Tilt max={4} className="rounded-2xl">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); } }}
        style={{ '--glow-color': itemGlow }}
        className="cursor-grow group relative bg-white dark:bg-ink-900 rounded-2xl overflow-hidden border border-ink-200/50 dark:border-ink-800/80 shadow-card hover:shadow-cardhover transition-all duration-300 spotlight hover:border-brand-500/20 card-glow-hover"
        onMouseMove={spotlightHandler}
      >
        <div className="flex p-3 gap-3">
          <div ref={imgRef} className="menu-img relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-sm border border-ink-100 dark:border-ink-900">
            <MenuItemImage src={item.img} alt={item.name} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700" />
            {priced.discountPercent ? (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500 text-white shadow-md tracking-wider">
                −{priced.discountPercent}%
              </span>
            ) : isBestseller ? (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-glow tracking-wider animate-pulse">
                Populaire
              </span>
            ) : null}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="font-display font-bold text-sm sm:text-base leading-tight text-ink-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{item.name}</h3>
            <p className="mt-1 text-[11px] sm:text-xs text-ink-500 dark:text-ink-400 line-clamp-2 leading-relaxed">{item.desc}</p>
            <div className="mt-auto pt-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                {priced.discountPercent ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-display font-black text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                      {formatMad(priced.price)}
                    </span>
                    <span className="text-xs text-ink-400 line-through font-semibold">
                      {formatMad(priced.originalPrice)}
                    </span>
                  </div>
                ) : (
                  <div className="font-display font-black text-base sm:text-lg text-ink-900 dark:text-white">{formatMad(item.price)}</div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={orderingDisabled}
                title={orderingDisabled ? 'Restaurant fermé' : 'Ajouter au panier'}
                className={`cursor-grow relative w-10 h-10 rounded-xl grid place-items-center transition-transform shrink-0 ${
                  orderingDisabled
                    ? 'bg-ink-200 text-ink-400 dark:bg-ink-800 dark:text-ink-500 cursor-not-allowed'
                    : adding
                      ? 'bg-emerald-500 text-white shadow-glow scale-110'
                      : 'bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white active:scale-95 shadow-md'
                }`}
              >
                {adding ? <I.Check size={18} stroke={3}/> : <I.Plus size={18} stroke={3}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Tilt>
  );
}

/** Boutiques sans menu sync (sur-mesure / listing statique). */
const SERVICE_CUISINES = ['pharmacy', 'parapharmacy', 'supermarket', 'shop'];
/** Pâtisseries du listing Google Maps — pas les desserts partenaires catalogue. */
const STATIC_DESSERT_CUISINES = ['dessert', 'patisserie'];

function isServiceStore(r) {
  if (!r || r.isCustomRequest) return false;
  if (SERVICE_CUISINES.includes(r.cuisine)) return true;
  // Restos dessert catalogue (menu + rating + distance) = cartes partenaires normales
  if (STATIC_DESSERT_CUISINES.includes(r.cuisine) && r.isStatic) return true;
  return false;
}

export function RestaurantCard({ restaurant, onClick }) {
  const router = useRouter();
  const open = isRestaurantOpen(restaurant);
  const isDuty = restaurant.isDutyPharmacy;
  const isService = isServiceStore(restaurant);
  const prefetch = () => {
    if (restaurant?.id && !restaurant.isCustomRequest) {
      try { router.prefetch(`/restaurant/${restaurant.id}`); } catch { /* ignore */ }
    }
  };

  return (
    <div
      onClick={onClick}
      onPointerEnter={prefetch}
      onTouchStart={prefetch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
      className="cursor-grow card-glow-hover group relative block h-[min(78vw,360px)] sm:h-[320px] w-full overflow-hidden rounded-[1.6rem] sm:rounded-3xl border border-ink-200/60 dark:border-white/[0.08] bg-ink-950 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.55)] hover:shadow-cardhover transition-[box-shadow,border-color,filter] duration-500 active:brightness-95"
    >
      <img
        src={restaurantCover(restaurant.cover)}
        alt={restaurant.name}
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.1] group-active:scale-105 ${
          restaurant.coverBlend === 'screen' ? 'mix-blend-screen' : ''
        } ${
          !open ? 'filter blur-sm grayscale opacity-70' : ''
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
      <div className="card-shine pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {!open && (
        <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20">
          <span className="bg-ink-950/75 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            Fermé
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5 sm:p-4 z-10">
        {isDuty ? (
          <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-emerald-500 text-white shadow-md">
            🕐 GARDE {restaurant.guard === 'night' ? 'NUIT' : restaurant.guard === 'day' ? 'JOUR' : '24H'}
          </span>
        ) : restaurant.isCustomRequest ? (
          <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-r from-amber-500 to-brand-500 text-white shadow-md">
            ✨ SUR-MESURE
          </span>
        ) : restaurant.promo && open ? (
          <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-glow animate-pulse-slow">
            🎁 {restaurant.promo}
          </span>
        ) : open ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Ouvert
          </span>
        ) : <span />}

        {!restaurant.isCustomRequest && !isService && (
          <span className="shrink-0 inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white/95 text-emerald-600 text-[10px] sm:text-xs font-bold shadow-sm">
            <I.Star size={11} className="fill-emerald-500 text-emerald-500 sm:w-3 sm:h-3" />{' '}
            {(restaurant.rating ?? 4.8).toString().replace('.', ',')}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 text-white">
        <h3 className="font-display font-black text-[1.25rem] sm:text-xl leading-tight line-clamp-2 transition-colors group-hover:text-brand-300">
          {restaurant.name}
        </h3>
        {isDuty && restaurant.nameAr && (
          <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-white/55 truncate" dir="rtl">
            {restaurant.nameAr}
          </p>
        )}
        {isDuty && restaurant.address && (
          <p className="mt-1 text-[11px] sm:text-xs text-white/70 line-clamp-2 leading-snug">
            {restaurant.address}
          </p>
        )}
        {restaurant.subtitle && (
          <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-white/55 truncate">
            {restaurant.subtitle}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2 text-[11px] sm:text-xs text-white/70 truncate">
          {isDuty ? (
            <>
              {restaurant.phone && <span className="truncate shrink-0">{restaurant.phone}</span>}
              {restaurant.distance && (
                <span className="shrink-0 text-emerald-300 font-bold">{restaurant.distance}</span>
              )}
            </>
          ) : (
            <span className="truncate">{formatTags(restaurant.tags, ' • ')}</span>
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-2 border-t border-white/[0.12] pt-3 text-[11px] sm:text-xs">
          {isDuty || restaurant.isCustomRequest || isService ? (
            <>
              <span className="font-bold text-amber-300 shrink-0">20 MAD livraison</span>
              <span className="flex-1" />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-ink-900 font-black text-[10px] sm:text-[11px] shadow-md">
                Commander <I.Right size={11} />
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-white/70 min-w-0">
                <I.MapPin size={12} className="text-white/50 shrink-0" />
                <span className="truncate">{restaurant.distance}</span>
              </span>
              <span className="font-bold text-emerald-400 shrink-0">Livraison offerte</span>
              <span className="flex-1" />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-brand-500 to-pink-500 text-white font-black text-[10px] sm:text-[11px] shadow-glow">
                Voir le menu <I.Right size={11} />
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const DeliverooCard = RestaurantCard;

export function RestaurantSkeleton() {
  return (
    <div className="relative h-[min(78vw,360px)] sm:h-[320px] rounded-[1.6rem] sm:rounded-3xl overflow-hidden border border-ink-200/60 dark:border-ink-800 shadow-sm">
      <div className="absolute inset-0 bg-ink-200 dark:bg-ink-800/50 skeleton"></div>
      <div className="absolute inset-x-0 bottom-0 p-5 space-y-3">
        <div className="h-5 w-2/3 rounded bg-white/20 animate-pulse"></div>
        <div className="h-3.5 w-1/2 rounded bg-white/15 animate-pulse"></div>
      </div>
    </div>
  );
}

export function EmptyState({ catalogEmpty, filter, onShowAll, onOpenCustomModal }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center py-16 px-4 glass-card-premium rounded-3xl border border-ink-200/60 dark:border-ink-800/80 shadow-md">
      <div className="text-5xl sm:text-6xl mb-4 animate-bounce-vertical flex items-center justify-center">🍽️</div>
      <h3 className="font-display font-extrabold text-xl text-ink-900 dark:text-white">
        {catalogEmpty ? "Le catalogue est vide" : "Aucun établissement trouvé"}
      </h3>
      <p className="mt-2 text-sm text-ink-500 max-w-sm leading-relaxed">
        {catalogEmpty 
          ? "Nous n'avons pas pu charger d'établissements. Veuillez vérifier votre connexion."
          : `Aucun partenaire ne correspond à la catégorie "${filter}" ou à votre recherche.`}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {!catalogEmpty && onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="cursor-grow px-4 py-2.5 rounded-xl bg-ink-900 text-white dark:bg-white dark:text-ink-900 font-bold text-xs shadow active:scale-95 transition-transform"
          >
            Voir tous les établissements
          </button>
        )}
        {onOpenCustomModal && (
          <button
            type="button"
            onClick={onOpenCustomModal}
            className="cursor-grow px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 text-white font-bold text-xs shadow-glow active:scale-95 transition-transform"
          >
            🍰 Commander en sur-mesure (+20 MAD)
          </button>
        )}
      </div>
    </div>
  );
}



export function ApiErrorState({ message, onRetry }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center py-12 px-4 bg-red-500/5 rounded-3xl border border-red-500/20 dark:border-red-500/10 shadow-sm">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="font-display font-extrabold text-lg text-red-600 dark:text-red-400">
        Erreur de chargement
      </h3>
      <p className="mt-1.5 text-xs text-ink-500 max-w-md leading-relaxed">
        {message || "Impossible de joindre le serveur. Veuillez réessayer."}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 cursor-grow px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 active:scale-95 transition-transform"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

export function LoyaltyRewardBanner() {
  const { user, login } = useAuth() || {};
  const { orders = [] } = useOrders() || {};

  // Count ONLY orders confirmed delivered by courier (DELIVERED or LIVRÉ or COMPLETED)
  const deliveredOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter(o => o.status === 'DELIVERED' || o.status === 'LIVRÉ' || o.status === 'COMPLETED');
  }, [orders, user]);

  const deliveredCount = deliveredOrders.length;
  const currentStep = deliveredCount % 6;
  const isGoalReached = currentStep === 0 && deliveredCount > 0;
  const activeStepCount = isGoalReached ? 6 : currentStep;
  const remaining = isGoalReached ? 0 : 6 - currentStep;

  if (!user) {
    return (
      <div className="px-4 sm:px-0">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 shadow-lg border border-emerald-400/30">
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🎁
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-emerald-200 block">
                  Offre Récompense Fidélité
                </span>
                <h3 className="font-display font-black text-base sm:text-lg text-white mt-0.5">
                  Connectez-vous pour accumuler vos commandes et recevoir <span className="text-amber-300">-50 MAD</span> !
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => login?.()}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              Se connecter ➔
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 shadow-lg border border-emerald-400/30">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
              🎁
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-emerald-200">
                  Offre Récompense Fidélité
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase">
                  {deliveredCount} commande{deliveredCount > 1 ? 's' : ''} livrée{deliveredCount > 1 ? 's' : ''}
                </span>
              </div>
              
              {isGoalReached ? (
                <h3 className="font-display font-black text-base sm:text-lg text-white mt-0.5">
                  🎉 Félicitations ! Votre réduction de <span className="text-amber-300">-50 MAD</span> est débloquée avec le code YOHA50 !
                </h3>
              ) : (
                <h3 className="font-display font-black text-base sm:text-lg text-white mt-0.5">
                  Encore <span className="underline decoration-amber-400 decoration-2 underline-offset-2">{remaining} commande{remaining > 1 ? 's' : ''}</span> pour avoir <span className="text-amber-300 font-black">-50 MAD</span> !
                </h3>
              )}
            </div>
          </div>

          {/* Connected Circles Deliveroo-style Stamp Indicator */}
          <div className="shrink-0 max-w-full overflow-x-auto no-scrollbar bg-white/95 dark:bg-ink-900/95 text-ink-900 dark:text-white px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl shadow-md border border-white/50 flex items-center gap-1 sm:gap-1.5 self-start sm:self-center">
            {[1, 2, 3, 4, 5, 6].map((step, idx) => {
              const isDone = activeStepCount >= step;
              const isCurrent = !isGoalReached && currentStep + 1 === step;
              return (
                <React.Fragment key={step}>
                  {/* Circle Node */}
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] sm:text-xs transition-all duration-300 ${
                      isDone
                        ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-sm scale-105'
                        : isCurrent
                        ? 'bg-emerald-500/20 border-2 border-amber-400 text-amber-500 dark:text-amber-300 animate-pulse'
                        : 'bg-slate-100 dark:bg-ink-800 border-2 border-slate-300 dark:border-ink-600 text-slate-400 dark:text-ink-400'
                    }`}
                  >
                    {isDone ? (
                      step === 6 ? '🎁' : '✓'
                    ) : (
                      step
                    )}
                  </div>

                  {/* Connecting Line (except after last circle) */}
                  {idx < 5 && (
                    <div
                      className={`h-1 w-1.5 sm:w-3.5 rounded-full transition-colors duration-300 ${
                        activeStepCount > step ? 'bg-amber-400' : 'bg-slate-200 dark:bg-ink-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const PROMO_BANNERS = [
  {
    id: 'promo-1',
    accent: 'from-brand-500 via-pink-500 to-rose-600',
    orb: 'bg-amber-300/40',
    tag: 'Offre de bienvenue',
    title: '50 MAD',
    titleAccent: 'offerts',
    subtitle: 'Sur ta 1ʳᵉ commande Alliance & CHU',
    code: 'YOHA50',
    cta: "J'en profite",
    image: '/promos/promo_bienvenue_50mad.jpg',
    filterId: null,
    promoCode: 'YOHA50',
  },
  {
    id: 'promo-2',
    accent: 'from-violet-600 via-fuchsia-500 to-brand-500',
    orb: 'bg-violet-300/35',
    tag: 'Livraison offerte',
    title: '0 MAD',
    titleAccent: 'de frais',
    subtitle: 'Dès 200 MAD de commande globale',
    code: 'GROUPE0',
    cta: 'Commander',
    image: '/promos/promo_frais_offerts.jpg',
    filterId: null,
    promoCode: 'GROUPE0',
  },
  {
    id: 'promo-4',
    accent: 'from-pink-600 via-rose-500 to-orange-400',
    orb: 'bg-pink-200/40',
    tag: 'Douceurs & desserts',
    title: 'Envie',
    titleAccent: 'glacée ?',
    subtitle: 'Glaces, gaufres & crêpes livrées chaudes',
    code: null,
    cta: 'Voir les douceurs',
    image: '/promos/promo_envie_glacee.jpg',
    filterId: 'dessert',
    promoCode: null,
  },
  {
    id: 'promo-pharma',
    accent: 'from-emerald-600 via-teal-500 to-cyan-500',
    orb: 'bg-emerald-200/40',
    tag: 'Pharmacie de garde',
    title: 'Médicaments',
    titleAccent: '& soins',
    subtitle: 'Pharmacies de garde livrées sur Alliance & CHU',
    code: null,
    cta: 'Voir les pharmacies',
    image: '/chain-img/pharmacie.jpg',
    filterId: 'pharmacy',
    promoCode: null,
  },
  {
    id: 'promo-para',
    accent: 'from-teal-500 via-emerald-400 to-lime-400',
    orb: 'bg-teal-200/35',
    tag: 'Parapharmacie',
    title: 'Beauté',
    titleAccent: '& bien-être',
    subtitle: 'Soins, hygiène et cosmétiques livrés vite',
    code: null,
    cta: 'Voir la para',
    image: '/chain-img/sub-beaute.jpg',
    filterId: 'parapharmacy',
    promoCode: null,
  },
  {
    id: 'promo-market',
    accent: 'from-cyan-600 via-sky-500 to-blue-500',
    orb: 'bg-sky-200/40',
    tag: 'Supermarché',
    title: 'Courses',
    titleAccent: 'du quotidien',
    subtitle: 'Marjane, Carrefour, BIM… livrés à ta chambre',
    code: null,
    cta: 'Faire mes courses',
    image: '/chain-img/market-carrefour.jpg',
    filterId: 'supermarket',
    promoCode: null,
  },
  {
    id: 'promo-shop',
    accent: 'from-violet-600 via-purple-500 to-fuchsia-500',
    orb: 'bg-violet-200/40',
    tag: 'Magasins',
    title: 'Mode',
    titleAccent: '& shopping',
    subtitle: 'Zara, Nike, H&M… on va chercher pour toi',
    code: null,
    cta: 'Voir les magasins',
    image: '/chain-img/shop-zara.jpg',
    filterId: 'shop',
    promoCode: null,
  },
  {
    id: 'promo-5',
    accent: 'from-indigo-600 via-violet-500 to-pink-500',
    orb: 'bg-sky-300/30',
    tag: 'Livraison express',
    title: '4,99 MAD',
    titleAccent: 'express',
    subtitle: 'Dès 120 MAD · livré ultra vite',
    code: null,
    cta: 'Profiter',
    image: '/promos/promo_livraison_express.jpg',
    filterId: 'fast',
    promoCode: null,
  },
  {
    id: 'promo-6',
    accent: 'from-amber-500 via-orange-500 to-pink-500',
    orb: 'bg-amber-200/45',
    tag: 'Fidélité',
    title: '-50 MAD',
    titleAccent: 'fidélité',
    subtitle: 'Après 6 commandes livrées confirmées',
    code: null,
    cta: 'Voir mon solde',
    image: '/promos/promo_recompense_fidelite.jpg',
    filterId: null,
    promoCode: null,
  },
];

export function DeliverooPromoBannersCarousel({ onSelectFilter }) {
  const trackRef = useRef(null);
  const [copiedToast, setCopiedToast] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const { goto } = useYohaNav();

  const scrollNext = () => {
    trackRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const cards = Array.from(el.children);
    if (!cards.length) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActiveIdx(best);
  };

  const handleCardClick = (b) => {
    if (b.id === 'promo-6') {
      goto('my-orders');
      return;
    }
    if (b.promoCode) {
      if (typeof navigator !== 'undefined') {
        navigator.clipboard?.writeText(b.promoCode);
      }
      setCopiedToast(`Code ${b.promoCode} copié`);
      setTimeout(() => setCopiedToast(null), 2500);
    }
    if (b.filterId) {
      onSelectFilter(b.filterId);
    }
  };

  return (
    <section className="relative px-4 sm:px-0">
      {copiedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-black text-sm shadow-glow flex items-center gap-2 animate-bounce-soft border border-white/20">
          <span className="text-base">✓</span>
          <span>{copiedToast}</span>
        </div>
      )}

      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-400">
            Exclusivités
          </p>
          <h2 className="font-display font-black text-[1.65rem] sm:text-3xl text-ink-900 dark:text-white tracking-tight leading-none mt-1">
            Juste pour toi
          </h2>
          <div className="mt-2.5 h-1.5 w-14 rounded-full bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 shadow-glow" />
        </div>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Suivant"
          className="hidden sm:grid place-items-center w-11 h-11 rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 text-brand-600 shadow-card hover:scale-105 active:scale-95 transition"
        >
          →
        </button>
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex gap-3.5 overflow-x-auto no-scrollbar pb-3 snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {PROMO_BANNERS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handleCardClick(b)}
            className="promo-snap yoha-card-cv cursor-pointer shrink-0 w-[82vw] max-w-[300px] sm:w-[280px] md:w-[300px] lg:w-[320px] snap-center text-left group animate-fade-up"
            style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
          >
            <div className="relative h-[200px] sm:h-[190px] md:h-[200px] rounded-[1.5rem] overflow-hidden border border-white/15 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10">
              <img
                src={b.image}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${b.accent} opacity-[0.82] mix-blend-multiply`} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
              <div className={`absolute -top-10 -right-8 w-32 h-32 rounded-full ${b.orb} blur-3xl pointer-events-none`} />
              <div className="card-shine absolute inset-0 opacity-40 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full p-3.5 sm:p-4 overflow-hidden">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="inline-flex items-center max-w-[58%] truncate px-2 py-0.5 rounded-full bg-white/95 text-ink-900 text-[9px] font-black uppercase tracking-[0.12em]">
                    {b.tag}
                  </span>
                  {b.code ? (
                    <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-ink-950/55 backdrop-blur-md border border-white/25 text-white text-[9px] font-black tracking-wide">
                      {b.code}
                      <span className="opacity-80">📋</span>
                    </span>
                  ) : (
                    <span className="w-7 h-7 shrink-0 rounded-full bg-white/15 backdrop-blur-md border border-white/25 grid place-items-center text-white text-xs font-black">
                      →
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-3 min-w-0">
                  <h3 className="font-display font-black text-[1.85rem] sm:text-[1.75rem] md:text-[1.9rem] leading-[0.92] tracking-tight text-white truncate">
                    {b.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] sm:text-[13px] font-extrabold text-white/90 tracking-tight line-clamp-1">
                    {b.titleAccent}
                  </p>
                  <p className="mt-1.5 text-[11px] sm:text-[11px] text-white/75 font-medium leading-snug line-clamp-2">
                    {b.subtitle}
                  </p>

                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-ink-950 font-black text-[11px] sm:text-xs max-w-full">
                    <span className="truncate">{b.cta}</span>
                    <span className="shrink-0 text-brand-600">→</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 sm:hidden" aria-hidden>
        {PROMO_BANNERS.map((b, i) => (
          <span
            key={b.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIdx
                ? 'w-6 bg-gradient-to-r from-brand-500 to-pink-500'
                : 'w-1.5 bg-ink-200 dark:bg-ink-700'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function DeliverooPopularBrandsSection({ restaurants, onPick }) {
  const trackRef = useRef(null);

  const scrollNext = () => {
    trackRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const bgColors = [
    'from-amber-400 to-yellow-500',
    'from-slate-900 to-indigo-950',
    'from-slate-950 to-black',
    'from-rose-600 to-red-700',
    'from-orange-500 to-amber-600',
    'from-emerald-600 to-teal-700',
    'from-violet-600 to-purple-800',
    'from-sky-500 to-blue-700',
  ];

  return (
    <section className="relative px-4 sm:px-0">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-display font-black text-lg sm:text-xl text-ink-900 dark:text-white flex items-center gap-2">
          Marques populaires
        </h2>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {restaurants.map((r, idx) => {
            const bgGrad = bgColors[idx % bgColors.length];
            return (
              <div
                key={`popular-brand-${r.id}`}
                onClick={() => onPick(r)}
                className="cursor-pointer shrink-0 w-[270px] sm:w-[300px] h-[82px] rounded-2xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all flex items-center overflow-hidden group"
              >
                {/* Left Logo Box */}
                <div className={`w-[82px] h-[82px] shrink-0 bg-gradient-to-br ${bgGrad} relative overflow-hidden flex items-center justify-center p-2`}>
                  <img
                    src={r.cover}
                    alt={r.name}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-inner"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>

                {/* Right Info Box */}
                <div className="flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
                  <h3 className="font-extrabold text-sm text-ink-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                    {r.name}
                  </h3>
                  <div className="text-xs font-semibold text-ink-500 dark:text-ink-400 flex items-center gap-1 mt-0.5">
                    <span className="text-amber-500">★</span>
                    <span>{r.rating ?? 4.8}</span>
                    <span>·</span>
                    <span>{r.eta || '45-60 min'}</span>
                  </div>
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 truncate mt-0.5 flex items-center gap-1">
                    <span className="text-xs">%</span>
                    <span>0,00 MAD de livraison</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Next Button Arrow */}
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Suivant"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-ink-800 text-ink-900 dark:text-white shadow-xl border border-ink-100 dark:border-ink-700 items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
        >
          <span className="text-lg font-black text-brand-600 dark:text-brand-400">→</span>
        </button>
      </div>
    </section>
  );
}