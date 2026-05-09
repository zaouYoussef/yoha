import React, { useState, useEffect, useMemo, useRef } from 'react';
import { I } from '../icons/Icons.jsx';
import { RESTAURANTS, CUISINES, CATEGORIES_BANNERS } from '../data/index.js';
import { Reveal } from '../components/ui/Reveal.jsx';
import { Tilt } from '../components/ui/Tilt.jsx';
import { rippleEffect } from '../utils/ripple.js';
import { spotlightHandler } from '../utils/spotlight.js';
import { formatMad } from '../data/index.js';
import { MenuItemImage } from '../components/ui/MenuItemImage.jsx';

export function Home({ onPickRestaurant, initialFilter = 'all' }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [filter]);

  const restaurants = useMemo(() => {
    return RESTAURANTS.filter(r => {
      const matchCuisine = filter === 'all' || r.cuisine === filter;
      const matchSearch = !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.join(' ').toLowerCase().includes(search.toLowerCase());
      return matchCuisine && matchSearch;
    });
  }, [search, filter]);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-start sm:items-center gap-3 flex-wrap">
          <div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
              Salut <span className="text-gradient">toi</span> 👋
            </h1>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400">
              <I.MapPin size={14}/> Livraison à <span className="font-semibold text-ink-700 dark:text-ink-200">CHU-Tanger</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Maintenant — 15-20 min
            </span>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} />

        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto no-scrollbar pt-1">
          <div className="flex gap-3 min-w-max sm:min-w-0 sm:grid sm:grid-cols-4 lg:grid-cols-8">
            {CATEGORIES_BANNERS.map((c) => {
              const active = filter === c.id;
              return (
                <button key={c.label} onClick={() => setFilter(active ? 'all' : c.id)}
                  className={`cursor-grow group relative shrink-0 w-32 sm:w-auto h-24 rounded-2xl overflow-hidden text-left p-3 transition-all ${active ? 'ring-2 ring-brand-500 scale-[0.98]' : ''}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-90 group-hover:opacity-100 transition`}></div>
                  <div className="relative text-white">
                    <div className="text-2xl group-hover:scale-110 transition-transform">{c.emoji}</div>
                    <div className="font-display font-bold text-sm mt-1">{c.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0 pt-1">
          {CUISINES.map(c => {
            const active = filter === c.id;
            return (
              <button key={c.id} onClick={() => setFilter(c.id)}
                className={`cursor-grow shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${active
                  ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900 shadow-md scale-105'
                  : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-ink-200 border border-ink-200 dark:border-ink-800 hover:border-brand-500'}`}>
                <span>{c.emoji}</span> {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
          {filter === 'all' ? 'Tous les restaurants' : CUISINES.find(c => c.id === filter)?.label}
        </h2>
        <span className="text-sm text-ink-500 dark:text-ink-400">{loading ? '…' : `${restaurants.length} adresses`}</span>
      </div>

      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)
          : restaurants.length === 0
            ? <EmptyState />
            : restaurants.map((r, i) => (
                <Reveal key={r.id} delay={i*60}>
                  <Tilt max={6}>
                    <RestaurantCard restaurant={r} onClick={() => onPickRestaurant(r)} />
                  </Tilt>
                </Reveal>
              ))
        }
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`group relative rounded-2xl transition-all ${focused ? 'shadow-glow' : 'shadow-card'}`}>
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 transition-opacity ${focused ? 'opacity-60 blur-md' : 'opacity-0'}`}></div>
      <div className="relative flex items-center gap-3 px-4 sm:px-5 h-14 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800">
        <I.Search size={20} className="text-ink-400 shrink-0"/>
        <input
          type="text" value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Pizza, sushi, bowls healthy…"
          className="flex-1 bg-transparent outline-none placeholder:text-ink-400 text-base"
        />
        {value && (
          <button onClick={() => onChange('')} className="cursor-grow p-1 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800">
            <I.X size={16}/>
          </button>
        )}
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-ink-100 dark:bg-ink-800 text-ink-500">⌘K</span>
      </div>
    </div>
  );
}

export function RestaurantCard({ restaurant, onClick }) {
  return (
    <button onClick={onClick} onMouseMove={spotlightHandler}
      className="cursor-grow group text-left w-full bg-white dark:bg-ink-900 rounded-3xl overflow-hidden shadow-card hover:shadow-cardhover border border-ink-200/60 dark:border-ink-800 spotlight">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={restaurant.cover} alt={restaurant.name} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"></div>
        {restaurant.promo && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-md">
            🎁 {restaurant.promo}
          </span>
        )}
        <button className="cursor-grow absolute top-3 right-3 w-9 h-9 rounded-full glass-strong grid place-items-center hover:scale-110 transition-transform"
          onClick={(e) => { e.stopPropagation(); }}>
          <I.Heart size={16}/>
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-ink-900 shadow flex items-center gap-1">
            <I.Clock size={12}/> {restaurant.eta}
          </span>
        </div>
      </div>
      <div className="p-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg truncate">{restaurant.name}</h3>
            <div className="text-sm text-ink-500 dark:text-ink-400 truncate">{restaurant.tags.join(' • ')}</div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <I.Star size={12} className="fill-current"/> {restaurant.rating.toString().replace('.', ',')}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-ink-500 dark:text-ink-400 flex items-center gap-1.5"><I.MapPin size={14}/> {restaurant.distance}</div>
          <div className="font-semibold inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 group-hover:gap-2 transition-all">
            Voir le menu <I.Right size={14}/>
          </div>
        </div>
      </div>
    </button>
  );
}

export function RestaurantSkeleton() {
  return (
    <div className="bg-white dark:bg-ink-900 rounded-3xl overflow-hidden border border-ink-200/60 dark:border-ink-800">
      <div className="aspect-[16/10] skeleton"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 rounded skeleton"></div>
        <div className="h-3 w-1/2 rounded skeleton"></div>
        <div className="h-3 w-3/4 rounded skeleton"></div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="col-span-full grid place-items-center text-center py-20">
      <div className="text-6xl mb-4 animate-wiggle">🍽️</div>
      <h3 className="font-display font-bold text-xl">Aucun restaurant ici pour l'instant</h3>
      <p className="mt-1 text-ink-500">Essayez une autre catégorie ou recherche.</p>
    </div>
  );
}

/* ============================================================================
   RESTAURANT PAGE
============================================================================ */
export function RestaurantPage({ restaurant, onBack, onAdd }) {
  const r = restaurant;
  const [activeCat, setActiveCat] = useState(r.menu[0].category);
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
      <section className="relative h-[42vh] sm:h-[55vh] min-h-[280px] overflow-hidden">
        <img src={r.cover} alt={r.name} className="absolute inset-0 w-full h-full object-cover scale-105"/>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent"></div>
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-12">
            <button onClick={onBack} className="cursor-grow mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl glass text-white hover:bg-white/20 transition">
              <I.Left size={18}/> Retour
            </button>
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-white shadow-cardhover bg-white">
                <img src={r.logo} alt="" className="w-full h-full object-cover"/>
              </div>
              <div className="text-white">
                <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight">{r.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1"><I.Star size={14} className="fill-amber-400 text-amber-400"/> <b>{r.rating.toString().replace('.',',')}</b> <span className="opacity-70">({r.reviews}+ avis)</span></span>
                  <span className="opacity-70">•</span>
                  <span className="inline-flex items-center gap-1"><I.Clock size={14}/> {r.eta}</span>
                  <span className="opacity-70">•</span>
                  <span className="inline-flex items-center gap-1"><I.MapPin size={14}/> {r.distance}</span>
                  <span className="opacity-70">•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-200"><I.Bike size={14}/> Livraison offerte</span>
                </div>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-white/85 text-sm sm:text-base">{r.description}</p>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-30 glass-strong border-b border-ink-200/60 dark:border-ink-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar h-14 items-center">
          {r.menu.map(c => {
            const active = activeCat === c.category;
            return (
              <button key={c.category} onClick={() => scrollToCat(c.category)}
                className={`cursor-grow shrink-0 px-4 h-10 rounded-full text-sm font-semibold transition-all ${active
                  ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'}`}>
                {c.category}
              </button>
            );
          })}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {r.menu.map(cat => (
          <div key={cat.category} ref={el => sectionRefs.current[cat.category] = el} className="mb-12 scroll-mt-44">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-5">{cat.category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.items.map((it, i) => (
                <Reveal key={it.id} delay={i*40}>
                  <MenuItem item={it} restaurant={r} onAdd={onAdd} />
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function MenuItem({ item, restaurant, onAdd }) {
  const [adding, setAdding] = useState(false);
  const imgRef = useRef();

  const handleAdd = (e) => {
    onAdd(item, restaurant, imgRef.current);
    setAdding(true);
    setTimeout(() => setAdding(false), 600);
    rippleEffect(e);
  };

  return (
    <div className="group relative bg-white dark:bg-ink-900 rounded-2xl overflow-hidden border border-ink-200/60 dark:border-ink-800 shadow-card hover:shadow-cardhover transition-all spotlight"
      onMouseMove={spotlightHandler}>
      <div className="flex p-3 gap-3">
        <div ref={imgRef} className="menu-img relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden">
          <MenuItemImage src={item.img} alt={item.name} loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="font-display font-bold text-base leading-tight line-clamp-2">{item.name}</h3>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 line-clamp-2">{item.desc}</p>
          <div className="mt-auto pt-3 flex items-center justify-between">
            <div className="font-display font-extrabold text-lg">{formatMad(item.price)}</div>
            <button onClick={handleAdd}
              className={`cursor-grow ripple relative w-10 h-10 rounded-xl bg-ink-900 text-white dark:bg-white dark:text-ink-900 grid place-items-center hover:scale-110 active:scale-95 transition-transform ${adding ? 'animate-wiggle' : ''}`}>
              <I.Plus size={18} stroke={3}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
