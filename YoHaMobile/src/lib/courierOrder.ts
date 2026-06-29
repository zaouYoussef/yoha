import { Order } from './api';
import { formatMad } from './constants';

export function parseAmount(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : 0;
}

export function buildOrderCopyText(order: Order): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = items.map((item) => {
    const qty = item.qty || 1;
    const unit = parseAmount(item.price);
    return `• ${qty}× ${item.name} — ${formatMad(unit * qty, 2)}`;
  });

  return [
    `🛵 Commande YoHa #${order.id}`,
    `Restaurant : ${order.restaurantName ?? '—'}`,
    `Client : ${order.customer?.name || '—'}`,
    `Adresse : ${order.customer?.address || '—'}`,
    order.customer?.phone ? `Tél : ${order.customer.phone}` : null,
    order.restaurantNotes?.trim()
      ? `Remarques restaurant : ${order.restaurantNotes.trim()}`
      : null,
    order.cancellationReason?.trim()
      ? `Annulation : ${order.cancellationReason.trim()}`
      : null,
    '',
    'Articles :',
    ...(lines.length ? lines : ['• (détail indisponible)']),
    '',
    `Total : ${formatMad(parseAmount(order.totalDh), 2)}`,
    '',
    '— YoHa Livraison',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export function whatsAppDigits(phone?: string): string {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `212${digits.slice(1)}`;
  else if (!digits.startsWith('212') && digits.length === 9) digits = `212${digits}`;
  return digits;
}

export function whatsAppUrl(phone: string | undefined, text: string): string | null {
  const digits = whatsAppDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function getTodayCourierStats(
  deliveredOrders: Order[],
  gainMad: number,
): { count: number; totalMad: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = deliveredOrders.filter((o) => {
    const raw = o.createdAt;
    if (!raw) return false;
    const d = new Date(raw);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;
  return { count, totalMad: count * gainMad };
}
