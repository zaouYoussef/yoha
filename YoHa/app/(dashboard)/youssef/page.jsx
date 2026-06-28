'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCart } from '@/contexts/AppContexts.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const AdminDashboard = dynamic(
  () => import('@/dashboards/AdminPanel.jsx').then((m) => m.AdminDashboard),
  { ssr: false, loading: () => <DashboardLoader label="Admin" /> }
);

function DashboardLoader({ label }) {
  return (
    <div className="min-h-screen grid place-items-center text-ink-500">
      Chargement {label}…
    </div>
  );
}

export default function AdminPage() {
  const { goto } = useYohaNav();
  const { theme } = useCart();
  const { user, booting } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (booting) return;
    if (!user || user.role !== 'admin') {
      router.push('/auth?redirect=youssef');
    }
  }, [user, booting, router]);

  if (booting || !user || user.role !== 'admin') {
    return <DashboardLoader label="Admin" />;
  }

  return <AdminDashboard goto={goto} dark={theme.dark} setDark={theme.setDark} />;
}
