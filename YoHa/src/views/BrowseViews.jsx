'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { I } from '../icons/Icons.jsx';
import { CUISINES, CATEGORIES_BANNERS } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Reveal } from '../components/ui/Reveal.jsx';
import { Tilt } from '../components/ui/Tilt.jsx';
import { Magnetic } from '../components/ui/Magnetic.jsx';
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
      {/* Conically rotating premium glow mesh */}
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,rgba(236,72,153,0.06)_30%,transparent_50%)] animate-rotate-slow pointer-events-none" aria-hidden />
      <div className="absolute inset-0 mesh-conic opacity-35 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 grid-bg opacity-[0.06]" aria-hidden />
      <div className="absolute -top-24 -right-20 w-[28rem] h-[28rem] rounded-full bg-brand-500/20 blur-3xl animate-blob pointer-events-none" aria-hidden />
      <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-pink-500/15 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }} aria-hidden />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" aria-hidden />
 
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10 sm:pb-14">
        <div className="grid lg:grid-cols-[1fr,280px] xl:grid-cols-[1fr,320px] gap-8 lg:gap-10 items-start">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-widest text-white/90 animate-fade-up">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              Campus & CHU · En direct
            </span>
 
            <h1 className="mt-5 font-display font-black text-4xl sm:text-5xl lg:text-[3.25rem] tracking-tight leading-[0.95] text-white animate-fade-up" style={{ animationDelay: '80ms' }}>
              {timeGreeting()},{' '}
              <span className="bg-gradient-to-r from-brand-400 via-pink-400 to-violet-400 bg-clip-text text-transparent text-glow-slow">{name}</span>
              <span className="inline-block ml-1 animate-wiggle">👋</span>
            </h1>
 
            <p className="mt-4 max-w-lg text-base sm:text-lg text-white/70 leading-relaxed animate-fade-up" style={{ animationDelay: '160ms' }}>
              Découvre les cuisines autour de toi — livré en chambre, à l&apos;aile ou à la BU en moins de 30 min.
            </p>
 
            <div className="mt-5 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '220ms' }}>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-sm text-white/90">
                <I.MapPin size={15} className="text-brand-400 shrink-0" />
                <strong className="font-semibold text-white">CHU-Tanger</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/25 text-emerald-300 text-sm font-semibold">
                <I.Bike size={15} /> Livraison offerte
              </span>
            </div>
 
            <div className="mt-7 sm:mt-8 max-w-xl animate-fade-up" style={{ animationDelay: '280ms' }}>
              <SearchBar value={search} onChange={onSearchChange} variant="hero" />
            </div>
            <div className="mt-6 sm:mt-8 max-w-xl animate-fade-up lg:hidden" style={{ animationDelay: '320ms' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card-premium rounded-2xl p-4 border border-white/10 hover:border-pink-500/30 transition-all duration-300 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-xl shrink-0">⚡</div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Délai</div>
                    <div className="font-display font-extrabold text-base text-white mt-0.5">26 min</div>
                  </div>
                </div>
                <div className="glass-card-premium rounded-2xl p-4 border border-white/10 hover:border-violet-500/30 transition-all duration-300 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl shrink-0">🎁</div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Livraison</div>
                    <div className="font-display font-extrabold text-base text-white mt-0.5">Offerte</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-1 gap-3.5 animate-fade-up" style={{ animationDelay: '350ms' }}>
            <Tilt max={8}>
              <div className="glass-card-premium rounded-2xl p-6 border border-white/10 hover:scale-[1.02] hover:border-pink-500/35 hover:shadow-[0_0_25px_rgba(236,72,153,0.2)] transition-all duration-300 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-pink-500/15 border border-pink-400/20 flex items-center justify-center text-3xl shrink-0">
                  ⚡
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-pink-400">Temps estimé</div>
                  <div className="font-display font-black text-3xl text-white leading-none mt-1">26 min</div>
                  <div className="text-xs text-white/50 mt-1.5">Livraison moyenne sur campus</div>
                </div>
              </div>
            </Tilt>
            <Tilt max={8}>
              <div className="glass-card-premium rounded-2xl p-6 border border-white/10 hover:scale-[1.02] hover:border-violet-500/35 hover:shadow-[0_0_25px_rgba(139,92,246,0.2)] transition-all duration-300 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center text-3xl shrink-0">
                  🎁
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-violet-400">Frais de port</div>
                  <div className="font-display font-black text-3xl text-white leading-none mt-1">0 MAD</div>
                  <div className="text-xs text-white/50 mt-1.5">Offerte dès 50 MAD d'achat</div>
                </div>
              </div>
            </Tilt>
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
      <Tilt max={3}>
        <button
          type="button"
          onClick={onClick}
          onMouseMove={spotlightHandler}
          className="cursor-grow group relative w-full text-left overflow-hidden rounded-[2rem] border border-brand-500/20 shadow-glow-lg spotlight transition-all duration-500 hover:-translate-y-1 hover:shadow-glow card-glow-hover"
          style={{ '--glow-color': 'rgba(249,115,22,0.45)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-transparent z-10" />
          <img
            src={restaurantCover(restaurant.cover)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110 will-change-transform"
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
              <span className="btn-shimmer inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-ink-900 font-extrabold text-sm group-hover:gap-3 group-hover:bg-brand-50 group-hover:text-brand-650 transition-all duration-300 shadow-xl w-full sm:w-auto border border-white/20 select-none">
                Voir le menu <I.Right size={16} className="group-hover:translate-x-1 transition-transform" />
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
              <Tilt max={10} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`cursor-grow w-[7.5rem] sm:w-[8.5rem] h-28 sm:h-32 rounded-2xl overflow-hidden text-left p-3.5 transition-all duration-300 border card-glow-hover flex flex-col justify-between ${
                    filter === 'all'
                      ? 'scale-[0.97] border-brand-500/80 shadow-[0_0_25px_rgba(249,115,22,0.45),inset_0_0_12px_rgba(249,115,22,0.25)] ring-2 ring-brand-500 ring-offset-2 ring-offset-brand-50 dark:ring-offset-ink-950'
                      : 'border-ink-200/60 dark:border-ink-800 hover:scale-[1.03] hover:-translate-y-0.5'
                  } bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 text-white`}
                  style={{ '--glow-color': 'rgba(249,115,22,0.45)' }}
                >
                  <div className="text-3xl transition-all duration-300 transform hover:scale-120 hover:-translate-y-1.5 select-none animate-bounce-vertical drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]">✨</div>
                  <div className="mt-auto font-display font-black text-sm leading-tight uppercase tracking-wider">Tout</div>
                </button>
              </Tilt>

              {CATEGORIES_BANNERS.map((c) => {
                const active = filter === c.id;
                const glowColor = CATEGORY_GLOW[c.id] || 'rgba(249,115,22,0.3)';
                return (
                  <Tilt key={c.id} max={10} className="shrink-0 snap-start">
                    <button
                      type="button"
                      onClick={() => setFilter(active ? 'all' : c.id)}
                      style={{
                        '--glow-color': glowColor,
                        borderColor: active ? glowColor : undefined,
                        boxShadow: active ? `0 0 25px ${glowColor}, inset 0 0 12px ${glowColor}` : undefined
                      }}
                      className={`cursor-grow group relative w-[7.5rem] sm:w-[8.5rem] h-28 sm:h-32 rounded-2xl overflow-hidden text-left p-3.5 transition-all duration-300 border card-glow-hover flex flex-col justify-between ${
                        active
                          ? 'scale-[0.97] ring-2 ring-offset-2 ring-offset-brand-50 dark:ring-offset-ink-950'
                          : 'border-white/10 dark:border-white/5 hover:scale-[1.03] hover:-translate-y-0.5'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-90 group-hover:opacity-100 transition duration-300`} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
                      <div className="relative text-white h-full flex flex-col justify-between w-full">
                        <div className="text-3xl transition-all duration-300 transform group-hover:scale-125 group-hover:-translate-y-1.5 origin-left select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
                          {c.emoji}
                        </div>
                        <div className="mt-auto font-display font-black text-sm leading-tight uppercase tracking-wider">{c.label}</div>
                      </div>
                    </button>
                  </Tilt>
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

  const themeGlow = CATEGORY_GLOW[r.cuisine] || 'rgba(249, 115, 22, 0.35)';

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
      <section className="relative h-[30vh] sm:h-[42vh] min-h-[220px] overflow-hidden group">
        <img 
          src={restaurantCover(r.cover)} 
          alt={r.name} 
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[2000ms] group-hover:scale-110 will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15"></div>
        
        {/* Animated conically rotating glow mesh overlay in the cover */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12)_0%,transparent_60%)] pointer-events-none mix-blend-screen animate-pulse" />

        {/* Floating Back Button wrapped in Magnetic */}
        <div className="absolute top-4 left-4 sm:left-6 z-20">
          <Magnetic strength={15}>
            <button 
              onClick={onBack} 
              className="cursor-grow inline-flex items-center gap-2 px-4.5 py-3 rounded-2xl bg-black/45 backdrop-blur-md text-white border border-white/10 hover:bg-black/65 hover:border-white/20 transition-all shadow-glow-lg active:scale-95 text-xs sm:text-sm font-bold"
            >
              <I.Left size={16} stroke={3}/> <span>Retour</span>
            </button>
          </Magnetic>
        </div>
      </section>

      {/* Floating Glassmorphic Details Card overlapping Cover Image */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-28">
        <Tilt max={2}>
          <div 
            style={{ '--glow-color': themeGlow }}
            className="glass-strong rounded-[2rem] p-6 sm:p-8 shadow-cardhover border border-white/25 dark:border-ink-800/80 spotlight card-glow-hover transition-all duration-500"
            onMouseMove={spotlightHandler}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-4 border-white dark:border-ink-950 shadow-cardhover bg-white shrink-0 hover:scale-105 transition-transform duration-300">
                  <img src={restaurantLogo(r.logo)} alt="" className="w-full h-full object-cover"/>
                </div>
                <div className="min-w-0">
                  <h1 className="font-display font-black text-2xl sm:text-4xl tracking-tight text-ink-900 dark:text-white truncate text-glow-slow">
                    {r.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-ink-650 dark:text-ink-300">
                    <span className="inline-flex items-center gap-1"><I.MapPin size={14} className="text-brand-500"/> {r.distance}</span>
                    <span className="opacity-70">•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"><I.Bike size={14}/> Livraison offerte</span>
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
            
            <p className="mt-4 text-ink-650 dark:text-ink-350 text-sm sm:text-base leading-relaxed max-w-4xl">
              {r.description}
            </p>
          </div>
        </Tilt>
      </div>

      {/* Sticky Menu Navigation Bar */}
      <div className="sticky top-16 z-30 glass-strong border-b border-ink-200/60 dark:border-ink-800/60 mt-6 sm:mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2.5 overflow-x-auto no-scrollbar h-14 items-center">
          {r.menu.map(c => {
            const active = activeCat === c.category;
            return (
              <button 
                key={c.category} 
                onClick={() => scrollToCat(c.category)}
                style={{
                  boxShadow: active ? `0 0 15px ${themeGlow.replace('0.35', '0.25')}` : undefined,
                  borderColor: active ? themeGlow : undefined
                }}
                className={`cursor-grow shrink-0 px-4.5 h-9 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 ${active
                  ? 'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow scale-105'
                  : 'text-ink-600 dark:text-ink-350 hover:bg-ink-100 dark:hover:bg-ink-800 border border-transparent hover:border-ink-200/50'}`}
              >
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
  const itemGlow = CATEGORY_GLOW[restaurant.cuisine] || 'rgba(249, 115, 22, 0.15)';

  return (
    <Tilt max={4}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); } }}
        style={{ '--glow-color': itemGlow }}
        className="cursor-grow group relative bg-white dark:bg-ink-900 rounded-2xl overflow-hidden border border-ink-200/50 dark:border-ink-800/80 shadow-card hover:shadow-cardhover transition-all duration-300 spotlight hover:-translate-y-1 hover:border-brand-500/20 card-glow-hover"
        onMouseMove={spotlightHandler}
      >
        <div className="flex p-3 gap-3">
          <div ref={imgRef} className="menu-img relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-sm border border-ink-100 dark:border-ink-850">
            <MenuItemImage src={item.img} alt={item.name} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            {isBestseller && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-glow tracking-wider animate-pulse">
                Populaire
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="font-display font-bold text-sm sm:text-base leading-tight text-ink-900 dark:text-white line-clamp-2 group-hover:text-brand-650 dark:group-hover:text-brand-400 transition-colors">{item.name}</h3>
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
                      : 'bg-ink-900 text-white dark:bg-white dark:text-ink-900 hover:scale-110 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white active:scale-95 shadow-md'
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
  const glowColor = CATEGORY_GLOW[restaurant.cuisine] || 'rgba(249,115,22,0.3)';

  return (
    <div
      onClick={onClick}
      onMouseMove={spotlightHandler}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); } }}
      style={{ '--glow-color': glowColor }}
      className="cursor-grow group text-left w-full bg-white dark:bg-ink-900 rounded-3xl overflow-hidden shadow-card hover:shadow-cardhover border border-ink-200/60 dark:border-ink-800 spotlight transition-all duration-300 card-glow-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100 dark:bg-ink-950">
        <img
          src={restaurantCover(restaurant.cover)}
          alt={restaurant.name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
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

        {restaurant.promo && open && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-md animate-pulse-slow">
            🎁 {restaurant.promo}
          </span>
        )}

        <button
          className="cursor-grow absolute top-3 right-3 w-9 h-9 rounded-full glass-strong grid place-items-center hover:scale-110 transition-transform text-white"
          onClick={(e) => {
            e.stopPropagation();
          }}
          aria-label="Ajouter aux favoris"
        >
          <I.Heart size={16} />
        </button>

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-ink-900 shadow flex items-center gap-1">
            <I.Clock size={12} className="text-brand-500" /> {restaurant.eta}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-ink-900 shadow">
            {restaurant.fee}
          </span>
        </div>
      </div>

      <div className="p-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-lg truncate text-ink-900 dark:text-white group-hover:text-brand-500 transition-colors">
              {restaurant.name}
            </h3>
            <div className="text-xs text-ink-500 dark:text-ink-400 truncate mt-0.5">
              {Array.isArray(restaurant.tags) ? restaurant.tags.join(' • ') : ''}
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/10">
            <I.Star size={12} className="fill-emerald-500 text-emerald-500" />{' '}
            {(restaurant.rating ?? 4.8).toString().replace('.', ',')}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800/80 flex items-center justify-between text-xs">
          <div className="text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
            <I.MapPin size={14} className="text-ink-400" /> {restaurant.distance}
          </div>
          <div className="font-bold inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 group-hover:gap-2 transition-all">
            Voir le menu <I.Right size={14} className="group-hover:translate-x-0.5 transition-transform" />
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

export function EmptyState({ catalogEmpty, filter, onShowAll }) {
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
      {!catalogEmpty && onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-5 cursor-grow px-4 py-2 rounded-xl bg-ink-900 text-white dark:bg-white dark:text-ink-900 font-bold text-xs shadow hover:scale-105 active:scale-95 transition-all"
        >
          Voir tous les établissements
        </button>
      )}
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
          className="mt-4 cursor-grow px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 hover:scale-105 active:scale-95 transition-all"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

