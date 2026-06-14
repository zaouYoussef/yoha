'use client';

import dynamic from 'next/dynamic';
import { useCart } from '@/contexts/AppContexts.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';

const DeliveryDashboard = dynamic(
  () => import('@/dashboards/DeliveryPanel.jsx').then((m) => m.DeliveryDashboard),
  { ssr: false, loading: () => <div className="min-h-screen grid place-items-center">Chargement…</div> }
);

export default function DeliveryPage() {
  const { goto } = useYohaNav();
  const { theme } = useCart();
  return <DeliveryDashboard goto={goto} dark={theme.dark} setDark={theme.setDark} />;
}
