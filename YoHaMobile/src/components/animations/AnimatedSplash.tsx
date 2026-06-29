import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumBackground } from '../PremiumBackground';
import { gradients, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export function AnimatedSplash() {
  return (
    <PremiumBackground variant="warm">
      <View style={styles.center}>
        <LinearGradient
          colors={[...gradients.cta]}
          style={[styles.logo, shadows.glow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoText}>Y</Text>
        </LinearGradient>
        <Text style={styles.title}>YoHa</Text>
        <Text style={styles.sub}>Tanger livrée en un éclat</Text>
        <Text style={styles.tag}>Livraison offerte · CHU-Tanger</Text>
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 48, fontFamily: fonts.display },
  title: {
    marginTop: 24,
    fontSize: 36,
    fontFamily: fonts.display,
    color: '#0f172a',
    letterSpacing: -1,
    textAlign: 'center',
  },
  sub: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  tag: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#ea580c',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
