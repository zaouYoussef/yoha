'use client';

import { usePathname } from 'next/navigation';
import { ShopShell } from '@/components/shell/ShopShell';

const DASH_RE = /^\/(delivery|restaurant-dash|youssef)(\/|$)/;

/** ShopShell sur le parcours client ; laisse les dashboards intacts. */
export function PathAwareShell({ children }) {
  const pathname = usePathname() || '';
  if (DASH_RE.test(pathname)) return children;
  return <ShopShell>{children}</ShopShell>;
}
