import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SOCIAL_PROOF_MESSAGES } from '../data/cuisines';
import { brand, ink, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

export function SocialProofBanner() {
  const msg = SOCIAL_PROOF_MESSAGES[0];

  return (
    <View style={[styles.wrap, shadows.soft]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', brand[50]]}
        style={styles.grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.inner}>
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{msg.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.live}>En direct sur le campus</Text>
            <Text style={styles.text}>{msg.text}</Text>
          </View>
          <View style={styles.liveDot} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: brand[100],
  },
  grad: { paddingVertical: 14, paddingHorizontal: 16 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  live: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: brand[600],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  text: { fontFamily: fonts.semibold, fontSize: 13, color: ink[700], marginTop: 2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
});
