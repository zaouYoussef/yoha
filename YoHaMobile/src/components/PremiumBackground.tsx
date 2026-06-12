import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ink } from '../theme';

export function PremiumBackground({
  children,
  style,
  variant = 'warm',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'warm' | 'dark' | 'cream';
  showOrbs?: boolean;
}) {
  const base =
    variant === 'dark'
      ? (['#020617', '#0f172a', '#1e293b'] as const)
      : variant === 'cream'
        ? (['#fffbeb', '#fff7ed', '#ffffff', '#f8fafc'] as const)
        : (['#fff7ed', '#ffffff', '#fdf4ff', '#f8fafc'] as const);

  return (
    <View style={[styles.root, style]}>
      <LinearGradient colors={[...base]} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ink[50] },
  content: { flex: 1 },
});
