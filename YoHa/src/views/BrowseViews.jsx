'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { I } from '../icons/Icons.jsx';
import { CUISINES, CATEGORIES_BANNERS, CATEGORY_GROUPS, CUISINE_CATEGORIES, STATIC_STORES } from '../data/index.js';
import { useOrders, useCart } from '../contexts/AppContexts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Reveal } from '../components/ui/Reveal.jsx';
import { Tilt } from '../components/ui/Tilt.jsx';
import { Magnetic } from '../components/ui/Magnetic.jsx';

import { CategoryCarousel } from '../components/effects/CategoryCarousel.jsx';
import { useYohaNav } from '../contexts/YohaNavContext.jsx';
import { spotlightHandler } from '../utils/spotlight.js';
import { formatMad, restaurantOpenStatus } from '../data/index.js';
import { MenuItemImage, restaurantCover, restaurantLogo } from '../components/ui/MenuItemImage.jsx';
import { MenuItemDetailModal } from '../components/ui/MenuItemDetailModal.jsx';
import { pharmaciesApi } from '../lib/api.js';

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
  const st = restaurantOpenStatus(r.openingHours);
  return r.isOpen ?? st.isOpen;
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

/** Visuels génériques des pharmacies de garde (la source n'a pas de photos par pharmacie). */
const PHARMACY_COVER_POOL = [
  'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1000&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=1000&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1000&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1000&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=1000&auto=format&fit=crop&q=85',
];

function pharmacyCoverFor(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PHARMACY_COVER_POOL[h % PHARMACY_COVER_POOL.length];
}

/** Transforme une pharmacie de garde (API) en objet affichable comme une carte. */
export function toDutyPharmacyItem(p) {
  const guard = p.guard === '24h' ? '24h' : p.guard || '24h';
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
    tags: [`Garde ${guard}`],
    distance: p.address || '',
    address: p.address || '',
    phone: p.phone || '',
    lat: p.lat,
    lng: p.lng,
    guard,
    hoursLabel: p.hours_label || '',
    fee: '20 DH',
  };
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
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 dark:from-ink-950 dark:via-[#0d0704] dark:to-ink-950">
      <div className="absolute top-[-40%] right-[-20%] w-[500px] h-[500px] rounded-full bg-brand-500/[0.06] dark:bg-brand-500/10 blur-[100px] pointer-events-none" aria-hidden />
      <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-pink-500/[0.05] dark:bg-pink-500/8 blur-[80px] pointer-events-none" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4">
        {/* Top bar: Delivery mode + location */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-sm">
              <I.MapPin size={14} className="text-brand-500" />
              <span className="text-sm font-semibold text-ink-900 dark:text-white">CHU-Tanger</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {openCount} ouverts
          </span>
        </div>

        {/* Greeting */}
        <div className="mb-4">
          <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-ink-900 dark:text-white">
            {timeGreeting()},{' '}
            <span className="bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">{name}</span>
            <span className="inline-block ml-1 animate-wiggle">👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
            Livraison · Maintenant · 🏍️ Frais offerts
          </p>
        </div>

        {/* Search */}
        <SearchBar value={search} onChange={onSearchChange} variant="hero" />
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
          onMouseMove={spotlightHandler}
          className="cursor-grow group relative w-full text-left overflow-hidden rounded-[2rem] border border-brand-500/20 shadow-glow-lg spotlight transition-transform duration-500 hover:shadow-glow card-glow-hover"
          style={{ '--glow-color': 'rgba(249,115,22,0.45)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-transparent z-10" />
          <img
            src={restaurantCover(restaurant.cover)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out will-change-transform"
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
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  {open ? '● Ouvert' : '🔒 Fermé'}
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
  const [filter, setFilter] = useState(initialFilter);
  const [dutyPharmacies, setDutyPharmacies] = useState([]);

  useEffect(() => {
    setFilter(initialFilter);
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

  const restaurants = useMemo(() => {
    let list = [...catalog];
    const customResto = STATIC_STORES.find((s) => s.id === 'custom-restaurant');

    if (['dessert', 'pharmacy', 'parapharmacy', 'supermarket', 'shop', 'patisserie'].includes(filter)) {
      list = STATIC_STORES.filter((s) => 
        filter === 'dessert' ? (s.cuisine === 'dessert' || s.cuisine === 'patisserie') : s.cuisine === filter
      );
    } else if (filter === 'all' && customResto) {
      list = [customResto, ...catalog];
    }

    return list.filter((r) => {
      const tags = Array.isArray(r.tags) ? r.tags : [];
      const matchCuisine = filter === 'all' || r.cuisine === filter || r.isCustomRequest ||
        tags.some(t => t.toLowerCase() === filter.toLowerCase());
      const matchSearch =
        !search ||
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        tags.join(' ').toLowerCase().includes(search.toLowerCase());
      return matchCuisine && matchSearch;
    });
  }, [search, filter, catalog]);

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

  // Only real food restaurants (exclude non-food static stores like pharmacy, supermarket, patisserie)
  const foodRestaurants = useMemo(() => {
    const nonFoodCuisines = ['pharmacy', 'parapharmacy', 'supermarket', 'shop', 'dessert', 'patisserie'];
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

  const seedRef = useRef(Date.now() + Math.random());

  const freeDeliveryList = useMemo(() => shuffleWithSeed(foodRestaurants, seedRef.current + 101), [foodRestaurants]);
  const featuredList = useMemo(() => shuffleWithSeed(foodRestaurants, seedRef.current + 202), [foodRestaurants]);
  const popularRestaurants = useMemo(() => shuffleWithSeed(foodRestaurants, seedRef.current + 303), [foodRestaurants]);
  const fastDelivery = useMemo(() => shuffleWithSeed(foodRestaurants, seedRef.current + 404), [foodRestaurants]);
  const promoRestaurants = useMemo(() => shuffleWithSeed(foodRestaurants, seedRef.current + 505), [foodRestaurants]);
  const topRatedList = useMemo(() => shuffleWithSeed(foodRestaurants, seedRef.current + 606), [foodRestaurants]);
  const favoritesList = useMemo(() => shuffleWithSeed(foodRestaurants, seedRef.current + 707), [foodRestaurants]);

  const burgerList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'burger' || r.tags?.includes('Burgers') || r.name.toLowerCase().includes('burger')), [foodRestaurants]);
  const pizzaList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'pizza' || r.tags?.includes('Pizza') || r.name.toLowerCase().includes('pizza')), [foodRestaurants]);
  const asianList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'sushi' || r.cuisine === 'asian' || r.tags?.includes('Sushi') || r.name.toLowerCase().includes('sushi') || r.name.toLowerCase().includes('wok')), [foodRestaurants]);
  const tacosList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'tacos' || r.tags?.includes('Tacos') || r.name.toLowerCase().includes('tacos') || r.name.toLowerCase().includes('wrap')), [foodRestaurants]);
  const kebabList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'kebab' || r.tags?.includes('Kebab') || r.name.toLowerCase().includes('kebab') || r.name.toLowerCase().includes('shawarma') || r.name.toLowerCase().includes('mevlana') || r.name.toLowerCase().includes('bomo')), [foodRestaurants]);
  const sandwichList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'sandwich' || r.tags?.includes('Sandwich') || r.name.toLowerCase().includes('snack') || r.name.toLowerCase().includes('roma') || r.name.toLowerCase().includes('subway')), [foodRestaurants]);
  const healthyList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'healthy' || r.cuisine === 'medical' || r.tags?.includes('Healthy') || r.name.toLowerCase().includes('healthy') || r.name.toLowerCase().includes('bowl') || r.name.toLowerCase().includes('medeat')), [foodRestaurants]);
  const chickenList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'chicken' || r.tags?.includes('Chicken') || r.name.toLowerCase().includes('chicken') || r.name.toLowerCase().includes('poulet')), [foodRestaurants]);

  const dessertItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'dessert' || s.cuisine === 'patisserie'), []);
  const customPharmacy = useMemo(() => STATIC_STORES.find((s) => s.id === 'custom-pharmacy'), []);
  const pharmacyItems = useMemo(
    () => [customPharmacy, ...dutyPharmacies.map(toDutyPharmacyItem)].filter(Boolean),
    [customPharmacy, dutyPharmacies],
  );
  const dutyGuardLabel = useMemo(() => {
    const p = dutyPharmacies[0];
    if (!p) return '';
    return (p.hours_label || '').split('حراسة')[0].trim() || `Garde ${p.guard === '24h' ? '24h' : p.guard}`;
  }, [dutyPharmacies]);
  const paraItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'parapharmacy'), []);
  const marketItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'supermarket'), []);
  const shopItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'shop'), []);

  const displayedList = useMemo(() => {
    if (filter === 'offers') return promoRestaurants;
    if (filter === 'popular') return popularRestaurants;
    if (filter === 'fast') return fastDelivery;
    if (filter === 'free_delivery') return foodRestaurants;
    if (filter === 'top_rated') return topRatedList;
    if (filter === 'favorites') return favoritesList;
    if (filter === 'burgers_sec') return burgerList.length ? burgerList : foodRestaurants.filter(r => r.cuisine === 'burger');
    if (filter === 'pizzas_sec') return pizzaList.length ? pizzaList : foodRestaurants.filter(r => r.cuisine === 'pizza');
    if (filter === 'asian_sec') return asianList.length ? asianList : foodRestaurants.filter(r => r.cuisine === 'sushi' || r.cuisine === 'asian');
    if (filter === 'tacos_sec') return tacosList.length ? tacosList : foodRestaurants;
    if (filter === 'kebab_sec') return kebabList.length ? kebabList : foodRestaurants;
    if (filter === 'sandwich_sec') return sandwichList.length ? sandwichList : foodRestaurants;
    if (filter === 'healthy_sec') return healthyList.length ? healthyList : foodRestaurants;
    if (filter === 'chicken_sec') return chickenList.length ? chickenList : foodRestaurants;
    if (filter === 'dessert' || filter === 'patisserie') return dessertItems;
    if (filter === 'pharmacy') return pharmacyItems;
    if (filter === 'parapharmacy') return paraItems;
    if (filter === 'supermarket') return marketItems;
    if (filter === 'shop') return shopItems;
    if (['pizza', 'tacos', 'kebab', 'healthy', 'burger', 'sushi', 'asian', 'sandwich', 'grillades', 'breakfast', 'snacks', 'moroccan', 'shawarma', 'bakery', 'chicken', 'italian', 'sweets'].includes(filter)) {
      return foodRestaurants.filter(r =>
        r.cuisine === filter ||
        (Array.isArray(r.tags) && r.tags.some(t => {
          const clean = t.toLowerCase().replace(/[^a-z0-9]/g, '');
          return clean === filter || clean === filter.toLowerCase().replace(/[^a-z0-9]/g, '');
        }))
      );
    }
    if (filter === 'dessert' || filter === 'patisserie') return dessertItems;
    if (filter === 'pharmacy') return pharmacyItems;
    if (filter === 'parapharmacy') return paraItems;
    if (filter === 'supermarket') return marketItems;
    if (filter === 'shop') return shopItems;
    return foodRestaurants.filter(r =>
      filter === 'all' ||
      r.cuisine === filter ||
      (Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase() === filter.toLowerCase()))
    );
  }, [filter, promoRestaurants, popularRestaurants, fastDelivery, topRatedList, favoritesList, burgerList, pizzaList, asianList, dessertItems, pharmacyItems, paraItems, marketItems, shopItems, foodRestaurants]);

  const isDefault = filter === 'all' && !search.trim();

  return (
    <div className="page-enter">
      <BrowseHero name={name} search={search} onSearchChange={setSearch} openCount={openCount} totalCount={catalog.length} />

      <div className="bg-white dark:bg-ink-950 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6 sm:space-y-7">

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
                      onClick={() => setFilter(tab.id)}
                      className={`py-3 relative transition-colors ${
                        active ? 'text-teal-600 dark:text-teal-400 font-extrabold' : 'hover:text-ink-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {active && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ 🔥 OFFRES — IMAGE PROMO BANNERS CAROUSEL ═══ */}
          {!search && (
            <DeliverooPromoBannersCarousel onSelectFilter={setFilter} />
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
                      onClick={() => setFilter(active ? 'all' : c.id)}
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

          {/* ═══ SUB-CAROUSEL per filter ═══ */}
          {!isDefault && !search.trim() && (() => {
            const subItems = {
              restaurants: CATEGORY_GROUPS.filter(g => g.id !== 'services_group').flatMap(g => g.items),
              dessert: CATEGORY_GROUPS.find(g => g.id === 'sweet')?.items || [],
              pharmacy: [
                { label: 'Médicaments', image: '/pizza-img/section_4_04.webp', emoji: '💊', id: 'pharmacy' },
                { label: 'Hygiène', image: '/pizza-img/section_2_07.webp', emoji: '🧼', id: 'hygiene' },
                { label: 'Bébé', image: '/pizza-img/section_2_01.webp', emoji: '👶', id: 'bebe' },
                { label: 'Vitamines', image: '/pizza-img/section_1_05.webp', emoji: '💪', id: 'vitamines' },
                { label: 'Douleur', image: '/pizza-img/section_2_05.webp', emoji: '🩹', id: 'douleur' },
              ],
              parapharmacy: [
                { label: 'Beauté', image: '/pizza-img/section_1_06.webp', emoji: '💄', id: 'beaute' },
                { label: 'Soin visage', image: '/pizza-img/section_2_05.webp', emoji: '🧴', id: 'soin' },
                { label: 'Compléments', image: '/pizza-img/section_1_05.webp', emoji: '🌿', id: 'complement' },
                { label: 'Cheveux', image: '/pizza-img/section_2_07.webp', emoji: '💆', id: 'cheveux' },
              ],
              supermarket: [
                { label: 'Fruits', image: '/pizza-img/section_1_05.webp', emoji: '🍎', id: 'fruits' },
                { label: 'Légumes', image: '/pizza-img/section_1_06.webp', emoji: '🥬', id: 'legumes' },
                { label: 'Laitiers', image: '/pizza-img/section_2_01.webp', emoji: '🥛', id: 'laitiers' },
                { label: 'Boulangerie', image: '/pizza-img/section_2_02.webp', emoji: '🍞', id: 'boulangerie' },
                { label: 'Surgelés', image: '/pizza-img/section_2_06.webp', emoji: '🧊', id: 'surgeles' },
                { label: 'Boissons', image: '/pizza-img/section_2_07.webp', emoji: '🥤', id: 'drinks' },
              ],
              shop: [
                { label: 'Vêtements', image: '/pizza-img/section_1_09.webp', emoji: '👕', id: 'vetements' },
                { label: 'Électronique', image: '/pizza-img/section_1_08.webp', emoji: '📱', id: 'electronique' },
                { label: 'Accessoires', image: '/pizza-img/section_1_04.webp', emoji: '👟', id: 'accessoires' },
                { label: 'Maison', image: '/pizza-img/section_1_02.webp', emoji: '🏠', id: 'maison' },
              ],
            };
            const items = subItems[filter];
            if (!items || items.length === 0) return null;
            return (
              <section className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilter(c.id === filter ? 'all' : c.id)}
                    className="cursor-grow shrink-0 flex flex-col items-center gap-2.5 w-[4.5rem]"
                  >
                    <div className="relative w-[4.5rem] h-[4.5rem] rounded-[1.25rem] overflow-hidden transition-all duration-300 group border border-ink-100 dark:border-ink-800">
                      <img src={c.image} alt={c.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
                    </div>
                    <span className="text-[11px] font-bold text-center leading-tight text-ink-600 dark:text-ink-400">
                      {c.label}
                    </span>
                  </button>
                ))}
              </section>
            );
          })()}

          {/* ═══ FILTERED / CATEGORY GRID VIEW ═══ */}
          {(filter !== 'all' || search.trim()) && (
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
                       `Résultats pour « ${search} »`}
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
                    {displayedList.length} établissement{displayedList.length > 1 ? 's' : ''} disponible{displayedList.length > 1 ? 's' : ''}
                  </p>
                  {filter === 'pharmacy' && dutyGuardLabel && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-1">
                      🕐 {dutyGuardLabel}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setFilter('all'); setSearch(''); }}
                  className="cursor-grow px-3.5 py-2 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-white font-bold text-xs hover:bg-brand-500 hover:text-white active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>Toutes les catégories</span>
                  <span>✕</span>
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)}
                </div>
              ) : displayedList.length === 0 ? (
                <EmptyState catalogEmpty={catalog.length === 0} filter={filter || search} onShowAll={() => { setFilter('all'); setSearch(''); }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {displayedList.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ═══ DEFAULT HOME SECTIONS (DELIVEROO STRUCTURE) ═══ */}
          {filter === 'all' && !search.trim() && (
            <>
              {/* 1. Frais de livraison offerts */}
              <HorizontalRow
                title="Frais de livraison offerts"
                subtitle="Livraison 0 MAD sur tout l'Alliance & CHU"
                count={freeDeliveryList.length}
                onSeeAll={() => setFilter('free_delivery')}
              >
                {freeDeliveryList.map((r) => (
                  <RestaurantCardHorizontal key={`free-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} promo />
                ))}
              </HorizontalRow>

              {/* 2. À la une */}
              <section className="px-4 sm:px-0">
                <div className="flex flex-col mb-2">
                  <h2 className="font-display font-black text-lg sm:text-xl text-ink-900 dark:text-white">À la une</h2>
                  <p className="text-xs text-ink-500 dark:text-ink-400 font-medium mt-0.5">Annonces payantes de nos partenaires</p>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
                  {featuredList.map((r) => (
                    <RestaurantCardHorizontal key={`featured-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} promo />
                  ))}
                </div>
              </section>


              {/* 4. Marques populaires */}
              <DeliverooPopularBrandsSection restaurants={foodRestaurants} onPick={onPickRestaurant} />

              {/* 4. Populaires dans votre quartier */}
              <HorizontalRow
                title="🔥 Populaires dans votre quartier"
                subtitle="Établissements très prisés au campus & hôpitaux"
                count={popularRestaurants.length}
                onSeeAll={() => setFilter('popular')}
              >
                {popularRestaurants.map((r) => (
                  <RestaurantCardHorizontal key={`pop-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                ))}
              </HorizontalRow>

              {/* 5. Frais de livraison tout doux */}
              <HorizontalRow
                title="⚡ Frais de livraison tout doux"
                subtitle="Livraison ultra rapide en moins de 30 min"
                count={fastDelivery.length}
                onSeeAll={() => setFilter('fast')}
              >
                {fastDelivery.map((r) => (
                  <RestaurantCardHorizontal key={`fast-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                ))}
              </HorizontalRow>

              {/* 6. Offres près de chez vous */}
              {promoRestaurants.length > 0 && (
                <HorizontalRow
                  title="🎁 Offres près de chez vous"
                  subtitle="Promotions actives et menus avantageux"
                  count={promoRestaurants.length}
                  onSeeAll={() => setFilter('offers')}
                >
                  {promoRestaurants.map((r) => (
                    <RestaurantCardHorizontal key={`promo-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} promo />
                  ))}
                </HorizontalRow>
              )}

              {/* 7. Mieux notés */}
              <HorizontalRow
                title="🌟 Mieux notés"
                subtitle="Les meilleures adresses notées 4.8 et plus"
                count={topRatedList.length}
                onSeeAll={() => setFilter('top_rated')}
              >
                {topRatedList.map((r) => (
                  <RestaurantCardHorizontal key={`top-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                ))}
              </HorizontalRow>

              {/* 8. Favoris les plus populaires */}
              <HorizontalRow
                title="❤️ Favoris les plus populaires"
                subtitle="Adresses fréquemment ajoutées en coup de cœur"
                count={favoritesList.length}
                onSeeAll={() => setFilter('favorites')}
              >
                {favoritesList.map((r) => (
                  <RestaurantCardHorizontal key={`fav-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                ))}
              </HorizontalRow>

              {/* 9. Burgers */}
              {burgerList.length > 0 && (
                <HorizontalRow
                  title="🍔 Burgers"
                  subtitle="Smash burgers, double cheese et frites dorées"
                  count={burgerList.length}
                  onSeeAll={() => setFilter('burgers_sec')}
                >
                  {burgerList.map((r) => (
                    <RestaurantCardHorizontal key={`burger-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* 10. Pizzas */}
              {pizzaList.length > 0 && (
                <HorizontalRow
                  title="🍕 Pizzas"
                  subtitle="Pizzas napolitaines et recettes italiennes"
                  count={pizzaList.length}
                  onSeeAll={() => setFilter('pizzas_sec')}
                >
                  {pizzaList.map((r) => (
                    <RestaurantCardHorizontal key={`pizza-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* 11. Asian & Sushi */}
              {asianList.length > 0 && (
                <HorizontalRow
                  title="🍣 Asian & Sushi"
                  subtitle="Maki, nigiri, pad thaï et ramen chaud"
                  count={asianList.length}
                  onSeeAll={() => setFilter('asian_sec')}
                >
                  {asianList.map((r) => (
                    <RestaurantCardHorizontal key={`asian-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* 12. Shawarma & Kebab */}
              {kebabList.length > 0 && (
                <HorizontalRow
                  title="🥙 Shawarma & Kebab"
                  subtitle="Kebab grillé au feu de bois, shawarma libanais & sauces maison"
                  count={kebabList.length}
                  onSeeAll={() => setFilter('kebab_sec')}
                >
                  {kebabList.map((r) => (
                    <RestaurantCardHorizontal key={`kebab-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* 13. Tacos & Wraps */}
              {tacosList.length > 0 && (
                <HorizontalRow
                  title="🌮 Tacos & Wraps"
                  subtitle="French tacos généreux, gratinés au fromage & wraps gourmands"
                  count={tacosList.length}
                  onSeeAll={() => setFilter('tacos_sec')}
                >
                  {tacosList.map((r) => (
                    <RestaurantCardHorizontal key={`tacos-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* 14. Sandwichs & Snacks */}
              {sandwichList.length > 0 && (
                <HorizontalRow
                  title="🥪 Sandwichs & Snacks"
                  subtitle="Sandwichs chauds, paninis croustillants & snacks de quartier"
                  count={sandwichList.length}
                  onSeeAll={() => setFilter('sandwich_sec')}
                >
                  {sandwichList.map((r) => (
                    <RestaurantCardHorizontal key={`snack-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* 15. Bowls & Salades Healthy */}
              {healthyList.length > 0 && (
                <HorizontalRow
                  title="🥗 Bowls & Salades Healthy"
                  subtitle="Poke bowls frais, salades composées & menus hôpital MedEat"
                  count={healthyList.length}
                  onSeeAll={() => setFilter('healthy_sec')}
                >
                  {healthyList.map((r) => (
                    <RestaurantCardHorizontal key={`healthy-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* 16. Poulet Rôti & Crispy Chicken */}
              {chickenList.length > 0 && (
                <HorizontalRow
                  title="🍗 Poulet Rôti & Crispy Chicken"
                  subtitle="Poulet braisé, tenders croustillants & wings épicés"
                  count={chickenList.length}
                  onSeeAll={() => setFilter('chicken_sec')}
                >
                  {chickenList.map((r) => (
                    <RestaurantCardHorizontal key={`chicken-${r.id}`} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

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
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-white mb-4">
                Résultats pour « {search} »
              </h2>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeletonHorizontal key={i} />)
                : restaurants.length === 0
                  ? <EmptyState catalogEmpty={false} filter={search} onShowAll={() => { setSearch(''); setFilter('all'); }} />
                  : (
                    <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
                      {restaurants.map((r) => (
                        <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                      ))}
                    </div>
                  )
              }
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function HorizontalRow({ title, subtitle, count, children, onSeeAll }) {
  return (
    <section className="px-4 sm:px-0">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="font-display font-extrabold text-base sm:text-lg text-ink-900 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 hover:underline cursor-pointer flex items-center gap-1 active:scale-95 transition-transform shrink-0"
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

  const storeName = lastOrder.restaurantName || lastOrder.restaurant_name || lastOrder.storeName || 'votre restaurant favori';
  const items = lastOrder.items || [];
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
    <div className="w-full mb-3">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-ink-950 via-slate-900 to-ink-950 text-white p-3.5 sm:p-5 shadow-xl border border-brand-500/40">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        
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
  const open = isRestaurantOpen(restaurant);
  const isCustom = restaurant.isCustomRequest;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
      className="cursor-grow card-glow-hover group relative shrink-0 w-[240px] sm:w-[270px] lg:w-[290px] h-[210px] sm:h-[230px] snap-start overflow-hidden rounded-2xl border border-ink-200/60 dark:border-white/[0.08] bg-ink-950 shadow-sm hover:shadow-cardhover hover:-translate-y-1 transition-all duration-500"
    >
      <img
        src={restaurantCover(restaurant.cover)}
        alt={restaurant.name}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08] ${
          !open ? 'filter blur-[2px] grayscale opacity-50' : ''
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />

      {/* Time Badge */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="px-2.5 py-1 rounded-full bg-white text-ink-950 font-extrabold text-xs shadow-md">
          {restaurant.eta || '30-45 min'}
        </span>
      </div>

      {/* Closed overlay */}
      {!open && (
        <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
          <span className="px-3.5 py-1.5 rounded-full bg-black/80 text-white text-xs font-black border border-white/20 shadow-xl uppercase tracking-wider">
            🔒 Fermé
          </span>
        </div>
      )}

      {/* Contenu ancré en bas, sur le voile */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col gap-1 text-left text-white z-10">
        <h3 className="font-extrabold text-base truncate transition-colors group-hover:text-brand-400">
          {restaurant.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-white/75 font-medium truncate">
          <span className="text-teal-400 font-extrabold">★</span>
          <span className="font-bold text-white">{(restaurant.rating ?? 4.4).toString().replace('.', ',')}</span>
          <span>·</span>
          <span>{restaurant.distance || '1.5 km'}</span>
          <span>·</span>
          <span className="text-teal-400 font-bold">⚡ Rapide</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs mt-0.5 font-bold">
          {isCustom || ['pharmacy','dessert','supermarket','shop','parapharmacy'].includes(restaurant.cuisine) ? (
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
        ? 'shadow-glow-lg scale-[1.01]' 
        : 'shadow-card'
    }`}>
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 transition-opacity duration-300 ${focused ? 'opacity-[0.55] blur-md' : 'opacity-0'}`} />
      <div
        className={`relative flex items-center gap-3 px-4 sm:px-5 h-14 sm:h-[3.75rem] rounded-2xl border transition-all duration-300 ${
          isHero
            ? focused
              ? 'bg-white dark:bg-ink-950 border-brand-500 dark:border-brand-500'
              : 'bg-white/95 dark:bg-ink-900/90 backdrop-blur-md border-white/20 dark:border-ink-800'
            : focused
              ? 'bg-white dark:bg-ink-950 border-brand-500 dark:border-brand-500'
              : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-800'
        }`}
      >
        <I.Search size={20} className={`shrink-0 transition-colors duration-300 ${focused ? 'text-brand-500' : 'text-ink-400'}`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Pizza, sushi, bowls healthy…"
          className="flex-1 bg-transparent outline-none placeholder:text-ink-400/70 text-base text-ink-900 dark:text-white"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="cursor-grow p-1.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500 transition-colors"
          >
            <I.X size={16} />
          </button>
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
  const sectionRefs = useRef({});

  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [orderDetails, setOrderDetails] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  const tags = Array.isArray(r.tags) ? r.tags : [];
  const totalItems = (r.menu || []).reduce((s, c) => s + (c.items?.length || 0), 0);
  const isDuty = r.isDutyPharmacy;
  const dutyHoursFr = (r.hoursLabel || '').split('حراسة')[0].trim();

  const scrollToCat = (cat) => {
    setActiveCat(cat);
    const el = sectionRefs.current[cat];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top, behavior:'smooth' });
    }
  };

  useEffect(() => {
    if (!r.menu) return;
    const onScroll = () => {
      const offsets = r.menu.map(c => ({
        cat: c.category,
        top: sectionRefs.current[c.category]?.getBoundingClientRect().top || 0
      }));
      const visible = offsets.filter(o => o.top < 200).pop();
      if (visible) setActiveCat(visible.cat);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [r]);

  const CUISINE_ICONS = {
    pizza: '🍕', tacos: '🌮', kebab: '🥙', sushi: '🍣', burger: '🍔',
    healthy: '🥗', asian: '🥢', dessert: '🍰', drinks: '🥤',
    pharmacy: '💊', parapharmacy: '🌿', supermarket: '🛒', shop: '🛍️', medical: '⚕️',
    patisserie: '🥐',
  };

  const populaires = (r.menu || []).flatMap(c =>
    (c.items || []).filter(it => it.price > 12).slice(0, 4)
  ).slice(0, 6);

  return (
    <div className="page-enter bg-white dark:bg-ink-950 min-h-screen">
      {/* Cover */}
      <div className="relative h-[200px] sm:h-[280px] lg:h-[320px] overflow-hidden bg-ink-100 dark:bg-ink-900">
        <img
          src={restaurantCover(r.cover)}
          alt={r.name || ''}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-ink-900/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-ink-800 active:scale-95 transition"
          title="Retour"
        >
          <I.Left size={18} />
        </button>
      </div>

      {/* Info */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-lg border border-ink-100 dark:border-ink-800 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-800 shrink-0 flex items-center justify-center">
              {typeof r.logo === 'string' && (r.logo.startsWith('http') || r.logo.startsWith('/')) ? (
                <img src={r.logo} alt={r.name || ''} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl select-none">{r.logo || '💊'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display font-black text-xl sm:text-2xl text-ink-900 dark:text-white truncate">
                {r.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                {tags.map((t, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-ink-300 dark:text-ink-600">·</span>}
                    {formatTag(t)}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-500 dark:text-ink-400">
                <span className="flex items-center gap-1">
                  <I.MapPin size={12} className="text-ink-400" /> {r.distance || 'Tanger'}
                </span>
                <span>·</span>
                <span>{isOpen ? (openLabel || 'Ouvert') : (openLabel || 'Fermé')}</span>
                <span>·</span>
                <span>Min. {formatMad(40, { decimals: 0 })}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <I.Star size={12} className="fill-emerald-500 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {(r.rating ?? 4.5).toString().replace('.', ',')}
                  </span>
                </div>
                <span className="text-xs text-ink-500">Livraison {r.fee || '0,00'} MAD</span>
                {isDuty && r.phone && (
                  <a
                    href={`tel:${r.phone.replace(/\s/g, '')}`}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition-colors"
                  >
                    <I.Phone size={12} /> {r.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
          {r.description && (
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
              {isDuty && dutyHoursFr
                ? dutyHoursFr
                : `${r.name}, disponible en livraison directement chez vous ! ${CUISINE_ICONS[r.cuisine] || '🍽️'} 🚴‍♂️`}
            </p>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {!r.isStatic && (r.menu || []).length > 0 && (
        <div className="sticky top-14 z-30 bg-white dark:bg-ink-950 border-b border-ink-100 dark:border-ink-800 mt-4">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-0.5 overflow-x-auto no-scrollbar h-12 items-center">
            {(r.menu || []).map(c => {
              const active = activeCat === c.category;
              return (
                <button
                  key={c.category}
                  onClick={() => scrollToCat(c.category)}
                  className={`cursor-grow relative shrink-0 px-3 sm:px-4 h-10 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    active
                      ? 'text-ink-900 dark:text-white bg-ink-100 dark:bg-ink-800'
                      : 'text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'
                  }`}
                >
                  {CUISINE_ICONS[c.category?.toLowerCase()] || ''} {c.category}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-brand-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {!r.isStatic ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-32">
          {!isOpen && (
            <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-500/5 px-4 py-3 text-center">
              <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                🔒 Fermé — {openLabel}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-300/70 mt-0.5">
                Vous pouvez consulter le menu, la commande reprendra à l&apos;ouverture.
              </p>
            </div>
          )}

          {/* Populaires */}
          {populaires.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display font-bold text-base sm:text-lg text-ink-900 dark:text-white mb-3">
                Populaires
              </h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                {populaires.map((it, i) => (
                  <DeliverooItemCard
                    key={it.db_id || it.id || i}
                    item={it}
                    restaurant={r}
                    onAdd={onAdd}
                    onOpen={() => setSelectedItem(it)}
                    orderingDisabled={!isOpen}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Menu Sections */}
          {(r.menu || []).map(cat => (
            <div key={cat.category} ref={el => sectionRefs.current[cat.category] = el} className="mb-10 scroll-mt-36">
              <h2 className="font-display font-bold text-base sm:text-lg text-ink-900 dark:text-white mb-4">
                {CUISINE_ICONS[cat.category?.toLowerCase()] || ''} {cat.category}
              </h2>
              <div className="space-y-0 divide-y divide-ink-100 dark:divide-ink-800/80">
                {(cat.items || []).map((it, i) => (
                  <DeliverooItemCard
                    key={it.db_id || it.id || i}
                    item={it}
                    restaurant={r}
                    onAdd={onAdd}
                    onOpen={() => setSelectedItem(it)}
                    orderingDisabled={!isOpen}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 sm:p-8 shadow-sm">
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-3">
              📝 Commander sur-mesure
            </h2>
            <p className="text-sm text-ink-500 leading-relaxed mb-6">
              {isDuty
                ? "Commandez vos médicaments depuis cette pharmacie de garde, notre livreur s'occupe de tout !"
                : r.cuisine === 'pharmacy' ? "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
                   r.cuisine === 'parapharmacy' ? "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
                   r.cuisine === 'supermarket' ? "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
                   r.cuisine === 'shop' ? "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
                   "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !"}
            </p>

            {isDuty && (
              <div className="mb-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    🕐 {r.guard === '24h' ? 'Garde 24H' : 'Pharmacie de garde'}
                  </span>
                  {r.phone && (
                    <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <I.Phone size={12} /> {r.phone}
                    </a>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <I.MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-700 dark:text-ink-200 leading-relaxed">{r.address}</p>
                </div>
                {r.addressAr && (
                  <p className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed" dir="rtl">
                    {r.addressAr}
                  </p>
                )}
                {dutyHoursFr && (
                  <p className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed border-t border-emerald-100 dark:border-emerald-500/15 pt-2">
                    🕐 {dutyHoursFr}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              if (r.isCustomRequest && (!storeName.trim() || !storeAddress.trim())) {
                alert('Veuillez renseigner le nom et l\'adresse de l\'établissement.');
                return;
              }
              if (!orderDetails.trim()) {
                alert('Veuillez préciser votre commande.');
                return;
              }

              const targetStoreName = r.isCustomRequest ? storeName.trim() : r.name;
              const targetStoreAddress = r.isCustomRequest ? storeAddress.trim() : (isDuty ? r.address : r.distance);

              const customItem = {
                id: `custom-${r.id}-${Date.now()}`,
                name: r.isCustomRequest || isDuty
                  ? `[${targetStoreName}] ${orderDetails.trim()}`
                  : `${r.name} - ${orderDetails.trim()}`,
                price: 0,
                img: r.cuisine === 'pharmacy' ? '/media/restaurants/custom-pharmacy.webp' :
                     r.cuisine === 'parapharmacy' ? '/media/restaurants/custom-parapharmacy.webp' :
                     r.cuisine === 'supermarket' ? '/media/restaurants/custom-supermarket.webp' :
                     r.cuisine === 'shop' ? '/media/restaurants/custom-shop.webp' :
                     '/media/restaurants/custom-patisserie.webp',
                restaurantId: r.id,
                restaurantName: targetStoreName,
                restaurantCuisine: r.cuisine,
                isCustom: true,
                customDetails: {
                  storeName: targetStoreName,
                  storeAddress: targetStoreAddress,
                  details: orderDetails.trim()
                }
              };

              onAdd(customItem, { id: r.id, name: targetStoreName });
              setOrderDetails('');
              if (r.isCustomRequest) {
                setStoreName('');
                setStoreAddress('');
              }
              setIsAdded(true);
              setTimeout(() => setIsAdded(false), 2000);
            }} className="space-y-4">
              {r.isCustomRequest && (
                <>
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">Nom de l&apos;établissement *</span>
                    <input type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Ex: Pharmacie du Progrès"
                      className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-ink-900 dark:text-white" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">Adresse *</span>
                    <input type="text" required value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="Ex: Boulevard Mohammed V, Tanger"
                      className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-ink-900 dark:text-white" />
                  </label>
                </>
              )}
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">Détaillez votre commande *</span>
                <textarea required value={orderDetails} onChange={(e) => setOrderDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-ink-900 dark:text-white resize-none"
                  rows={4}
                  placeholder="Ex: 2 boîtes de Doliprane 1000mg, 1 boîte de Spasfon..." />
              </label>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-0.5">💵 Frais de livraison fixes : 20 MAD</p>
                <p>Le prix d&apos;achat réel sera ajouté à la livraison.</p>
              </div>
              <button type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition shadow-md active:scale-[0.98]">
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

function DeliverooItemCard({ item, restaurant, onAdd, onOpen, orderingDisabled = false, compact = false }) {
  const [adding, setAdding] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (orderingDisabled) return;
    onAdd(item, restaurant);
    setAdding(true);
    setTimeout(() => setAdding(false), 1200);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onOpen?.()}
        className="cursor-grow shrink-0 w-[42vw] sm:w-[200px] lg:w-[220px] text-left group"
      >
        <div className="relative rounded-xl overflow-hidden bg-ink-50 dark:bg-ink-800 aspect-[4/3] border border-ink-100 dark:border-ink-800">
          <MenuItemImage src={item.img} alt={item.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {item.price > 14 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 dark:bg-ink-900/90 text-[10px] font-bold text-ink-900 dark:text-white shadow-sm">
              Populaire
            </span>
          )}
          {!orderingDisabled && (
            <button
              type="button"
              onClick={handleAdd}
              className={`absolute bottom-2 right-2 w-10 h-10 rounded-lg grid place-items-center text-sm font-bold shadow transition-all ${
                adding
                  ? 'bg-emerald-500 text-white scale-110'
                  : 'bg-white dark:bg-ink-900 text-ink-900 dark:text-white hover:bg-brand-500 hover:text-white active:scale-95'
              }`}
            >
              {adding ? '✓' : '+'}
            </button>
          )}
        </div>
        <div className="mt-2 px-0.5">
          <h3 className="font-semibold text-sm text-ink-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {item.name}
          </h3>
          <p className="text-[11px] text-ink-400 dark:text-ink-500 line-clamp-1 mt-0.5">{item.desc}</p>
          <div className="mt-1 font-bold text-sm text-ink-900 dark:text-white">{formatMad(item.price)}</div>
        </div>
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); } }}
      className="flex gap-3 py-4 cursor-grow group"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm sm:text-base text-ink-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
          {item.name}
        </h3>
        <p className="text-xs text-ink-400 dark:text-ink-500 line-clamp-2 mt-1 leading-relaxed">{item.desc}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-bold text-sm text-ink-900 dark:text-white">{formatMad(item.price)}</span>
          {!orderingDisabled && (
            <button
              type="button"
              onClick={handleAdd}
              className={`ml-auto w-11 h-11 rounded-lg grid place-items-center text-sm font-bold shadow-sm transition-all ${
                adding
                  ? 'bg-emerald-500 text-white scale-110'
                  : 'bg-white dark:bg-ink-800 text-ink-900 dark:text-white border border-ink-200 dark:border-ink-700 hover:bg-brand-500 hover:text-white hover:border-brand-500 active:scale-95'
              }`}
            >
              {adding ? '✓' : '+'}
            </button>
          )}
        </div>
      </div>
      <div className="shrink-0 w-[100px] sm:w-[120px] h-[80px] sm:h-[90px] rounded-xl overflow-hidden bg-ink-50 dark:bg-ink-800 relative">
        <MenuItemImage src={item.img} alt={item.name} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {item.price > 14 && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-white/90 dark:bg-ink-900/90 text-[9px] font-bold text-ink-900 dark:text-white shadow-sm">
            Populaire
          </span>
        )}
      </div>
    </div>
  );
}

export function MenuItem({ item, restaurant, onAdd, onOpen, orderingDisabled = false }) {
  const [adding, setAdding] = useState(false);
  const imgRef = useRef();

  const handleAdd = (e) => {
    e.stopPropagation();
    if (orderingDisabled) return;
    onAdd(item, restaurant, imgRef.current);
    setAdding(true);
    setTimeout(() => setAdding(false), 1200);
  };

  const isBestseller = item.price > 80;
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
            {isBestseller && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-glow tracking-wider animate-pulse">
                Populaire
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="font-display font-bold text-sm sm:text-base leading-tight text-ink-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{item.name}</h3>
            <p className="mt-1 text-[11px] sm:text-xs text-ink-500 dark:text-ink-400 line-clamp-2 leading-relaxed">{item.desc}</p>
            <div className="mt-auto pt-2 flex items-center justify-between">
              <div className="font-display font-black text-base sm:text-lg text-ink-900 dark:text-white">{formatMad(item.price)}</div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={orderingDisabled}
                title={orderingDisabled ? 'Restaurant fermé' : 'Ajouter au panier'}
                className={`cursor-grow relative w-10 h-10 rounded-xl grid place-items-center transition-transform ${
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

export function RestaurantCard({ restaurant, onClick }) {
  const open = isRestaurantOpen(restaurant);
  const isDuty = restaurant.isDutyPharmacy;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
      className="cursor-grow card-glow-hover group relative block h-[300px] w-full overflow-hidden rounded-3xl border border-ink-200/60 dark:border-white/[0.08] bg-ink-950 shadow-sm hover:shadow-cardhover transition-shadow duration-500"
    >
      {/* Image plein cadre : plus de bandeau blanc séparé, tout vit sur la photo. */}
      <img
        src={restaurantCover(restaurant.cover)}
        alt={restaurant.name}
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-[1.08] ${
          !open ? 'filter blur-sm grayscale opacity-70' : ''
        }`}
      />
      {/* Voile bas : le texte se lit toujours, quelle que soit la photo. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />

      {/* Fermé */}
      {!open && (
        <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
          <span className="bg-ink-950/75 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Fermé · Réouverture demain
          </span>
        </div>
      )}

      {/* Pastilles en haut */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4 z-10">
        {restaurant.isDutyPharmacy ? (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md animate-pulse-slow">
            🕐 GARDE {restaurant.guard === '24h' ? '24H' : 'DE GARDE'}
          </span>
        ) : restaurant.isCustomRequest ? (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-brand-500 text-white shadow-md animate-pulse">
            ✨ SUR-MESURE (+20 MAD)
          </span>
        ) : restaurant.promo && open ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-md animate-pulse-slow">
            🎁 {restaurant.promo}
          </span>
        ) : <span />}

        <span className="shrink-0 inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white/95 text-emerald-600 text-[10px] sm:text-xs font-bold shadow-sm">
          <I.Star size={11} className="fill-emerald-500 text-emerald-500 sm:w-3 sm:h-3" />{' '}
          {(restaurant.rating ?? 4.8).toString().replace('.', ',')}
        </span>
      </div>

      {/* Contenu, ancré en bas sur le voile — repris de hiho/yoha-web (RestaurantCard) */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 text-white">
        <h3 className="font-display font-extrabold text-lg sm:text-xl truncate transition-colors group-hover:text-brand-400">
          {restaurant.name}
        </h3>
        {isDuty && restaurant.nameAr && (
          <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-white/55 truncate" dir="rtl">
            {restaurant.nameAr}
          </p>
        )}
        {restaurant.subtitle && (
          <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-white/55 truncate">
            {restaurant.subtitle}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs text-white/70 truncate">
          <span className="truncate">{formatTags(restaurant.tags, ' • ')}</span>
          {isDuty && restaurant.phone && (
            <>
              <span className="text-white/25 shrink-0">·</span>
              <span className="truncate shrink-0">{restaurant.phone}</span>
            </>
          )}
          {!isDuty && (
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-bold">
              Sponsorisé
            </span>
          )}
        </div>

        <div className="mt-3 sm:mt-4 flex items-center gap-3 border-t border-white/[0.12] pt-3 text-[11px] sm:text-xs">
          {isDuty ? (
            <>
              <span className="flex items-center gap-1 text-white/70 min-w-0">
                <I.MapPin size={12} className="text-white/50 shrink-0" />
                <span className="truncate">{restaurant.address || restaurant.distance}</span>
              </span>
              <span className="flex-1" />
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-400 shrink-0">
                Commander <I.Right size={12} />
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-white/70">
                <I.MapPin size={12} className="text-white/50" /> {restaurant.distance}
              </span>
              <span className="text-white/20">|</span>
              <span className="line-through text-white/40">19,99 MAD</span>
              <span className="font-bold text-emerald-400">0,00 MAD livraison</span>
              <span className="flex-1" />
              <span className="hidden sm:inline-flex items-center gap-0.5 font-bold text-brand-400 shrink-0">
                Voir le menu <I.Right size={12} />
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
    <div className="relative h-[300px] rounded-3xl overflow-hidden border border-ink-200/60 dark:border-ink-800 shadow-sm">
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
    bg: 'from-rose-500 via-pink-600 to-rose-600 text-white border-rose-400/50 shadow-lg shadow-rose-500/20',
    tag: 'OFFRE DE BIENVENUE',
    tagBg: 'bg-white text-rose-600 font-black',
    title: '50 MAD OFFERTS',
    subtitle: 'sur votre première commande à l\'Alliance & CHU',
    code: 'CODE : YOHA50 📋',
    cta: 'J\'en profite 🚀',
    image: '/promos/promo_bienvenue_50mad.jpg',
    filterId: null,
    promoCode: 'YOHA50',
    textColor: 'text-white',
    subColor: 'text-rose-100 font-medium',
  },
  {
    id: 'promo-2',
    bg: 'from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-400/50 shadow-lg shadow-emerald-500/20',
    tag: 'FRAIS DE LIVRAISON',
    tagBg: 'bg-white text-emerald-700 font-black',
    title: '0 MAD DE FRAIS',
    subtitle: 'Dès 200 MAD de commande globale',
    code: 'CODE : GROUPE0 📋',
    cta: 'Commander 👥',
    image: '/promos/promo_frais_offerts.jpg',
    filterId: null,
    promoCode: 'GROUPE0',
    textColor: 'text-white',
    subColor: 'text-emerald-100 font-medium',
  },
  {
    id: 'promo-4',
    bg: 'from-purple-600 via-pink-600 to-rose-500 text-white border-pink-400/50 shadow-lg shadow-pink-500/20',
    tag: 'DOUCEURS & DESSERTS',
    tagBg: 'bg-amber-400 text-slate-950 font-black',
    title: 'UNE ENVIE GLACÉE ?',
    subtitle: 'Glaces artisanales, gaufres & crêpes livrées chaudes',
    code: 'C\'EST PAR ICI ➔',
    cta: 'Pâtisseries 🍰',
    image: '/promos/promo_envie_glacee.jpg',
    filterId: 'dessert',
    promoCode: null,
    textColor: 'text-white',
    subColor: 'text-pink-100 font-medium',
  },
  {
    id: 'promo-5',
    bg: 'from-indigo-600 via-purple-600 to-blue-700 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/20',
    tag: 'LIVRAISON EXPRESS',
    tagBg: 'bg-amber-400 text-slate-950 font-black',
    title: 'LIVRAISON 4,99 MAD',
    subtitle: 'Dès 120 MAD de commande en livraison rapide',
    code: 'EXPRESS 🚀',
    cta: 'Profiter ⚡',
    image: '/promos/promo_livraison_express.jpg',
    filterId: 'fast',
    promoCode: null,
    textColor: 'text-white',
    subColor: 'text-indigo-100 font-medium',
  },
  {
    id: 'promo-6',
    bg: 'from-amber-500 via-orange-500 to-amber-600 text-white border-amber-400/50 shadow-lg shadow-amber-500/20',
    tag: 'FIDÉLITÉ RÉCOMPENSÉE',
    tagBg: 'bg-white text-slate-950 font-black',
    title: '-50 MAD FIDÉLITÉ',
    subtitle: 'Après 6 commandes livrées confirmées !',
    code: 'FIDÉLITÉ ⭐',
    cta: 'Voir mon solde →',
    image: '/promos/promo_recompense_fidelite.jpg',
    filterId: null,
    promoCode: null,
    textColor: 'text-white',
    subColor: 'text-amber-100 font-medium',
  },
];

export function DeliverooPromoBannersCarousel({ onSelectFilter }) {
  const trackRef = useRef(null);
  const [copiedToast, setCopiedToast] = useState(null);
  const { goto } = useYohaNav();

  const scrollNext = () => {
    trackRef.current?.scrollBy({ left: 340, behavior: 'smooth' });
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
      setCopiedToast(`Code ${b.promoCode} copié ! 📋`);
      setTimeout(() => setCopiedToast(null), 2500);
    }
    if (b.filterId) {
      onSelectFilter(b.filterId);
    }
  };

  return (
    <section className="relative px-4 sm:px-0">
      {copiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-black text-xs shadow-2xl border border-emerald-400/30 flex items-center gap-2 animate-bounce">
          <span>🎉</span>
          <span>{copiedToast}</span>
        </div>
      )}

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {PROMO_BANNERS.map((b) => (
          <div
            key={b.id}
            onClick={() => handleCardClick(b)}
            className={`cursor-pointer shrink-0 w-[300px] sm:w-[380px] md:w-[420px] rounded-3xl p-4 sm:p-5 border shadow-card hover:shadow-cardhover hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group snap-start bg-gradient-to-br ${b.bg}`}
          >
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/20 dark:bg-white/5 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            
            <div className="relative flex items-center justify-between gap-3 h-full">
              <div className="flex-1 min-w-0 pr-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 shadow-xs ${b.tagBg}`}>
                  {b.tag}
                </span>

                <h3 className={`font-display font-black text-lg sm:text-2xl tracking-tight leading-none ${b.textColor || 'text-ink-900 dark:text-white'} transition-colors`}>
                  {b.title}
                </h3>

                <p className={`text-xs ${b.subColor || 'text-ink-600 dark:text-ink-300'} mt-1.5 line-clamp-2 leading-relaxed font-medium`}>
                  {b.subtitle}
                </p>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="inline-block px-2.5 py-1 rounded-xl bg-amber-300 dark:bg-amber-400 text-slate-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wide shadow-sm border border-amber-400">
                    {b.code}
                  </span>
                  <span
                    onClick={(e) => {
                      if (b.id === 'promo-6') {
                        e.stopPropagation();
                        goto('my-orders');
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-slate-950 font-black text-xs shadow-md group-hover:scale-105 transition-all ${b.id === 'promo-6' ? 'cursor-pointer hover:bg-amber-50' : ''}`}>
                    <span>{b.cta}</span>
                  </span>
                </div>
              </div>

              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border-2 border-white/60 shadow-md transform group-hover:scale-105 transition-transform duration-500">
                <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        ))}
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
                    <span>{r.eta || '30-45 min'}</span>
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