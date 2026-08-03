'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Home } from '@/views/BrowseViews.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';

function BrowseInner() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const { goto } = useYohaNav();

  return (
    <Home
      key={filter}
      initialFilter={filter}
      onPickRestaurant={(r) => goto('restaurant', { restaurant: r })}
    />
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="page-enter max-w-7xl mx-auto px-4 py-20 text-center text-ink-500">Chargement…</div>}>
      <BrowseInner />
    </Suspense>
  );
}
