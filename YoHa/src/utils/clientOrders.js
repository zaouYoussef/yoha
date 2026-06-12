/** Commandes visibles pour un client connecté (liées au compte). */
export function filterOrdersForClient(orders, user) {
  if (!user || user.role !== 'client' || !Array.isArray(orders)) return [];
  return orders.filter((o) => o.customerUserId === user.id);
}

/** Historique affichable : compte client ou commandes invité sur cet appareil. */
export function getVisibleOrders(orders, user) {
  if (!Array.isArray(orders)) return [];
  if (user?.role === 'client') return filterOrdersForClient(orders, user);
  return orders;
}
