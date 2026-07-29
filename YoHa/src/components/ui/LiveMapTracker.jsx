'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { calculateHaversineDistance, resolveDestinationCoords, getCourierGps } from '../../utils/courierGps.js';

/**
 * Composant de Carte Live Interactive intégré directement sur le site web
 * Affiche la position réelle du livreur en mouvement, la destination et le tracé.
 */
export function LiveMapTracker({ orderId, courierName, address, height = '280px' }) {
  const [courierGps, setCourierGps] = useState(null);

  const destInfo = useMemo(() => resolveDestinationCoords(address || ''), [address]);

  useEffect(() => {
    if (!orderId) return;
    const fetchGps = () => {
      let data = getCourierGps(orderId);
      if (!data) data = getCourierGps('active_courier');
      setCourierGps(data);
    };
    fetchGps();
    const timer = setInterval(fetchGps, 3000);
    window.addEventListener('yoha_courier_gps_updated', fetchGps);
    return () => {
      clearInterval(timer);
      window.removeEventListener('yoha_courier_gps_updated', fetchGps);
    };
  }, [orderId]);

  // Position réelle du livreur ou position par défaut zone universitaire Tanger
  const courierLat = courierGps?.active ? courierGps.lat : 35.68500;
  const courierLng = courierGps?.active ? courierGps.lng : -5.92300;

  const distanceKm = calculateHaversineDistance(courierLat, courierLng, destInfo.lat, destInfo.lng);
  const travelMins = Math.max(2, Math.ceil((distanceKm / 22) * 60 + 2));

  // Generer bounding box OpenStreetMap centré sur le livreur et sa destination
  const minLat = Math.min(courierLat, destInfo.lat) - 0.006;
  const maxLat = Math.max(courierLat, destInfo.lat) + 0.006;
  const minLng = Math.min(courierLng, destInfo.lng) - 0.006;
  const maxLng = Math.max(courierLng, destInfo.lng) + 0.006;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${courierLat},${courierLng}`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-ink-200 dark:border-ink-800 shadow-lg bg-slate-900 group my-3">
      {/* Real-time Map Header Overlay */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-white shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold text-emerald-400 block truncate">
              🛵 Livreur {courierName || 'YoHa'} en direct
            </span>
            <span className="text-[10px] text-slate-300 font-semibold truncate block">
              À {distanceKm.toFixed(1)} km de {destInfo.name} (~{travelMins} min)
            </span>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
          Carte Live 🔴
        </span>
      </div>

      {/* Embedded Map iFrame */}
      <iframe
        title={`Carte de suivi live ${courierName || 'Livreur'}`}
        width="100%"
        height={height}
        frameBorder="0"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        src={mapUrl}
        className="w-full grayscale-[10%] contrast-[105%] transition-all group-hover:grayscale-0 pointer-events-auto"
      />

      {/* Footer Info Strip */}
      <div className="p-2.5 bg-slate-950 text-white text-[11px] font-medium flex items-center justify-between gap-2 border-t border-slate-800">
        <span className="flex items-center gap-1.5 truncate">
          <span>{destInfo.icon}</span> Destination : <strong className="text-amber-300">{destInfo.name}</strong>
        </span>
        <span className="text-[10px] font-mono text-slate-400 shrink-0">
          GPS: {courierLat.toFixed(4)}, {courierLng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
