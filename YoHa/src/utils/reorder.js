/** Convertit une commande API en lignes de panier. */
export function orderToCartItems(order) {
  if (!order?.items?.length) return [];
  return order.items.map((line) => {
    const item = {
      id: line.id,
      name: line.name,
      price: Number(line.price),
      img: line.img,
      qty: line.qty,
      restaurantId: line.restaurantId || order.restaurantId,
      restaurantName: line.restaurantName || order.restaurantName,
    };
    if (Array.isArray(line.options) && line.options.length > 0) {
      item.options = line.options.map((o) => (typeof o === 'string' ? { name: o, price: 0 } : o));
    }
    if (line.isCustom || line.restaurantCuisine || item.price === 0) {
      item.isCustom = true;
      item.restaurantCuisine = line.restaurantCuisine;
      item.customDetails = line.customDetails;
    }
    return item;
  });
}
