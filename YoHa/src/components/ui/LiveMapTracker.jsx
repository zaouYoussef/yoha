'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { calculateHaversineDistance, resolveDestinationCoords, getCourierGps } from '../../utils/courierGps.js';
import { ordersApi } from '../../lib/api.js';

/**
 * Carte live : position réelle du livreur (API + localStorage) jusqu'à livraison.
 */
export function LiveMapTracker({ orderId, courierName, address, height = '280px', lat: latProp, lng: lngProp }) {
  const [courierGps, setCourierGps] = useState(null);
  const [remoteGps, setRemoteGps] = useState(null);

  const destInfo = useMemo(() => resolveDestinationCoords(address || ''), [address]);

  useEffect(() => {
    if (!orderId) return undefined;
    const fetchGps = () => {
      const data = getCourierGps(orderId);
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

  useEffect(() => {
    if (!orderId) return undefined;
    const fetchRemote = () => {
      ordersApi.getLocation(orderId).then((data) => {
        if (data?.active && data?.latitude != null && data?.longitude != null) {
          setRemoteGps(data);
        } else {
          setRemoteGps(null);
        }
      }).catch(() => setRemoteGps(null));
    };
    fetchRemote();
    const timer = setInterval(fetchRemote, 4000);
    return () => clearInterval(timer);
  }, [orderId]);

  const courierLat =
    latProp != null
      ? Number(latProp)
      : remoteGps?.active
        ? Number(remoteGps.latitude)
        : courierGps?.active
          ? courierGps.lat
          : null;
  const courierLng =
    lngProp != null
      ? Number(lngProp)
      : remoteGps?.active
        ? Number(remoteGps.longitude)
        : courierGps?.active
          ? courierGps.lng
          : null;

  const isLive = courierLat != null && courierLng != null;
  const displayLat = isLive ? courierLat : 35.685;
  const displayLng = isLive ? courierLng : -5.923;

  const distanceKm = calculateHaversineDistance(displayLat, displayLng, destInfo.lat, destInfo.lng);
  const travelMins = Math.max(2, Math.ceil((distanceKm / 22) * 60 + 2));
  const mapUrl = `https://maps.google.com/maps?q=${displayLat},${displayLng}&z=15&output=embed`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-ink-200 dark:border-ink-800 shadow-lg bg-slate-900 group my-3">
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-white shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          {isLive ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          )}
          <div className="min-w-0">
            <span className={`text-[11px] font-extrabold block truncate ${isLive ? 'text-emerald-400' : 'text-amber-300'}`}>
              {courierName || 'Livreur'} {isLive ? 'en direct' : '(GPS en attente)'}
            </span>
            <span className="text-[10px] text-slate-300 font-semibold truncate block">
              {isLive
                ? `À ${distanceKm.toFixed(1)} km de ${destInfo.name} (~${travelMins} min)`
                : `Destination : ${destInfo.name}`}
            </span>
          </div>
        </div>

        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 ${
          isLive
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        }`}>
          {isLive ? 'GPS Live' : 'En attente'}
        </span>
      </div>

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

      <div className="p-2.5 bg-slate-950 text-white text-[11px] font-medium flex items-center justify-between gap-2 border-t border-slate-800">
        <span className="flex items-center gap-1.5 truncate">
          <span>{destInfo.icon}</span> Destination : <strong className="text-amber-300">{destInfo.name}</strong>
        </span>
        <span className="text-[10px] font-mono text-slate-400 shrink-0">
          {isLive ? `GPS: ${displayLat.toFixed(4)}, ${displayLng.toFixed(4)}` : 'Pas de signal'}
        </span>
      </div>
    </div>
  );
}
