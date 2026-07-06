'use client';

import React, { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { I } from '../../icons/Icons.jsx';
import { useOrders } from '../../contexts/AppContexts.jsx';
import { FEATURES } from '../../data/features.jsx';
import { HOW_STEPS } from '../../data/howSteps.jsx';
import { TESTIMONIALS } from '../../data/testimonials.js';
import { CAMPUS_HOSPITALS } from '../../data/campusHospitals.js';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Magnetic } from '../../components/ui/Magnetic.jsx';
import { Tilt } from '../../components/ui/Tilt.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { HERO_RESTAURANTS } from '../../data/heroRestaurants.js';
import { Star } from 'lucide-react';
import { restaurantCover } from '../../components/ui/MenuItemImage.jsx';
import { spotlightHandler } from '../../utils/spotlight.js';
import { useYohaNav } from '../../contexts/YohaNavContext.jsx';

/* === SCROLL ENGINE HOOK & COMPONENTS === */
function useSectionScrollProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const start = rect.top - viewportHeight;
          const total = rect.height + viewportHeight;
          const current = -start;
          const rawProgress = current / total;
          setProgress(Math.max(0, Math.min(1, rawProgress)));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return progress;
}

export function Landing({ onStart }) {
  const scrollToHowItWorks = () => {
    document.getElementById('comment-ca-marche')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page-enter">
      <Hero onStart={onStart} onHowItWorks={scrollToHowItWorks} />
      <PartnersMarquee />
      <PizzaAssemblySection />
      <ShowcaseSection />
      <PartnerCategoriesSection />
      <Carousel3DSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FinalCTA onStart={onStart} />
    </div>
  );
}

/* === HERO === */
export function Hero({ onStart, onHowItWorks }) {
  const slogans = [
    'Livraison intelligente',
    'pour votre CHU',
    'Pensé pour la vie de campus',
    'Plus rapide que ta faim.',
  ];
  const [sloganIdx, setSloganIdx] = useState(0);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    let i = 0; let dir = 1; let t;
    const target = slogans[sloganIdx];
    const tick = () => {
      i += dir; setTyped(target.slice(0, i));
      if (i === target.length && dir === 1) { t = setTimeout(() => { dir = -1; tick(); }, 1600); }
      else if (i === 0 && dir === -1)       { setSloganIdx(s => (s + 1) % slogans.length); }
      else                                   { t = setTimeout(tick, dir === 1 ? 65 : 30); }
    };
    tick();
    return () => clearTimeout(t);
  }, [sloganIdx]);

  /* spotlight follows cursor */
  const heroRef = useRef();
  /* parallax on text */
  const textRef = useRef();
  const progress = useSectionScrollProgress(heroRef);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1024) return;
    const onMove = e => {
      const r = el.getBoundingClientRect();
      const xPct = (e.clientX - r.left) / r.width;
      const yPct = (e.clientY - r.top ) / r.height;
      el.style.setProperty('--mx', (xPct * 100) + '%');
      el.style.setProperty('--my', (yPct * 100) + '%');
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section ref={heroRef} className="relative overflow-hidden hero-spot">
      {/* Animated blobs */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[16rem] sm:w-[32rem] lg:w-[42rem] h-[16rem] sm:h-[32rem] lg:h-[42rem] rounded-full bg-brand-400/40 blur-3xl animate-blob"></div>
        <div className="absolute top-[10%] right-[-15%] w-[14rem] sm:w-[28rem] lg:w-[36rem] h-[14rem] sm:h-[28rem] lg:h-[36rem] rounded-full bg-fuchsia-400/40 blur-3xl animate-blob" style={{ animationDelay:'4s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[18rem] sm:w-[34rem] lg:w-[44rem] h-[18rem] sm:h-[34rem] lg:h-[44rem] rounded-full bg-violet-400/30 blur-3xl animate-blob" style={{ animationDelay:'8s' }}></div>
        <div className="absolute inset-0 mesh-bg opacity-70"></div>
        <div className="mesh-conic-glow"></div>
        <div className="absolute inset-0 grid-bg"></div>
      </div>

      {/* Particules — desktop uniquement */}
      <div className="absolute inset-0 -z-[5] pointer-events-none hidden md:block">
        <div className="absolute inset-0 pointer-events-auto">
          <ParticleCanvas />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 lg:pt-20 pb-10 sm:pb-16 lg:pb-28 grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
        {/* LEFT */}
        <div ref={textRef} className="relative z-10 min-w-0 transition-transform duration-300 ease-out lg:[transform:none]" style={{ pointerEvents:'auto' }}>
          <span className="inline-flex max-w-full items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/60 dark:bg-ink-900/60 backdrop-blur text-[10px] sm:text-xs font-semibold tracking-wider uppercase animate-fade-up border border-brand-500/25 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
            </span>
            <span className="truncate">En direct · campus & CHU</span>
          </span>

          <h1 className="mt-4 sm:mt-6 font-display font-black tracking-tight text-5xl sm:text-6xl lg:text-7xl leading-[1.05] sm:leading-[0.95]">
            <span className="block animate-fade-up">
              <span className="block text-gradient text-glow">
                YoHa.
              </span>
            </span>
            <span className="block animate-fade-up" style={{ animationDelay: '150ms' }}>
              <span className="block mt-2 sm:mt-3 text-ink-900 dark:text-ink-50 min-h-[3.3em] sm:min-h-[1.2em] lg:min-h-[1.15em] text-glow leading-snug">
                {typed}
                <span className="caret align-baseline" style={{ height:'0.85em' }}></span>
              </span>
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 max-w-xl text-sm sm:text-base lg:text-lg text-ink-600 dark:text-ink-300 leading-relaxed animate-fade-up" style={{ animationDelay:'600ms' }}>
            <span className="sm:hidden">Commandez et faites-vous livrer à la chambre, à l&apos;aile ou à la BU — en moins de 30 min.</span>
            <span className="hidden sm:inline">Commandez auprès de vos cuisines préférées et faites-vous livrer directement à votre chambre, à l&apos;aile hospitalière ou à la BU — en moins de 30 minutes. Aucun détour.</span>
          </p>

          <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 animate-fade-up" style={{ animationDelay:'750ms' }}>
            <Magnetic strength={20} className="block w-full sm:inline-block sm:w-auto">
              <Button onClick={onStart} variant="primary" size="lg" className="w-full sm:w-auto">
                Commander maintenant <I.Right size={18}/>
              </Button>
            </Magnetic>
            <Button type="button" variant="ghost" size="lg" onClick={onHowItWorks} className="w-full sm:w-auto">
              <I.Bike size={18}/> Comment ça marche
            </Button>
          </div>

          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 animate-fade-up" style={{ animationDelay:'900ms' }}>
            <div className="flex -space-x-2 shrink-0">
              {[1,2,3,4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/64?img=${i+10}`} alt=""
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white dark:border-ink-900 object-cover" />
              ))}
            </div>
            <div className="text-xs sm:text-sm min-w-0">
              <div className="flex items-center gap-1 text-amber-500">
                {[1,2,3,4,5].map(i => <I.Star key={i} size={13} stroke={2.4} className="fill-amber-400 sm:w-3.5 sm:h-3.5" />)}
                <span className="ml-1 font-semibold text-ink-900 dark:text-ink-50">4,9</span>
              </div>
              <div className="text-ink-500 dark:text-ink-400 leading-snug">
                <span className="sm:hidden">12 000+ utilisateurs satisfaits</span>
                <span className="hidden sm:inline">Adoré par 12 000+ étudiants & soignants</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Bento layout */}
        <div className="relative min-w-0 w-full">
          <BentoHero />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-ink-400 animate-pulse-slow">
        <span className="text-xs uppercase tracking-widest">Défiler</span>
        <I.ArrowDown size={18}/>
      </div>
    </section>
  );
}

/* === Animated heading — char-by-char reveal === */
export function AnimatedHeading({ text, gradient }) {
  return (
    <span className="block animate-char-up">
      <span className={`block ${gradient ? 'text-gradient text-glow' : ''}`}>
        {text}
      </span>
    </span>
  );
}

/* === Bento layout for hero right === */
function BentoSpotlightCard({ spot, spotFade, n, restaurants, spotIdx, onSelectSpot }) {
  return (
    <div className="cursor-grow group relative h-full min-h-[200px] sm:min-h-[220px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-cardhover spotlight border border-ink-200/20 dark:border-ink-800/80 transition-all duration-300"
      onMouseMove={spotlightHandler}>
      <div className={`absolute inset-0 transition-opacity duration-300 ease-out ${spotFade ? 'opacity-100' : 'opacity-0'}`}>
        <img src={restaurantCover(spot.cover)} alt={spot.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"/>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent"></div>
        <div className="absolute top-3 left-3 right-3 sm:right-14 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/95 text-ink-900 shadow flex items-center gap-1 w-fit max-w-[calc(100%-1.5rem)]">
          <I.Flame size={12} className="text-brand-500 shrink-0"/>
          <span className="truncate">{spot.tags[0] ?? 'Partenaire'}</span>
        </div>
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 text-white z-10">
          {n > 1 && (
            <div className="flex justify-center gap-1.5 mb-2 sm:mb-3" role="tablist" aria-label="Restaurants à l'affiche">
              {restaurants.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  aria-label={r.name}
                  aria-current={i === spotIdx ? 'true' : undefined}
                  onClick={() => onSelectSpot(i)}
                  className={`h-1.5 rounded-full transition-colors ${i === spotIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/75'}`}
                />
              ))}
            </div>
          )}
          <div className="font-display font-extrabold text-xl sm:text-2xl lg:text-3xl leading-tight line-clamp-2">{spot.name}</div>
        </div>
      </div>
    </div>
  );
}

export function BentoHero() {
  const restaurants = HERO_RESTAURANTS;
  const n = restaurants.length;
  const [spotIdx, setSpotIdx] = useState(0);
  const [spotFade, setSpotFade] = useState(true);

  useEffect(() => {
    if (n <= 1) return;
    let timeoutId;
    const iv = setInterval(() => {
      setSpotFade(false);
      timeoutId = setTimeout(() => {
        setSpotIdx((i) => (i + 1) % n);
        setSpotFade(true);
      }, 280);
    }, 5200);
    return () => {
      clearInterval(iv);
      clearTimeout(timeoutId);
    };
  }, [n]);

  const spot = restaurants[spotIdx] ?? restaurants[0];
  if (!spot) return null;

  const selectSpot = (i) => {
    if (i === spotIdx) return;
    setSpotFade(false);
    setTimeout(() => { setSpotIdx(i); setSpotFade(true); }, 200);
  };

  return (
    <>
      {/* Mobile — layout simplifié et lisible */}
      <div className="lg:hidden space-y-3">
        <BentoSpotlightCard
          spot={spot}
          spotFade={spotFade}
          n={n}
          restaurants={restaurants}
          spotIdx={spotIdx}
          onSelectSpot={selectSpot}
        />

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 p-3 text-white text-center border border-white/20 shadow-glow">
            <div className="text-[9px] font-semibold uppercase tracking-wider opacity-90">Délai</div>
            <div className="font-display font-black text-2xl leading-none mt-0.5">26<span className="text-xs font-bold">min</span></div>
          </div>
          <div className="rounded-2xl glass-card-premium p-3 text-center border border-white/20 dark:border-white/5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-500">Communauté</div>
            <div className="font-display font-black text-xl sm:text-2xl text-gradient mt-0.5">12k+</div>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 p-3 text-center border border-emerald-500/20">
            <div className="text-lg leading-none">🎁</div>
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mt-1 leading-tight">Livraison offerte</div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-ink-950 to-ink-900 p-4 text-white border border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"/> Suivi en direct
            </div>
            <div className="font-semibold text-sm mt-1 truncate">Yacine · arrivée dans 4 min</div>
          </div>
          <span className="text-2xl shrink-0">🛵</span>
        </div>
      </div>

      {/* Desktop — grille bento complète */}
      <div className="hidden lg:grid grid-cols-6 grid-rows-6 gap-3 h-[640px]">
      <Tilt className="col-span-4 row-span-3 rounded-3xl">
        <BentoSpotlightCard
          spot={spot}
          spotFade={spotFade}
          n={n}
          restaurants={restaurants}
          spotIdx={spotIdx}
          onSelectSpot={selectSpot}
        />
      </Tilt>

      <Tilt className="col-span-2 row-span-3 rounded-3xl" max={5}>
        <div className="relative h-full rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-black p-4 text-white overflow-hidden shadow-cardhover border border-white/10 dark:border-ink-800/80">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-500/30 blur-2xl"></div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> En direct
          </div>
          <div className="mt-2 font-display font-bold text-lg">Suivi livraison</div>
          <LiveTrackMini />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-7 h-7 rounded-full bg-white/15 grid place-items-center"><I.Bike size={14}/></span>
              <div>
                <div className="font-semibold leading-tight">Yacine, livreur</div>
                <div className="text-[10px] opacity-70">Arrivée dans 4 min</div>
              </div>
            </div>
          </div>
        </div>
      </Tilt>

      <Tilt className="col-span-3 row-span-2 rounded-3xl">
        <div className="h-full rounded-3xl glass-card-premium p-5 shadow-cardhover border border-white/20 dark:border-white/5 hover:border-brand-500/20 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Communauté</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="animate-pulse-slow">
                <span className="font-display font-black text-3xl sm:text-4xl text-gradient">12 000+</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 animate-pulse-slow">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> En ligne
              </span>
            </div>
            <div className="mt-1 text-sm text-ink-600 dark:text-ink-300 leading-snug">étudiants & soignants nous font confiance</div>
          </div>
          <div className="mt-3 flex -space-x-2.5">
            {[5,16,18,22,33].map(i => (
              <img key={i} src={`https://i.pravatar.cc/48?img=${i}`} alt=""
                className="w-8 h-8 rounded-full border-2 border-white dark:border-ink-950 object-cover cursor-pointer"/>
            ))}
          </div>
        </div>
      </Tilt>

      <Tilt className="col-span-3 row-span-2 rounded-3xl">
        <div className="relative h-full rounded-3xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 p-5 text-white shadow-glow border border-white/20 overflow-hidden transition-all duration-300 flex flex-col justify-between">
          <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/20 blur-2xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(at_10%_20%,rgba(255,255,255,0.15)_0,transparent_55%)]"></div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-90">Livraison moyenne</div>
            <div className="mt-2 font-display font-black text-5xl tracking-tight text-glow animate-pulse-slow">26<span className="text-2xl font-bold">min</span></div>
          </div>
          <div className="text-sm opacity-95 flex items-center gap-1.5 font-medium">
            <span>⚡</span> Du clic à la fourchette
          </div>
        </div>
      </Tilt>

      <Tilt className="col-span-3 row-span-1 rounded-3xl">
        <div className="h-full rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 px-4 flex items-center gap-3 shadow-sm hover:bg-emerald-500/15 dark:hover:bg-emerald-500/10 transition-all duration-300 hover:border-emerald-500/30 cursor-pointer">
          <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white grid place-items-center shadow-sm shrink-0"><I.Bike size={18}/></span>
          <div className="text-sm min-w-0">
            <div className="font-bold text-emerald-800 dark:text-emerald-300">Livraison offerte</div>
            <div className="text-ink-500 dark:text-ink-400 text-xs">Sur tout le campus & CHU</div>
          </div>
        </div>
      </Tilt>

      <Tilt className="col-span-3 row-span-1 rounded-3xl">
        <div className="h-full rounded-3xl glass-card-premium border border-white/20 dark:border-white/5 px-4 flex items-center gap-3 shadow-card hover:shadow-cardhover transition-all duration-300 hover:border-brand-500/20 cursor-pointer">
          <span className="w-9 h-9 rounded-xl bg-brand-500 text-white grid place-items-center text-lg shadow-sm shrink-0">🍽️</span>
          <div className="text-sm min-w-0">
            <div className="font-bold">Campus & CHU</div>
            <div className="text-ink-500 dark:text-ink-400 text-xs">Livraison prioritaire 24h/24</div>
          </div>
        </div>
      </Tilt>
      </div>
    </>
  );
}

/* spotlight handler — sets CSS vars for radial gradient */

/* Live track mini SVG */
export function LiveTrackMini() {
  return (
    <svg viewBox="0 0 200 100" className="absolute inset-x-0 top-12 w-full h-24" fill="none">
      <defs>
        <linearGradient id="track" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#ec4899"/>
        </linearGradient>
        <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M 10 60 Q 60 10, 110 50 T 195 30" stroke="rgba(255,255,255,.15)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4"/>
      <path d="M 10 60 Q 60 10, 110 50 T 195 30" stroke="url(#track)" strokeWidth="3.5" strokeLinecap="round" pathLength="100" filter="url(#glow-filter)"
        style={{ strokeDasharray:'100', strokeDashoffset:'40', animation:'shimmer 3s linear infinite' }}/>
      <circle cx="10" cy="60" r="5" fill="#fff" filter="url(#glow-filter)" />
      <circle cx="195" cy="30" r="5" fill="#10b981" filter="url(#glow-filter)" />
      <g style={{ offsetPath:"path('M 10 60 Q 60 10, 110 50 T 195 30')", animation:'bike-go 4s ease-in-out infinite alternate' }}>
        <circle r="10" fill="#f97316" filter="url(#glow-filter)"/>
        <circle r="10" fill="none" stroke="#fff" strokeWidth="2"/>
        <text x="0" y="3.5" textAnchor="middle" fontSize="10">🛵</text>
      </g>
    </svg>
  );
}

/* === Marquee === */
export function PartnersMarquee() {
  const items = [
    '🏥 CHU Mohammed VI de Tanger',
    '🎓 FMPT de Tanger',
    '🎓 ISPITS Tanger',
    '🏠 Résidence universitaire Alliance Tanger',
  ];
  return (
    <section className="marquee-mask border-y border-ink-200/60 dark:border-ink-800/60 py-6 overflow-hidden bg-white/40 dark:bg-ink-900/40 backdrop-blur-md">
      <div className="marquee gap-12 text-2xl sm:text-3xl font-display font-bold tracking-tight text-ink-400/70 dark:text-ink-500/75">
        {[...Array(2)].map((_, k) => (
          <Fragment key={k}>
            {items.map(it => <span key={it+k} className="hover:text-brand-500 transition-colors duration-300">{it}</span>)}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

/* === Restaurants · Pâtisseries · Pharmacies === */
export function PartnerCategoriesSection() {
  const sectionRef = useRef(null);
  const progress = useSectionScrollProgress(sectionRef);
  const { goto } = useYohaNav();

  const rows = [
    {
      emoji: '🍽️',
      title: 'Restaurants',
      line: 'Repas chauds, cuisines du monde, menus du jour préparés par nos chefs partenaires.',
      color: 'from-orange-500 to-amber-500',
      hoverBorder: 'hover:border-orange-500/30',
      hoverShadow: 'hover:shadow-[0_20px_50px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_20px_50px_rgba(249,115,22,0.25)]',
      textHover: 'group-hover:text-amber-500',
      tag: 'Cuisines variées',
      browseFilter: 'all',
    },
    {
      emoji: '🥐',
      title: 'Pâtisseries',
      line: 'Viennoiseries fraîches, gâteaux, desserts gourmands et pauses sucrées au quotidien.',
      color: 'from-pink-500 to-rose-500',
      hoverBorder: 'hover:border-pink-500/30',
      hoverShadow: 'hover:shadow-[0_20px_50px_rgba(236,72,153,0.15)] dark:hover:shadow-[0_20px_50px_rgba(236,72,153,0.25)]',
      textHover: 'group-hover:text-pink-500',
      tag: 'Douceurs & Cafés',
      browseFilter: 'dessert',
    },
    {
      emoji: '💊',
      title: 'Pharmacies',
      line: 'Produits de parapharmacie, hygiène et soins de première urgence livrés discrètement.',
      color: 'from-emerald-500 to-teal-500',
      hoverBorder: 'hover:border-emerald-500/30',
      hoverShadow: 'hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_20px_50px_rgba(16,185,129,0.25)]',
      textHover: 'group-hover:text-emerald-500',
      tag: 'Soin & Santé',
      browseFilter: 'pharmacy',
    },
  ];

  return (
    <section ref={sectionRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 overflow-visible">


      <Reveal>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-widest">
            🛍️ Services & Commerces
          </span>
          <h2 className="mt-4 font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-tight">
            Tout ce dont vous avez besoin, <span className="text-gradient text-glow">au même endroit.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-600 dark:text-ink-400 leading-relaxed">
            En plus des restaurants, YoHa regroupe tous les commerces et services de Tanger essentiels pour votre quotidien au campus ou au CHU.
          </p>
        </div>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {rows.map((r, i) => (
          <Reveal key={r.title} delay={i * 100}>
            <Tilt max={6} className="h-full rounded-2xl sm:rounded-[2rem]">
              <button
                type="button"
                onClick={() => goto('home', { browseFilter: r.browseFilter })}
                className={`relative overflow-hidden group h-full w-full text-left p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] glass-card-premium border border-white/20 dark:border-white/5 ${r.hoverBorder} transition-all duration-500 shadow-card ${r.hoverShadow} flex flex-col justify-between min-h-[240px] sm:min-h-[280px] lg:min-h-[300px] cursor-pointer`}
              >
                {/* Glowing background orb */}
                <div className={`absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-gradient-to-br ${r.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 blur-xl transition-all duration-500 scale-50`}></div>
                
                <div>
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    {/* Glowing Emoji Container */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} text-white flex items-center justify-center text-3xl shadow-glow relative transition-all duration-500`}>
                      {r.emoji}
                      <span className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-white to-white/0 opacity-25 border border-white/30"></span>
                    </div>
                    {/* Badge */}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 border border-ink-200/50 dark:border-ink-700/50 group-hover:border-brand-500/20 group-hover:bg-brand-500/5 transition-colors">
                      {r.tag}
                    </span>
                  </div>

                  <div className="mt-8">
                    <h3 className={`font-display font-extrabold text-2xl text-ink-900 dark:text-white transition-colors duration-300 ${r.textHover}`}>
                      {r.title}
                    </h3>
                    <p className="mt-3 text-ink-600 dark:text-ink-400 text-sm sm:text-base leading-relaxed">
                      {r.line}
                    </p>
                  </div>
                </div>

                <div className={`mt-6 flex items-center gap-1 text-sm font-bold text-ink-500 transition-colors duration-300 ${r.textHover}`}>
                  <span>Découvrir la sélection</span>
                  <span className="transition-transform duration-300">→</span>
                </div>
              </button>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* === 3D AUTO-ROTATING CAROUSEL === */
function CarouselPartnerCard({ restaurant, className = '' }) {
  const tags = Array.isArray(restaurant.tags) ? restaurant.tags : [];
  return (
    <div className={`relative w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 dark:border-ink-800/80 shadow-glow ${className}`}>
      <img src={restaurantCover(restaurant.cover)} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"/>
      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
        ★ 4.9
      </div>
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-brand-500/80 text-white mb-2">{tags[0] || 'Partenaire'}</span>
        <div className="font-display font-extrabold text-base sm:text-lg lg:text-xl mt-0.5 line-clamp-2">{restaurant.name}</div>
      </div>
    </div>
  );
}

function useCarouselRadius() {
  const [radius, setRadius] = useState(360);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 1280) setRadius(Math.min(280, w * 0.38));
      else setRadius(360);
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);
  return radius;
}

export function Carousel3DSection() {
  const { restaurants } = useOrders();
  const items = restaurants.slice(0, 6);
  const count = Math.max(items.length, 1);
  const angleStep = 360 / count;
  const radius = useCarouselRadius();

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(550px,90vw)] h-[320px] rounded-full bg-brand-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute inset-0 -z-20 mesh-conic opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-8 sm:mb-10">
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">À découvrir</span>
        <h2 className="mt-3 font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight px-2">
          Un univers culinaire <span className="text-gradient animate-text-glow-slow">à 360°</span>
        </h2>
        <p className="mt-3 text-sm sm:text-base text-ink-500 dark:text-ink-400 px-2">
          Tour complet à 360° sur nos restaurants partenaires.
        </p>
      </div>

      {/* Carrousel 3D pour tous les écrans (responsive) */}
      <div className="carousel-3d relative h-[250px] sm:h-[320px] md:h-[380px] lg:h-[380px] xl:h-[420px]">
        <div className="carousel-3d-inner">
          {items.map((r, i) => {
            const angle = i * angleStep;
            return (
              <div key={r.id} className="carousel-3d-card cursor-grow group"
                style={{ transform: `rotateY(${angle}deg) translateZ(${radius}px)` }}>
                <CarouselPartnerCard restaurant={r} className="group-hover:border-brand-500/30 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]"/>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* === Features === */
export function FeaturesSection() {
  const sectionRef = useRef(null);
  const progress = useSectionScrollProgress(sectionRef);

  return (
    <section ref={sectionRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 overflow-visible">

      <div className="max-w-2xl mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-widest">
          ✨ Avantages
        </span>
        <h2 className="mt-4 font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-tight">
          Pensé pour le <span className="text-gradient text-glow">rythme du campus.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-ink-600 dark:text-ink-300 leading-relaxed">
          Conçu main dans la main avec des étudiants et des soignants — rapide, silencieux et ridiculement simple à utiliser.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {FEATURES.map((f, i) => {
          const hoverBorderClass = 
            i === 0 ? 'hover:border-orange-500/35' : 
            i === 1 ? 'hover:border-fuchsia-500/35' : 
            i === 2 ? 'hover:border-pink-500/35' : 
            'hover:border-sky-500/35';
          const hoverShadowClass = 
            i === 0 ? 'hover:shadow-[0_20px_50px_rgba(249,115,22,0.14)] dark:hover:shadow-[0_20px_50px_rgba(249,115,22,0.22)]' : 
            i === 1 ? 'hover:shadow-[0_20px_50px_rgba(217,70,239,0.14)] dark:hover:shadow-[0_20px_50px_rgba(217,70,239,0.22)]' : 
            i === 2 ? 'hover:shadow-[0_20px_50px_rgba(244,63,94,0.14)] dark:hover:shadow-[0_20px_50px_rgba(244,63,94,0.22)]' : 
            'hover:shadow-[0_20px_50px_rgba(14,165,233,0.14)] dark:hover:shadow-[0_20px_50px_rgba(14,165,233,0.22)]';
          const textHoverClass = 
            i === 0 ? 'group-hover:text-amber-500' : 
            i === 1 ? 'group-hover:text-fuchsia-500' : 
            i === 2 ? 'group-hover:text-pink-500' : 
            'group-hover:text-sky-500';

          return (
            <Reveal key={f.title} delay={i * 80}>
              <Tilt max={8} className="h-full rounded-2xl sm:rounded-[2rem]">
                <div className={`group relative h-full p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] glass-card-premium border border-white/20 dark:border-white/5 ${hoverBorderClass} shadow-card ${hoverShadowClass} transition-all duration-500 overflow-hidden spotlight flex flex-col justify-between min-h-[200px] sm:min-h-[240px]`}
                  onMouseMove={spotlightHandler}>
                  
                  {/* Glowing background corner orb */}
                  <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-gradient-to-br ${f.from} ${f.to} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 blur-xl transition-all duration-500 scale-50`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.from} ${f.to} text-white flex items-center justify-center shadow-glow relative transition-all duration-500`}>
                      {f.icon}
                      <span className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-white to-white/0 opacity-25 border border-white/30"></span>
                    </div>

                    <h3 className={`mt-6 font-display font-extrabold text-xl text-ink-900 dark:text-white transition-colors duration-300 ${textHoverClass}`}>
                      {f.title}
                    </h3>
                    <p className="mt-3 text-ink-600 dark:text-ink-400 text-sm leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Tilt>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* === How It Works === */
export function HowItWorksSection() {
  const sectionRef = useRef(null);
  const progress = useSectionScrollProgress(sectionRef);

  return (
    <section ref={sectionRef} id="comment-ca-marche" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 scroll-mt-24 overflow-visible" aria-labelledby="how-it-works-heading">

      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-widest">
          📌 Fonctionnement
        </span>
        <h2 id="how-it-works-heading" className="mt-4 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
          3 étapes. <span className="text-gradient text-glow">Zéro friction.</span>
        </h2>
        <p className="mt-3 text-ink-500 dark:text-ink-400 text-base leading-relaxed">
          De votre faim à votre assiette en un temps record. Une logistique sur-mesure conçue pour la vie de campus.
        </p>
      </div>

      <div className="relative flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6 md:gap-4">
        {HOW_STEPS.map((s, i) => {
          const hoverBorderClass = 
            s.num === '01' ? 'hover:border-orange-500/35' : 
            s.num === '02' ? 'hover:border-pink-500/35' : 
            'hover:border-violet-500/35';
          const hoverShadowClass = 
            s.num === '01' ? 'hover:shadow-[0_20px_50px_rgba(249,115,22,0.14)] dark:hover:shadow-[0_20px_50px_rgba(249,115,22,0.22)]' : 
            s.num === '02' ? 'hover:shadow-[0_20px_50px_rgba(236,72,153,0.14)] dark:hover:shadow-[0_20px_50px_rgba(236,72,153,0.22)]' : 
            'hover:shadow-[0_20px_50px_rgba(139,92,246,0.14)] dark:hover:shadow-[0_20px_50px_rgba(139,92,246,0.22)]';
          const textHoverClass = 
            s.num === '01' ? 'group-hover:text-amber-500' : 
            s.num === '02' ? 'group-hover:text-pink-500' : 
            'group-hover:text-violet-500';
 
          return (
            <React.Fragment key={s.num}>
              <div className="flex-1 w-full">
                <Reveal delay={i * 150}>
                  <div className={`relative overflow-hidden group h-full p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] glass-card-premium border border-white/20 dark:border-white/5 ${hoverBorderClass} transition-all duration-500 shadow-card ${hoverShadowClass} flex flex-col justify-between min-h-[220px] sm:min-h-[260px]`}>
                    {/* Giant Backdrop Number */}
                    <span className={`absolute -right-4 sm:-right-3 -bottom-4 sm:-bottom-5 font-display font-black text-7xl sm:text-9xl text-transparent bg-gradient-to-br ${s.color} bg-clip-text opacity-[0.08] dark:opacity-[0.14] select-none pointer-events-none group-hover:opacity-[0.22] transition-all duration-500`}>
                      {s.num}
                    </span>
 
                    <div>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-glow relative z-10 transition-all duration-500`}>
                        {s.icon}
                        <span className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-white to-white/0 opacity-25 border border-white/30"></span>
                      </div>
 
                      <div className="mt-6 relative z-10">
                        <h3 className={`font-display font-extrabold text-2xl text-ink-900 dark:text-white transition-colors duration-300 ${textHoverClass}`}>
                          {s.title}
                        </h3>
                        <p className="mt-3 text-ink-600 dark:text-ink-400 text-sm sm:text-base leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
 
              {i < HOW_STEPS.length - 1 && (
                <div className="flex items-center justify-center shrink-0 py-2 md:py-0 z-10">
                  <span className={`font-display font-black text-3xl select-none bg-gradient-to-r ${
                    i === 0 ? 'from-orange-500 to-pink-500' : 'from-pink-500 to-violet-500'
                  } bg-clip-text text-transparent`}>
                    <span className="hidden md:inline-block animate-bounce-horizontal">→</span>
                    <span className="inline-block md:hidden animate-bounce-vertical">↓</span>
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

/* === Pizza Assembly Section === */
export function PizzaAssemblySection() {
  const sectionRef = useRef(null);
  const progress = useSectionScrollProgress(sectionRef);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-slate-50 dark:bg-ink-950 py-20 border-y border-ink-200/40 dark:border-ink-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT: Text */}
        <Reveal>
          <div className="text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-widest">
              🍕 Ingrédients Sélectionnés
            </span>
            <h2 className="mt-4 font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-tight">
              Une préparation fraîche, <br />
              <span className="text-gradient">assemblée sous vos yeux.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-600 dark:text-ink-400 leading-relaxed">
              Faites défiler pour voir nos ingrédients frais (champignons, pepperoni, olives fraîches, feuilles de basilic odorantes et oignons) s'assembler et atterrir directement sur notre pâte artisanale cuite sur pierre.
            </p>
          </div>
        </Reveal>

        {/* RIGHT: Top-Down Pizza Assembly Stage */}
        <div className="relative flex justify-center items-center w-full min-h-[300px] sm:min-h-[420px] md:min-h-[500px] lg:min-h-[520px]">
          <div className="w-full flex justify-center">
            <Reveal delay={200}>
              <PizzaCookingStage progress={progress} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* === Pizza Cooking Stage === */
export function PizzaCookingStage({ progress }) {
  // progress goes from 0 to 1
  // We want 4 layers to fade in sequentially.
  const getOpacity = (p, start, end) => {
    if (p < start) return 0;
    if (p > end) return 1;
    return (p - start) / (end - start);
  };

  const opacity2 = getOpacity(progress, 0.05, 0.22);
  const opacity3 = getOpacity(progress, 0.22, 0.40);
  const opacity4 = getOpacity(progress, 0.40, 0.58);

  const scale = 1 + (progress - 0.5) * 0.05;

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[600px] aspect-square select-none flex items-center justify-center">
      <div 
        className="relative w-full h-full flex items-center justify-center transition-transform duration-150 ease-out will-change-transform"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Layer 1: Dough */}
        <img
          src="/pizza-img/section_4_01.webp"
          alt="Pizza Step 1"
          className="absolute w-full h-full object-contain"
          style={{ zIndex: 10 }}
        />
        
        {/* Layer 2: Dough + Sauce */}
        <img
          src="/pizza-img/section_4_02.webp"
          alt="Pizza Step 2"
          className="absolute w-full h-full object-contain transition-opacity duration-150 ease-out"
          style={{ zIndex: 11, opacity: opacity2 }}
        />
        
        {/* Layer 3: Pizza with cheese and toppings */}
        <img
          src="/pizza-img/section_4_03.webp"
          alt="Pizza Step 3"
          className="absolute w-full h-full object-contain transition-opacity duration-150 ease-out"
          style={{ zIndex: 12, opacity: opacity3 }}
        />
        
        {/* Layer 4: Cooked Pizza */}
        <img
          src="/pizza-img/section_4_04.webp"
          alt="Pizza Step 4"
          className="absolute w-full h-full object-contain transition-opacity duration-150 ease-out"
          style={{ zIndex: 13, opacity: opacity4 }}
        />
      </div>
    </div>
  );
}

/* === Showcase === */
export function ShowcaseSection() {
  const sectionRef = useRef(null);

  return (
    <section 
      ref={sectionRef} 
      className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-[#fffcf6] to-[#fdf4e3] text-slate-900 py-12 sm:py-16 lg:py-20 my-8 sm:my-12 lg:my-16 rounded-2xl sm:rounded-[2.5rem] lg:rounded-[3rem] max-w-7xl mx-4 sm:mx-6 lg:mx-auto px-5 sm:px-8 lg:px-12 border border-amber-100 shadow-xl"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft glowing mesh gradient blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-200/40 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-rose-200/30 blur-[100px]" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
      </div>

      <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
        {/* LEFT COLUMN: Text and highlights */}
        <div className="lg:col-span-7 text-left flex flex-col justify-center">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 text-xs font-semibold uppercase tracking-widest border border-brand-500/20">
                ✨ Technologie & Expérience
              </span>
              <h2 className="mt-6 font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-slate-900">
                Une expérience <br />
                <span className="bg-gradient-to-r from-amber-600 via-brand-500 to-rose-500 bg-clip-text text-transparent text-glow">
                  extraordinairement fluide.
                </span>
              </h2>
              <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Tout a été méticuleusement conçu pour éliminer l'attente et vous offrir le meilleur de vos campus.
              </p>
            </div>
          </Reveal>

          {/* Premium Highlights Grid */}
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: '14 min de livraison', desc: 'Moyenne record sur le campus' },
              { icon: '🍔', title: 'Gourmet & Ultra-frais', desc: 'Préparé sous vos yeux' },
              { icon: '🛵', title: 'Suivi live interactif', desc: 'Savoir exactement où est le livreur' },
              { icon: '🔒', title: 'Zéro friction', desc: 'Commande en 3 clics sans friction' }
            ].map((item, idx) => (
              <Reveal key={item.title} delay={100 + idx * 80}>
                <div className="p-4 rounded-2xl bg-white/60 border border-amber-100 hover:border-brand-500/20 hover:bg-white transition-all duration-300 flex items-start gap-3.5 group shadow-sm hover:shadow-md">
                  <span className="w-10 h-10 rounded-xl bg-amber-100/50 text-amber-800 group-hover:bg-brand-500/20 group-hover:text-brand-600 transition-all duration-300 flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Exploded Burger */}
        <div className="lg:col-span-5 flex justify-center items-center relative min-h-[380px] lg:min-h-[480px]">
          <Reveal delay={200} className="w-full flex justify-center">
            <InteractiveBurger3D />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* === Pizza Exploded Stage === */
export function PizzaExplodedStage({ progress }) {
  const factor = Math.sin(progress * Math.PI);

  const layers = [
    { src: '/pizza-img/section_3_06.webp', targetY: 260 },
    { src: '/pizza-img/section_3_05.webp', targetY: 190 },
    { src: '/pizza-img/section_3_04.webp', targetY: 0 },
    { src: '/pizza-img/section_3_03.webp', targetY: -100 },
    { src: '/pizza-img/section_3_02.webp', targetY: -190 },
    { src: '/pizza-img/section_3_01.webp', targetY: -260 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[480px] h-[580px] select-none flex items-center justify-center">
      <div className="relative w-[340px] h-[340px] flex items-center justify-center">
        {layers.map((layer, idx) => {
          const y = layer.targetY * factor;
          const rotate = (idx % 2 === 0 ? 12 : -12) * (1 - factor);

          return (
            <img
              key={idx}
              src={layer.src}
              alt=""
              className="absolute w-full h-auto object-contain transition-transform duration-150 ease-out will-change-transform"
              style={{
                transform: `translate3d(0, ${y}px, 0) rotate(${rotate}deg)`,
                zIndex: idx + 5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* === Testimonials === */
export function TestimonialsSection() {
  const sectionRef = useRef(null);
  const progress = useSectionScrollProgress(sectionRef);

  return (
    <section ref={sectionRef} className="relative py-20 overflow-visible">

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Ils en parlent</span>
            <h2 className="mt-3 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
              Adoré sur les <span className="text-gradient">campus & dans les couloirs.</span>
            </h2>
          </div>
        </div>

        <div className="marquee-mask -mx-4 sm:mx-0 px-4 sm:px-0 overflow-hidden">
          <div className="testi-marquee gap-5 mt-10 pb-6">
            {[...Array(2)].map((_, k) => (
              <Fragment key={k}>
                {TESTIMONIALS.map((t) => (
                  <div key={t.name + k} className="cursor-grow shrink-0 w-[88%] sm:w-[380px] lg:w-[420px] rounded-2xl sm:rounded-3xl p-5 sm:p-6 glass-card-premium border border-white/20 dark:border-white/5 shadow-card hover:shadow-cardhover hover:shadow-[0_20px_50px_rgba(249,115,22,0.08)] transition-all duration-300 relative overflow-hidden spotlight hover:border-brand-500/20"
                    onMouseMove={spotlightHandler}>
                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${t.color} opacity-20 blur-2xl`}></div>
                    
                    {/* Verified Badge */}
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      <span className="text-xs">✓</span> <span className="hidden sm:inline">Achat vérifié</span><span className="sm:hidden">Vérifié</span>
                    </div>

                    <div className="text-3xl sm:text-5xl text-brand-500/30 leading-none font-serif">“</div>
                    <p className="mt-1 text-ink-700 dark:text-ink-200 leading-relaxed text-sm sm:text-base pr-4 sm:pr-12">{t.text}</p>
                    <div className="mt-5 flex items-center gap-3">
                      <img src={t.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-white/20 dark:border-white/10 shadow-sm"/>
                      <div>
                        <div className="font-bold text-sm text-ink-900 dark:text-white">{t.name}</div>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(t.rating)].map((_,j) => <I.Star key={j} size={12} className="fill-amber-400" stroke={2.5}/>)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* === Final CTA === */
/* === Pizza Exploded Stage (Mini) === */
export function PizzaExplodedStageMini({ progress }) {
  const factor = Math.sin(progress * Math.PI);

  const layers = [
    { src: '/pizza-img/section_3_06.webp', targetY: 130 },
    { src: '/pizza-img/section_3_05.webp', targetY: 95 },
    { src: '/pizza-img/section_3_04.webp', targetY: 0 },
    { src: '/pizza-img/section_3_03.webp', targetY: -50 },
    { src: '/pizza-img/section_3_02.webp', targetY: -95 },
    { src: '/pizza-img/section_3_01.webp', targetY: -130 },
  ];

  return (
    <div className="relative w-full max-w-[240px] h-[280px] select-none flex items-center justify-center overflow-visible">
      <div className="relative w-[180px] h-[180px] flex items-center justify-center">
        {layers.map((layer, idx) => {
          const y = layer.targetY * factor;
          const rotate = (idx % 2 === 0 ? 12 : -12) * (1 - factor);

          return (
            <img
              key={idx}
              src={layer.src}
              alt=""
              className="absolute w-full h-auto object-contain transition-transform duration-150 ease-out will-change-transform"
              style={{
                transform: `translate3d(0, ${y}px, 0) rotate(${rotate}deg)`,
                zIndex: idx + 5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function FinalCTA({ onStart }) {
  const sectionRef = useRef(null);
  const progress = useSectionScrollProgress(sectionRef);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('YOHA15');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-[#fffcf5] to-orange-50/50 border border-amber-200/60 p-8 sm:p-14 text-slate-900 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div aria-hidden className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-amber-300/30 blur-3xl animate-pulse-slow"></div>
          <div aria-hidden className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-rose-200/30 blur-3xl animate-pulse-slow" style={{ animationDelay:'1s' }}></div>
          <div className="absolute inset-0 grid-bg opacity-[0.02]"></div>
          
          <div className="relative max-w-xl z-10 text-left">
            <h3 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-slate-900 leading-tight">
              Faim ? Votre chambre est à <span className="bg-gradient-to-r from-brand-600 to-rose-600 bg-clip-text text-transparent font-black">14 minutes</span> de quelque chose de génial.
            </h3>
            <p className="mt-4 text-slate-600 text-lg">Aucune app à télécharger. Ouvrez YoHa et commandez.</p>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <div 
                onClick={handleCopy}
                title="Cliquez pour copier"
                className="group/promo cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-700 hover:bg-brand-500/15 transition-transform duration-300 shadow-sm active:scale-95"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Code promo :</span>
                <span className="font-mono font-black text-sm select-all">YOHA15</span>
                <span className="text-[10px] bg-brand-500 text-white font-bold px-2 py-0.5 rounded-full transition-transform group-hover/promo:scale-105">
                  {copied ? 'Copié !' : '-15%'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Magnetic strength={20}>
                <Button onClick={onStart} variant="primary" size="lg">Commander maintenant <I.Right size={18}/></Button>
              </Magnetic>
              <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"><I.Headset size={18}/> Parler au support</Button>
            </div>
          </div>

          {/* Mini Pizza Exploded Animation */}
          <div className="relative shrink-0 w-full md:w-[240px] h-[280px] flex items-center justify-center z-10 pointer-events-none select-none">
            <PizzaExplodedStageMini progress={progress} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function CampusHospitalsSection() {
  return (
    <section className="mt-2 sm:mt-4">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950 dark:from-black dark:via-ink-950 dark:to-black text-white shadow-cardhover border border-ink-800/80">
          <div className="absolute inset-0 grid-bg opacity-[0.06]" aria-hidden />
          <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl" aria-hidden />

          <div className="relative p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-semibold border border-white/10">
                  <I.MapPin size={14} className="text-brand-400" />
                  Campus & Hôpitaux — Tanger
                </div>
                <h3 className="mt-4 font-display font-extrabold text-2xl sm:text-4xl tracking-tight leading-tight">
                  Zones couvertes{' '}
                  <span className="bg-gradient-to-r from-brand-400 to-pink-400 bg-clip-text text-transparent">
                    24/7
                  </span>
                </h3>
                <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
                  Hôpitaux universitaires, instituts de santé et résidences étudiantes — livraison prioritaire sur tout le campus.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <div className="px-5 py-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/50">Points</div>
                  <div className="font-display font-black text-3xl leading-none mt-1">+{CAMPUS_HOSPITALS.length}</div>
                </div>
                <div className="px-5 py-4 rounded-2xl bg-emerald-500/15 backdrop-blur border border-emerald-400/25 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">Statut</div>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Actif
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 grid sm:grid-cols-2 gap-4">
              {CAMPUS_HOSPITALS.map((place, idx) => (
                <Reveal key={place.name} delay={idx * 70}>
                  <article className="group relative flex gap-0 sm:block h-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
                    <div className="relative w-28 sm:w-full shrink-0 sm:shrink sm:h-40 overflow-hidden">
                      <img
                        src={place.img}
                        alt={place.name}
                        loading="lazy"
                        className="w-full h-full min-h-[7rem] sm:min-h-0 object-cover transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r sm:bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col justify-center flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Disponible
                      </div>
                      <h4 className="font-display font-bold text-base sm:text-lg leading-snug line-clamp-2">{place.name}</h4>
                      <p className="mt-1.5 text-xs sm:text-sm text-white/60 line-clamp-2">{place.subtitle}</p>
                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                        <I.Bike size={14} /> Livraison prioritaire
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* === Flying Burger Concept Showcase === */
export function FlyingBurgerShowcase() {
  const containerRef = useRef(null);
  const progress = useSectionScrollProgress(containerRef);
  const mousePos = { x: 0, y: 0 };

  return (
    <section 
      ref={containerRef}
      className="relative overflow-visible py-20 bg-slate-50 dark:bg-ink-950/40 border-y border-ink-200/40 dark:border-ink-800/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* LEFT: 3D Stacked Figma screens */}
        <div className="relative flex justify-center items-center h-[420px]" style={{ perspective: '1200px' }}>
          <div className="relative w-full max-w-[420px] h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            {/* Desktop Mockup Card */}
            <div 
              className="absolute w-[360px] aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-ink-800/80 bg-ink-900"
              style={{
                transform: `rotateY(${mousePos.x * 20}deg) rotateX(${mousePos.y * -20}deg) translate3d(0, -40px, -50px)`,
                zIndex: 10,
              }}
            >
              <div className="w-full h-3 bg-white/10 dark:bg-ink-950/60 border-b border-white/5 flex items-center gap-1.5 px-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              </div>
              <img 
                src="/burger-img/df23088ac8117ca6618f0f5a4e8097679a10d00d.png" 
                alt="Figma Desktop Mockup" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Mobile Mockup Card */}
            <div 
              className="absolute w-[170px] aspect-[9/19] rounded-[2.2rem] overflow-hidden shadow-2xl border-4 border-slate-800 dark:border-ink-950 bg-ink-900"
              style={{
                transform: `rotateY(${mousePos.x * 30}deg) rotateX(${mousePos.y * -30}deg) translate3d(70px, 30px, 60px)`,
                zIndex: 20,
              }}
            >
              {/* Speaker/camera notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-800 dark:bg-ink-950 rounded-full z-30 flex items-center justify-center">
                <span className="w-6 h-0.5 bg-white/10 rounded-full" />
              </div>
              <img 
                src="/burger-img/e2b24f321f9ea9e999a0c4675aa5c3c96f9ef6ca.png" 
                alt="Figma Mobile Mockup" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Text content and Exploded Burger */}
        <div className="flex flex-col md:flex-row gap-8 items-center text-left">
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-widest">
              🍔 Exclusivité YoHa
            </span>
            <h2 className="mt-4 font-display font-extrabold text-3xl sm:text-4xl tracking-tight leading-tight">
              Le Flying Burger <br />
              <span className="text-gradient">Concept 3D</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-ink-600 dark:text-ink-300 leading-relaxed">
              Modélisé à partir de l'animation originale du projet Figma &quot;Hamburger Homepage&quot;. Glissez votre souris verticalement sur le burger à droite pour écarter et disséquer manuellement ses ingrédients gourmet en 3D.
            </p>
            <p className="mt-3 text-xs sm:text-sm text-ink-500 dark:text-ink-400">
              Au défilement, le burger s'assemble automatiquement. Les maquettes Figma à gauche s'inclinent en parallax dynamique au mouvement du curseur.
            </p>
          </div>

          <div className="shrink-0 flex justify-center items-center w-full md:w-auto">
            <InteractiveBurger3D progress={progress} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* === Interactive 3D Exploded Burger (WebP Frame Sequence) === */
export function InteractiveBurger3D({ progress }) {
  const [frameIndex, setFrameIndex] = useState(59);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

  // Preload all 60 frames on mount to avoid flickering
  useEffect(() => {
    for (let i = 0; i < 60; i++) {
      const img = new Image();
      img.src = `/burger-frames/burger_${String(i).padStart(2, '0')}.webp`;
    }
  }, []);

  // Continuous auto-playing ping-pong loop when not hovering and no scroll progress is provided
  useEffect(() => {
    if (isHovering || typeof progress === 'number') return;

    let direction = -1; // Start by exploding (decreasing index)
    const intervalId = setInterval(() => {
      setFrameIndex((prev) => {
        let next = prev + direction;
        if (next >= 59) {
          next = 59;
          direction = -1; // Reverse to explode
        } else if (next <= 0) {
          next = 0;
          direction = 1; // Reverse to assemble
        }
        return next;
      });
    }, 20); // ~50 FPS loop, smooth
    
    return () => clearInterval(intervalId);
  }, [isHovering, progress]);

  // Sync with scroll progress if provided and not hovering
  useEffect(() => {
    if (isHovering || typeof progress !== 'number') return;
    const targetFrame = Math.min(59, Math.max(0, Math.round(progress * 59)));
    setFrameIndex(targetFrame);
  }, [progress, isHovering]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = (e.clientY - rect.top) / rect.height;
    const targetFrame = Math.min(59, Math.max(0, Math.round(relativeY * 59)));
    setFrameIndex(targetFrame);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeY = (touch.clientY - rect.top) / rect.height;
    const targetFrame = Math.min(59, Math.max(0, Math.round(relativeY * 59)));
    setFrameIndex(targetFrame);
  };

  const frameSrc = `/burger-frames/burger_${String(frameIndex).padStart(2, '0')}.webp`;
  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsHovering(true)}
      onTouchEnd={() => setIsHovering(false)}
      onTouchMove={handleTouchMove}
      className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] aspect-[568/845] flex items-center justify-center cursor-pointer select-none"
      style={{ perspective: '1200px' }}
    >
      {/* Glow Spotlight Behind */}
      <div 
        className="absolute inset-8 rounded-full bg-gradient-to-tr from-brand-500/20 via-pink-500/10 to-transparent blur-3xl opacity-75 pointer-events-none"
      />

      {/* Floating Shadow at the bottom */}
      <div 
        className="absolute bottom-6 w-48 h-4 bg-black/15 dark:bg-black/45 rounded-full blur-md pointer-events-none"
        style={{
          transform: `scaleX(${1.1 - (59 - frameIndex) * 0.005}) scaleY(${1.0 - (59 - frameIndex) * 0.003})`,
          opacity: 0.25 + (frameIndex / 59) * 0.5,
        }}
      />

      {/* Main Image Sequence frame */}
      <img
        src={frameSrc}
        alt="Interactive 3D Flying Burger"
        className="relative max-w-full h-auto object-contain pointer-events-none select-none z-10"
      />
    </div>
  );
}




