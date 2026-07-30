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
  openCount = 12,
}: Props & { openCount?: number }) {
  const hasLive = !!activeOrder;

  return (
    <View style={[styles.hero, { paddingTop: topInset + (hasLive ? 76 : 14) }]}>
      <LinearGradient
        colors={['#fff7ed', '#ffedd5', '#fff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {hasLive ? <LiveOrderChip order={activeOrder} /> : null}

      <View style={styles.topRow}>
        <View style={styles.locationPill}>
          <Text style={styles.locationText}>📍 CHU-Tanger</Text>
        </View>
        <View style={styles.openPill}>
          <View style={styles.openDot} />
          <Text style={styles.openText}>{openCount} ouverts</Text>
        </View>
        <Pressable onPress={() => router.push(isGuest ? '/landing' : '/(client)/profile' as never)}>
          <LinearGradient
            colors={['#f97316', '#ec4899']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{userInitial || 'Y'}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.greetBox}>
        <Text style={styles.title}>
          {timeGreeting()},{' '}
          <Text style={styles.nameGradient}>{name}</Text> 👋
        </Text>
        <Text style={styles.hook}>Livraison · Maintenant · 🏍️ Frais offerts</Text>
      </View>

      <SearchBarWow value={query} onChange={onQueryChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fed7aa',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  locationText: { fontFamily: fonts.bold, fontSize: 13, color: '#0f172a' },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  openDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10b981' },
  openText: { fontFamily: fonts.bold, fontSize: 12, color: '#047857' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  avatarText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 18 },
  greetBox: {
    marginBottom: 18,
    zIndex: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: '#0f172a',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  nameGradient: { color: '#ea580c', fontFamily: fonts.extrabold },
  hook: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
});
