'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RestaurantPage } from '@/views/BrowseViews.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useCart } from '@/providers/AppProviders.jsx';
import { restaurantsApi } from '@/lib/api';

export default function RestaurantRoutePage() {
  const { slug } = useParams();
  const { goto } = useYohaNav();
  const { addToCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setRestaurant(null);
    setError('');
    restaurantsApi
      .get(slug)
      .then((data) => {
        if (!cancelled) setRestaurant(data);
      })
      .catch(() => {
        if (!cancelled) setError('Restaurant introuvable.');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="page-enter max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl">{error}</h2>
        <button
          onClick={() => goto('home', { browseFilter: 'all' })}
          className="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!restaurant) {
    return <div className="page-enter max-w-7xl mx-auto px-4 py-20 text-center text-ink-500">Chargement…</div>;
  }

  return (
    <RestaurantPage
      restaurant={restaurant}
      onBack={() => goto('home', { browseFilter: 'all' })}
      onAdd={addToCart}
    />
  );
}
