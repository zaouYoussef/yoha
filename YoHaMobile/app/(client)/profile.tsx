import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '../../src/components/animations/FadeInView';
import { PremiumBackground } from '../../src/components/PremiumBackground';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { brand, gradients, ink, radius, shadows } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

const PERKS = [
  { emoji: '🛵', title: 'Livraison offerte', sub: 'Sur tout le campus CHU' },
  { emoji: '↻', title: 'Recommander en 1 tap', sub: 'Historique sauvegardé' },
  { emoji: '⭐', title: 'Offres exclusives', sub: 'Promos réservées aux membres' },
];

export default function ClientProfile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { tabBarHeight } = useLayoutChrome();
  const bottomPad = tabBarHeight + 24;

  const handleLogout = async () => {
    await logout();
    router.replace('/landing' as never);
  };

  if (!user) {
    return (
      <PremiumBackground variant="cream">
        <ScrollView contentContainerStyle={[styles.guestScroll, { paddingTop: insets.top + 48, paddingBottom: bottomPad }]}>
          <FadeInView variant="zoom">
            <LinearGradient colors={[...gradients.cta]} style={[styles.guestAvatar, shadows.glow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.guestEmoji}>👤</Text>
            </LinearGradient>
          </FadeInView>
          <FadeInView delay={120}>
            <Text style={styles.guestTitle}>Rejoins YouHa</Text>
            <Text style={styles.guestSub}>
              Tu commandes déjà en invité — imagine avec un compte : historique, reorder, offres VIP.
            </Text>
          </FadeInView>
          <FadeInView delay={200} style={{ width: '100%', marginTop: 28, gap: 12 }}>
            {PERKS.map((p) => (
              <View key={p.title} style={[styles.perkCard, shadows.soft]}>
                <Text style={styles.perkEmoji}>{p.emoji}</Text>
                <View>
                  <Text style={styles.perkTitle}>{p.title}</Text>
                  <Text style={styles.perkSub}>{p.sub}</Text>
                </View>
              </View>
            ))}
          </FadeInView>
          <FadeInView delay={320} style={{ width: '100%', marginTop: 28 }}>
            <YohaButton title="Créer mon compte →" onPress={() => router.push('/auth/register' as never)} />
            <YohaButton title="Se connecter" variant="ghost" onPress={() => router.push('/auth/login' as never)} style={{ marginTop: 12 }} />
            <YohaButton title="Continuer en invité" variant="ghost" onPress={() => router.replace('/(client)' as never)} style={{ marginTop: 12 }} size="md" />
          </FadeInView>
        </ScrollView>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: bottomPad }]}>
        <LinearGradient colors={[...gradients.aurora]} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <FadeInView variant="zoom">
            <LinearGradient colors={[...gradients.cta]} style={styles.avatarRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.displayName?.[0]?.toUpperCase() || 'Y'}</Text>
              </View>
            </LinearGradient>
          </FadeInView>
          <FadeInView delay={80}>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>✨ Membre YouHa</Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <FadeInView delay={160} style={{ width: '100%', marginTop: 20 }}>
          <Pressable onPress={() => router.push('/(client)/orders' as never)} style={[styles.menuCard, shadows.float]}>
            <Text style={styles.menuEmoji}>📦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Mes commandes</Text>
              <Text style={styles.menuSub}>Suivi & reorder en 1 tap</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </Pressable>
          <View style={[styles.menuCard, shadows.soft, { marginTop: 12 }]}>
            <Text style={styles.menuEmoji}>🛵</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Livraison CHU-Tanger</Text>
              <Text style={styles.menuSub}>Livraison offerte · 15–20 min</Text>
            </View>
          </View>
          <YohaButton title="Se déconnecter" variant="ghost" onPress={handleLogout} style={{ marginTop: 28 }} />
        </FadeInView>
      </ScrollView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  guestScroll: { paddingHorizontal: 24, alignItems: 'center' },
  heroCard: {
    borderRadius: radius.xl + 4,
    padding: 28,
    alignItems: 'center',
    ...shadows.float,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 32,
    ...shadows.glow,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: ink[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 34, fontFamily: fonts.display },
  name: { marginTop: 16, fontSize: 26, fontFamily: fonts.display, color: '#fff', textAlign: 'center' },
  email: { marginTop: 6, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.medium, textAlign: 'center' },
  vipBadge: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(251,146,60,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.4)',
  },
  vipText: { fontFamily: fonts.bold, fontSize: 13, color: '#fdba74' },
  guestAvatar: { width: 100, height: 100, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  guestEmoji: { fontSize: 44 },
  guestTitle: { marginTop: 24, fontSize: 30, fontFamily: fonts.display, color: ink[900], textAlign: 'center' },
  guestSub: { marginTop: 12, fontFamily: fonts.medium, fontSize: 15, color: ink[500], textAlign: 'center', lineHeight: 24 },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  perkEmoji: { fontSize: 28 },
  perkTitle: { fontFamily: fonts.bold, fontSize: 15, color: ink[900] },
  perkSub: { fontFamily: fonts.medium, fontSize: 13, color: ink[500], marginTop: 2 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: ink[100],
  },
  menuEmoji: { fontSize: 28 },
  menuTitle: { fontFamily: fonts.bold, fontSize: 16, color: ink[900] },
  menuSub: { fontFamily: fonts.medium, fontSize: 13, color: ink[500], marginTop: 2 },
  menuArrow: { fontSize: 22, color: brand[500], fontFamily: fonts.bold },
});
