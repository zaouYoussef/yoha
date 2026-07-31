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
    if (line.isCustom || line.restaurantCuisine || item.price === 0) {
      item.isCustom = true;
      item.restaurantCuisine = line.restaurantCuisine;
      item.customDetails = line.customDetails;
    }
    return item;
  });
}
