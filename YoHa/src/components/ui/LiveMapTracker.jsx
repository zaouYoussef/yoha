'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { calculateHaversineDistance, resolveDestinationCoords, getCourierGps } from '../../utils/courierGps.js';

export function LiveMapTracker({ orderId, courierName, address, height = '280px' }) {
  const [courierGps, setCourierGps] = useState(null);
  const [expanded, setExpanded] = useState(false);

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

  const courierLat = courierGps?.active ? courierGps.lat : 35.68500;
  const courierLng = courierGps?.active ? courierGps.lng : -5.92300;

  const distanceKm = calculateHaversineDistance(courierLat, courierLng, destInfo.lat, destInfo.lng);
  const travelMins = Math.max(2, Math.ceil((distanceKm / 22) * 60 + 2));

  const mapHeight = expanded ? 'calc(100vh - 180px)' : height;

  const mapUrl = `https://maps.google.com/maps?saddr=${courierLat},${courierLng}&daddr=${destInfo.lat},${destInfo.lng}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${courierLat},${courierLng}&destination=${destInfo.lat},${destInfo.lng}&travelmode=driving`;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-ink-200 dark:border-ink-800 shadow-lg bg-slate-900 group my-3 ${expanded ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      {expanded && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1]" onClick={() => setExpanded(false)} />
      )}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-white shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          {courierGps?.active ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold text-emerald-400 block truncate">
              🛵 {courierName || 'Livreur'} {courierGps?.active ? 'en direct' : '(position estimée)'}
            </span>
            <span className="text-[10px] text-slate-300 font-semibold truncate block">
              {distanceKm.toFixed(1)} km — {travelMins} min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
            courierGps?.active
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {courierGps?.active ? 'Live' : 'Estimée'}
          </span>
          <button onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
            title={expanded ? 'Réduire' : 'Plein écran'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {expanded
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              }
            </svg>
          </button>
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
            className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
            title="Ouvrir dans Google Maps"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      <iframe
        title={`Carte de suivi live ${courierName || 'Livreur'}`}
        width="100%"
        height={mapHeight}
        frameBorder="0"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        src={mapUrl}
        className="w-full grayscale-[10%] contrast-[105%] transition-all group-hover:grayscale-0 pointer-events-auto"
      />

      <div className="p-2.5 bg-slate-950 text-white text-[11px] font-medium flex items-center justify-between gap-2 border-t border-slate-800">
        <span className="flex items-center gap-1.5 truncate">
          <span>{destInfo.icon}</span> {destInfo.name}
        </span>
        <span className="text-[10px] font-mono text-slate-400 shrink-0">
          {distanceKm.toFixed(1)} km
        </span>
      </div>
    </div>
  );
}
