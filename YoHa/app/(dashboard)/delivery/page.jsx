'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCart } from '@/contexts/AppContexts.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const DeliveryDashboard = dynamic(
  () => import('@/dashboards/DeliveryPanel.jsx').then((m) => m.DeliveryDashboard),
  { ssr: false, loading: () => <div className="min-h-screen grid place-items-center">Chargement…</div> }
);

export default function DeliveryPage() {
  const { goto } = useYohaNav();
  const { theme } = useCart();
  const { user, booting } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (booting) return;
    if (!user || user.role !== 'courier') {
      router.push('/auth?redirect=delivery');
    }
  }, [user, booting, router]);

  if (booting || !user || user.role !== 'courier') {
    return <div className="min-h-screen grid place-items-center">Chargement…</div>;
  }

  return <DeliveryDashboard goto={goto} dark={theme.dark} setDark={theme.setDark} />;
}
