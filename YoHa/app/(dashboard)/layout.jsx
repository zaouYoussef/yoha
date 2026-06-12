'use client';

import { ToastViewport } from '@/components/ui/ToastViewport.jsx';
import { useToast } from '@/contexts/AppContexts.jsx';

export default function DashboardLayout({ children }) {
  const { toasts } = useToast();
  return (
    <div className="min-h-screen overflow-x-hidden">
      {children}
      <ToastViewport toasts={toasts} />
    </div>
  );
}
