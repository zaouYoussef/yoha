/** Commandes associées au compte client (id enregistré ou même nom pour les anciennes données). */
export function filterOrdersForClient(orders, user) {
  if (!user || user.role !== 'client' || !Array.isArray(orders)) return [];
  return orders.filter((o) => {
    if (o.customerUserId === user.id) return true;
    if (
      !o.customerUserId &&
      o.customer?.name &&
      user.displayName &&
      o.customer.name.trim() === user.displayName.trim()
    ) {
      return true;
    }
    return false;
  });
}
