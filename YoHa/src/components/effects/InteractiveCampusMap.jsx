'use client';

import { useState } from 'react';

const CAMPUS_ZONES = [
  {
    id: 'chu',
    name: 'CHU Mohammed VI Tanger',
    emoji: '🏥',
    eta: '45-60 min',
    desc: 'Livraison directe aux pavillons d\'urgence, réanimation et internat.',
    coords: { x: '35%', y: '40%' },
    badge: 'Urgence & Garde 24/7',
  },
  {
    id: 'fmpt',
    name: 'Faculté de Médecine (FMPT)',
    emoji: '🎓',
    eta: '45-60 min',
    desc: 'Livraison aux amphithéâtres, laboratoires et salles de révision.',
    coords: { x: '60%', y: '30%' },
    badge: 'Campus Étudiant',
  },
  {
    id: 'ispits',
    name: 'ISPITS Tanger',
    emoji: '🔬',
    eta: '45-60 min',
    desc: 'Service rapide pour les étudiants infirmiers et techniciens de santé.',
    coords: { x: '75%', y: '55%' },
    badge: 'École de Santé',
  },
  {
    id: 'alliance',
    name: 'Résidence Alliance',
    emoji: '🏢',
    eta: '45-60 min',
    desc: 'Livraison au pied des immeubles de la résidence étudiante L\'Alliance.',
    coords: { x: '25%', y: '70%' },
    badge: 'Logement Étudiant',
  },
];

export function InteractiveCampusMap() {
  const [selectedZone, setSelectedZone] = useState(CAMPUS_ZONES[0]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-slate-950 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      {/* Background neon grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Campus Interactive Visual Map */}
        <div className="lg:col-span-7 relative h-[340px] md:h-[400px] rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
          {/* Simulated Map Stylized Paths */}
          <svg className="absolute inset-0 w-full h-full stroke-orange-500/20 stroke-[2] fill-none">
            <path d="M 50 100 Q 200 50 350 150 T 600 300" strokeDasharray="6 6" />
            <path d="M 120 300 Q 250 250 450 100" strokeDasharray="4 4" />
          </svg>

          {/* Interactive Pins */}
          {CAMPUS_ZONES.map((zone) => {
            const isSelected = selectedZone.id === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                style={{ left: zone.coords.x, top: zone.coords.y }}
              >
                {/* Pulse Ring */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    isSelected ? 'animate-ping bg-orange-500/40 scale-150' : 'group-hover:bg-orange-500/20 scale-110'
                  }`}
                />

                {/* Pin Button */}
                <div
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-lg transition-all duration-300 ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-400 scale-110 shadow-orange-500/50'
                      : 'bg-slate-950/90 text-slate-300 border-slate-700 hover:border-orange-500/60'
                  }`}
                >
                  <span className="text-base">{zone.emoji}</span>
                  <span className="hidden sm:inline">{zone.name.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Zone Details Card */}
        <div className="lg:col-span-5">
          <div className="space-y-5 transition-all duration-300">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
              <span>{selectedZone.badge}</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <span>{selectedZone.emoji}</span>
              <span>{selectedZone.name}</span>
            </h3>

            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              {selectedZone.desc}
            </p>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏍️</span>
                <div>
                  <div className="text-xs text-slate-400">Temps Moyen de Livraison</div>
                  <div className="text-base font-bold text-orange-400">{selectedZone.eta}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Frais de Livraison</div>
                <div className="text-base font-bold text-emerald-400">0 DH (Offert)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
