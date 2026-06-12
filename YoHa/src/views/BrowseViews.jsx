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
  const filterLabel = filter === 'all' ? 'Tous les restaurants' : CUISINES.find((c) => c.id === filter)?.label;

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 dark:from-black dark:via-ink-950 dark:to-black" />
        <div className="absolute inset-0 grid-bg opacity-[0.07]" aria-hidden />
        <div className="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-brand-500/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">
              {timeGreeting()} · YouHa Tanger
            </p>
            <h1 className="mt-2 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white">
              Salut{' '}
              <span className="bg-gradient-to-r from-brand-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                {name}
              </span>{' '}
              👋
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm text-white/90">
                <I.MapPin size={15} className="text-brand-400 shrink-0" />
                Livraison à <strong className="text-white font-semibold">CHU-Tanger</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                15–20 min
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/5 text-white/70 text-xs font-semibold">
                <I.Bike size={14} /> Livraison offerte
              </span>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 max-w-2xl">
            <SearchBar value={search} onChange={setSearch} variant="hero" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Catégories visuelles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg sm:text-xl text-ink-900 dark:text-white">Catégories</h2>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                Tout voir
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES_BANNERS.map((c) => {
              const active = filter === c.id;
              const glowColorMap = {
                pizza: 'rgba(249,115,22,0.45)',
                tacos: 'rgba(217,119,6,0.45)',
                kebab: 'rgba(194,65,12,0.45)',
                healthy: 'rgba(16,185,129,0.45)',
                burger: 'rgba(245,158,11,0.45)',
                sushi: 'rgba(236,72,153,0.45)',
                asian: 'rgba(168,85,247,0.45)',
                medical: 'rgba(14,165,233,0.45)',
                dessert: 'rgba(236,72,153,0.45)',
                drinks: 'rgba(6,182,212,0.45)',
              };
              const glowColor = glowColorMap[c.id] || 'rgba(249,115,22,0.3)';
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setFilter(active ? 'all' : c.id)}
                  style={{ '--glow-color': glowColor }}
                  className={`cursor-grow group relative shrink-0 w-[7.5rem] sm:w-[8.5rem] h-28 sm:h-32 rounded-2xl overflow-hidden text-left p-3.5 snap-start transition-all duration-300 border border-white/10 dark:border-white/5 card-glow-hover ${
                    active ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-ink-950 scale-[0.95] shadow-glow-lg border-white/45' : 'hover:scale-[1.03] hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-95 group-hover:opacity-100 transition`} />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />
                  <div className="relative text-white h-full flex flex-col">
                    <div className="text-3xl group-hover:scale-110 transition-transform origin-left">{c.emoji}</div>
                    <div className="mt-auto font-display font-bold text-sm leading-tight">{c.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtres cuisine */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CUISINES.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`cursor-grow shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  active
                    ? 'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow scale-105'
                    : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-ink-200 border border-ink-200/60 dark:border-ink-800 hover:border-brand-500/40 hover:bg-brand-50/5 dark:hover:bg-brand-500/5 hover:-translate-y-0.5 hover:shadow-sm'
                }`}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            );
          })}
        </div>

        {/* Grille principale */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">{filterLabel}</h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {loading ? 'Chargement du catalogue…' : `${restaurants.length} adresse${restaurants.length > 1 ? 's' : ''} près de vous`}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)
              : restaurantsError
                ? <ApiErrorState message={restaurantsError} onRetry={refreshRestaurants} />
                : restaurants.length === 0
                  ? <EmptyState catalogEmpty={catalog.length === 0} filter={filter} onShowAll={() => setFilter('all')} />
                  : restaurants.map((r, i) => (
                    <Reveal key={r.id} delay={i * 50}>
                      <Tilt max={5}>
                        <RestaurantCard restaurant={r} onClick={() => onPickRestaurant(r)} />
                      </Tilt>
                    </Reveal>
                  ))}
          </div>
        </section>
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
  const cardGlow = restaurant.cuisine === 'pizza' ? 'rgba(249,115,22,0.3)' : restaurant.cuisine === 'healthy' ? 'rgba(16,185,129,0.3)' : 'rgba(236,72,153,0.3)';

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={spotlightHandler}
      style={{ '--glow-color': cardGlow }}
      className={`cursor-grow group text-left w-full bg-white dark:bg-ink-900 overflow-hidden shadow-card hover:shadow-cardhover border border-ink-200/50 dark:border-ink-800/80 spotlight transition-all duration-350 hover:-translate-y-1.5 hover:border-brand-500/20 card-glow-hover ${
        compact ? 'rounded-2xl' : 'rounded-3xl'
      } ${!isOpen ? 'opacity-90' : ''}`}
    >
      <div className={`relative overflow-hidden ${compact ? 'aspect-[16/11]' : 'aspect-[16/10]'}`}>
        <img
          src={restaurantCover(restaurant.cover)}
          alt={restaurant.name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!isOpen ? 'grayscale-[35%]' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />

        {!isOpen ? (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-sm text-white border border-white/10 shadow-md">
            🔒 Fermé
          </span>
        ) : (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-md flex items-center gap-1">
            ★ 4.9
          </span>
        )}

        {restaurant.promo && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white border border-white/20 shadow-glow">
            🎁 {restaurant.promo}
          </span>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/95 dark:border-ink-900/95 shadow-md shrink-0 bg-white">
            <img src={restaurantLogo(restaurant.logo)} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className={compact ? 'p-3.5' : 'p-4 sm:p-5'}>
        <h3 className={`font-display font-extrabold truncate text-ink-900 dark:text-white transition-colors group-hover:text-brand-550 ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>
          {restaurant.name}
        </h3>
        <p className="mt-0.5 text-xs sm:text-sm text-ink-500 dark:text-ink-400 truncate">
          {tags.slice(0, 3).join(' · ')}
        </p>
        <div className={`flex items-center justify-between gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
          <div className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 flex flex-col gap-0.5 min-w-0">
            <span className="inline-flex items-center gap-1 truncate text-ink-600 dark:text-ink-300">
              <I.MapPin size={13} className="text-brand-500 shrink-0" />
              {restaurant.distance}
            </span>
            {!isOpen ? (
              <span className="text-[10px] font-bold text-red-500 dark:text-red-400 truncate">{openLabel}</span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ouvert
              </span>
            )}
          </div>
          <span className="font-bold inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 text-xs sm:text-sm group-hover:gap-2 transition-all shrink-0">
            Menu <I.Right size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}

export function RestaurantSkeleton() {
  return (
    <div className="bg-white dark:bg-ink-900 rounded-3xl overflow-hidden border border-ink-200/60 dark:border-ink-800 shadow-card">
      <div className="aspect-[16/10] skeleton" />
      <div className="p-5 space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 rounded skeleton" />
            <div className="h-3 w-1/2 rounded skeleton" />
          </div>
        </div>
        <div className="h-3 w-3/4 rounded skeleton" />
      </div>
    </div>
  );
}

export function EmptyState({ catalogEmpty = false, filter = 'all', onShowAll }) {
  return (
    <div className="col-span-full grid place-items-center text-center py-20">
      <div className="text-6xl mb-4 animate-wiggle">🍽️</div>
      <h3 className="font-display font-bold text-xl">
        {catalogEmpty ? 'Aucun restaurant disponible' : 'Aucun restaurant ici pour l\'instant'}
      </h3>
      <p className="mt-1 text-ink-500 max-w-md">
        {catalogEmpty
          ? 'Le catalogue est vide. Démarrez le backend puis lancez : python manage.py seed_yoha'
          : 'Essayez une autre catégorie ou recherche.'}
      </p>
      {!catalogEmpty && filter !== 'all' && onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-4 text-sm font-semibold text-brand-600 hover:underline"
        >
          Voir tous les restaurants
        </button>
      )}
    </div>
  );
}

export function ApiErrorState({ message, onRetry }) {
  return (
    <div className="col-span-full grid place-items-center text-center py-16 px-4">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="font-display font-bold text-xl">Connexion au serveur</h3>
      <p className="mt-2 text-sm text-ink-500 max-w-md">
        {message || 'Le catalogue sera disponible dès que le backend répond.'}
      </p>
      <p className="mt-2 text-xs text-ink-400">
        Dans le dossier backend : python manage.py runserver
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:opacity-90 transition"
        >
          Réessayer
        </button>
      )}
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
