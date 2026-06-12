import React from 'react';
import { ViewStyle } from 'react-native';
import { PremiumBackground } from './PremiumBackground';

export function MeshBackground({
  children,
  style,
  variant = 'default',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'auth' | 'courier';
}) {
  const bg =
    variant === 'courier' ? 'cream' : variant === 'auth' ? 'warm' : 'warm';

  return (
    <PremiumBackground variant={bg} style={style}>
      {children}
    </PremiumBackground>
  );
}
