import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Restaurant } from '../../lib/api';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export function LandingBento({ restaurants }: { restaurants: Restaurant[] }) {
  const [idx, setIdx] = useState(0);
  const spot = restaurants[idx] ?? restaurants[0];

  return (
    <View style={styles.grid}>
      {spot ? (
        <View style={[styles.spotlight, shadows.glow]}>
          <Image source={{ uri: spot.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
          <LinearGradient colors={['transparent', 'rgba(15,23,42,0.9)']} style={StyleSheet.absoluteFill} />
          <View style={styles.spotBadge}>
            <Text style={styles.spotBadgeText}>🔥 {(spot.tags?.[0] ?? spot.cuisine) || 'Partenaire'}</Text>
          </View>
          <View style={styles.spotFooter}>
            {restaurants.length > 1 ? (
              <View style={styles.dots}>
                {restaurants.slice(0, 5).map((r, i) => (
                  <Pressable key={r.slug} onPress={() => setIdx(i)}>
                    <View style={[styles.dot, i === idx && styles.dotActive]} />
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text style={styles.spotName}>{spot.name}</Text>
          </View>
        </View>
      ) : (
        <LinearGradient colors={[ink[800], ink[900]]} style={[styles.spotlight, shadows.float]}>
          <Text style={styles.spotPlaceholder}>🍽️ Restaurants partenaires</Text>
        </LinearGradient>
      )}

      <View style={styles.row2}>
        <LinearGradient colors={['#0f172a', '#020617']} style={[styles.trackCard, shadows.card]}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>EN DIRECT</Text>
          </View>
          <Text style={styles.trackTitle}>Suivi livraison</Text>
          <View style={styles.trackPath}>
            <Text>📍</Text>
            <View style={styles.trackLine} />
            <Text>🛵</Text>
            <View style={styles.trackLine} />
            <Text>🏠</Text>
          </View>
          <Text style={styles.trackEta}>Yacine · Arrivée dans 4 min</Text>
        </LinearGradient>

        <LinearGradient colors={[...gradients.cta]} style={[styles.statCard, shadows.glowOrange]}>
          <Text style={styles.statLabel}>Livraison moy.</Text>
          <Text style={styles.statValue}>26<Text style={styles.statUnit}>min</Text></Text>
          <Text style={styles.statSub}>⚡ Du clic à la fourchette</Text>
        </LinearGradient>
      </View>

      <View style={styles.row3}>
        <View style={[styles.communityCard, shadows.soft]}>
          <Text style={styles.communityLabel}>COMMUNAUTÉ</Text>
          <Text style={styles.communityValue}>12 000+</Text>
          <Text style={styles.communitySub}>étudiants & soignants</Text>
          <Text style={styles.communityAvatars}>👩‍🎓👨‍⚕️👩‍⚕️🧑‍🎓👨‍🎓</Text>
        </View>
        <View style={[styles.freeCard, shadows.soft]}>
          <Text style={styles.freeEmoji}>🛵</Text>
          <Text style={styles.freeTitle}>Livraison offerte</Text>
          <Text style={styles.freeSub}>Sur tout le campus</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12, marginTop: 24 },
  spotlight: { height: 220, borderRadius: radius.xl + 4, overflow: 'hidden' },
  spotBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  spotBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: ink[900] },
  spotFooter: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 22, backgroundColor: '#fff' },
  spotName: { fontFamily: fonts.display, fontSize: 24, color: '#fff', letterSpacing: -0.5 },
  spotPlaceholder: { color: '#fff', fontFamily: fonts.bold, fontSize: 18, textAlign: 'center', marginTop: 90 },
  row2: { flexDirection: 'row', gap: 12 },
  trackCard: { flex: 1.2, borderRadius: radius.xl, padding: 16, minHeight: 160 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  liveLabel: { fontFamily: fonts.bold, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  trackTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#fff', marginTop: 8 },
  trackPath: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 4 },
  trackLine: { flex: 1, height: 3, backgroundColor: brand[500], borderRadius: 2, opacity: 0.6 },
  trackEta: { marginTop: 12, fontFamily: fonts.semibold, fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  statCard: { flex: 1, borderRadius: radius.xl, padding: 16, justifyContent: 'center' },
  statLabel: { fontFamily: fonts.semibold, fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.8 },
  statValue: { fontFamily: fonts.display, fontSize: 40, color: '#fff', marginTop: 4 },
  statUnit: { fontSize: 20 },
  statSub: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  row3: { flexDirection: 'row', gap: 12 },
  communityCard: {
    flex: 1.3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  communityLabel: { fontFamily: fonts.bold, fontSize: 10, color: ink[400], letterSpacing: 1 },
  communityValue: { fontFamily: fonts.display, fontSize: 32, color: brand[600], marginTop: 4 },
  communitySub: { fontFamily: fonts.medium, fontSize: 12, color: ink[500] },
  communityAvatars: { marginTop: 10, fontSize: 18, letterSpacing: -4 },
  freeCard: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    justifyContent: 'center',
  },
  freeEmoji: { fontSize: 28 },
  freeTitle: { fontFamily: fonts.bold, fontSize: 14, color: ink[900], marginTop: 6 },
  freeSub: { fontFamily: fonts.medium, fontSize: 11, color: ink[500], marginTop: 2 },
});
