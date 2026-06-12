import { Order } from './api';
import { CartLine } from '../contexts/CartContext';

export function orderToCartItems(order: Order): Omit<CartLine, 'qty'>[] {
  if (!order?.items?.length) return [];
  return order.items.map((line) => ({
    id: String(line.id),
    name: line.name,
    price: Number(line.price),
    img: line.img,
    restaurantId: String(
      (line as { restaurantId?: string }).restaurantId || order.restaurantId || '',
    ),
    restaurantName: String(
      (line as { restaurantName?: string }).restaurantName || order.restaurantName || '',
    ),
  }));
}
