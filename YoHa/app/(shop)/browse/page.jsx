'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Home } from '@/views/BrowseViews.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { CampusHospitalsSection } from '@/views/landing/LandingViews.jsx';

function BrowseInner() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const { goto } = useYohaNav();

  return (
    <>
      <Home
        key={filter}
        initialFilter={filter}
        onPickRestaurant={(r) => goto('restaurant', { restaurant: r })}
      />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-14">
        <CampusHospitalsSection />
      </div>
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="page-enter max-w-7xl mx-auto px-4 py-20 text-center text-ink-500">Chargement…</div>}>
      <BrowseInner />
    </Suspense>
  );
}
