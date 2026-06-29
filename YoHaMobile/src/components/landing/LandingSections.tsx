import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../animations/FadeInView';
import {
  CAMPUS_ZONES,
  HOW_STEPS,
  LANDING_FEATURES,
  LANDING_TESTIMONIALS,
  PARTNER_CATEGORIES,
} from '../../data/landing';
import { Restaurant } from '../../lib/api';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

const { width } = Dimensions.get('window');

export function PartnerCategoriesBlock() {
  return (
    <FadeInView delay={80}>
      <View style={[styles.panel, shadows.float]}>
        <Text style={styles.panelTitle}>
          On livre aussi les <Text style={styles.accent}>pâtisseries</Text> et les <Text style={styles.accent}>pharmacies</Text>
        </Text>
        <Text style={styles.panelSub}>
          Restaurants, douceurs et parapharmacie — tout au même endroit sur le campus.
        </Text>
        {PARTNER_CATEGORIES.map((r, i) => (
          <View key={r.title} style={[styles.catRow, i > 0 && styles.catBorder]}>
            <Text style={styles.catEmoji}>{r.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.catTitle}>{r.title}</Text>
              <Text style={styles.catLine}>{r.line}</Text>
            </View>
          </View>
        ))}
      </View>
    </FadeInView>
  );
}

export function HowItWorksBlock() {
  return (
    <FadeInView delay={100}>
      <Text style={styles.kicker}>COMMENT ÇA MARCHE</Text>
      <Text style={styles.sectionH}>3 étapes. <Text style={styles.accent}>Zéro friction.</Text></Text>
      <View style={styles.steps}>
        {HOW_STEPS.map((s, i) => (
          <FadeInView key={s.num} delay={120 + i * 80} variant="up">
            <View style={styles.step}>
              <LinearGradient colors={s.colors} style={styles.stepIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.stepNum}>{s.num}</Text>
                <Text style={styles.stepEmoji}>{s.emoji}</Text>
              </LinearGradient>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </FadeInView>
        ))}
      </View>
    </FadeInView>
  );
}

export function FeaturesBlock() {
  return (
    <FadeInView delay={80}>
      <Text style={styles.kicker}>POURQUOI YOHA</Text>
      <Text style={styles.sectionH}>Pensé pour le <Text style={styles.accent}>rythme du campus.</Text></Text>
      <View style={styles.featGrid}>
        {LANDING_FEATURES.map((f, i) => (
          <FadeInView key={f.title} delay={100 + i * 60}>
            <View style={[styles.featCard, shadows.soft]}>
              <LinearGradient colors={f.colors} style={styles.featIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              </LinearGradient>
              <Text style={styles.featTitle}>{f.title}</Text>
              <Text style={styles.featDesc}>{f.desc}</Text>
            </View>
          </FadeInView>
        ))}
      </View>
    </FadeInView>
  );
}

export function RestaurantCarousel({ restaurants }: { restaurants: Restaurant[] }) {
  if (!restaurants.length) return null;
  return (
    <FadeInView delay={80}>
      <Text style={styles.kicker}>À DÉCOUVRIR</Text>
      <Text style={styles.sectionH}>Un univers culinaire <Text style={styles.accent}>à 360°</Text></Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {restaurants.map((r) => (
          <View key={r.slug} style={[styles.carouselCard, shadows.float]}>
            <Image source={{ uri: r.cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.carouselTag}>{r.cuisine || 'Restaurant'}</Text>
            <Text style={styles.carouselName}>{r.name}</Text>
          </View>
        ))}
      </ScrollView>
    </FadeInView>
  );
}

export function CampusZonesBlock() {
  return (
    <FadeInView delay={80}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={[styles.campusWrap, shadows.float]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.campusBadge}>
          <Text style={styles.campusBadgeText}>📍 Campus & Hôpitaux — Tanger</Text>
        </View>
        <Text style={styles.campusTitle}>
          Zones couvertes <Text style={styles.accentLight}>24/7</Text>
        </Text>
        <Text style={styles.campusSub}>
          Hôpitaux, instituts de santé et résidences — livraison prioritaire.
        </Text>
        <View style={styles.campusStats}>
          <View style={styles.campusStat}>
            <Text style={styles.campusStatVal}>+{CAMPUS_ZONES.length}</Text>
            <Text style={styles.campusStatLbl}>Points</Text>
          </View>
          <View style={[styles.campusStat, styles.campusStatGreen]}>
            <Text style={styles.campusStatGreenText}>● Actif</Text>
          </View>
        </View>
        {CAMPUS_ZONES.map((z) => (
          <View key={z.name} style={styles.zoneRow}>
            <Text style={styles.zoneEmoji}>{z.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.zoneName}>{z.name}</Text>
              <Text style={styles.zoneSub}>{z.subtitle}</Text>
            </View>
            <Text style={styles.zoneAvail}>Disponible</Text>
          </View>
        ))}
      </LinearGradient>
    </FadeInView>
  );
}

export function TestimonialsBlock() {
  return (
    <FadeInView delay={80}>
      <Text style={styles.kicker}>ILS EN PARLENT</Text>
      <Text style={styles.sectionH}>Adoré sur les <Text style={styles.accent}>campus & couloirs.</Text></Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.testiRow}>
        {LANDING_TESTIMONIALS.map((t) => (
          <View key={t.name} style={[styles.testiCard, shadows.soft]}>
            <Text style={styles.testiQuote}>"</Text>
            <Text style={styles.testiText}>{t.text}</Text>
            <View style={styles.testiFoot}>
              <Text style={styles.testiAvatar}>{t.emoji}</Text>
              <View>
                <Text style={styles.testiName}>{t.name}</Text>
                <Text style={styles.testiStars}>{'★'.repeat(t.stars)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </FadeInView>
  );
}

export function PhoneShowcase() {
  return (
    <FadeInView delay={80} variant="zoom">
      <Text style={styles.kicker}>SUR VOTRE TÉLÉPHONE</Text>
      <Text style={styles.sectionH}>Une expérience <Text style={styles.accent}>si fluide</Text></Text>
      <View style={[styles.phone, shadows.glow]}>
        <View style={styles.phoneNotch} />
        <LinearGradient colors={['#fff7ed', '#fdf4ff']} style={styles.phoneScreen}>
          <View style={styles.phoneSearch}>
            <Text style={styles.phoneSearchText}>🔍 Que mangez-vous ?</Text>
          </View>
          <View style={styles.phoneCard}>
            <Text style={styles.phoneCardLbl}>Recommandé</Text>
            <View style={styles.phoneCardRow}>
              <Text style={{ fontSize: 32 }}>🍕</Text>
              <View>
                <Text style={styles.phoneCardTitle}>Margherita</Text>
                <Text style={styles.phoneCardSub}>89 MAD · 14 min</Text>
              </View>
              <View style={styles.phonePlus}><Text style={{ color: '#fff', fontWeight: '800' }}>+</Text></View>
            </View>
          </View>
          <LinearGradient colors={[...gradients.cta]} style={styles.phoneCart} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.phoneCartText}>🛒 3 articles</Text>
            <Text style={styles.phoneCartText}>243 MAD</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <View style={styles.checkList}>
        {['Suivi livreur en direct', 'Reorder en 1 tap', 'Livraison offerte campus', 'Sans compte requis'].map((t) => (
          <Text key={t} style={styles.checkItem}>✓ {t}</Text>
        ))}
      </View>
    </FadeInView>
  );
}

export function FinalCTABlock({ onStart }: { onStart: () => void }) {
  return (
    <FadeInView delay={100}>
      <LinearGradient colors={['#0f172a', '#312e81', '#0f172a']} style={[styles.finalCta, shadows.glow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.finalTitle}>
          Faim ? Votre chambre est à <Text style={styles.accentLight}>14 minutes</Text> de quelque chose de génial.
        </Text>
        <Text style={styles.finalSub}>Aucun stress. Ouvrez YoHa et commandez.</Text>
        <Pressable onPress={onStart} style={styles.finalBtn}>
          <LinearGradient colors={[...gradients.cta]} style={styles.finalBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.finalBtnText}>Commander maintenant →</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: fonts.bold, fontSize: 11, color: brand[600], letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  sectionH: { fontFamily: fonts.display, fontSize: 28, color: ink[900], letterSpacing: -0.8, marginBottom: 20 },
  accent: { color: brand[500] },
  accentLight: { color: '#fb923c' },
  panel: {
    backgroundColor: 'rgba(248,250,252,0.95)',
    borderRadius: radius.xl + 4,
    borderWidth: 1,
    borderColor: ink[200],
    overflow: 'hidden',
    marginBottom: 36,
  },
  panelTitle: { fontFamily: fonts.display, fontSize: 22, color: ink[900], padding: 20, paddingBottom: 8, letterSpacing: -0.5 },
  panelSub: { fontFamily: fonts.medium, fontSize: 14, color: ink[500], paddingHorizontal: 20, paddingBottom: 16, lineHeight: 20 },
  catRow: { flexDirection: 'row', gap: 14, padding: 20, alignItems: 'flex-start' },
  catBorder: { borderTopWidth: 1, borderTopColor: ink[200] },
  catEmoji: { fontSize: 28 },
  catTitle: { fontFamily: fonts.bold, fontSize: 17, color: ink[900] },
  catLine: { fontFamily: fonts.medium, fontSize: 13, color: ink[500], marginTop: 4, lineHeight: 18 },
  steps: { gap: 24, marginBottom: 36 },
  step: { alignItems: 'center' },
  stepIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...shadows.glowOrange },
  stepNum: { position: 'absolute', top: 4, right: 8, fontFamily: fonts.display, fontSize: 14, color: 'rgba(255,255,255,0.35)' },
  stepEmoji: { fontSize: 28 },
  stepTitle: { marginTop: 14, fontFamily: fonts.bold, fontSize: 18, color: ink[900] },
  stepDesc: { marginTop: 6, fontFamily: fonts.medium, fontSize: 14, color: ink[500], textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 36 },
  featCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  featIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  featTitle: { marginTop: 12, fontFamily: fonts.bold, fontSize: 15, color: ink[900] },
  featDesc: { marginTop: 6, fontFamily: fonts.medium, fontSize: 12, color: ink[500], lineHeight: 17 },
  carousel: { gap: 14, paddingBottom: 8, marginBottom: 36 },
  carouselCard: { width: 200, height: 260, borderRadius: radius.xl + 4, overflow: 'hidden', padding: 16, justifyContent: 'flex-end' },
  carouselTag: { fontFamily: fonts.bold, fontSize: 10, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1 },
  carouselName: { fontFamily: fonts.display, fontSize: 20, color: '#fff', marginTop: 4 },
  campusWrap: { borderRadius: radius.xl + 4, padding: 22, marginBottom: 36 },
  campusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  campusBadgeText: { fontFamily: fonts.semibold, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  campusTitle: { marginTop: 16, fontFamily: fonts.display, fontSize: 26, color: '#fff', letterSpacing: -0.5 },
  campusSub: { marginTop: 8, fontFamily: fonts.medium, fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },
  campusStats: { flexDirection: 'row', gap: 12, marginTop: 18, marginBottom: 16 },
  campusStat: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  campusStatVal: { fontFamily: fonts.display, fontSize: 28, color: '#fff' },
  campusStatLbl: { fontFamily: fonts.medium, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  campusStatGreen: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(52,211,153,0.3)', justifyContent: 'center' },
  campusStatGreenText: { fontFamily: fonts.bold, fontSize: 14, color: '#6ee7b7' },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  zoneEmoji: { fontSize: 24 },
  zoneName: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  zoneSub: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  zoneAvail: { fontFamily: fonts.bold, fontSize: 10, color: '#6ee7b7' },
  testiRow: { gap: 14, paddingBottom: 8, marginBottom: 36 },
  testiCard: { width: width * 0.78, backgroundColor: '#fff', borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: ink[100] },
  testiQuote: { fontSize: 48, color: ink[200], lineHeight: 40, fontFamily: fonts.display },
  testiText: { fontFamily: fonts.medium, fontSize: 15, color: ink[700], lineHeight: 22 },
  testiFoot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  testiAvatar: { fontSize: 32 },
  testiName: { fontFamily: fonts.bold, fontSize: 13, color: ink[900] },
  testiStars: { color: brand[500], fontSize: 12, letterSpacing: 2, marginTop: 2 },
  phone: {
    alignSelf: 'center',
    width: 260,
    borderRadius: 40,
    backgroundColor: ink[900],
    padding: 10,
    marginBottom: 20,
  },
  phoneNotch: { alignSelf: 'center', width: 100, height: 24, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, backgroundColor: ink[900], marginBottom: 4 },
  phoneScreen: { borderRadius: 32, height: 420, overflow: 'hidden', padding: 16 },
  phoneSearch: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 14 },
  phoneSearchText: { fontFamily: fonts.semibold, fontSize: 13, color: ink[600] },
  phoneCard: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 14 },
  phoneCardLbl: { fontFamily: fonts.semibold, fontSize: 11, color: ink[400] },
  phoneCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  phoneCardTitle: { fontFamily: fonts.bold, fontSize: 14, color: ink[900] },
  phoneCardSub: { fontFamily: fonts.medium, fontSize: 11, color: ink[500] },
  phonePlus: { marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, backgroundColor: brand[500], alignItems: 'center', justifyContent: 'center' },
  phoneCart: { position: 'absolute', bottom: 16, left: 16, right: 16, borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  phoneCartText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  checkList: { gap: 10, marginBottom: 36 },
  checkItem: { fontFamily: fonts.semibold, fontSize: 14, color: ink[700] },
  finalCta: { borderRadius: radius.xl + 4, padding: 28, marginBottom: 24 },
  finalTitle: { fontFamily: fonts.display, fontSize: 26, color: '#fff', letterSpacing: -0.6, lineHeight: 32 },
  finalSub: { marginTop: 12, fontFamily: fonts.medium, fontSize: 15, color: 'rgba(255,255,255,0.65)' },
  finalBtn: { marginTop: 22 },
  finalBtnGrad: { paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center' },
  finalBtnText: { fontFamily: fonts.extrabold, fontSize: 16, color: '#fff' },
});
