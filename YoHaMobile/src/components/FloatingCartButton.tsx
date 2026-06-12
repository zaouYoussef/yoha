import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCart } from '../contexts/CartContext';
import { useLayoutChrome } from '../lib/layoutChrome';
import { gradients, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingCartButton() {
  const { count } = useCart();
  const { cartBarBottom } = useLayoutChrome();
  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(count > 0 ? 1 : 0, { damping: 14, stiffness: 160 });
    if (count > 0) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1,
        true,
      );
    }
  }, [count, pulse, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
    opacity: scale.value,
  }));

  if (count === 0) return null;

  return (
    <AnimatedPressable
      onPress={() => router.push('/(client)/cart' as never)}
      style={[styles.wrap, { bottom: cartBarBottom }, animStyle]}
    >
      <LinearGradient colors={[...gradients.primary]} style={[styles.btn, shadows.glow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.emoji}>🛒</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 20, zIndex: 50 },
  btn: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 12, fontFamily: fonts.extrabold, color: '#ec4899' },
});
