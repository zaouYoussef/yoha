import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { brand, ink, radius, shadows } from '../theme';
import { hapticSuccess } from '../lib/haptics';

interface ReorderBannerProps {
  lastOrderName?: string;
  lastOrderPrice?: string;
  onReorder: () => void;
}

export function ReorderBanner({ lastOrderName = 'Tacos Double & Frites', lastOrderPrice = '45 DH', onReorder }: ReorderBannerProps) {
  return (
    <View style={styles.bannerContainer}>
      <View style={styles.contentWrap}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeIcon}>🔄</Text>
          <Text style={styles.badgeText}>Recommander en 1-Tap</Text>
        </View>
        <Text style={styles.titleText}>{lastOrderName}</Text>
        <Text style={styles.priceText}>{lastOrderPrice} · Frais offerts CHU</Text>
      </View>
      <Pressable
        onPress={() => {
          hapticSuccess();
          onReorder();
        }}
        style={styles.reorderBtn}
      >
        <Text style={styles.btnText}>Commander ➔</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: radius.xl,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  contentWrap: { flex: 1, marginRight: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  badgeIcon: { fontSize: 14 },
  badgeText: { color: brand[400], fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  titleText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  priceText: { color: '#a1a1aa', fontSize: 12, marginTop: 2 },
  reorderBtn: {
    backgroundColor: brand[500],
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
});
