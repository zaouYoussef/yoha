const GUEST_ORDER_IDS_KEY = 'yoha-guest-order-ids';
const GUEST_ORDER_EMAIL_KEY = 'yoha-guest-order-email';
const MAX_GUEST_ORDERS = 30;

export function getGuestOrderIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_ORDER_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function getGuestOrderEmail() {
  if (typeof window === 'undefined') return '';
  try {
    return (localStorage.getItem(GUEST_ORDER_EMAIL_KEY) || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

export function addGuestOrderId(publicId, email = '') {
  if (typeof window === 'undefined' || !publicId) return;
  const ids = getGuestOrderIds().filter((id) => id !== publicId);
  localStorage.setItem(GUEST_ORDER_IDS_KEY, JSON.stringify([publicId, ...ids].slice(0, MAX_GUEST_ORDERS)));
  if (email && typeof email === 'string') {
    localStorage.setItem(GUEST_ORDER_EMAIL_KEY, email.trim().toLowerCase());
  }
}

export function hasGuestOrders() {
  return getGuestOrderIds().length > 0;
}

export function clearGuestOrderIds() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_ORDER_IDS_KEY);
  localStorage.removeItem(GUEST_ORDER_EMAIL_KEY);
}
