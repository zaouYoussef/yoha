import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuItemSkeleton } from '../ui/Skeleton';
export function RestaurantMenuLoading() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={[styles.hero, { paddingTop: insets.top + 60 }]}>
        <View style={styles.shimmerLogo} />
        <View style={styles.shimmerTitle} />
        <View style={styles.shimmerSub} />
      </LinearGradient>
      <View style={styles.body}>
        <MenuItemSkeleton />
        <MenuItemSkeleton />
        <MenuItemSkeleton />
        <MenuItemSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff7ed' },
  hero: { height: 300, paddingHorizontal: 20, justifyContent: 'flex-end', paddingBottom: 28 },
  shimmerLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  shimmerTitle: { width: '70%', height: 28, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 10 },
  shimmerSub: { width: '45%', height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  body: { padding: 20, marginTop: -20, gap: 4 },
});
