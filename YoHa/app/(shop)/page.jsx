'use client';

import { Landing, CampusHospitalsSection } from '@/views/landing/LandingViews.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';

export default function LandingPage() {
  const { goto } = useYohaNav();
  return (
    <>
      <Landing onStart={() => goto('home', { browseFilter: 'all' })} />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-14 -mt-4">
        <CampusHospitalsSection />
      </div>
    </>
  );
}
