import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

type Mode = 'login' | 'register';

const COPY: Record<Mode, { title: string; tagline: string; badge: string }> = {
  login: {
    title: 'Bon retour',
    tagline: 'Connectez-vous pour suivre vos commandes\net retrouver vos adresses favorites.',
    badge: 'Tanger · Campus & CHU',
  },
  register: {
    title: 'Créer un compte',
    tagline: 'Inscription gratuite — commandez en quelques taps\net suivez votre livraison en direct.',
    badge: 'Rejoignez +2 000 clients',
  },
};

const PERKS = ['🛵 Livraison rapide', '🔒 Paiement sécurisé', '⭐ Restos locaux'];

type Props = {
  mode?: Mode;
};

export function AuthHero({ mode = 'login' }: Props) {
  const copy = COPY[mode];

  return (
    <View style={styles.hero}>
      <View style={styles.logoRing}>
        <LinearGradient
          colors={[...gradients.cta]}
          style={[styles.logo, shadows.glow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoText}>Y</Text>
        </LinearGradient>
      </View>

      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>{copy.badge}</Text>
      </View>

      <Text style={styles.brandName}>{copy.title}</Text>
      <Text style={styles.tagline}>{copy.tagline}</Text>

      <View style={styles.perksRow}>
        {PERKS.map((perk) => (
          <View key={perk} style={styles.perkChip}>
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 22 },
  logoRing: {
    padding: 3,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 38,
    fontFamily: fonts.display,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: brand[100],
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: brand[700],
    letterSpacing: 0.2,
  },
  brandName: {
    marginTop: 14,
    fontSize: 30,
    fontFamily: fonts.display,
    color: ink[900],
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fonts.medium,
    color: ink[500],
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  perkChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: ink[100],
  },
  perkText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: ink[600],
  },
});
