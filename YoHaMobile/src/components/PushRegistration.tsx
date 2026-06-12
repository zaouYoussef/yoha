import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { registerGuestOrderPush, registerPushTokenForUser } from '../lib/pushRegistration';

/** Enregistre le token push serveur (client, restaurant, invité). */
export function PushRegistration() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === 'client' || user?.role === 'restaurant') {
      void registerPushTokenForUser();
    } else if (!user) {
      void registerGuestOrderPush();
    }
  }, [user, loading]);

  return null;
}
