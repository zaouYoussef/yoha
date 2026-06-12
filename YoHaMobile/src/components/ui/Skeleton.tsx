import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ink, radius } from '../../theme';

function Shimmer({ style }: { style?: ViewStyle }) {
  return <View style={[styles.shimmer, style]} />;
}

export function RestaurantSkeleton() {
  return (
    <View style={styles.card}>
      <Shimmer style={styles.cover} />
      <View style={styles.body}>
        <Shimmer style={styles.lineLg} />
        <Shimmer style={styles.lineSm} />
        <View style={styles.metaRow}>
          <Shimmer style={styles.chip} />
          <Shimmer style={styles.chip} />
        </View>
      </View>
    </View>
  );
}

export function MenuItemSkeleton() {
  return (
    <View style={styles.menuRow}>
      <Shimmer style={styles.menuImg} />
      <View style={{ flex: 1, gap: 8 }}>
        <Shimmer style={styles.lineLg} />
        <Shimmer style={styles.lineSm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: ink[100],
    borderRadius: radius.md,
    opacity: 0.7,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  cover: { height: 160, borderRadius: 0 },
  body: { padding: 16, gap: 10 },
  lineLg: { height: 18, width: '70%' },
  lineSm: { height: 14, width: '45%' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { height: 24, width: 64, borderRadius: radius.full },
  menuRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  menuImg: { width: 72, height: 72, borderRadius: radius.lg },
});
