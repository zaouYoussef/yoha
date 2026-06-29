export const ORDER_STATES: Record<
  string,
  { label: string; clientMsg: string; color: string; step: number }
> = {
  placed: {
    label: 'Commande confirmée',
    clientMsg: 'Votre commande est confirmée.',
    color: '#f59e0b',
    step: 1,
  },
  pickup_confirmed: {
    label: 'Livreur vers le resto',
    clientMsg: 'Un livreur est en route vers le restaurant.',
    color: '#0ea5e9',
    step: 2,
  },
  preparing: {
    label: 'Prête au restaurant',
    clientMsg: 'Votre commande est prête — le livreur va la récupérer.',
    color: '#8b5cf6',
    step: 2,
  },
  delivering: {
    label: 'En route vers vous',
    clientMsg: 'Votre livreur est en route avec votre commande !',
    color: '#ec4899',
    step: 3,
  },
  delivered: {
    label: 'Livré',
    clientMsg: 'Bon appétit ! Votre commande a été livrée.',
    color: '#334155',
    step: 4,
  },
  cancelled: {
    label: 'Annulée',
    clientMsg: 'Cette commande a été annulée.',
    color: '#ef4444',
    step: 0,
  },
};

export const ACTIVE_ORDER_STATUSES = new Set([
  'placed',
  'pickup_confirmed',
  'preparing',
  'delivering',
]);

export const CLIENT_TRACK_STEPS = [
  'placed',
  'pickup_confirmed',
  'delivering',
  'delivered',
];

export const ORDER_STATUS_TOASTS: Record<string, { title: string; desc: string }> = {
  placed: {
    title: '✅ Commande confirmée',
    desc: 'Votre commande est bien enregistrée.',
  },
  preparing: {
    title: '👨‍🍳 En préparation',
    desc: 'Le restaurant prépare votre commande.',
  },
  pickup_confirmed: {
    title: '🛵 Livreur en route',
    desc: 'Il se dirige vers le restaurant pour récupérer votre commande.',
  },
  delivering: {
    title: '📦 En route vers vous',
    desc: 'Votre repas est en chemin !',
  },
  delivered: {
    title: '✅ Livré !',
    desc: 'Votre commande est arrivée. Bon appétit !',
  },
  cancelled: {
    title: 'Commande annulée',
    desc: 'Cette commande a été annulée.',
  },
};

export const DELIVERY_FEE_DH = 0;
export const DEFAULT_ETA = '15–20 min';

export const MOCK_COURIER_GAIN_PER_DELIVERY_MAD = 16;
export const SERVICE_FEE_THRESHOLD_MAD = 3000;
export const SERVICE_FEE_LOW_MAD = 12;
export const SERVICE_FEE_HIGH_MAD = 30;

export const CANCEL_PHASES: Record<
  string,
  { label: string; short: string; hint: string }
> = {
  before_pickup: {
    label: 'Annulée avant récupération',
    short: 'Avant récupération',
    hint: "Le livreur n'a pas encore récupéré la commande au restaurant.",
  },
  after_pickup: {
    label: 'Annulée après récupération',
    short: 'Après récupération',
    hint: 'Client injoignable ou refus à la livraison.',
  },
};

export const RESTO_CANCEL_BEFORE = [
  'Rupture de stock',
  'Plat indisponible',
  'Restaurant fermé',
  'Erreur de commande',
];

export function isActiveOrderStatus(status: string) {
  return ACTIVE_ORDER_STATUSES.has(status);
}

/** Commandes visibles dans le dashboard restaurant (livreur confirmé, pas encore récupéré). */
export const RESTAURANT_ACTIVE_STATUSES = new Set(['pickup_confirmed', 'preparing']);

export function isRestaurantActiveOrder(status: string) {
  return RESTAURANT_ACTIVE_STATUSES.has(status);
}

export function isRestaurantCancelledOrder(order: {
  status?: string;
  cancelledPhase?: string;
  courierId?: string | number | null;
}) {
  return (
    order?.status === 'cancelled'
    && order?.cancelledPhase === 'before_pickup'
    && !!order?.courierId
  );
}

/** Agrégats stats : commandes traitées par le resto (hors placed en attente livreur). */
export function isRestaurantStatsOrder(order: {
  status?: string;
  cancelledPhase?: string;
  courierId?: string | number | null;
}) {
  if (!order || order.status === 'placed') return false;
  if (order.status === 'cancelled') return isRestaurantCancelledOrder(order);
  return true;
}

export function getServiceFeeMad(subtotal: number) {
  if (!Number.isFinite(subtotal)) return SERVICE_FEE_LOW_MAD;
  return subtotal > SERVICE_FEE_THRESHOLD_MAD
    ? SERVICE_FEE_HIGH_MAD
    : SERVICE_FEE_LOW_MAD;
}

export function formatMad(value: number | string, decimals = 2) {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return decimals === 0 ? '0 MAD' : '0,00 MAD';
  if (decimals === 0) return `${Math.round(n)} MAD`;
  return `${n.toFixed(decimals).replace('.', ',')} MAD`;
}

/** Comptes gérant — dashboard web uniquement, pas l'app mobile. */
export const ADMIN_MOBILE_BLOCKED_MSG =
  "Le dashboard gérant n'est pas disponible sur l'application mobile. Utilisez le site web YoHa.";

export function isAdminRole(role?: string) {
  return role === 'admin';
}

export const DEMO_ACCOUNTS = [
  { email: 'client@yoha.ma', label: 'Client', role: 'client', password: 'DemoClient2025!' },
  { email: 'livreur@yoha.ma', label: 'Livreur', role: 'courier', password: 'DemoCourier2025!' },
  { email: 'resto@yoha.ma', label: 'Restaurant', role: 'restaurant', password: 'DemoResto2025!' },
];
