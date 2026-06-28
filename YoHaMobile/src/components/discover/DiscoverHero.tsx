import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LiveOrderChip } from '../LiveOrderChip';
import { PulseBadge } from '../ui/PulseBadge';
import { Order } from '../../lib/api';
import { DEFAULT_ETA } from '../../lib/constants';
import { brand, gradients, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';
import { SearchBarWow } from './SearchBarWow';
import { DiscoverFloatEmojis } from './DiscoverFloatEmojis';
import { hapticLight } from '../../lib/haptics';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

type Props = {
  name: string;
  userInitial?: string;
  isGuest: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  activeOrder: Order | null;
  topInset: number;
  onPromoPress?: () => void;
};

export function DiscoverHero({
  name,
  userInitial,
  isGuest,
  query,
  onQueryChange,
  activeOrder,
  topInset,
  onPromoPress,
}: Props) {
  const hasLive = !!activeOrder;

  return (
    <View style={[styles.hero, { paddingTop: topInset + (hasLive ? 76 : 12) }]}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#312e81']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <DiscoverFloatEmojis />
      {hasLive ? <LiveOrderChip order={activeOrder} /> : null}

      <View style={styles.topRow}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Campus & CHU en direct</Text>
        </View>
        <Pressable onPress={() => router.push(isGuest ? '/landing' : '/(client)/profile' as never)}>
          <LinearGradient
            colors={[...gradients.cta]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{userInitial || 'Y'}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <Text style={styles.greet}>{timeGreeting()} · YouHa Tanger</Text>
      <Text style={styles.title}>
        Salut <Text style={styles.nameGradient}>{name}</Text> 👋
      </Text>
      <Text style={styles.hook}>Une faim de loup ? 🐺 Vos plats préférés livrés chez vous ou au bureau, chaud et croustillant en 20 min chrono !</Text>
      <View style={styles.pills}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>📍 CHU-Tanger</Text>
        </View>
        <PulseBadge label={DEFAULT_ETA} emoji="🛵" />
        <View style={styles.pillBike}>
          <Text style={styles.pillBikeText}>Livraison 100% OFFERTE</Text>
        </View>
        <Pressable
          onPress={() => {
            onPromoPress?.();
            hapticLight();
          }}
          style={({ pressed }) => [
            styles.pillPromo,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={styles.promoDot} />
          <Text style={styles.pillPromoText}>🔥 PROMOS ACTIVES</Text>
        </Pressable>
      </View>

      <SearchBarWow value={query} onChange={onQueryChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    overflow: 'hidden',
    minHeight: 300,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand[400] },
  liveText: { fontFamily: fonts.semibold, fontSize: 11, color: 'rgba(255,255,255,0.88)' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  avatarText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 20 },
  greet: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    zIndex: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: '#fff',
    letterSpacing: -1.2,
    marginTop: 8,
    zIndex: 2,
  },
  nameGradient: { color: '#fb923c' },
  hook: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 8,
    zIndex: 2,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, zIndex: 2 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillText: { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.92)' },
  pillBike: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  pillBikeText: { fontFamily: fonts.bold, fontSize: 11, color: '#fca5a5' },
  pillPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(244,63,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.35)',
  },
  promoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
  },
  pillPromoText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#fda4af',
  },
});
