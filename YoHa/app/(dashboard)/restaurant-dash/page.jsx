'use client';

import dynamic from 'next/dynamic';
import { useCart } from '@/providers/AppProviders.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';

const RestaurantDashboard = dynamic(
  () => import('@/dashboards/RestaurantPanel.jsx').then((m) => m.RestaurantDashboard),
  { ssr: false, loading: () => <div className="min-h-screen grid place-items-center">Chargement…</div> }
);

export default function RestaurantDashPage() {
  const { goto } = useYohaNav();
  const { theme } = useCart();
  return <RestaurantDashboard goto={goto} dark={theme.dark} setDark={theme.setDark} />;
}
