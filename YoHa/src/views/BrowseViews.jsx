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

function BrowseHero({ name, search, onSearchChange, openCount, totalCount, onOpenCustomModal }) {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-ink-950 border-b border-ink-100 dark:border-ink-800/50">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <I.MapPin size={16} className="text-brand-500 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-sm text-ink-900 dark:text-white">Livraison</span>
              <span className="text-ink-400">·</span>
              <span className="font-semibold text-sm text-brand-600 dark:text-brand-400">Maintenant</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {openCount} ouverts
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <I.MapPin size={14} className="text-brand-500 shrink-0" />
          <span className="text-sm text-ink-600 dark:text-ink-300 font-medium">CHU-Tanger</span>
          <span className="text-ink-300 dark:text-ink-600">·</span>
          <span className="text-sm text-ink-500 dark:text-ink-400">Campus & quartier</span>
        </div>

        <SearchBar value={search} onChange={onSearchChange} variant="hero" />
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
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

  const promoRestaurants = useMemo(() => catalog.filter(r => r.promo && isRestaurantOpen(r)), [catalog]);
  const popularRestaurants = useMemo(() => {
    const open = catalog.filter(r => isRestaurantOpen(r));
    return open.sort((a, b) => (b.rating ?? 4.8) - (a.rating ?? 4.8)).slice(0, 12);
  }, [catalog]);
  const fastDelivery = useMemo(() => {
    return catalog.filter(r => isRestaurantOpen(r)).slice(0, 10);
  }, [catalog]);

  const isNonFoodFilter = ['dessert', 'patisserie', 'pharmacy', 'parapharmacy', 'supermarket', 'shop'].includes(filter);
  const isDefault = filter === 'all' && !search.trim();

  return (
    <div className="page-enter">
      <BrowseHero
        name={name}
        search={search}
        onSearchChange={setSearch}
        openCount={openCount}
        totalCount={catalog.length}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
      />

      <CustomOrderModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />

      <div className="bg-white dark:bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-8">

          {/* Services row */}
          {!search && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {[
                { label: 'Restaurants', emoji: '🍽️', id: 'all' },
                { label: 'Pâtisseries', emoji: '🥐', id: 'dessert' },
                { label: 'Pharmacies', emoji: '💊', id: 'pharmacy' },
                { label: 'Parapharma', emoji: '🌿', id: 'parapharmacy' },
                { label: 'Supermarchés', emoji: '🛒', id: 'supermarket' },
                { label: 'Magasins', emoji: '🛍️', id: 'shop' },
              ].map((s) => {
                const active = isNonFoodFilter ? filter === s.id : s.id === 'all';
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFilter(s.id)}
                    className={`cursor-grow shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                      active
                        ? 'bg-ink-900 dark:bg-white text-white dark:text-ink-900 border-ink-900 dark:border-white shadow-md'
                        : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-ink-300 border-ink-200 dark:border-ink-800 hover:border-ink-400 dark:hover:border-ink-600'
                    }`}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Featured promo banner */}
          {isDefault && promoRestaurants.length > 0 && (
            <section>
              <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 p-[1px]">
                <div className="rounded-2xl bg-gradient-to-br from-ink-900 to-ink-950 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500 text-white mb-2">
                      <I.Flame size={10} className="text-yellow-300" /> Offre du jour
                    </span>
                    <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                      {promoRestaurants[0].promo || 'Profitez de nos offres'}
                    </h3>
                    <p className="text-sm text-white/70 mt-1">
                      {promoRestaurants.length} établissement{promoRestaurants.length > 1 ? 's' : ''} avec promotion active
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPickRestaurant(promoRestaurants[0])}
                    className="cursor-grow shrink-0 px-6 py-3 rounded-xl bg-white text-ink-900 font-extrabold text-sm hover:bg-brand-50 transition-colors shadow-lg"
                  >
                    Voir l&apos;offre →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Category images - only show when not filtering to non-food */}
          {isDefault && (
            <section className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES_BANNERS.map((c) => {
                const active = filter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilter(active ? 'all' : c.id)}
                    className="cursor-grow shrink-0 flex flex-col items-center gap-2 w-20"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                      active ? 'border-brand-500 shadow-lg shadow-brand-500/20 scale-105' : 'border-transparent hover:border-ink-200 dark:hover:border-ink-700'
                    }`}>
                      <img src={c.image} alt={c.label} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-semibold text-ink-700 dark:text-ink-300 text-center leading-tight">{c.label}</span>
                  </button>
                );
              })}
            </section>
          )}

          {/* Non-food category carousel */}
          {isNonFoodFilter && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-ink-500">
                  {filter === 'pharmacy' ? 'Santé' : filter === 'parapharmacy' ? 'Bien-être' : filter === 'supermarket' ? 'Courses' : filter === 'shop' ? 'Shopping' : 'Gourmandises'}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-500/40 to-transparent" />
              </div>
              <CategoryCarousel category={filter === 'dessert' ? 'patisserie' : filter} />
            </section>
          )}

          {/* Horizontal restaurant sections */}
          {!isNonFoodFilter && !search.trim() && (
            <>
              {/* À la une */}
              {showFeatured && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-white">À la une</h2>
                  </div>
                  <FeaturedSpotlight restaurant={featured} onClick={() => onPickRestaurant(featured)} />
                </section>
              )}

              {/* Promos */}
              {promoRestaurants.length > 1 && (
                <HorizontalRow title="Offres près de chez vous" count={promoRestaurants.length - 1} onSeeAll={() => {}}>
                  {promoRestaurants.slice(1).map((r) => (
                    <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                  ))}
                </HorizontalRow>
              )}

              {/* Populaires */}
              <HorizontalRow title="Populaires dans votre quartier" count={popularRestaurants.length} onSeeAll={() => {}}>
                {popularRestaurants.map((r) => (
                  <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                ))}
              </HorizontalRow>

              {/* Livraison rapide */}
              <HorizontalRow title="Livraison la plus rapide" count={fastDelivery.length} onSeeAll={() => {}}>
                {fastDelivery.map((r) => (
                  <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                ))}
              </HorizontalRow>
            </>
          )}

          {/* Full grid: filtered or search results */}
          {(isNonFoodFilter || search.trim()) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-white">
                    {search.trim() ? 'Résultats' : filterLabel}
                  </h2>
                  {!loading && (
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                      {restaurants.length} adresse{restaurants.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeletonHorizontal key={i} />)
                  : restaurantsError
                    ? <ApiErrorState message={restaurantsError} onRetry={refreshRestaurants} />
                    : restaurants.length === 0
                      ? <EmptyState catalogEmpty={catalog.length === 0} filter={filter} onShowAll={() => setFilter('all')} />
                      : restaurants.map((r) => (
                        <RestaurantCardHorizontal key={r.id} restaurant={r} onClick={() => onPickRestaurant(r)} />
                      ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function HorizontalRow({ title, count, onSeeAll, children }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-white">{title}</h2>
        {count > 0 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Tout voir ({count})
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        {children}
      </div>
    </section>
  );
}

function RestaurantCardHorizontal({ restaurant, onClick }) {
  const open = isRestaurantOpen(restaurant);
  const isCustom = restaurant.isCustomRequest;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
      className="cursor-grow shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-ink-900 rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-700 transition-all duration-200 hover:shadow-lg group"
    >
      <div className="relative h-40 sm:h-44 overflow-hidden bg-ink-100 dark:bg-ink-800">
        <img
          src={restaurantCover(restaurant.cover)}
          alt={restaurant.name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !open ? 'filter blur-[1px] grayscale opacity-60' : ''
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          {restaurant.promo && open ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-500 text-white shadow-md">
              🎁 {restaurant.promo}
            </span>
          ) : isCustom ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-md">
              ✨ Sur-mesure
            </span>
          ) : <div />}
          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white">
            ⚡ {restaurant.eta || '20-35 min'}
          </span>
        </div>

        {/* Closed overlay */}
        {!open && (
          <div className="absolute inset-0 bg-ink-950/50 flex items-center justify-center z-10">
            <span className="px-3 py-1.5 rounded-full bg-black/70 text-white text-[11px] font-bold border border-white/20">
              🔒 Fermé
            </span>
          </div>
        )}

        {/* Delivery fee badge bottom-left */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm ${
            isCustom || restaurant.cuisine === 'pharmacy' || restaurant.cuisine === 'dessert'
              ? 'bg-white/90 text-ink-700'
              : 'bg-emerald-500/90 text-white'
          }`}>
            {isCustom || restaurant.cuisine === 'pharmacy' || restaurant.cuisine === 'dessert'
              ? '20 DH livr.'
              : '0,00 € livr.'}
          </span>
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-sm text-ink-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {restaurant.name}
            </h3>
            <div className="text-[11px] text-ink-500 dark:text-ink-400 truncate mt-0.5">
              {Array.isArray(restaurant.tags) ? restaurant.tags.join(' · ') : ''}
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-0.5 text-xs font-bold text-ink-700 dark:text-ink-300">
            <I.Star size={12} className="fill-current text-emerald-500" />{' '}
            {(restaurant.rating ?? 4.8).toString().replace('.', ',')}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-500 dark:text-ink-400">
          <span className="flex items-center gap-1">
            <I.MapPin size={11} className="text-brand-500 shrink-0" /> {restaurant.distance}
          </span>
          <span>·</span>
          <span className="font-semibold text-brand-600 dark:text-brand-400">
            {restaurant.menu?.length ? 'Voir le menu' : isCustom ? 'Commander' : 'Ouvrir'}
          </span>
          <I.Right size={10} />
        </div>
      </div>
    </div>
  );
}

function RestaurantCardSkeletonHorizontal() {
  return (
    <div className="shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-ink-900 rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800 animate-pulse">
      <div className="h-40 sm:h-44 bg-ink-200 dark:bg-ink-800 skeleton" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 w-2/3 rounded bg-ink-200 dark:bg-ink-800 skeleton" />
        <div className="h-3 w-1/2 rounded bg-ink-200 dark:bg-ink-800 skeleton" />
        <div className="h-3 w-1/3 rounded bg-ink-200 dark:bg-ink-800 skeleton" />
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
  const r = restaurant;
  const openStatus = restaurantOpenStatus(r.openingHours);
  const isOpen = r.isOpen ?? openStatus.isOpen;
  const openLabel = r.openLabel ?? openStatus.openLabel;
  const [activeCat, setActiveCat] = useState(r.menu?.[0]?.category ?? '');
  const [selectedItem, setSelectedItem] = useState(null);
  const sectionRefs = useRef({});

  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [orderDetails, setOrderDetails] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  const themeGlow = CATEGORY_GLOW[r.cuisine] || '#f97316';

  const scrollToCat = (cat) => {
    setActiveCat(cat);
    const el = sectionRefs.current[cat];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 180;
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
      const visible = offsets.filter(o => o.top < 220).pop();
      if (visible) setActiveCat(visible.cat);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [r]);

  return (
    <div className="page-enter">
      {/* Dynamic Parallax-like Cover Image Header */}
      <section className="relative h-[30vh] sm:h-[42vh] min-h-[220px] overflow-hidden group">
        <img 
          src={restaurantCover(r.cover)} 
          alt={r.name} 
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[2000ms] will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15"></div>
        
        {/* Animated conically rotating glow mesh overlay in the cover */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12)_0%,transparent_60%)] pointer-events-none mix-blend-screen animate-pulse" />

        {/* Floating Back Button */}
        <div className="absolute top-4 left-4 sm:left-6 z-20">
          <button 
            onClick={onBack} 
            className="cursor-grow inline-flex items-center justify-center gap-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 text-white border border-white/20 hover:bg-white/35 hover:border-white/40 active:scale-95 transition-transform shadow-lg shadow-black/20 text-sm sm:text-base font-bold"
            title="Retour"
          >
            <I.Left size={18} stroke={3}/>
          </button>
        </div>
      </section>

      {/* Floating Glassmorphic Details Card overlapping Cover Image */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-28">
        <Tilt max={2} className="rounded-[2rem]">
          <div 
            style={{ '--glow-color': themeGlow }}
            className="glass-strong rounded-[2rem] p-6 sm:p-8 shadow-cardhover border border-white/25 dark:border-ink-800/80 spotlight card-glow-hover transition-all duration-500"
            onMouseMove={spotlightHandler}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-4 border-white dark:border-ink-950 shadow-cardhover bg-white shrink-0">
                  <img src={restaurantLogo(r.logo)} alt="" className="w-full h-full object-cover"/>
                </div>
                <div className="min-w-0">
                  <h1 className="font-display font-black text-2xl sm:text-4xl tracking-tight text-ink-900 dark:text-white truncate text-glow-slow">
                    {r.name}
                  </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-ink-600 dark:text-ink-300">
                    <span className="inline-flex items-center gap-1"><I.MapPin size={14} className="text-brand-500"/> {r.distance}</span>
                    <span className="opacity-70">•</span>
                    <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold"><I.Bike size={14}/> {r.cuisine === 'pharmacy' || r.cuisine === 'dessert' ? 'Livraison 20 DH' : 'Livraison offerte'}</span>
                    <span className="opacity-70">•</span>
                    <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-full ${
                      isOpen 
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                        : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20'
                    }`}>
                      {isOpen ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ouvert
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {openLabel}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="mt-4 text-ink-600 dark:text-ink-400 text-sm sm:text-base leading-relaxed max-w-4xl">
              {r.description}
            </p>
          </div>
        </Tilt>
      </div>

      {/* Conditionally render sticky menu & items list or the custom form */}
      {!r.isStatic ? (
        <>
          {/* Sticky Menu Navigation Bar */}
          <div className="sticky top-16 z-30 bg-white/80 dark:bg-ink-950/80 backdrop-blur-xl border-b border-ink-200/60 dark:border-ink-800/60 mt-6 sm:mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar h-14 items-center">
              {(r.menu || []).map(c => {
                const active = activeCat === c.category;
                return (
                  <button 
                    key={c.category} 
                    onClick={() => scrollToCat(c.category)}
                    className={`cursor-grow relative shrink-0 px-4 h-9 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                      active
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10'
                        : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-800'
                    }`}
                  >
                    {c.category}
                    {active && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-brand-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            {!isOpen && (
              <div className="mb-8 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 backdrop-blur-sm px-5 py-4 text-center">
                <p className="font-display font-bold text-red-700 dark:text-red-300">🔒 Restaurant fermé</p>
                <p className="mt-1 text-sm text-red-650/90 dark:text-red-300/80">{openLabel} — vous pouvez consulter le menu, la commande reprendra à l&apos;ouverture.</p>
              </div>
            )}
            {(r.menu || []).map(cat => (
              <div key={cat.category} ref={el => sectionRefs.current[cat.category] = el} className="mb-12 scroll-mt-44">
                <h2 className="font-display font-extrabold text-xl sm:text-2xl mb-5 border-l-4 border-brand-500 pl-3">{cat.category}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(cat.items || []).map((it, i) => (
                    <Reveal key={it.db_id || it.id} delay={i*40}>
                      <MenuItem item={it} restaurant={r} onAdd={onAdd} onOpen={() => setSelectedItem(it)} orderingDisabled={!isOpen} />
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {selectedItem && (
            <MenuItemDetailModal
              item={selectedItem}
              restaurant={r}
              onClose={() => setSelectedItem(null)}
              onAdd={onAdd}
              orderingDisabled={!isOpen}
            />
          )}
        </>
      ) : (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="glass-card-premium rounded-3xl p-6 sm:p-8 border border-brand-500/10 shadow-lg">
            <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900 dark:text-white mb-4">
              📝 Commander sur-mesure
            </h2>
            <p className="text-sm sm:text-base text-ink-600 dark:text-ink-400 leading-relaxed mb-6">
              {r.cuisine === 'pharmacy' ? "Nous n'avons pas de menu pré-enregistré pour les pharmacies. Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
               r.cuisine === 'parapharmacy' ? "Nous n'avons pas de menu pré-enregistré pour les parapharmacies. Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
               r.cuisine === 'supermarket' ? "Nous n'avons pas de menu pré-enregistré pour les supermarchés. Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
               r.cuisine === 'shop' ? "Nous n'avons pas de menu pré-enregistré pour les magasins. Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !" :
               "Nous n'avons pas de menu pré-enregistré pour les pâtisseries. Indiquez-nous exactement ce que vous voulez, et notre livreur s'occupe de tout !"}
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
                    <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                      Nom de l&apos;établissement *
                    </span>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Ex: Pharmacie du Progrès, Pâtisserie Paul..."
                      className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-ink-900 dark:text-white"
                    />
                  </label>
                  
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                      Adresse de l&apos;établissement *
                    </span>
                    <input
                      type="text"
                      required
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="Ex: Boulevard Mohammed V, Tanger"
                      className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-ink-900 dark:text-white"
                    />
                  </label>
                </>
              )}

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                  Détaillez votre commande *
                </span>
                <textarea
                  required
                  value={orderDetails}
                  onChange={(e) => setOrderDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-ink-900 dark:text-white resize-none"
                  rows={4}
                  placeholder={
                    r.cuisine === 'pharmacy'
                      ? "Ex: 2 boîtes de Doliprane 1000mg, 1 boîte de Spasfon, 1 sirop Toplexil..."
                      : r.cuisine === 'parapharmacy'
                      ? "Ex: Crème solaire SPF 50+, gel moussant Bioderma..."
                      : r.cuisine === 'supermarket'
                      ? "Ex: 2L de lait, 1kg de sucre, 1 paquet de café..."
                      : r.cuisine === 'shop'
                      ? "Ex: Chargeur iPhone USB-C, écouteurs, piles AA..."
                      : "Ex: 1 boîte de 12 macarons, 1 tarte au citron pour 6 personnes..."
                  }
                />
              </label>

              {/* Informational Banner */}
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <span>💵</span> Mode de tarification
                </p>
                <p className="leading-relaxed">
                  Frais de livraison fixes de <b>20 DH</b> pour cette commande. Le prix d&apos;achat réel des articles sera ajouté directement à la livraison sur présentation du ticket de caisse.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors shadow-md active:scale-[0.98]"
                >
                  <I.Bag size={18} />
                  {isAdded ? 'Commande ajoutée !' : 'Ajouter à mon panier'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
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
                className={`cursor-grow relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl grid place-items-center transition-transform ${
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
          <div className="text-ink-500 dark:text-ink-400 flex items-center gap-1">
            <I.MapPin size={12} className="text-ink-400 sm:w-3.5 sm:h-3.5" /> {restaurant.distance}
          </div>
          <div className="font-bold inline-flex items-center gap-0.5 text-brand-600 dark:text-brand-400">
            Voir le menu <I.Right size={12} className="sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="text-5xl mb-4 animate-bounce-vertical">🍽️</div>
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

