'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { I } from '../icons/Icons.jsx';
import { CUISINES, CATEGORIES_BANNERS } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Reveal } from '../components/ui/Reveal.jsx';
import { Tilt } from '../components/ui/Tilt.jsx';
import { rippleEffect } from '../utils/ripple.js';
import { spotlightHandler } from '../utils/spotlight.js';
import { formatMad, restaurantOpenStatus } from '../data/index.js';
import { MenuItemImage, restaurantCover, restaurantLogo } from '../components/ui/MenuItemImage.jsx';
import { MenuItemDetailModal } from '../components/ui/MenuItemDetailModal.jsx';

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
  pizza: 'rgba(249,115,22,0.45)',
  tacos: 'rgba(217,119,6,0.45)',
  kebab: 'rgba(194,65,12,0.45)',
  healthy: 'rgba(16,185,129,0.45)',
  burger: 'rgba(245,158,11,0.45)',
  sushi: 'rgba(236,72,153,0.45)',
  asian: 'rgba(168,85,247,0.45)',
  medical: 'rgba(14,165,233,0.45)',
  dessert: 'rgba(236,72,153,0.45)',
  pharmacy: 'rgba(16,185,129,0.45)',
  drinks: 'rgba(6,182,212,0.45)',
};

function BrowseHero({ name, search, onSearchChange, openCount, totalCount }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-[#120a06] to-ink-950 dark:from-black dark:via-ink-950 dark:to-black" />
      <div className="absolute inset-0 mesh-conic opacity-30 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 grid-bg opacity-[0.06]" aria-hidden />
      <div className="absolute -top-24 -right-20 w-[28rem] h-[28rem] rounded-full bg-brand-500/30 blur-3xl animate-blob pointer-events-none" aria-hidden />
      <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-pink-500/20 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }} aria-hidden />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '8s' }} aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10 sm:pb-14">
        <div className="grid lg:grid-cols-[1fr,280px] xl:grid-cols-[1fr,320px] gap-8 lg:gap-10 items-start">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-widest text-white/80 animate-fade-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Campus & CHU · En direct
            </span>

            <h1 className="mt-5 font-display font-black text-4xl sm:text-5xl lg:text-[3.25rem] tracking-tight leading-[0.95] text-white animate-fade-up" style={{ animationDelay: '80ms' }}>
              {timeGreeting()},{' '}
              <span className="text-gradient text-glow">{name}</span>
              <span className="inline-block ml-1 animate-wiggle">👋</span>
            </h1>

            <p className="mt-4 max-w-lg text-base sm:text-lg text-white/65 leading-relaxed animate-fade-up" style={{ animationDelay: '160ms' }}>
              Découvre les cuisines autour de toi — livré en chambre, à l&apos;aile ou à la BU en moins de 30 min.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '220ms' }}>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-sm text-white/90">
                <I.MapPin size={15} className="text-brand-400 shrink-0" />
                <strong className="font-semibold text-white">CHU-Tanger</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-400/25 text-emerald-200 text-sm font-semibold">
                <I.Bike size={15} /> Livraison offerte
              </span>
            </div>

            <div className="mt-7 sm:mt-8 max-w-xl animate-fade-up" style={{ animationDelay: '280ms' }}>
              <SearchBar value={search} onChange={onSearchChange} variant="hero" />
            </div>
            <div className="mt-6 sm:mt-8 max-w-xl animate-fade-up lg:hidden" style={{ animationDelay: '320ms' }}>
              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card-premium rounded-xl p-3 border border-white/15 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/50">Ouverts</div>
                  <div className="mt-0.5 font-display font-black text-xl text-white">{openCount}<span className="text-xs text-white/50">/{totalCount}</span></div>
                </div>
                <div className="glass-card-premium rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-lg">⚡</div>
                  <div className="font-display font-extrabold text-base text-white">26 min</div>
                </div>
                <div className="glass-card-premium rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-lg">🎁</div>
                  <div className="font-display font-extrabold text-base text-white">0 MAD</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '350ms' }}>
            <div className="glass-card-premium rounded-2xl p-4 border border-white/15 shadow-glow col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Disponible maintenant</div>
              <div className="mt-1 font-display font-black text-3xl text-white">
                {openCount}
                <span className="text-lg font-semibold text-white/50">/{totalCount}</span>
              </div>
              <div className="text-xs text-white/60 mt-0.5">restaurants ouverts</div>
            </div>
            <div className="glass-card-premium rounded-2xl p-4 border border-white/10">
              <div className="text-2xl">⚡</div>
              <div className="mt-2 font-display font-extrabold text-xl text-white">26 min</div>
              <div className="text-[11px] text-white/55">délai moyen</div>
            </div>
            <div className="glass-card-premium rounded-2xl p-4 border border-white/10">
              <div className="text-2xl">🎁</div>
              <div className="mt-2 font-display font-extrabold text-xl text-white">0 MAD</div>
              <div className="text-[11px] text-white/55">frais de livraison</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-brand-50 dark:from-ink-950 to-transparent pointer-events-none" />
    </section>
  );
}

function FeaturedSpotlight({ restaurant, onClick }) {
  const tags = Array.isArray(restaurant.tags) ? restaurant.tags : [];
  const open = isRestaurantOpen(restaurant);

  return (
    <Reveal>
      <button
        type="button"
        onClick={onClick}
        onMouseMove={spotlightHandler}
        className="cursor-grow group relative w-full text-left overflow-hidden rounded-[2rem] border border-brand-500/20 shadow-glow-lg spotlight transition-all duration-500 hover:-translate-y-1 hover:shadow-glow card-glow-hover"
        style={{ '--glow-color': 'rgba(249,115,22,0.4)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-transparent z-10" />
        <img
          src={restaurantCover(restaurant.cover)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6 p-6 sm:p-8 min-h-[220px] sm:min-h-[260px]">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500/90 text-white border border-white/20">
              <I.Flame size={12} /> Coup de cœur
            </span>
            <h3 className="mt-4 font-display font-black text-2xl sm:text-4xl text-white tracking-tight">{restaurant.name}</h3>
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
            <span className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-ink-900 font-bold text-sm group-hover:gap-3 transition-all shadow-lg w-full sm:w-auto">
              Voir le menu <I.Right size={16} />
            </span>
          </div>
        </div>
      </button>
    </Reveal>
  );
}

export function Home({ onPickRestaurant, initialFilter = 'all' }) {
  const { user } = useAuth();
  const { restaurants: catalog, loadingRestaurants, restaurantsError, refreshRestaurants } = useOrders();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const restaurants = useMemo(() => {
    return catalog.filter((r) => {
      const tags = Array.isArray(r.tags) ? r.tags : [];
      const matchCuisine = filter === 'all' || r.cuisine === filter;
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        tags.join(' ').toLowerCase().includes(search.toLowerCase());
      return matchCuisine && matchSearch;
    });
  }, [search, filter, catalog]);

  const loading = loadingRestaurants;
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

  return (
    <div className="page-enter">
      <BrowseHero
        name={name}
        search={search}
        onSearchChange={setSearch}
        openCount={openCount}
        totalCount={catalog.length}
      />

      <div className="relative browse-grid-bg bg-brand-50/50 dark:bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
          {/* Catégories */}
          <section>
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Explorer</span>
                <h2 className="mt-1 font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-ink-900 dark:text-white">
                  Quelle <span className="text-gradient">envie</span> aujourd&apos;hui ?
                </h2>
              </div>
              {filter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-500 transition"
                >
                  Tout voir
                </button>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`cursor-grow shrink-0 w-[7rem] sm:w-[8rem] h-28 sm:h-32 rounded-2xl overflow-hidden text-left p-3.5 snap-start transition-all duration-300 border ${
                  filter === 'all'
                    ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-brand-50 dark:ring-offset-ink-950 scale-[0.97] shadow-glow-lg border-brand-500/40'
                    : 'border-ink-200/60 dark:border-ink-800 hover:scale-[1.03] hover:-translate-y-0.5'
                } bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 text-white card-glow-hover`}
                style={{ '--glow-color': 'rgba(249,115,22,0.4)' }}
              >
                <div className="text-3xl">✨</div>
                <div className="mt-auto font-display font-bold text-sm leading-tight pt-6">Tout</div>
              </button>

              {CATEGORIES_BANNERS.map((c) => {
                const active = filter === c.id;
                const glowColor = CATEGORY_GLOW[c.id] || 'rgba(249,115,22,0.3)';
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilter(active ? 'all' : c.id)}
                    style={{ '--glow-color': glowColor }}
                    className={`cursor-grow group relative shrink-0 w-[7.5rem] sm:w-[8.5rem] h-28 sm:h-32 rounded-2xl overflow-hidden text-left p-3.5 snap-start transition-all duration-300 border card-glow-hover ${
                      active
                        ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-brand-50 dark:ring-offset-ink-950 scale-[0.97] shadow-glow-lg border-white/45'
                        : 'border-white/10 dark:border-white/5 hover:scale-[1.03] hover:-translate-y-0.5'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-95 group-hover:opacity-100 transition`} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
                    <div className="relative text-white h-full flex flex-col">
                      <div className="text-3xl group-hover:scale-110 transition-transform origin-left drop-shadow-sm">{c.emoji}</div>
                      <div className="mt-auto font-display font-bold text-sm leading-tight">{c.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {showFeatured && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-ink-500">Sélection du moment</span>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-500/40 to-transparent" />
              </div>
              <FeaturedSpotlight restaurant={featured} onClick={() => onPickRestaurant(featured)} />
            </section>
          )}

          {/* Grille */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-ink-900 dark:text-white">
                  {filterLabel}
                </h2>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  {loading
                    ? 'Chargement du catalogue…'
                    : `${restaurants.length} adresse${restaurants.length > 1 ? 's' : ''} · triées par proximité`}
                </p>
              </div>
              {!loading && restaurants.length > 0 && (
                <span className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {restaurants.filter((r) => isRestaurantOpen(r)).length} ouverts
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)
                : restaurantsError
                  ? <ApiErrorState message={restaurantsError} onRetry={refreshRestaurants} />
                  : restaurants.length === 0
                    ? <EmptyState catalogEmpty={catalog.length === 0} filter={filter} onShowAll={() => setFilter('all')} />
                    : restaurants.map((r, i) => (
                      <Reveal key={r.id} delay={Math.min(i * 60, 360)}>
                        <Tilt max={5}>
                          <RestaurantCard restaurant={r} onClick={() => onPickRestaurant(r)} />
                        </Tilt>
                      </Reveal>
                    ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, variant = 'default' }) {
  const [focused, setFocused] = useState(false);
  const isHero = variant === 'hero';

  return (
    <div className={`group relative rounded-2xl transition-all duration-350 ${
      focused 
        ? 'shadow-glow-lg scale-[1.01]' 
        : 'shadow-card hover:scale-[1.005]'
    }`}>
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 transition-opacity duration-300 ${focused ? 'opacity-55 blur-md' : 'opacity-0'}`} />
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
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-ink-100 dark:bg-ink-800 text-ink-500 border border-ink-200/50 dark:border-ink-700/50">
          ⌘K
        </span>
      </div>
    </div>
  );
}

export function RestaurantCard({ restaurant, onClick, compact = false }) {
  const tags = Array.isArray(restaurant.tags) ? restaurant.tags : [];
  const openStatus = restaurantOpenStatus(restaurant.openingHours);
  const isOpen = restaurant.isOpen ?? openStatus.isOpen;
  const openLabel = restaurant.openLabel ?? openStatus.openLabel;
  const cardGlow =
    restaurant.cuisine === 'pizza'
      ? 'rgba(249,115,22,0.35)'
      : restaurant.cuisine === 'healthy'
        ? 'rgba(16,185,129,0.35)'
        : restaurant.cuisine === 'medical'
          ? 'rgba(14,165,233,0.35)'
          : 'rgba(236,72,153,0.3)';

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={spotlightHandler}
      style={{ '--glow-color': cardGlow }}
      className={`cursor-grow group text-left w-full glass-card-premium overflow-hidden shadow-card hover:shadow-cardhover border border-ink-200/40 dark:border-ink-800/70 spotlight transition-all duration-400 hover:-translate-y-2 hover:border-brand-500/30 card-glow-hover ${
        compact ? 'rounded-2xl' : 'rounded-[1.75rem]'
      } ${!isOpen ? 'opacity-[0.88]' : ''}`}
    >
      <div className={`relative overflow-hidden ${compact ? 'aspect-[16/11]' : 'aspect-[16/10]'}`}>
        <img
          src={restaurantCover(restaurant.cover)}
          alt={restaurant.name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!isOpen ? 'grayscale-[40%] brightness-75' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-transparent to-violet-500/0 group-hover:from-brand-500/10 group-hover:to-violet-500/10 transition-all duration-500" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {restaurant.promo ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white border border-white/20 shadow-glow max-w-[55%] truncate">
              🎁 {restaurant.promo}
            </span>
          ) : (
            <span />
          )}
          {!isOpen ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/65 backdrop-blur-md text-white border border-white/10 shrink-0">
              🔒 Fermé
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/25 shrink-0 flex items-center gap-1">
              ★ 4.9
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-white/95 shadow-lg shrink-0 bg-white ring-2 ring-black/10">
            <img src={restaurantLogo(restaurant.logo)} alt="" className="w-full h-full object-cover" />
          </div>
          {isOpen && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/25 backdrop-blur-md text-emerald-100 border border-emerald-400/30">
              ⚡ 15–26 min
            </span>
          )}
        </div>
      </div>

      <div className={compact ? 'p-3.5' : 'p-4 sm:p-5'}>
        <h3 className={`font-display font-extrabold truncate text-ink-900 dark:text-white transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400 ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>
          {restaurant.name}
        </h3>
        <p className="mt-0.5 text-xs sm:text-sm text-ink-500 dark:text-ink-400 truncate">
          {tags.slice(0, 3).join(' · ')}
        </p>
        <div className={`flex items-center justify-between gap-2 ${compact ? 'mt-2' : 'mt-3.5'}`}>
          <div className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 flex flex-col gap-0.5 min-w-0">
            <span className="inline-flex items-center gap-1 truncate text-ink-600 dark:text-ink-300">
              <I.MapPin size={13} className="text-brand-500 shrink-0" />
              {restaurant.distance}
            </span>
            {!isOpen ? (
              <span className="text-[10px] font-bold text-red-500 dark:text-red-400 truncate">{openLabel}</span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ouvert maintenant
              </span>
            )}
          </div>
          <span className="font-bold inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-900 text-xs sm:text-sm group-hover:gap-2 group-hover:shadow-glow transition-all shrink-0">
            Menu <I.Right size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}

export function RestaurantSkeleton() {
  return (
    <div className="glass-card-premium rounded-[1.75rem] overflow-hidden border border-ink-200/50 dark:border-ink-800 shadow-card animate-pulse">
      <div className="aspect-[16/10] skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-6 w-2/3 rounded-lg skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
        <div className="flex justify-between pt-2">
          <div className="h-8 w-24 rounded-lg skeleton" />
          <div className="h-9 w-20 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ catalogEmpty = false, filter = 'all', onShowAll }) {
  return (
    <div className="col-span-full relative overflow-hidden rounded-[2rem] border border-ink-200/60 dark:border-ink-800 bg-gradient-to-br from-brand-50/80 via-white to-pink-50/50 dark:from-ink-900 dark:via-ink-950 dark:to-ink-900 p-10 sm:p-14 text-center">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-500/10 blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="text-6xl mb-4 animate-float-slow inline-block">🍽️</div>
        <h3 className="font-display font-extrabold text-xl sm:text-2xl text-ink-900 dark:text-white">
          {catalogEmpty ? 'Aucun restaurant disponible' : 'Rien ici pour l\'instant'}
        </h3>
        <p className="mt-2 text-ink-500 dark:text-ink-400 max-w-md mx-auto text-sm sm:text-base">
          {catalogEmpty
            ? 'Démarrez le backend puis lancez : python manage.py seed_yoha'
            : 'Essayez une autre catégorie ou modifiez votre recherche.'}
        </p>
        {!catalogEmpty && filter !== 'all' && onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white font-bold text-sm shadow-glow hover:opacity-95 transition"
          >
            Voir tous les partenaires
          </button>
        )}
      </div>
    </div>
  );
}

export function ApiErrorState({ message, onRetry }) {
  return (
    <div className="col-span-full relative overflow-hidden rounded-[2rem] border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 dark:from-ink-900 dark:via-ink-950 dark:to-ink-900 p-10 sm:p-14 text-center">
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="font-display font-extrabold text-xl sm:text-2xl text-ink-900 dark:text-white">Connexion au serveur</h3>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 max-w-md mx-auto">
          {message || 'Le catalogue sera disponible dès que le backend répond.'}
        </p>
        <p className="mt-2 text-xs text-ink-400">
          Dans le dossier backend : python manage.py runserver
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white font-bold text-sm shadow-glow hover:opacity-95 transition"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   RESTAURANT PAGE
============================================================================ */
export function RestaurantPage({ restaurant, onBack, onAdd }) {
  const r = restaurant;
  const openStatus = restaurantOpenStatus(r.openingHours);
  const isOpen = r.isOpen ?? openStatus.isOpen;
  const openLabel = r.openLabel ?? openStatus.openLabel;
  const [activeCat, setActiveCat] = useState(r.menu?.[0]?.category ?? '');
  const [selectedItem, setSelectedItem] = useState(null);
  const sectionRefs = useRef({});

  const scrollToCat = (cat) => {
    setActiveCat(cat);
    const el = sectionRefs.current[cat];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 180;
      window.scrollTo({ top, behavior:'smooth' });
    }
  };

  useEffect(() => {
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
      <section className="relative h-[25vh] sm:h-[35vh] min-h-[200px] overflow-hidden">
        <img src={restaurantCover(r.cover)} alt={r.name} className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"></div>
        {/* Floating Back Button */}
        <div className="absolute top-4 left-4 sm:left-6 z-20">
          <button onClick={onBack} className="cursor-grow inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition shadow-lg active:scale-95">
            <I.Left size={16} stroke={2.5}/> <span className="text-xs sm:text-sm font-semibold">Retour</span>
          </button>
        </div>
      </section>

      {/* Floating Glassmorphic Details Card overlapping Cover Image */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-24">
        <div className="glass-strong rounded-3xl p-5 sm:p-8 shadow-cardhover border border-white/20 dark:border-ink-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-white dark:border-ink-950 shadow-cardhover bg-white shrink-0">
                <img src={restaurantLogo(r.logo)} alt="" className="w-full h-full object-cover"/>
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-black text-2xl sm:text-4xl tracking-tight text-ink-900 dark:text-white truncate">{r.name}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-ink-600 dark:text-ink-300">
                  <span className="inline-flex items-center gap-1"><I.MapPin size={14} className="text-brand-500"/> {r.distance}</span>
                  <span className="opacity-70">•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><I.Bike size={14}/> Livraison offerte</span>
                  <span className="opacity-70">•</span>
                  <span className={`inline-flex items-center gap-1.5 font-bold ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
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
          <p className="mt-4 text-ink-500 dark:text-ink-400 text-sm sm:text-base leading-relaxed max-w-3xl">{r.description}</p>
        </div>
      </div>

      {/* Sticky Menu Navigation Bar */}
      <div className="sticky top-16 z-30 glass-strong border-b border-ink-200/60 dark:border-ink-800/60 mt-6 sm:mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar h-14 items-center">
          {r.menu.map(c => {
            const active = activeCat === c.category;
            return (
              <button key={c.category} onClick={() => scrollToCat(c.category)}
                className={`cursor-grow shrink-0 px-4 h-9 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${active
                  ? 'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow scale-105'
                  : 'text-ink-600 dark:text-ink-350 hover:bg-ink-100 dark:hover:bg-ink-800 border border-transparent hover:border-ink-200/50'}`}>
                {c.category}
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
        {r.menu.map(cat => (
          <div key={cat.category} ref={el => sectionRefs.current[cat.category] = el} className="mb-12 scroll-mt-44">
            <h2 className="font-display font-extrabold text-xl sm:text-2xl mb-5 border-l-4 border-brand-500 pl-3">{cat.category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.items.map((it, i) => (
                <Reveal key={it.id} delay={i*40}>
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
    rippleEffect(e);
  };

  const isBestseller = item.price > 80;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); } }}
      className="cursor-grow group relative bg-white dark:bg-ink-900 rounded-2xl overflow-hidden border border-ink-200/50 dark:border-ink-800/80 shadow-card hover:shadow-cardhover transition-all duration-300 spotlight hover:-translate-y-1 hover:border-brand-500/20"
      onMouseMove={spotlightHandler}
    >
      <div className="flex p-3 gap-3">
        <div ref={imgRef} className="menu-img relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-sm border border-ink-100 dark:border-ink-850">
          <MenuItemImage src={item.img} alt={item.name} loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {isBestseller && (
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-brand-500 text-white shadow-sm tracking-wider">
              Populaire
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="font-display font-bold text-sm sm:text-base leading-tight text-ink-900 dark:text-white line-clamp-2 group-hover:text-brand-550 transition-colors">{item.name}</h3>
          <p className="mt-1 text-[11px] sm:text-xs text-ink-500 dark:text-ink-400 line-clamp-2 leading-relaxed">{item.desc}</p>
          <div className="mt-auto pt-2 flex items-center justify-between">
            <div className="font-display font-black text-base sm:text-lg text-ink-900 dark:text-white">{formatMad(item.price)}</div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={orderingDisabled}
              title={orderingDisabled ? 'Restaurant fermé' : 'Ajouter au panier'}
              className={`cursor-grow ripple relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl grid place-items-center transition-all duration-300 ${
                orderingDisabled
                  ? 'bg-ink-200 text-ink-400 dark:bg-ink-800 dark:text-ink-500 cursor-not-allowed'
                  : adding
                    ? 'bg-emerald-500 text-white shadow-glow scale-110'
                    : 'bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:scale-110 active:scale-95'
              }`}
            >
              {adding ? <I.Check size={18} stroke={3}/> : <I.Plus size={18} stroke={3}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
