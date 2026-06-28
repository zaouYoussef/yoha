'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCart } from '@/contexts/AppContexts.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const RestaurantDashboard = dynamic(
  () => import('@/dashboards/RestaurantPanel.jsx').then((m) => m.RestaurantDashboard),
  { ssr: false, loading: () => <div className="min-h-screen grid place-items-center">Chargement…</div> }
);

export default function RestaurantDashPage() {
  const { goto } = useYohaNav();
  const { theme } = useCart();
  const { user, booting } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (booting) return;
    if (!user || user.role !== 'restaurant') {
      router.push('/auth?redirect=restaurant-dash');
    }
  }, [user, booting, router]);

  if (booting || !user || user.role !== 'restaurant') {
    return <div className="min-h-screen grid place-items-center">Chargement…</div>;
  }

  return <RestaurantDashboard goto={goto} dark={theme.dark} setDark={theme.setDark} />;
}
