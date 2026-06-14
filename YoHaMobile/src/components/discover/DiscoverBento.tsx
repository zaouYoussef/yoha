import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Order, Restaurant } from '../../lib/api';
import { CLIENT_TRACK_STEPS, DEFAULT_ETA, ORDER_STATES } from '../../lib/constants';
import { hapticLight } from '../../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export const DiscoverBento = React.memo(function DiscoverBento({
  restaurants,
  activeOrder,
}: {
  restaurants: Restaurant[];
  activeOrder: Order | null;
}) {
  const [idx, setIdx] = useState(0);
  const spot = restaurants[idx] || restaurants[0];
  const trackStep = activeOrder
    ? CLIENT_TRACK_STEPS.indexOf(activeOrder.status)
    : -1;

  const openSpot = () => {
    if (!spot) return;
    hapticLight();
    router.push(`/(client)/restaurant/${spot.slug}` as never);
  };

  return (
    <View style={styles.grid}>
      {spot ? (
        <Pressable onPress={openSpot}>
          <View style={[styles.spotlight, shadows.glow]}>
            <Image source={{ uri: spot.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
            <LinearGradient colors={['transparent', 'rgba(2,6,23,0.35)', 'rgba(2,6,23,0.92)']} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={[...gradients.cta]} style={styles.spotRibbon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.spotRibbonText}>⭐ Coup de cœur du moment</Text>
            </LinearGradient>
            {spot.promo ? (
              <View style={styles.promoPill}>
                <Text style={styles.promoText} numberOfLines={1}>🔥 {spot.promo}</Text>
              </View>
            ) : null}
            <View style={styles.spotFooter}>
              {restaurants.length > 1 ? (
                <View style={styles.dots}>
                  {restaurants.slice(0, 5).map((r, i) => (
                    <Pressable key={r.slug} onPress={() => { hapticLight(); setIdx(i); }} hitSlop={6}>
                      <View style={[styles.dot, i === idx && styles.dotActive]} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Text style={styles.spotName}>{spot.name}</Text>
              <Text style={styles.spotCta}>Découvrir la carte →</Text>
            </View>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.row2}>
        <Pressable
          onPress={() => activeOrder && router.push(`/(client)/order/${activeOrder.id}` as never)}
          style={{ flex: 1.25 }}
        >
          <LinearGradient colors={['#0f172a', '#020617']} style={[styles.trackCard, shadows.card]}>
            <View style={styles.liveRow}>
              <View style={[styles.liveDot, activeOrder && styles.liveDotOn]} />
              <Text style={styles.liveLabel}>{activeOrder ? 'EN DIRECT' : 'SUIVI LIVE'}</Text>
            </View>
            <Text style={styles.trackTitle}>
              {activeOrder ? ORDER_STATES[activeOrder.status]?.label ?? 'Commande en cours' : 'Suivi livraison'}
            </Text>
            <View style={styles.trackPath}>
              {['📍', '🛵', '🏠'].map((icon, i) => (
                <React.Fragment key={icon}>
                  <Text style={[styles.trackIcon, trackStep >= i && styles.trackIconOn]}>{icon}</Text>
                  {i < 2 ? <View style={[styles.trackLine, trackStep > i && styles.trackLineOn]} /> : null}
                </React.Fragment>
              ))}
            </View>
            <Text style={styles.trackEta}>
              {activeOrder
                ? ORDER_STATES[activeOrder.status]?.clientMsg ?? 'Suivez votre commande en temps réel'
                : 'Commande → suivi en direct sur la carte'}
            </Text>
          </LinearGradient>
        </Pressable>

        <LinearGradient colors={[...gradients.cta]} style={[styles.statCard, shadows.glowOrange]}>
          <Text style={styles.statLabel}>LIVRAISON ÉCLAIR ⚡</Text>
          <Text style={styles.statValue}>
            26<Text style={styles.statUnit}>min</Text>
          </Text>
          <Text style={styles.statSub}>🛵 Moyenne sur le campus</Text>
        </LinearGradient>
      </View>

      <View style={styles.row3}>
        <View style={[styles.communityCard, shadows.soft]}>
          <Text style={styles.communityLabel}>REJOIGNEZ LA TRIBU</Text>
          <Text style={styles.communityValue}>12 000+</Text>
          <Text style={styles.communitySub}>étudiants & soignants régalés</Text>
          <Text style={styles.communityAvatars}>👩‍🎓👨‍⚕️👩‍⚕️🧑‍🎓</Text>
        </View>
        <LinearGradient colors={['rgba(255,247,237,0.95)', 'rgba(255,237,213,0.85)']} style={[styles.freeCard, shadows.soft]}>
          <Text style={styles.freeEmoji}>🚀</Text>
          <Text style={styles.freeTitle}>Livraison 0 DH</Text>
          <Text style={styles.freeSub}>Zéro frais caché sur le campus</Text>
        </LinearGradient>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  grid: { gap: 12, marginBottom: 22 },
  spotlight: {
    height: 240,
    borderRadius: radius.xl + 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  spotRibbon: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  spotRibbonText: { fontFamily: fonts.extrabold, fontSize: 10, color: '#fff' },
  promoPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(220,38,38,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    maxWidth: 140,
  },
  promoText: { fontFamily: fonts.bold, fontSize: 10, color: '#fff' },
  spotFooter: { position: 'absolute', bottom: 18, left: 18, right: 18 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 22, backgroundColor: '#fff' },
  spotName: { fontFamily: fonts.display, fontSize: 28, color: '#fff', letterSpacing: -0.8 },
  spotCta: { marginTop: 6, fontFamily: fonts.bold, fontSize: 13, color: '#fdba74' },
  row2: { flexDirection: 'row', gap: 12 },
  trackCard: {
    borderRadius: radius.xl + 2,
    padding: 16,
    minHeight: 168,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  liveDotOn: { backgroundColor: '#4ade80' },
  liveLabel: { fontFamily: fonts.bold, fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 1 },
  trackTitle: { fontFamily: fonts.bold, fontSize: 15, color: '#fff', marginTop: 8 },
  trackPath: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 4 },
  trackIcon: { fontSize: 16, opacity: 0.35 },
  trackIconOn: { opacity: 1 },
  trackLine: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2 },
  trackLineOn: { backgroundColor: brand[500], opacity: 0.85 },
  trackEta: { marginTop: 12, fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 15 },
  statCard: { flex: 1, borderRadius: radius.xl + 2, padding: 16, justifyContent: 'center' },
  statLabel: { fontFamily: fonts.semibold, fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.8 },
  statValue: { fontFamily: fonts.display, fontSize: 40, color: '#fff', marginTop: 4 },
  statUnit: { fontSize: 18 },
  statSub: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  row3: { flexDirection: 'row', gap: 12 },
  communityCard: {
    flex: 1.2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.xl + 2,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  communityLabel: { fontFamily: fonts.bold, fontSize: 9, color: ink[400], letterSpacing: 1 },
  communityValue: { fontFamily: fonts.display, fontSize: 28, color: ink[900], marginTop: 4 },
  communitySub: { fontFamily: fonts.medium, fontSize: 11, color: ink[500] },
  communityAvatars: { fontSize: 16, marginTop: 8 },
  freeCard: {
    flex: 1,
    borderRadius: radius.xl + 2,
    padding: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.3)',
  },
  freeEmoji: { fontSize: 28 },
  freeTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: brand[800], marginTop: 6 },
  freeSub: { fontFamily: fonts.medium, fontSize: 11, color: brand[600], marginTop: 2 },
});
