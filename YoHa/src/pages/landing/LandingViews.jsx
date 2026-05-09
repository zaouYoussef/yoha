import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { I } from '../../icons/Icons.jsx';
import { RESTAURANTS } from '../../data/restaurants.js';
import { FEATURES } from '../../data/features.jsx';
import { HOW_STEPS } from '../../data/howSteps.jsx';
import { TESTIMONIALS } from '../../data/testimonials.js';
import { CAMPUS_HOSPITALS } from '../../data/campusHospitals.js';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Magnetic } from '../../components/ui/Magnetic.jsx';
import { Tilt } from '../../components/ui/Tilt.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { spotlightHandler } from '../../utils/spotlight.js';

export function Landing({ onStart }) {
  const scrollToHowItWorks = () => {
    document.getElementById('comment-ca-marche')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page-enter">
      <Hero onStart={onStart} onHowItWorks={scrollToHowItWorks} />
      <PartnersMarquee />
      <PartnerCategoriesSection />
      <Carousel3DSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
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

  return (
    <section className="relative overflow-hidden hero-spot">
      {/* Animated blobs */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[42rem] h-[42rem] rounded-full bg-brand-400/40 blur-3xl animate-blob"></div>
        <div className="absolute top-[10%] right-[-15%] w-[36rem] h-[36rem] rounded-full bg-fuchsia-400/40 blur-3xl animate-blob" style={{ animationDelay:'4s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[44rem] h-[44rem] rounded-full bg-violet-400/30 blur-3xl animate-blob" style={{ animationDelay:'8s' }}></div>
        <div className="absolute inset-0 mesh-bg opacity-70"></div>
        <div className="absolute inset-0 grid-bg"></div>
      </div>

      {/* Canvas particle network — overlays everything but pointer-events allowed */}
      <div className="absolute inset-0 -z-[5] pointer-events-none">
        <div className="absolute inset-0 pointer-events-auto">
          <ParticleCanvas />
        </div>
      </div>

      {/* Floating emoji decorations */}
      <span className="emoji-deco hidden md:block" style={{ top:'18%', left:'8%',  animationDelay:'0s'   }}>🍕</span>
      <span className="emoji-deco hidden md:block" style={{ top:'38%', left:'4%',  animationDelay:'1.5s' }}>🥗</span>
      <span className="emoji-deco hidden md:block" style={{ top:'68%', left:'12%', animationDelay:'3s'   }}>🍣</span>
      <span className="emoji-deco hidden lg:block" style={{ top:'26%', right:'4%', animationDelay:'2s'   }}>🥤</span>
      <span className="emoji-deco hidden lg:block" style={{ top:'72%', right:'8%', animationDelay:'.5s'  }}>🍔</span>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-28 grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT */}
        <div className="relative z-10" style={{ pointerEvents:'auto' }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-semibold tracking-wider uppercase animate-fade-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            En direct sur les campus & hôpitaux
          </span>

          <h1 className="mt-6 font-display font-black tracking-tight text-5xl sm:text-6xl lg:text-7xl leading-[0.95]">
            {/* Un seul bloc text-gradient : avec des spans par lettre, le clip dégradé ne s’appliquait pas → texte invisible */}
            <span className="block text-gradient">YoHa.</span>
            <span className="block mt-3 text-ink-900 dark:text-ink-50 min-h-[1.15em]">
              {typed}
              <span className="caret align-baseline" style={{ height:'0.85em' }}></span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-ink-600 dark:text-ink-300 leading-relaxed animate-fade-up" style={{ animationDelay:'600ms' }}>
            Commandez auprès de vos cuisines préférées et faites-vous livrer directement à votre chambre ou à l'aile hospitalière — en moins de 30 minutes. Aucun détour.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay:'750ms' }}>
            <Button onClick={onStart} variant="primary" size="lg">
              Commander maintenant <I.Right size={18}/>
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={onHowItWorks}>
              <I.Bike size={18}/> Comment ça marche
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-6 animate-fade-up" style={{ animationDelay:'900ms' }}>
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/64?img=${i+10}`} alt=""
                  className="w-9 h-9 rounded-full border-2 border-white dark:border-ink-900 object-cover" />
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                {[1,2,3,4,5].map(i => <I.Star key={i} size={14} stroke={2.4} className="fill-amber-400" />)}
                <span className="ml-1 font-semibold text-ink-900 dark:text-ink-50">4,9</span>
              </div>
              <div className="text-ink-500 dark:text-ink-400">Adoré par 12 000+ étudiants & soignants</div>
            </div>
          </div>
        </div>

        {/* RIGHT — Bento layout */}
        <div className="relative">
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

/* === Bento layout for hero right === */
export function BentoHero() {
  const n = RESTAURANTS.length;
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

  const spot = RESTAURANTS[spotIdx] ?? RESTAURANTS[0];

  return (
    <div className="grid grid-cols-6 grid-rows-6 gap-3 h-[520px] sm:h-[600px] lg:h-[640px]">
      <Tilt className="col-span-4 row-span-3">
        <div className="cursor-grow group relative h-full rounded-3xl overflow-hidden shadow-cardhover spotlight"
          onMouseMove={spotlightHandler}>
          <div
            className={`absolute inset-0 transition-opacity duration-300 ease-out ${spotFade ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={spot.cover} alt={spot.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent"></div>
            <div className="absolute top-3 left-3 right-14 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-ink-900 shadow flex items-center gap-1 max-w-[min(100%,14rem)]">
              <I.Flame size={12} className="text-brand-500 shrink-0"/> <span className="truncate">{spot.tags[0] ?? 'Partenaire'}</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-white z-10">
              {n > 1 && (
                <div className="flex justify-center gap-1.5 mb-3" role="tablist" aria-label="Restaurants à l’affiche">
                  {RESTAURANTS.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      aria-label={r.name}
                      aria-current={i === spotIdx ? 'true' : undefined}
                      onClick={() => {
                        if (i === spotIdx) return;
                        setSpotFade(false);
                        setTimeout(() => { setSpotIdx(i); setSpotFade(true); }, 200);
                      }}
                      className={`h-1.5 rounded-full transition-all ${i === spotIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/75'}`}
                    />
                  ))}
                </div>
              )}
              <div className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">{spot.name}</div>
              <div className="text-sm opacity-90 flex items-center gap-2 mt-1 flex-wrap">
                <I.Star size={12} className="fill-amber-400 text-amber-400 shrink-0"/>
                <span>{spot.rating.toString().replace('.', ',')} ·</span>
                <span className="inline-flex items-center gap-1.5"><I.Clock size={12}/> {spot.eta}</span>
              </div>
            </div>
          </div>
        </div>
      </Tilt>

      <Tilt className="col-span-2 row-span-3" max={5}>
        <div className="relative h-full rounded-3xl bg-gradient-to-br from-ink-900 to-black p-4 text-white overflow-hidden shadow-cardhover">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-500/40 blur-2xl"></div>
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

      <Tilt className="col-span-3 row-span-2">
        <div className="h-full rounded-3xl glass-strong p-4 shadow-cardhover">
          <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Communauté</div>
          <div className="mt-2 font-display font-black text-3xl sm:text-4xl text-gradient">12 000+</div>
          <div className="text-sm text-ink-600 dark:text-ink-300">étudiants & soignants</div>
          <div className="mt-3 flex -space-x-2">
            {[5,16,18,22,33].map(i => (
              <img key={i} src={`https://i.pravatar.cc/48?img=${i}`} alt=""
                className="w-7 h-7 rounded-full border-2 border-white dark:border-ink-900 object-cover"/>
            ))}
          </div>
        </div>
      </Tilt>

      <Tilt className="col-span-3 row-span-2">
        <div className="relative h-full rounded-3xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 p-4 text-white shadow-glow overflow-hidden">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/15 blur-2xl"></div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Livraison moyenne</div>
          <div className="mt-2 font-display font-black text-5xl">26<span className="text-2xl">min</span></div>
          <div className="text-sm opacity-90">⚡ Du clic à la fourchette</div>
        </div>
      </Tilt>

      <Tilt className="col-span-3 row-span-1">
        <div className="h-full rounded-3xl bg-emerald-500/10 border border-emerald-500/30 px-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white grid place-items-center"><I.Bike size={18}/></span>
          <div className="text-sm">
            <div className="font-bold">Livraison offerte</div>
            <div className="text-ink-500 dark:text-ink-400 text-xs">Sur tout le campus</div>
          </div>
        </div>
      </Tilt>

      <Tilt className="col-span-3 row-span-1">
        <div className="h-full rounded-3xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 px-4 flex items-center gap-3 shadow-card">
          <span className="w-9 h-9 rounded-xl bg-amber-400 text-white grid place-items-center"><I.Star size={18} className="fill-current"/></span>
          <div className="text-sm">
            <div className="font-bold">4,9 / 5</div>
            <div className="text-ink-500 dark:text-ink-400 text-xs">Basé sur 5 800+ avis</div>
          </div>
        </div>
      </Tilt>
    </div>
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
      </defs>
      <path d="M 10 60 Q 60 10, 110 50 T 195 30" stroke="rgba(255,255,255,.15)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4"/>
      <path d="M 10 60 Q 60 10, 110 50 T 195 30" stroke="url(#track)" strokeWidth="3" strokeLinecap="round" pathLength="100"
        style={{ strokeDasharray:'100', strokeDashoffset:'40', animation:'shimmer 3s linear infinite' }}/>
      <circle cx="10" cy="60" r="4" fill="#fff"/>
      <circle cx="195" cy="30" r="4" fill="#10b981"/>
      <g style={{ offsetPath:"path('M 10 60 Q 60 10, 110 50 T 195 30')", animation:'bike-go 4s ease-in-out infinite alternate' }}>
        <circle r="9" fill="#f97316"/>
        <circle r="9" fill="none" stroke="#fff" strokeWidth="2"/>
        <text x="0" y="3" textAnchor="middle" fontSize="10">🛵</text>
      </g>
    </svg>
  );
}

/* === Marquee === */
export function PartnersMarquee() {
  const items = [
    '🏥 CHU Mohammed VI de Tanger',
    '🏥 Hôpital Universitaire Mohammed VI',
    '🎓 ISPITS Tanger',
    '🏠 Résidence universitaire Alliance Tanger',
  ];
  return (
    <section className="border-y border-ink-200/60 dark:border-ink-800/60 py-6 overflow-hidden bg-white/40 dark:bg-ink-900/40 backdrop-blur">
      <div className="marquee gap-12 text-2xl sm:text-3xl font-display font-bold tracking-tight text-ink-400/70 dark:text-ink-500/70">
        {[...Array(2)].map((_, k) => (
          <Fragment key={k}>
            {items.map(it => <span key={it+k}>{it}</span>)}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

/* === Restaurants · Pâtisseries · Pharmacies (bandeau sobre) === */
export function PartnerCategoriesSection() {
  const rows = [
    { emoji: '🍽️', title: 'Restaurants', line: 'Repas chauds, cuisines du monde, menus du jour.' },
    { emoji: '🥐', title: 'Pâtisseries', line: 'Viennoiseries, desserts et pauses sucrées.' },
    { emoji: '💊', title: 'Pharmacies', line: 'Parapharmacie et besoins du quotidien (selon partenaire).' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Reveal>
        <div className="rounded-3xl border border-ink-200/80 bg-ink-50/80 dark:border-ink-800 dark:bg-ink-950/50 overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-10 border-b border-ink-200/80 dark:border-ink-800">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-ink-900 dark:text-ink-50">
              On livre aussi les <span className="text-gradient">pâtisseries</span> et les <span className="text-gradient">pharmacies</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-ink-600 dark:text-ink-400 leading-relaxed">
              En plus des restaurants, YoHa regroupe les partenaires dont vous avez besoin sur le campus ou au CHU — tout au même endroit.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink-200/80 dark:divide-ink-800">
            {rows.map((r) => (
              <div key={r.title} className="flex gap-4 px-6 py-6 sm:px-8 sm:py-8">
                <span className="text-3xl shrink-0 leading-none pt-0.5" aria-hidden>{r.emoji}</span>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink-900 dark:text-ink-100">{r.title}</h3>
                  <p className="mt-1 text-sm text-ink-600 dark:text-ink-400 leading-snug">{r.line}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* === 3D AUTO-ROTATING CAROUSEL === */
export function Carousel3DSection() {
  const items = RESTAURANTS.slice(0, 6);
  const radius = 360;
  const angleStep = 360 / items.length;

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 -z-10 mesh-conic opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-10">
        <span className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">À découvrir</span>
        <h2 className="mt-3 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
          Un univers culinaire <span className="text-gradient">à 360°</span>
        </h2>
        <p className="mt-3 text-ink-500 dark:text-ink-400">
          Tour complet à 360° sur nos restaurants partenaires.
        </p>
      </div>

      <div className="carousel-3d relative h-[420px]">
        <div className="carousel-3d-inner">
          {items.map((r, i) => {
            const angle = i * angleStep;
            return (
              <div key={r.id} className="carousel-3d-card cursor-grow"
                style={{ transform: `rotateY(${angle}deg) translateZ(${radius}px)` }}>
                <div className="relative w-full h-full overflow-hidden rounded-3xl">
                  <img src={r.cover} alt={r.name} className="absolute inset-0 w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-ink-900 shadow flex items-center gap-1">
                    <I.Star size={11} className="fill-amber-400 text-amber-400"/> {r.rating.toString().replace('.', ',')}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-[10px] uppercase tracking-wider opacity-70">{r.tags[0]}</div>
                    <div className="font-display font-extrabold text-xl mt-0.5">{r.name}</div>
                    <div className="text-xs opacity-80 mt-1 flex items-center gap-1.5"><I.Clock size={11}/> {r.eta}</div>
                  </div>
                </div>
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
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Pourquoi YoHa</span>
        <h2 className="mt-3 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
          Pensé pour le <span className="text-gradient">rythme du campus.</span>
        </h2>
        <p className="mt-4 text-lg text-ink-600 dark:text-ink-300">
          Conçu avec des étudiants et des soignants — rapide, calme et ridiculement simple à utiliser.
        </p>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i*80}>
            <Tilt max={8}>
              <div className="group relative h-full p-6 rounded-3xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card hover:shadow-cardhover overflow-hidden spotlight"
                onMouseMove={spotlightHandler}>
                <div className={`absolute -inset-1 bg-gradient-to-br ${f.from} ${f.to} opacity-0 group-hover:opacity-10 transition-opacity blur-2xl`}></div>
                <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${f.from} ${f.to} text-white grid place-items-center shadow-md group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="relative mt-5 font-display font-bold text-xl">{f.title}</h3>
                <p className="relative mt-2 text-ink-600 dark:text-ink-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* === How It Works === */
export function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 scroll-mt-24" aria-labelledby="how-it-works-heading">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Comment ça marche</span>
        <h2 id="how-it-works-heading" className="mt-3 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
          3 étapes. <span className="text-gradient">Zéro friction.</span>
        </h2>
      </div>

      <div className="relative mt-14 grid md:grid-cols-3 gap-6">
        <div aria-hidden className="hidden md:block absolute top-12 left-[16%] right-[16%] border-t-2 border-dashed border-ink-300 dark:border-ink-700"></div>

        {HOW_STEPS.map((s, i) => (
          <Reveal key={s.num} delay={i*150}>
            <div className="relative group">
              <div className={`relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br ${s.color} text-white grid place-items-center shadow-glow group-hover:scale-110 transition-transform`}>
                <span className="absolute font-display font-black text-3xl opacity-25 -top-1 -right-2">{s.num}</span>
                {s.icon}
                <span className="pulse-ring rounded-3xl"></span>
              </div>
              <div className="mt-6 text-center">
                <div className="font-display font-bold text-xl">{s.title}</div>
                <p className="mt-2 text-ink-600 dark:text-ink-400 text-sm max-w-xs mx-auto">{s.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* === Showcase === */
export function ShowcaseSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <div className="relative">
            <div aria-hidden className="absolute -inset-10 mesh-conic opacity-50"></div>
            <PhoneMockup />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Sur tous vos écrans</span>
            <h2 className="mt-3 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
              Une expérience <span className="text-gradient">si fluide</span> que vous oublierez de respirer.
            </h2>
            <p className="mt-5 text-lg text-ink-600 dark:text-ink-300 max-w-lg">
              Tout est conçu pour simplifier votre expérience et gagner du temps.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                ['Suivi en direct du livreur, étape par étape', 'sky'],
                ['Accès rapide à vos dernières commandes en 1 clic', 'pink'],
                ['Suggestions de plats selon vos habitudes et vos horaires', 'violet'],
                ['Commande rapide depuis vos restaurants favoris', 'emerald'],
              ].map(([t, c]) => (
                <li key={t} className="flex items-start gap-3">
                  <span className={`mt-0.5 w-6 h-6 rounded-full bg-${c}-500/15 text-${c}-600 grid place-items-center shrink-0`}>
                    <I.Check size={14} stroke={3}/>
                  </span>
                  <span className="text-ink-700 dark:text-ink-200">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px] aspect-[9/19] rounded-[3rem] bg-ink-900 dark:bg-black p-3 shadow-cardhover animate-float-slow">
      <div className="absolute inset-x-0 -top-4 mx-auto w-32 h-7 rounded-b-2xl bg-ink-900 dark:bg-black z-10"></div>
      <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-brand-50 to-pink-50 dark:from-ink-900 dark:to-ink-950">
        <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-90"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

        <div className="absolute top-12 left-4 right-4">
          <div className="glass-strong rounded-2xl p-3 flex items-center gap-2">
            <I.Search size={16}/>
            <span className="text-xs font-semibold">Que mangez-vous ?</span>
          </div>
        </div>

        <div className="absolute bottom-20 left-4 right-4 glass-strong rounded-2xl p-3">
          <div className="text-xs font-semibold text-ink-500 dark:text-ink-400">Recommandé pour vous</div>
          <div className="mt-2 flex items-center gap-2">
            <img src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=100&q=80&auto=format&fit=crop" className="w-12 h-12 rounded-xl object-cover"/>
            <div>
              <div className="font-bold text-sm">Margherita</div>
              <div className="text-xs text-ink-500">89 MAD · 14 min</div>
            </div>
            <button className="ml-auto w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 text-white grid place-items-center shadow-glow">
              <I.Plus size={14} stroke={3}/>
            </button>
          </div>
        </div>

        <div className="absolute bottom-3 inset-x-3 bg-gradient-to-r from-brand-500 to-pink-500 text-white rounded-2xl p-3 flex items-center justify-between shadow-glow">
          <span className="font-bold text-sm flex items-center gap-2"><I.Bag size={16}/> 3 articles</span>
          <span className="font-bold text-sm">243 MAD</span>
        </div>
      </div>
    </div>
  );
}

/* === Testimonials === */
export function TestimonialsSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Ils en parlent</span>
            <h2 className="mt-3 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
              Adoré sur les <span className="text-gradient">campus & dans les couloirs.</span>
            </h2>
          </div>
        </div>

        <div className="mt-10 testi-track flex gap-5 overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0 pb-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="cursor-grow shrink-0 w-[85%] sm:w-[420px] rounded-3xl p-6 bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 shadow-card hover:shadow-cardhover transition-shadow lift-on-hover relative overflow-hidden spotlight"
              onMouseMove={spotlightHandler}>
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${t.color} opacity-15 blur-2xl`}></div>
              <div className="text-5xl text-ink-200 dark:text-ink-700 leading-none">"</div>
              <p className="mt-2 text-ink-700 dark:text-ink-200 leading-relaxed">{t.text}</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={t.avatar} alt="" className="w-11 h-11 rounded-full object-cover"/>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(t.rating)].map((_,j) => <I.Star key={j} size={12} className="fill-amber-400" stroke={2.5}/>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* === Final CTA === */
export function FinalCTA({ onStart }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 dark:from-black dark:via-ink-900 dark:to-black p-8 sm:p-14 text-white">
          <div aria-hidden className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-brand-500/40 blur-3xl animate-pulse-slow"></div>
          <div aria-hidden className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/40 blur-3xl animate-pulse-slow" style={{ animationDelay:'1s' }}></div>
          <div className="absolute inset-0 grid-bg opacity-30"></div>
          <div className="relative max-w-2xl">
            <h3 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
              Faim ? Votre chambre est à <span className="text-gradient">14 minutes</span> de quelque chose de génial.
            </h3>
            <p className="mt-4 text-white/70 text-lg">Aucune app à télécharger. Ouvrez YoHa et commandez.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Magnetic strength={20}>
                <Button onClick={onStart} variant="primary" size="lg">Commander maintenant <I.Right size={18}/></Button>
              </Magnetic>
              <Button variant="glass" size="lg"><I.Headset size={18}/> Parler au support</Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function CampusHospitalsSection() {
  return (
    <section className="mt-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-orange-50 to-rose-50 dark:from-ink-900 dark:via-ink-900 dark:to-ink-950 text-ink-900 dark:text-white shadow-cardhover p-5 sm:p-7 border border-ink-200/70 dark:border-ink-800">
          <div className="absolute inset-0 opacity-20 dark:opacity-10 grid-bg"></div>
          <div aria-hidden className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-brand-400/25 dark:bg-brand-500/30 blur-3xl"></div>
          <div aria-hidden className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-fuchsia-400/20 dark:bg-violet-500/25 blur-3xl"></div>

          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/15 backdrop-blur text-xs font-semibold border border-white/70 dark:border-white/15">
                <I.MapPin size={14}/> Campus & Hôpitaux — Tanger
              </div>
              <h3 className="mt-3 font-display font-extrabold text-2xl sm:text-4xl tracking-tight">
                Zones stratégiques <span className="text-gradient">couvertes 24/7</span>
              </h3>
              <p className="mt-2 text-sm sm:text-base text-ink-600 dark:text-white/80 max-w-2xl">
                Commande rapide vers les hôpitaux universitaires, instituts de santé et résidences étudiantes.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/85 dark:bg-white/10 px-4 py-3 backdrop-blur border border-white/80 dark:border-white/15">
              <div className="text-[11px] uppercase tracking-wider text-ink-500 dark:text-white/70">Points couverts</div>
              <div className="font-display font-black text-3xl leading-none">+{CAMPUS_HOSPITALS.length}</div>
            </div>
          </div>

          <div className="relative mt-6 space-y-4">
            {CAMPUS_HOSPITALS.map((place, idx) => (
              <Reveal key={place.name} delay={idx * 90}>
                <Tilt max={4}>
                  <article className="group grid md:grid-cols-[280px_1fr] gap-0 rounded-2xl overflow-hidden border border-ink-200/80 dark:border-white/15 bg-white/90 dark:bg-white/10 backdrop-blur-sm hover:bg-white dark:hover:bg-white/15 transition-all">
                    <div className="relative h-48 md:h-full overflow-hidden">
                      <img
                        src={place.img}
                        alt={place.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent md:bg-gradient-to-t md:from-black/30 md:to-transparent"></div>
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col justify-center">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-200 mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Disponible pour livraison
                      </div>
                      <h4 className="font-display font-bold text-xl sm:text-2xl leading-tight">{place.name}</h4>
                      <p className="mt-2 text-ink-600 dark:text-white/80">{place.subtitle}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-white/90">
                        <I.Bike size={16}/> Livraison prioritaire
                      </div>
                    </div>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
