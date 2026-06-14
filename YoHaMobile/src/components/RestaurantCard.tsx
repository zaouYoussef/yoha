import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Restaurant } from '../lib/api';
import { DEFAULT_ETA } from '../lib/constants';
import { restaurantOpenStatus } from '../lib/openingHours';
import { isFavorite, toggleFavorite } from '../lib/favorites';
import { hapticLight, hapticSuccess } from '../lib/haptics';
import { ShimmerSweep } from './animations/ShimmerSweep';
import { brand, gradients, ink, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

const cuisineEmoji: Record<string, string> = {
  pizza: '🍕', tacos: '🌮', kebab: '🥙', sushi: '🍣', burger: '🍔',
  healthy: '🥗', medical: '🏥', pharmacy: '💊', asian: '🍜', dessert: '🍰', drinks: '🥤',
};

export const RestaurantCard = React.memo(function RestaurantCard({
  restaurant,
  onPress,
  showFavorite = true,
  featured = false,
}: {
  restaurant: Restaurant;
  onPress: () => void;
  showFavorite?: boolean;
  featured?: boolean;
}) {
  const emoji = cuisineEmoji[restaurant.cuisine || ''] || '🍽️';
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (showFavorite) isFavorite(restaurant.slug).then(setFav);
  }, [restaurant.slug, showFavorite]);

  const handleFav = async () => {
    hapticSuccess();
    setFav(await toggleFavorite(restaurant.slug));
  };

  const fee = restaurant.fee || 'Livraison offerte';
  const promo = restaurant.promo || '';
  const openStatus = restaurantOpenStatus(restaurant.openingHours);
  const isOpen = restaurant.isOpen ?? openStatus.isOpen;
  const openLabel = restaurant.openLabel ?? openStatus.openLabel;

  const card = (
    <Pressable
      onPress={() => { hapticLight(); onPress(); }}
      style={({ pressed }) => [
        featured ? shadows.glow : (promo ? styles.promoGlow : shadows.float),
        styles.outer,
        pressed && { opacity: 0.94 },
      ]}
    >
      <View style={[styles.card, promo ? styles.promoBorder : null]}>
        <View style={[styles.imageWrap, featured && styles.imageFeatured]}>
          <Image
            source={{ uri: restaurant.cover || undefined }}
            style={styles.cover}
            contentFit="cover"
            transition={0}
          />
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.15)', 'rgba(15,23,42,0.88)']}
            style={StyleSheet.absoluteFill}
          />
          {featured ? (
            <LinearGradient colors={[...gradients.cta]} style={styles.featuredRibbon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.featuredText}>⭐ Coup de cœur</Text>
            </LinearGradient>
          ) : null}
          <View style={[styles.feeBadge, featured && { top: 48 }]}>
            <Text style={styles.feeText}>✨ {fee}</Text>
          </View>
          {promo ? (
            <View style={styles.promoBadge}>
              <Text style={styles.promoText} numberOfLines={1}>🔥 {promo}</Text>
            </View>
          ) : null}
          {!isOpen ? (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>🔒 Fermé</Text>
            </View>
          ) : null}
          {showFavorite ? (
            <Pressable onPress={handleFav} style={styles.favBtn} hitSlop={10}>
              <LinearGradient
                colors={fav ? ['#fb7185', '#ec4899'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                style={styles.favGrad}
              >
                <Text style={styles.favIcon}>{fav ? '❤️' : '🤍'}</Text>
              </LinearGradient>
            </Pressable>
          ) : null}
          <View style={styles.emojiBadge}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
          <View style={styles.overlayInfo}>
            <Text style={styles.overlayName} numberOfLines={1}>{restaurant.name}</Text>
            <View style={styles.overlayMeta}>
              <Text style={styles.overlayRating}>★ 4.8</Text>
              <Text style={styles.overlayDot}>·</Text>
              <Text style={styles.overlayEta}>🛵 {DEFAULT_ETA}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={styles.cuisine}>{restaurant.cuisine || 'Restaurant'}</Text>
            {restaurant.distance ? (
              <Text style={styles.distance}>📍 {restaurant.distance}</Text>
            ) : null}
          </View>
          {!isOpen ? (
            <Text style={styles.closedHint} numberOfLines={1}>{openLabel}</Text>
          ) : null}
          {(restaurant.tags || []).length > 0 ? (
            <View style={styles.tags}>
              {(restaurant.tags || []).slice(0, 3).map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <LinearGradient colors={[...gradients.hero]} style={[styles.cta, !isOpen && styles.ctaDisabled]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.ctaText}>{isOpen ? 'Commander maintenant →' : 'Consulter le menu'}</Text>
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  );

  return featured ? <ShimmerSweep style={{ borderRadius: radius.xl + 4 }}>{card}</ShimmerSweep> : card;
}, (prev, next) => {
  return prev.restaurant.slug === next.restaurant.slug &&
         prev.restaurant.isOpen === next.restaurant.isOpen &&
         prev.restaurant.promo === next.restaurant.promo &&
         prev.restaurant.fee === next.restaurant.fee &&
         prev.featured === next.featured &&
         prev.showFavorite === next.showFavorite;
});

const styles = StyleSheet.create({
  outer: { marginBottom: 22, borderRadius: radius.xl + 4 },
  promoGlow: {
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  promoBorder: {
    borderColor: 'rgba(244, 63, 94, 0.45)',
    borderWidth: 1.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  imageWrap: { height: 190, position: 'relative' },
  imageFeatured: { height: 210 },
  cover: { width: '100%', height: '100%', backgroundColor: ink[200] },
  featuredRibbon: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  featuredText: { fontFamily: fonts.extrabold, fontSize: 11, color: '#fff' },
  feeBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  feeText: { fontSize: 11, fontFamily: fonts.extrabold, color: brand[700] },
  promoBadge: {
    position: 'absolute',
    top: 14,
    right: 56,
    backgroundColor: 'rgba(220,38,38,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    maxWidth: 130,
  },
  promoText: { fontSize: 10, fontFamily: fonts.bold, color: '#fff' },
  closedBadge: {
    position: 'absolute',
    top: 14,
    right: 56,
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  closedText: { fontSize: 10, fontFamily: fonts.bold, color: '#fff' },
  closedHint: { fontFamily: fonts.semibold, fontSize: 12, color: '#dc2626' },
  favBtn: { position: 'absolute', top: 12, right: 12 },
  favGrad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  favIcon: { fontSize: 18 },
  emojiBadge: {
    position: 'absolute',
    bottom: 52,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  emoji: { fontSize: 24 },
  overlayInfo: {
    position: 'absolute',
    left: 16,
    right: 70,
    bottom: 14,
  },
  overlayName: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: '#fff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  overlayMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  overlayRating: { fontFamily: fonts.bold, fontSize: 13, color: '#fde68a' },
  overlayDot: { color: 'rgba(255,255,255,0.5)' },
  overlayEta: { fontFamily: fonts.semibold, fontSize: 12, color: '#86efac' },
  body: { padding: 16, paddingTop: 14, gap: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cuisine: { fontFamily: fonts.semibold, fontSize: 14, color: ink[600], textTransform: 'capitalize' },
  distance: { fontFamily: fonts.medium, fontSize: 12, color: ink[400] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: brand[50],
    borderWidth: 1,
    borderColor: brand[100],
  },
  tagText: { fontSize: 11, fontFamily: fonts.semibold, color: brand[700] },
  cta: {
    paddingVertical: 13,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: 2,
  },
  ctaDisabled: { opacity: 0.75 },
  ctaText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 14, letterSpacing: 0.2 },
});
