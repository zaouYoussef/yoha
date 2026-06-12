import React from 'react';
import { View, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
  variant?: 'up' | 'down' | 'left' | 'right' | 'zoom';
};

/** Pas d'animation — rendu direct pour de meilleures perfs. */
export function FadeInView({ children, style }: Props) {
  return <View style={style}>{children}</View>;
}
