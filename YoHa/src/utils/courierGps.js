'use client';

export const OFFICIAL_TANGER_DESTINATIONS = {
  chu: {
    name: 'CHU Mohammed VI de Tanger',
    subtitle: 'Centre hospitalier universitaire',
    lat: 35.7558,
    lng: -5.8285,
    icon: '🏥',
  },
  fmpt: {
    name: 'FMPT de Tanger',
    subtitle: 'Faculté de Médecine et de Pharmacie',
    lat: 35.7545,
    lng: -5.8260,
    icon: '🎓',
  },
  ispits: {
    name: 'ISPITS Tanger',
    subtitle: 'Institut Supérieur des Professions Infirmières et Techniques de Santé',
    lat: 35.7530,
    lng: -5.8250,
    icon: '🎓',
  },
  alliance: {
    name: 'Résidence universitaire Alliance Tanger',
    subtitle: 'Résidence étudiante universitaire',
    lat: 35.7580,
    lng: -5.8310,
    icon: '🏠',
  },
};

/** Résoudre les coordonnées GPS exactes selon l'adresse parmi les 4 lieux officiels */
export function resolveDestinationCoords(address = '') {
  const str = String(address).toLowerCase();
  if (str.includes('fmpt') || str.includes('médecine') || str.includes('medecine')) {
    return OFFICIAL_TANGER_DESTINATIONS.fmpt;
  }
  if (str.includes('ispits') || str.includes('infirmi') || str.includes('technique')) {
    return OFFICIAL_TANGER_DESTINATIONS.ispits;
  }
  if (str.includes('alliance') || str.includes('résidence') || str.includes('residence') || str.includes('étudiante')) {
    return OFFICIAL_TANGER_DESTINATIONS.alliance;
  }
  return OFFICIAL_TANGER_DESTINATIONS.chu;
}

/** Formule de Haversine pour la distance exacte en km entre 2 points GPS */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Obtenir la position GPS en direct enregistrée pour une commande */
export function getCourierGps(orderId) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`yoha_courier_gps_${orderId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.active && Date.now() - data.updatedAt < 5 * 60 * 1000) {
      return data;
    }
    return null;
  } catch (_) {
    return null;
  }
}

/** Mettre à jour les coordonnées GPS du livreur */
export function updateCourierGps(orderId, lat, lng, active = true) {
  if (typeof window === 'undefined') return;
  try {
    const data = {
      orderId: String(orderId),
      active,
      lat,
      lng,
      updatedAt: Date.now(),
    };
    localStorage.setItem(`yoha_courier_gps_${orderId}`, JSON.stringify(data));
    window.dispatchEvent(new Event('yoha_courier_gps_updated'));
  } catch (e) {
    console.error('Error updating courier GPS:', e);
  }
}
