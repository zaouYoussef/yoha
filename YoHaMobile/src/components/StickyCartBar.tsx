import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCart } from '../contexts/CartContext';
import { formatMad, getServiceFeeMad } from '../lib/constants';
import { hapticLight } from '../lib/haptics';
import { useLayoutChrome } from '../lib/layoutChrome';
import { gradients, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

type Props = {
  extraBottom?: number;
  restaurantName?: string;
};

export function StickyCartBar({ extraBottom = 0, restaurantName }: Props) {
  const { cartBarBottom } = useLayoutChrome();
  const { count, subtotal, items } = useCart();

  if (count === 0) return null;

  const total = subtotal + getServiceFeeMad(subtotal);
  const label = restaurantName || items[0]?.restaurantName || 'Votre panier';

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        router.push('/(client)/cart' as never);
      }}
      style={[styles.wrap, { bottom: cartBarBottom + extraBottom }]}
    >
      <LinearGradient
        colors={[...gradients.cta]}
        style={[styles.bar, shadows.glow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.left}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resto} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.sub}>Appuyez pour commander</Text>
          </View>
        </View>
        <View style={styles.ctaPill}>
          <Text style={styles.total}>{formatMad(total)}</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, zIndex: 60 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badgeText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 15 },
  resto: { color: '#fff', fontFamily: fonts.bold, fontSize: 16 },
  sub: { color: 'rgba(255,255,255,0.82)', fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  total: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 17 },
  arrow: { color: '#fff', fontSize: 20, fontFamily: fonts.bold },
});
