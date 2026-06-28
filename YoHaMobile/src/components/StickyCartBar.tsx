import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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

  const scale = useSharedValue(count > 0 ? 1 : 0);
  const bump = useSharedValue(1);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > 0) {
      if (prevCount.current === 0) {
        scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      } else if (count !== prevCount.current) {
        bump.value = withSequence(
          withTiming(1.12, { duration: 100 }),
          withSpring(1, { damping: 10, stiffness: 150 })
        );
      }
    } else {
      scale.value = withSpring(0, { damping: 14, stiffness: 180 });
    }
    prevCount.current = count;
  }, [count, scale, bump]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * bump.value }],
    opacity: scale.value,
  }));

  if (count === 0) return null;

  const total = subtotal + getServiceFeeMad(subtotal);
  const label = restaurantName || items[0]?.restaurantName || 'Votre panier';

  return (
    <Animated.View style={[styles.wrap, { bottom: cartBarBottom + extraBottom }, animStyle]}>
      <Pressable
        onPress={() => {
          router.push('/(client)/cart' as never);
          hapticLight();
        }}
        style={{ width: '100%' }}
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
    </Animated.View>
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
