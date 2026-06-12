'use client';

import { Checkout } from '@/views/CheckoutPage.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useCart } from '@/providers/AppProviders.jsx';
import { useOrders } from '@/contexts/AppContexts.jsx';

export default function CheckoutRoutePage() {
  const { goto } = useYohaNav();
  const { cart, cartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();

  return (
    <Checkout
      cart={cart}
      total={cartTotal}
      onBack={() => goto('home', { browseFilter: 'all' })}
      addOrder={addOrder}
      onSuccess={(orderId) => {
        clearCart();
        try {
          sessionStorage.setItem('yoha-track-order', orderId);
        } catch {
          /* ignore */
        }
        goto('success', { orderId });
      }}
      onLogin={() => goto('auth', { redirect: 'checkout' })}
    />
  );
}
