'use client';

import dynamic from 'next/dynamic';
import { useCart } from '@/providers/AppProviders.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';

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
  return <AdminDashboard goto={goto} dark={theme.dark} setDark={theme.setDark} />;
}
