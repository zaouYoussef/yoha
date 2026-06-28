import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Restaurant } from '../../lib/api';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';
import { hapticLight } from '../../lib/haptics';

export const PromoRow = React.memo(function PromoRow({ restaurants }: { restaurants: Restaurant[] }) {
  const promoRestos = restaurants.filter((r) => !!r.promo && r.isOpen !== false);
  if (!promoRestos.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>⚡ Offres Flash Tanger</Text>
          <Text style={styles.sub}>Plats offerts & réductions exclusives sur le campus</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {promoRestos.map((r) => (
          <Pressable
            key={r.slug}
            onPress={() => {
              router.push(`/(client)/restaurant/${r.slug}` as never);
              hapticLight();
            }}
            style={({ pressed }) => [styles.card, shadows.float, pressed && { opacity: 0.94 }]}
          >
            {/* Background Cover Image */}
            <Image source={{ uri: r.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />

            {/* Top promo badge */}
            <View style={styles.badgeWrap}>
              <LinearGradient
                colors={['#ef4444', '#f97316']}
                style={styles.badgeGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.badgeText}>🔥 {r.promo}</Text>
              </LinearGradient>
            </View>

            {/* Bottom info */}
            <View style={styles.footer}>
              {r.logo ? <Image source={{ uri: r.logo }} style={styles.logo} contentFit="cover" /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.meta}>★ 4.8 · 🛵 Rapide</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}, (prev, next) => {
  if (prev.restaurants.length !== next.restaurants.length) return false;
  return prev.restaurants.every((r, idx) => r.slug === next.restaurants[idx].slug);
});

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  head: { marginBottom: 14, marginTop: 4 },
  title: { fontFamily: fonts.display, fontSize: 22, color: ink[900], letterSpacing: -0.5 },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: ink[500], marginTop: 4 },
  row: { paddingRight: 20, paddingBottom: 4, gap: 12 },
  card: {
    width: 250,
    height: 136,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badgeWrap: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadows.glowOrange,
  },
  badgeGrad: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontFamily: fonts.extrabold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#ffffff',
  },
  meta: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
