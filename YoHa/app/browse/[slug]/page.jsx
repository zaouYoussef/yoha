'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { Home } from '@/views/BrowseViews.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { filterFromSlug } from '@/data/browseSlugs.js';

function BrowseSlugInner() {
  const params = useParams();
  const filter = filterFromSlug(params?.slug || '');
  const { goto } = useYohaNav();

  return (
    <Home
      key={filter}
      initialFilter={filter}
      onPickRestaurant={(r) => goto('restaurant', { restaurant: r })}
    />
  );
}

export default function BrowseSlugPage() {
  return (
    <Suspense fallback={<div className="page-enter max-w-7xl mx-auto px-4 py-20 text-center text-ink-500">Chargement…</div>}>
      <BrowseSlugInner />
    </Suspense>
  );
}
