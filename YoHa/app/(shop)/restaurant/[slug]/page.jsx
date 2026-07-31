'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RestaurantPage, toDutyPharmacyItem } from '@/views/BrowseViews.jsx';
import { useYohaNav } from '@/contexts/YohaNavContext.jsx';
import { useCart } from '@/contexts/AppContexts.jsx';
import { restaurantsApi, pharmaciesApi } from '@/lib/api';
import { STATIC_STORES } from '@/data/index.js';

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

    // Check if it is a static store
    const decodedSlug = decodeURIComponent(slug || '');
    const staticStore = STATIC_STORES.find(s => s.id === slug || s.id === decodedSlug);
    if (staticStore) {
      setRestaurant(staticStore);
      return;
    }

    // Pharmacy de garde (id = duty-<slug>)
    if (decodedSlug.startsWith('duty-')) {
      const pharmacySlug = decodedSlug.replace(/^duty-/, '');
      pharmaciesApi
        .duty()
        .then((list) => {
          if (cancelled) return;
          const found = (Array.isArray(list) ? list : []).find((p) => String(p.slug) === pharmacySlug);
          if (found) {
            setRestaurant(toDutyPharmacyItem(found));
            return;
          }
          return pharmaciesApi
            .get(pharmacySlug)
            .then((p) => {
              if (!cancelled) setRestaurant(toDutyPharmacyItem(p));
            })
            .catch(() => {
              if (!cancelled) setError('Pharmacie introuvable.');
            });
        })
        .catch(() => {
          if (!cancelled) setError('Pharmacie introuvable.');
        });
      return () => {
        cancelled = true;
      };
    }

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
