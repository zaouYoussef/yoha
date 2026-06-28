import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { hapticLight } from '../../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export function AuthGuestCta() {
  return (
    <Pressable
      onPress={() => {
        router.replace('/(client)' as never);
        hapticLight();
      }}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.94 }]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.92)', 'rgba(255,247,237,0.95)']}
        style={styles.inner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>Pas envie de créer un compte ?</Text>
          <Text style={styles.sub}>Parcourez les restos et commandez en invité</Text>
        </View>
        <LinearGradient colors={[...gradients.cta]} style={[styles.arrow, shadows.soft]}>
          <Text style={styles.arrowText}>→</Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: brand[100],
    ...shadows.soft,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
  },
  copy: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: ink[800],
  },
  sub: {
    marginTop: 3,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: ink[500],
    lineHeight: 17,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
});
