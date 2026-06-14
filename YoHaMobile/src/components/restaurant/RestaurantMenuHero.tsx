import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Restaurant } from '../../lib/api';
import { DEFAULT_ETA } from '../../lib/constants';
import { restaurantOpenStatus } from '../../lib/openingHours';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

const CUISINE_EMOJI: Record<string, string> = {
  pizza: '🍕', tacos: '🌮', kebab: '🥙', sushi: '🍣', burger: '🍔',
  healthy: '🥗', medical: '🏥', pharmacy: '💊', asian: '🍜', dessert: '🍰', drinks: '🥤',
};

type Props = {
  restaurant: Restaurant;
  scrollY: SharedValue<number>;
  topInset: number;
  onBack: () => void;
};

export function RestaurantMenuHero({ restaurant, scrollY, topInset, onBack }: Props) {
  const emoji = CUISINE_EMOJI[restaurant.cuisine || ''] || '🍽️';
  const openStatus = restaurantOpenStatus(restaurant.openingHours);
  const isOpen = restaurant.isOpen ?? openStatus.isOpen;
  const openLabel = restaurant.openLabel ?? openStatus.openLabel;

  const imageAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 280], [0, 70], Extrapolation.CLAMP) },
    ],
  }));

  const fadeAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 220], [1, 0.75], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.imageWrap, imageAnim]}>
        <Image source={{ uri: restaurant.cover }} style={styles.cover} contentFit="cover" transition={400} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, fadeAnim]}>
        <LinearGradient
          colors={['rgba(2,6,23,0.15)', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Pressable onPress={onBack} style={[styles.backBtn, { top: topInset + 8 }]}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={[styles.heroContent, { paddingTop: topInset + 56 }]}>
        <View style={styles.logoRow}>
          {restaurant.logo ? (
            <Image source={{ uri: restaurant.logo }} style={styles.logo} contentFit="cover" />
          ) : (
            <LinearGradient colors={[...gradients.cta]} style={styles.logoFallback} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.logoEmoji}>{emoji}</Text>
            </LinearGradient>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <View style={styles.metaRow}>
              {restaurant.distance ? <Text style={styles.meta}>📍 {restaurant.distance}</Text> : null}
              <Text style={styles.meta}>🛵 {DEFAULT_ETA}</Text>
              <Text style={[styles.meta, isOpen ? styles.metaOpen : styles.metaClosed]}>
                {isOpen ? '● Ouvert' : `🔒 ${openLabel}`}
              </Text>
            </View>
          </View>
        </View>

        {restaurant.description ? (
          <Text style={styles.desc} numberOfLines={2}>{restaurant.description}</Text>
        ) : null}

        {restaurant.promo ? (
          <View style={styles.badges}>
            <View style={styles.badgePromo}>
              <Text style={styles.badgePromoText}>🔥 {restaurant.promo}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 340, overflow: 'hidden', backgroundColor: ink[900] },
  imageWrap: { ...StyleSheet.absoluteFill },
  cover: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  backText: { fontSize: 20, fontFamily: fonts.bold, color: ink[800], marginLeft: -2 },
  heroContent: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 24, zIndex: 2 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#fff',
    ...shadows.float,
  },
  logoFallback: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  logoEmoji: { fontSize: 32 },
  name: { fontFamily: fonts.display, fontSize: 30, color: '#fff', letterSpacing: -0.9 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  meta: { fontFamily: fonts.semibold, fontSize: 13, color: 'rgba(255,255,255,0.82)' },
  metaOpen: { color: '#86efac' },
  metaClosed: { color: '#fca5a5', flexShrink: 1 },
  desc: { marginTop: 12, fontFamily: fonts.medium, fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 20 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  badgeStar: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(251,191,36,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(253,224,71,0.35)',
  },
  badgeStarText: { fontFamily: fonts.bold, fontSize: 12, color: '#fde68a' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  badgePromo: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(239,68,68,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
  },
  badgePromoText: { fontFamily: fonts.bold, fontSize: 12, color: '#fecaca' },
});
