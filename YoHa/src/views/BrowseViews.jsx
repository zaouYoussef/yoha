'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { I } from '../icons/Icons.jsx';
import { CUISINES, CATEGORIES_BANNERS, STATIC_STORES } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Reveal } from '../components/ui/Reveal.jsx';
import { Tilt } from '../components/ui/Tilt.jsx';
import { Magnetic } from '../components/ui/Magnetic.jsx';

import { CategoryCarousel } from '../components/effects/CategoryCarousel.jsx';
import { spotlightHandler } from '../utils/spotlight.js';
import { formatMad, restaurantOpenStatus } from '../data/index.js';
import { MenuItemImage, restaurantCover, restaurantLogo } from '../components/ui/MenuItemImage.jsx';
import { MenuItemDetailModal } from '../components/ui/MenuItemDetailModal.jsx';
import { CustomOrderModal } from '../components/ui/CustomOrderModal.jsx';

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
              <p className="mt-2 text-sm sm:text-base text-white/75 line-clamp-2">{tags.join(' · ')}</p>
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
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

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
      const matchCuisine = filter === 'all' || r.cuisine === filter || r.isCustomRequest;
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

  const promoRestaurants = useMemo(() => foodRestaurants.filter(r => r.promo && isRestaurantOpen(r)), [foodRestaurants]);
  const popularRestaurants = useMemo(() => {
    const open = foodRestaurants.filter(r => isRestaurantOpen(r));
    return open.sort((a, b) => (b.rating ?? 4.8) - (a.rating ?? 4.8));
  }, [foodRestaurants]);
  const fastDelivery = useMemo(() => foodRestaurants.filter(r => isRestaurantOpen(r)), [foodRestaurants]);
  const dessertItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'dessert' || s.cuisine === 'patisserie'), []);
  const pharmacyItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'pharmacy'), []);
  const paraItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'parapharmacy'), []);
  const marketItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'supermarket'), []);
  const shopItems = useMemo(() => STATIC_STORES.filter(s => s.cuisine === 'shop'), []);

  const displayedList = useMemo(() => {
    if (filter === 'offers') return promoRestaurants;
    if (filter === 'popular') return popularRestaurants;
    if (filter === 'fast') return fastDelivery;
    if (filter === 'dessert' || filter === 'patisserie') return dessertItems;
    if (filter === 'pharmacy') return pharmacyItems;
    if (filter === 'parapharmacy') return paraItems;
    if (filter === 'supermarket') return marketItems;
    if (filter === 'shop') return shopItems;
    if (['pizza', 'tacos', 'kebab', 'healthy', 'burger', 'sushi', 'asian'].includes(filter)) {
      return foodRestaurants.filter(r => r.cuisine === filter);
    }
    return foodRestaurants;
  }, [filter, promoRestaurants, popularRestaurants, fastDelivery, dessertItems, pharmacyItems, paraItems, marketItems, shopItems, foodRestaurants]);

  const isDefault = filter === 'all' && !search.trim();

  return (
    <div className="page-enter">
      <BrowseHero name={name} search={search} onSearchChange={setSearch} openCount={openCount} totalCount={catalog.length} />

      <CustomOrderModal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} />

      <div className="bg-white dark:bg-ink-950">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 py-4 space-y-7">

          {/* ═══ SERVICES ROW ═══ */}
          {!search && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {[
                { label: 'Offres', emoji: '🎁', id: 'offers' },
                { label: 'Fast Food', emoji: '🍕', id: 'pizza' },
                { label: 'Grillades', emoji: '🍗', id: 'grillades' },
                { label: 'Cuisine du monde', emoji: '🍣', id: 'sushi' },
                { label: 'Healthy', emoji: '🥗', id: 'healthy' },
                { label: 'Petit-déjeuner', emoji: '☕', id: 'breakfast' },
                { label: 'Sucré', emoji: '🍰', id: 'dessert' },
                { label: 'Boissons', emoji: '🧋', id: 'drinks' },
                { label: 'Pharmacies', emoji: '💊', id: 'pharmacy' },
                { label: 'Supermarchés', emoji: '🛒', id: 'supermarket' },
              ].map((s) => {
                const active = filter === s.id || (s.id === 'all' && filter === 'all');
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFilter(s.id === 'all_resto' ? 'all' : s.id)}
                    className={`cursor-grow shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                      active
                        ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/30 scale-[1.03]'
                        : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-ink-300 border-ink-100 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md'
                    }`}
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ═══ PROMO BANNER ═══ */}
          {isDefault && promoRestaurants.length > 0 && (
            <section className="px-4 sm:px-0">
              <div className="relative rounded-3xl overflow-hidden group cursor-pointer" onClick={() => onPickRestaurant(promoRestaurants[0])}>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-pink-500 to-violet-600 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
                <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-700 pointer-events-none" />
                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm mb-3">
                      <I.Flame size={11} className="text-yellow-200 animate-pulse" /> Offre du jour
                    </span>
                    <h3 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight">
                      {promoRestaurants[0].promo || 'Profitez de nos offres'}
                    </h3>
                    <p className="mt-2 text-sm text-white/80">
                      {promoRestaurants.length} établissement{promoRestaurants.length > 1 ? 's' : ''} avec promotion active
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-ink-900 font-extrabold text-sm shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300">
                    Voir l&apos;offre <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ═══ CATEGORY CIRCLES ═══ */}
          {isDefault && (
            <section className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES_BANNERS.map((c) => {
                const active = filter === c.id;
                const glowColor = CATEGORY_GLOW[c.id] || '#f97316';
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilter(active ? 'all' : c.id)}
                    className="cursor-grow shrink-0 flex flex-col items-center gap-2.5 w-[4.5rem]"
                  >
                    <div
                      className="relative w-[4.5rem] h-[4.5rem] rounded-[1.25rem] overflow-hidden transition-all duration-300 group"
                      style={{
                        boxShadow: active ? `0 0 0 3px ${glowColor}, 0 8px 25px -5px ${glowColor}40` : undefined,
                      }}
                    >
                      <img src={c.image} alt={c.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className={`absolute inset-0 transition-colors duration-300 ${active ? 'bg-brand-500/20' : 'bg-black/10 group-hover:bg-black/5'}`} />
                    </div>
                    <span className={`text-[11px] font-bold text-center leading-tight ${active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-600 dark:text-ink-400'}`}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </section>
          )}

          {/* ═══ FILTERED / CATEGORY GRID VIEW ═══ */}
          {(filter !== 'all' || search.trim()) && (
            <section className="px-4 sm:px-0">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-ink-100 dark:border-ink-800">
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900 dark:text-white flex items-center gap-2">
                    <span>
                      {filter === 'offers' ? '🎁 Offres près de chez vous' :
                       filter === 'popular' ? '🔥 Populaires dans votre quartier' :
                       filter === 'fast' ? '⚡ Livraison la plus rapide' :
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

          {/* ═══ DEFAULT HOME SECTIONS (CAROUSELS) ═══ */}
          {filter === 'all' && !search.trim() && (
            <>
              {/* À la une */}
              {showFeatured && (
                <section className="px-4 sm:px-0">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
                    </span>
                    <h2 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-white">À la une</h2>
                  </div>
                  <FeaturedSpotlight restaurant={featured} onClick={() => onPickRestaurant(featured)} />
                </section>
              )}

              {/* Offres */}
              {promoRestaurants.length > 1 && (
                <HorizontalRow title="🎁 Offres près de chez vous" count={promoRestaurants.length - 1} onSeeAll={() => setFilter('offers')}>
                  {promoRestaurants.slice(1).map((r) => (
                    <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} promo />
                  ))}
                </HorizontalRow>
              )}

              {/* Populaires */}
              <HorizontalRow title="🔥 Populaires dans votre quartier" count={popularRestaurants.length} onSeeAll={() => setFilter('popular')}>
                {popularRestaurants.map((r) => (
                  <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                ))}
              </HorizontalRow>

              {/* Rapide */}
              <HorizontalRow title="⚡ Livraison la plus rapide" count={fastDelivery.length} onSeeAll={() => setFilter('fast')}>
                {fastDelivery.map((r) => (
                  <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                ))}
              </HorizontalRow>

              {/* Pâtisseries preview */}
              {dessertItems.length > 0 && (
                <HorizontalRow title="🥐 Pâtisseries" count={dessertItems.length} onSeeAll={() => setFilter('dessert')}>
                  {dessertItems.map((r) => (
                    <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* Pharmacies preview */}
              {pharmacyItems.length > 0 && (
                <HorizontalRow title="💊 Pharmacies" count={pharmacyItems.length} onSeeAll={() => setFilter('pharmacy')}>
                  {pharmacyItems.map((r) => (
                    <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* Supermarchés preview */}
              {marketItems.length > 0 && (
                <HorizontalRow title="🛒 Supermarchés" count={marketItems.length} onSeeAll={() => setFilter('supermarket')}>
                  {marketItems.map((r) => (
                    <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* Search results */}
              {restaurantsError && <ApiErrorState message={restaurantsError} onRetry={refreshRestaurants} />}
            </>
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

function HorizontalRow({ title, count, children, onSeeAll }) {
  return (
    <section className="px-4 sm:px-0">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-display font-extrabold text-base sm:text-lg text-ink-900 dark:text-white">{title}</h2>
        {count > 0 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 hover:underline cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
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

function RestaurantCardHorizontal({ restaurant, onClick, promo = false }) {
  const open = isRestaurantOpen(restaurant);
  const isCustom = restaurant.isCustomRequest;
  const glowGrad = CUISINE_GLOW_MAP[restaurant.cuisine] || 'from-brand-500 to-pink-500';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
      className="cursor-grow shrink-0 w-[72vw] sm:w-[260px] lg:w-[300px] snap-start group"
    >
      {/* Card with gradient border on hover */}
      <div className={`relative rounded-[1.25rem] overflow-hidden transition-all duration-300 ${
        promo
          ? 'ring-2 ring-brand-500/40 shadow-lg shadow-brand-500/10'
          : 'border border-ink-100 dark:border-ink-800 hover:border-transparent'
      }`}>
        {/* Animated gradient border (visible on hover) */}
        <div className={`absolute -inset-[1px] rounded-[1.25rem] bg-gradient-to-br ${glowGrad} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px] pointer-events-none z-0`} />

        <div className="relative bg-white dark:bg-ink-900 rounded-[1.25rem] overflow-hidden z-[1]">
          {/* Image */}
          <div className="relative h-40 sm:h-44 overflow-hidden bg-ink-100 dark:bg-ink-800">
            <img
              src={restaurantCover(restaurant.cover)}
              alt={restaurant.name}
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                !open ? 'filter blur-[2px] grayscale opacity-50' : ''
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Floating badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
              {restaurant.promo && open ? (
                <span className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-lg shadow-brand-500/30 backdrop-blur-sm animate-pulse-slow">
                  🎁 {restaurant.promo}
                </span>
              ) : isCustom ? (
                <span className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                  ✨ Sur-mesure
                </span>
              ) : <div />}
              <span className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-black/60 backdrop-blur-md text-white shadow-lg">
                ⚡ {restaurant.eta || '20-35 min'}
              </span>
            </div>

            {/* Closed overlay */}
            {!open && (
              <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <span className="px-4 py-2 rounded-2xl bg-black/80 text-white text-xs font-black border border-white/20 shadow-2xl uppercase tracking-wider">
                  🔒 Fermé
                </span>
              </div>
            )}

            {/* Rating badge */}
            {open && (
              <div className="absolute bottom-2.5 right-2.5 z-10">
                <span className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-black shadow-lg">
                  <I.Star size={10} className="fill-yellow-400 text-yellow-400" />
                  {(restaurant.rating ?? 4.8).toString().replace('.', ',')}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-extrabold text-sm text-ink-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
                  {restaurant.name}
                </h3>
                <p className="text-[11px] text-ink-500 dark:text-ink-400 truncate mt-1">
                  {Array.isArray(restaurant.tags) ? restaurant.tags.join(' · ') : ''}
                </p>
              </div>
            </div>

            {/* Ligne Frais de livraison Deliveroo */}
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {isCustom || ['pharmacy','dessert','supermarket','shop','parapharmacy'].includes(restaurant.cuisine) ? (
                <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px]">20 MAD de livraison</span>
              ) : (
                <>
                  <span className="line-through text-ink-400 text-[11px]">2,99 MAD</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">0,00 MAD de livraison</span>
                </>
              )}
            </div>

            <div className="mt-2.5 pt-2 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-ink-500 dark:text-ink-400 font-medium">
                <I.MapPin size={11} className="text-brand-500 shrink-0" /> {restaurant.distance}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-brand-600 dark:text-brand-400 group-hover:gap-1.5 transition-all">
                {restaurant.menu?.length ? 'Voir le menu' : isCustom ? 'Commander' : 'Ouvrir'}
                <I.Right size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RestaurantCardSkeletonHorizontal() {
  return (
    <div className="shrink-0 w-[72vw] sm:w-[260px] lg:w-[300px] bg-white dark:bg-ink-900 rounded-[1.25rem] overflow-hidden border border-ink-100 dark:border-ink-800 animate-pulse">
      <div className="h-40 sm:h-44 bg-ink-200 dark:bg-ink-800 skeleton" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 w-3/4 rounded-lg bg-ink-200 dark:bg-ink-800 skeleton" />
        <div className="h-3 w-1/2 rounded bg-ink-200 dark:bg-ink-800 skeleton" />
        <div className="h-px w-full bg-ink-100 dark:bg-ink-800" />
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-ink-200 dark:bg-ink-800 skeleton" />
          <div className="h-3 w-20 rounded bg-ink-200 dark:bg-ink-800 skeleton" />
        </div>
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
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-500 dark:text-ink-400">
                <span className="flex items-center gap-1">
                  <I.MapPin size={12} className="text-ink-400" /> {r.distance || 'Tanger'}
                </span>
                <span>·</span>
                <span>{isOpen ? 'Ouvert 24h/7d' : (openLabel || 'Fermé')}</span>
                <span>·</span>
                <span>Min. {formatMad(10, { decimals: 0 })}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <I.Star size={12} className="fill-emerald-500 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {(r.rating ?? 4.5).toString().replace('.', ',')}
                  </span>
                </div>
                <span className="text-xs text-ink-500">Livraison {r.cuisine === 'pharmacy' || r.cuisine === 'shop' || r.cuisine === 'supermarket' ? '20' : '0,00'} MAD</span>
              </div>
            </div>
          </div>
          {r.description && (
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
              {r.name}, disponible en livraison directement chez vous ! {CUISINE_ICONS[r.cuisine] || '🍽️'} 🚴‍♂️
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
                  className={`cursor-grow relative shrink-0 px-3 sm:px-4 h-9 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
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
              {r.cuisine === 'pharmacy' ? "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
               r.cuisine === 'parapharmacy' ? "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
               r.cuisine === 'supermarket' ? "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
               r.cuisine === 'shop' ? "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
               "Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !"}
            </p>

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

              const customItem = {
                id: `custom-${r.id}-${Date.now()}`,
                name: r.isCustomRequest
                  ? `[${storeName.trim()}] ${orderDetails.trim()}`
                  : `${r.name} - ${orderDetails.trim()}`,
                price: 0,
                img: r.cuisine === 'pharmacy' ? '/media/restaurants/custom-pharmacy.webp' :
                     r.cuisine === 'parapharmacy' ? '/media/restaurants/custom-parapharmacy.webp' :
                     r.cuisine === 'supermarket' ? '/media/restaurants/custom-supermarket.webp' :
                     r.cuisine === 'shop' ? '/media/restaurants/custom-shop.webp' :
                     '/media/restaurants/custom-patisserie.webp',
                restaurantId: r.id,
                restaurantName: r.isCustomRequest ? storeName.trim() : r.name,
                restaurantCuisine: r.cuisine,
                isCustom: true,
                customDetails: {
                  storeName: r.isCustomRequest ? storeName.trim() : r.name,
                  storeAddress: r.isCustomRequest ? storeAddress.trim() : r.distance,
                  details: orderDetails.trim()
                }
              };

              onAdd(customItem, { id: r.id, name: r.isCustomRequest ? storeName.trim() : r.name });
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
              className={`ml-auto w-10 h-10 rounded-lg grid place-items-center text-sm font-bold shadow-sm transition-all ${
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
  const glowColor = CATEGORY_GLOW[restaurant.cuisine] || '#f97316';

  return (
    <div
      onClick={onClick}
      onMouseMove={spotlightHandler}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
      style={{ '--glow-color': glowColor }}
      className="cursor-grow group text-left w-full bg-white dark:bg-ink-900 rounded-3xl overflow-hidden shadow-card hover:shadow-cardhover border border-ink-200/60 dark:border-ink-800 spotlight transition-transform duration-300 card-glow-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100 dark:bg-ink-950">
        <img
          src={restaurantCover(restaurant.cover)}
          alt={restaurant.name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
            !open ? 'filter blur-sm grayscale opacity-70' : ''
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/10"></div>
        
        {/* Closed Overlay */}
        {!open && (
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
            <span className="bg-ink-950/75 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Fermé · Réouverture demain
            </span>
          </div>
        )}

        {restaurant.isCustomRequest && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-brand-500 text-white shadow-md animate-pulse z-10">
            ✨ SUR-MESURE (+20 MAD)
          </span>
        )}
        {restaurant.promo && open && !restaurant.isCustomRequest && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-md animate-pulse-slow">
            🎁 {restaurant.promo}
          </span>
        )}
      </div>

      <div className="p-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-sm sm:text-base md:text-lg truncate text-ink-900 dark:text-white group-hover:text-brand-500 transition-colors">
              {restaurant.name}
            </h3>
            <div className="text-[10px] sm:text-xs text-ink-500 dark:text-ink-400 truncate mt-0.5">
              {Array.isArray(restaurant.tags) ? restaurant.tags.join(' • ') : ''}
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-bold border border-emerald-500/10">
            <I.Star size={11} className="fill-emerald-500 text-emerald-500 sm:w-3 sm:h-3" />{' '}
            {(restaurant.rating ?? 4.8).toString().replace('.', ',')}
          </span>
        </div>

        <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-ink-100 dark:border-ink-800/80 flex items-center justify-between text-[10px] sm:text-xs">
          <div className="flex flex-col gap-0.5">
            <div className="text-ink-500 dark:text-ink-400 flex items-center gap-1">
              <I.MapPin size={12} className="text-ink-400 sm:w-3.5 sm:h-3.5" /> {restaurant.distance}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-1">
              <span className="line-through text-ink-400 font-normal">2,99 MAD</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">0,00 MAD de livraison</span>
            </div>
          </div>
          <div className="font-bold inline-flex items-center gap-0.5 text-brand-600 dark:text-brand-400 shrink-0">
            Voir le menu <I.Right size={12} className="sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const DeliverooCard = RestaurantCard;

export function RestaurantSkeleton() {
  return (
    <div className="bg-white dark:bg-ink-900 rounded-3xl overflow-hidden border border-ink-200/60 dark:border-ink-800 shadow-sm animate-pulse">
      <div className="aspect-[16/10] bg-ink-200 dark:bg-ink-800/50 skeleton"></div>
      <div className="p-5 space-y-3">
        <div className="h-5 w-2/3 rounded bg-ink-200 dark:bg-ink-800/50 skeleton"></div>
        <div className="h-3.5 w-1/2 rounded bg-ink-200 dark:bg-ink-800/50 skeleton"></div>
        <div className="h-3 w-3/4 rounded bg-ink-200 dark:bg-ink-800/50 skeleton"></div>
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

