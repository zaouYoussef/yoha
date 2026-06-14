import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimatedSplash } from '../src/components/animations/AnimatedSplash';
import { isAdminRole } from '../src/lib/constants';
import { roleHome, useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const val = await AsyncStorage.getItem('has_seen_onboarding');
        if (val === 'true') {
          setShowOnboarding(false);
        }
      } catch {
        // Fallback
      } finally {
        setOnboardingChecked(true);
      }
    }
    checkOnboarding();
  }, []);

  if (loading || !onboardingChecked) {
    return <AnimatedSplash />;
  }

  if (user) {
    if (!isAdminRole(user.role)) {
      return <Redirect href={roleHome(user.role) as never} />;
    }
    return <Redirect href="/auth/login" />;
  }

  if (showOnboarding) {
    return <Redirect href="/landing" />;
  }

  return <Redirect href="/(client)" />;
}


