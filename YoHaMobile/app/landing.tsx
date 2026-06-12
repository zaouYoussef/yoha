import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '../src/components/animations/FadeInView';
import { LandingBento } from '../src/components/landing/LandingBento';
import {
  CampusZonesBlock,
  FeaturesBlock,
  FinalCTABlock,
  HowItWorksBlock,
  PartnerCategoriesBlock,
  PhoneShowcase,
  RestaurantCarousel,
  TestimonialsBlock,
} from '../src/components/landing/LandingSections';
import { PartnersMarquee } from '../src/components/landing/PartnersMarquee';
import { StickyLandingCTA } from '../src/components/landing/StickyLandingCTA';
import { TypewriterHeadline } from '../src/components/landing/TypewriterHeadline';
import { Restaurant, restaurantsApi } from '../src/lib/api';
import { brand, gradients, radius, shadows } from '../src/theme';
import { fonts } from '../src/theme/fonts';

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await restaurantsApi.list({});
      setRestaurants(data);
    } catch {
      setRestaurants([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goShop = () => router.replace('/(client)' as never);
  const goLogin = () => router.push('/auth/login' as never);

  const bentoRestos = restaurants.slice(0, 5);
  const carouselRestos = restaurants.slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff7ed' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* === HERO (comme le site web) === */}
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#4c1d95']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.heroInner}>
            <FadeInView delay={0}>
              <View style={styles.topRow}>
                <LinearGradient colors={[...gradients.cta]} style={[styles.logo, shadows.glow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.logoText}>Y</Text>
                </LinearGradient>
                <Pressable onPress={goLogin} style={styles.loginGlass}>
                  <Text style={styles.loginText}>Connexion</Text>
                </Pressable>
              </View>
            </FadeInView>

            <FadeInView delay={80}>
              <View style={styles.liveBadge}>
                <View style={styles.livePing} />
                <Text style={styles.liveText}>En direct sur les campus & hôpitaux</Text>
              </View>
            </FadeInView>

            <FadeInView delay={140}>
              <TypewriterHeadline />
            </FadeInView>

            <FadeInView delay={220}>
              <Text style={styles.heroDesc}>
                Commandez auprès de vos cuisines préférées et faites-vous livrer à votre chambre ou à l'aile hospitalière — en moins de 30 minutes.
              </Text>
            </FadeInView>

            <FadeInView delay={300}>
              <View style={styles.socialProof}>
                <Text style={styles.avatars}>👩‍⚕️👨‍🎓👩‍🎓🧑‍⚕️</Text>
                <View>
                  <Text style={styles.stars}>★★★★★ <Text style={styles.rating}>4,9</Text></Text>
                  <Text style={styles.socialSub}>Adoré par 12 000+ étudiants & soignants</Text>
                </View>
              </View>
            </FadeInView>

            <FadeInView delay={380}>
              <LandingBento restaurants={bentoRestos} />
            </FadeInView>

            <FadeInView delay={460}>
              <Text style={styles.scrollCue}>↓ Défiler</Text>
            </FadeInView>
          </View>
        </View>

        <PartnersMarquee />

        <View style={styles.body}>
          <PartnerCategoriesBlock />
          <HowItWorksBlock />
          <FeaturesBlock />
          <RestaurantCarousel restaurants={carouselRestos} />
          <CampusZonesBlock />
          <PhoneShowcase />
          <TestimonialsBlock />
          <FinalCTABlock onStart={goShop} />
        </View>
      </ScrollView>

      <StickyLandingCTA onStart={goShop} onLogin={goLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    ...shadows.float,
  },
  heroInner: { paddingHorizontal: 20, zIndex: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 28, fontFamily: fonts.display },
  loginGlass: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  loginText: { fontFamily: fonts.bold, color: '#fff', fontSize: 14 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 20,
  },
  livePing: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand[400] || '#fb923c' },
  liveText: { fontFamily: fonts.semibold, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },
  heroDesc: {
    marginTop: 18,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 24,
    maxWidth: 340,
  },
  socialProof: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22 },
  avatars: { fontSize: 22, letterSpacing: -6 },
  stars: { color: '#fbbf24', fontSize: 14, letterSpacing: 1 },
  rating: { color: '#fff', fontFamily: fonts.bold },
  socialSub: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scrollCue: {
    textAlign: 'center',
    marginTop: 20,
    fontFamily: fonts.bold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  body: { paddingHorizontal: 20, paddingTop: 32 },
});
