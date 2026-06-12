export const ORDER_STATES = {
  placed:           { label:'Commande confirmée',     clientMsg:'Votre commande est confirmée.', color:'bg-amber-500',   text:'text-amber-600',   step:1 },
  pickup_confirmed: { label:'Livreur vers le resto',   clientMsg:'Un livreur est en route vers le restaurant pour récupérer votre commande.', color:'bg-sky-500',     text:'text-sky-600',     step:2 },
  preparing:        { label:'Prête au restaurant',      clientMsg:'Votre commande est prête — le livreur va la récupérer.', color:'bg-violet-500',  text:'text-violet-600',  step:2 },
  delivering:       { label:'En route vers vous',       clientMsg:'Votre livreur est en route avec votre commande !', color:'bg-pink-500',    text:'text-pink-600',    step:3 },
  delivered:        { label:'Livré',                    clientMsg:'Bon appétit ! Votre commande a été livrée.', color:'bg-ink-700',     text:'text-ink-700',     step:4 },
  cancelled:        { label:'Annulée',                  clientMsg:'Cette commande a été annulée.', color:'bg-red-500',     text:'text-red-600',     step:0 },
};

export const CANCEL_PHASES = {
  before_pickup: {
    label: 'Annulée avant récupération',
    short: 'Avant récupération',
    hint: 'Le livreur n\'a pas encore récupéré la commande au restaurant.',
  },
  after_pickup: {
    label: 'Annulée après récupération',
    short: 'Après récupération',
    hint: 'Client injoignable ou refus à la livraison.',
  },
};

export const ACTIVE_ORDER_STATUSES = new Set(['placed', 'pickup_confirmed', 'preparing', 'delivering']);

export function isActiveOrderStatus(status) {
  return ACTIVE_ORDER_STATUSES.has(status);
}

/** Commandes visibles dans le dashboard restaurant (livreur confirmé, pas encore récupéré). */
export const RESTAURANT_ACTIVE_STATUSES = new Set(['pickup_confirmed', 'preparing']);

export function isRestaurantActiveOrder(status) {
  return RESTAURANT_ACTIVE_STATUSES.has(status);
}

export function isRestaurantCancelledOrder(order) {
  return (
    order?.status === 'cancelled'
    && order?.cancelledPhase === 'before_pickup'
    && !!order?.courierId
  );
}

/** Agrégats stats : toutes les commandes traitées par le resto (hors placed en attente livreur). */
export function isRestaurantStatsOrder(order) {
  if (!order || order.status === 'placed') return false;
  if (order.status === 'cancelled') return isRestaurantCancelledOrder(order);
  return true;
}

export function cancelPhaseLabel(phase) {
  return CANCEL_PHASES[phase]?.label || 'Annulée';
}

/** Étapes affichées au client (4 e-mails / 4 statuts visibles) */
export const CLIENT_TRACK_STEPS = ['placed', 'pickup_confirmed', 'delivering', 'delivered'];

/** Notifications toast affichées au client lors d’un changement de statut */
export const ORDER_STATUS_TOASTS = {
  pickup_confirmed: { title: '🛵 Livreur en route', desc: 'Il se dirige vers le restaurant pour récupérer votre commande.' },
  delivering:       { title: '📦 En route vers vous', desc: 'Votre repas est en chemin !' },
  delivered:        { title: '✅ Livré !', desc: 'Votre commande est arrivée. Bon appétit !' },
  cancelled:        { title: 'Commande annulée', desc: 'Cette commande a été annulée.' },
};
/** Livraison toujours gratuite pour le client — pas de frais déduits des profits mock */
export const DELIVERY_FEE_DH = 0;

/** Rémunération fixe affichée par livraison (dashboard livreur) */
export const MOCK_COURIER_GAIN_PER_DELIVERY_MAD = 16;
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
