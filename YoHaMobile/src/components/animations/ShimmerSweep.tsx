import React from 'react';
import { View } from 'react-native';

/** Pas de shimmer — rendu direct. */
export function ShimmerSweep({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={style}>{children}</View>;
}
