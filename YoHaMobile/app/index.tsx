import { Redirect } from 'expo-router';

import React from 'react';

import { AnimatedSplash } from '../src/components/animations/AnimatedSplash';

import { isAdminRole } from '../src/lib/constants';
import { roleHome, useAuth } from '../src/contexts/AuthContext';



export default function Index() {

  const { user, loading } = useAuth();



  if (loading) return <AnimatedSplash />;

  if (user && !isAdminRole(user.role)) {
    return <Redirect href={roleHome(user.role) as never} />;
  }
  if (user && isAdminRole(user.role)) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/landing" />;

}


