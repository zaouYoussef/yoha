import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  count: number;
};

export function CourierHeroBanner({ count }: Props) {
  return (
    <LinearGradient
      colors={['#8b5cf6', '#d946ef', '#ec4899']}
      style={[styles.banner, shadows.glow]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.emoji}>🛵</Text>
      <View style={styles.copy}>
        <Text style={styles.title}>
          {count} commande{count > 1 ? 's' : ''} en attente
        </Text>
        <Text style={styles.sub}>
          Confirmez en premier — la course est à vous. Les autres livreurs la verront disparaître.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 18,
  },
  emoji: { fontSize: 32 },
  copy: { flex: 1 },
  title: { fontSize: 18, fontFamily: fonts.extrabold, color: '#fff', letterSpacing: -0.3 },
  sub: { marginTop: 4, fontSize: 13, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
});
