'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SuccessPage } from '@/views/SuccessPage.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';

function SuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const { goto } = useYohaNav();

  return (
    <SuccessPage
      orderId={orderId}
      onHome={() => goto('home', { browseFilter: 'all' })}
      onMyOrders={() => goto('my-orders')}
    />
  );
}

export default function SuccessRoutePage() {
  return (
    <Suspense fallback={<div className="page-enter py-20 text-center">Chargement…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
