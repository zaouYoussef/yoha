export const ORDER_STATES = {
  placed:           { label:'Nouvelle commande', color:'bg-amber-500',   text:'text-amber-600',   step:1 },
  pickup_confirmed: { label:'Livreur confirmé',  color:'bg-sky-500',     text:'text-sky-600',     step:2 },
  preparing:        { label:'En préparation',    color:'bg-violet-500',  text:'text-violet-600',  step:3 },
  delivering:       { label:'En livraison',      color:'bg-pink-500',    text:'text-pink-600',    step:4 },
  delivered:        { label:'Livré',             color:'bg-ink-700',     text:'text-ink-700',     step:5 },
};

export const COURIERS = [
  { id:'c1', name:'Yacine A.',  phone:'+212 6 11 22 33 44', avatar:'https://i.pravatar.cc/120?img=12', rating:4.9, vehicle:'Scooter' },
  { id:'c2', name:'Hamza R.',   phone:'+212 6 22 33 44 55', avatar:'https://i.pravatar.cc/120?img=13', rating:4.8, vehicle:'Vélo' },
  { id:'c3', name:'Soukaina B.',phone:'+212 6 33 44 55 66', avatar:'https://i.pravatar.cc/120?img=23', rating:5.0, vehicle:'Scooter' },
  { id:'c4', name:'Mehdi T.',   phone:'+212 6 44 55 66 77', avatar:'https://i.pravatar.cc/120?img=15', rating:4.7, vehicle:'Vélo' },
];

/** Livraison toujours gratuite pour le client — pas de frais déduits des profits mock */
export const DELIVERY_FEE_DH = 0;

/** Rémunération mock affichée par livraison (dashboard livreur — indépendante des frais client) */
export const MOCK_COURIER_GAIN_PER_DELIVERY_MAD = 120;
/** Commission plateforme sur le restaurant : 20 % sur (total commande − forfait client). */
export const PROFIT_FACTOR = 0.2;
/** Forfait client (MAD) : déduit de la base avant le %, puis ajouté au profit (les 12 DH prélevés au client). */
export const PROFIT_FIXED = 12;

/** Profit plateforme = (total − PROFIT_FIXED) × PROFIT_FACTOR + PROFIT_FIXED */
export function computeProfit(totalDh) {
  const t = typeof totalDh === 'number' ? totalDh : parseFloat(totalDh);
  if (!Number.isFinite(t)) return 0;
  return (t - PROFIT_FIXED) * PROFIT_FACTOR + PROFIT_FIXED;
}

/** Net = (brut − frais livraison mock) × ce facteur */
export const PROFIT_NET_FACTOR = 0.99;

export function computeNet(totalDh) {
  const brut = computeProfit(totalDh) - DELIVERY_FEE_DH;
  return brut * PROFIT_NET_FACTOR;
}

/** Seuil au-delà duquel les frais de service passent au tarif élevé */
export const SERVICE_FEE_THRESHOLD_MAD = 3000;
export const SERVICE_FEE_LOW_MAD = 12;
export const SERVICE_FEE_HIGH_MAD = 30;

/** Frais de service checkout : 12 MAD par défaut, 30 MAD si sous-total > 3000 MAD */
export function getServiceFeeMad(subtotal) {
  const s = typeof subtotal === 'number' ? subtotal : parseFloat(subtotal);
  if (!Number.isFinite(s)) return SERVICE_FEE_LOW_MAD;
  return s > SERVICE_FEE_THRESHOLD_MAD ? SERVICE_FEE_HIGH_MAD : SERVICE_FEE_LOW_MAD;
}

/** Affiche un montant en dirhams (MAD) */
export function formatMad(value, { decimals = 2 } = {}) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n)) return decimals === 0 ? '0 MAD' : '0,00 MAD';
  if (decimals === 0) return `${Math.round(n)} MAD`;
  return `${n.toFixed(decimals).replace('.', ',')} MAD`;
}
