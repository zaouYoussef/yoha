import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { brand, ink, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

const LIVE_MESSAGES = [
  { emoji: '🍕', text: 'Karim (FMP) a commandé une pizza Regina 🍕' },
  { emoji: '🍔', text: 'Sarah (CHU) se régale avec un Double Bacon Burger croustillant 🍔' },
  { emoji: '🌮', text: 'Youssef (ISPITS) a commandé un Tacos Maxi sauce fromagère 🧀' },
  { emoji: '🛵', text: '14 livreurs YoHa en route vers les pavillons universitaires 🛵' },
  { emoji: '⭐', text: 'Inès a noté 5★ son Tacos de chez Burger Corner "Super rapide !" ⭐' },
  { emoji: '🏥', text: 'Livraison express en cours pour le service Urgences CHU Tanger 🚨' },
  { emoji: '🥗', text: 'Amine (FMP) vient de commander un bol Healthy Poulet-Avocat 🥑' },
];

export const SocialProofBanner = React.memo(function SocialProofBanner() {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % LIVE_MESSAGES.length);
      }, 250);
    }, 4500);

    return () => clearInterval(timer);
  }, [fadeAnim]);

  const msg = LIVE_MESSAGES[index];

  return (
    <View style={[styles.wrap, shadows.soft]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.96)', brand[50]]}
        style={styles.grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.inner}>
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{msg.emoji}</Text>
          </View>
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <Text style={styles.live}>En direct sur le campus</Text>
            <Text style={styles.text}>{msg.text}</Text>
          </Animated.View>
          <View style={styles.liveDotWrap}>
            <View style={styles.liveDot} />
            <View style={styles.liveDotPulse} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

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
  liveDotWrap: { width: 10, height: 10, justifyContent: 'center', alignItems: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', zIndex: 2 },
  liveDotPulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    opacity: 0.4,
  },
});
