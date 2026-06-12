import { useCallback, useEffect, useState } from 'react';
import { Restaurant, restaurantsApi } from '../lib/api';

export function useRestaurantMe() {
  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const r = await restaurantsApi.me();
      setRestaurant(r);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 404) {
        setRestaurant(null);
      } else {
        setRestaurant(null);
        setError(err.message || 'Impossible de charger le restaurant.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { restaurant, loading, error, refresh, restoId: restaurant?.id || restaurant?.slug };
}
