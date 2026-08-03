'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthPage } from '@/views/AuthPage.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';

function AuthInner() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || undefined;
  const { goto } = useYohaNav();

  return (
    <AuthPage
      redirect={redirect}
      goto={goto}
      goHome={() => goto('home', { browseFilter: 'all' })}
    />
  );
}

export default function AuthRoutePage() {
  return (
    <Suspense fallback={<div className="page-enter py-20 text-center">Chargement…</div>}>
      <AuthInner />
    </Suspense>
  );
}
