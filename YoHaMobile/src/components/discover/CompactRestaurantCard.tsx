import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Restaurant } from '../../lib/api';
import { DEFAULT_ETA } from '../../lib/constants';
import { hapticLight } from '../../lib/haptics';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export const CompactRestaurantCard = React.memo(function CompactRestaurantCard({
  restaurant,
  onPress,
  wide = false,
  rank,
}: {
  restaurant: Restaurant;
  onPress: () => void;
  wide?: boolean;
  rank?: number;
}) {
  return (
    <Pressable
      onPress={() => { onPress(); hapticLight(); }}
      style={({ pressed }) => [
        wide ? styles.wide : styles.compact,
        shadows.float,
        pressed && { opacity: 0.94 },
      ]}
    >
      <Image source={{ uri: restaurant.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
      {rank ? (
        <View style={styles.rank}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      ) : null}
      {restaurant.promo ? (
        <View style={styles.promo}>
          <Text style={styles.promoText} numberOfLines={1}>🎁 {restaurant.promo}</Text>
        </View>
      ) : null}
      <View style={styles.footer}>
        <View style={styles.footerTopRow}>
          {restaurant.logo ? (
            <Image source={{ uri: restaurant.logo }} style={styles.logoRow} contentFit="cover" />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>★ 4.8</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>🛵 {DEFAULT_ETA}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cta}>Menu →</Text>
      </View>
    </Pressable>
  );
}, (prev, next) => {
  return prev.restaurant.slug === next.restaurant.slug &&
         prev.restaurant.promo === next.restaurant.promo &&
         prev.wide === next.wide &&
         prev.rank === next.rank;
});

const styles = StyleSheet.create({
  compact: {
    width: 168,
    height: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginRight: 12,
  },
  wide: {
    width: 280,
    height: 200,
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
    marginRight: 14,
  },
  rank: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontFamily: fonts.extrabold, fontSize: 12, color: '#fde68a' },
  promo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: brand[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  promoText: { fontFamily: fonts.bold, fontSize: 9, color: '#fff' },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoRow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  footer: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontFamily: fonts.semibold, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  dot: { color: 'rgba(255,255,255,0.4)' },
  cta: { marginTop: 6, fontFamily: fonts.bold, fontSize: 12, color: '#fdba74' },
});
