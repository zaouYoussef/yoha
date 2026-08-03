'use client';

import { MyOrdersPage } from '@/views/MyOrdersPage.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useOrders } from '@/contexts/AppContexts.jsx';

export default function OrdersRoutePage() {
  const { goto } = useYohaNav();
  const { reorderFromOrder } = useOrders();

  return (
    <MyOrdersPage
      onBack={() => goto('home', { browseFilter: 'all' })}
      onOpenOrder={(id) => goto('success', { orderId: id })}
      onReorder={(order) => reorderFromOrder(order)}
      onBrowse={() => goto('home', { browseFilter: 'all' })}
      onAfterReorder={() => goto('checkout')}
      onLogin={() => goto('auth', { redirect: 'my-orders' })}
    />
  );
}
