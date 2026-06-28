import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { gradients, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';
import { hapticLight } from '../../lib/haptics';

export const DiscoverPromoDeck = React.memo(function DiscoverPromoDeck({
  onOffresFlashPress,
}: {
  onOffresFlashPress?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        style={{ flex: 1.25 }}
        onPress={() => {
          router.push('/(client)/cart' as never);
          hapticLight();
        }}
      >
        <LinearGradient colors={[...gradients.cta]} style={[styles.card, shadows.glow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.emoji}>🎁</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Livraison 0 DH</Text>
            <Text style={styles.cardSub}>Zéro frais caché · Payez cash ou TPE à la porte</Text>
          </View>
        </LinearGradient>
      </Pressable>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          onOffresFlashPress?.();
          hapticLight();
        }}
      >
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={[styles.card, shadows.card]}>
          <Text style={styles.emoji}>⚡</Text>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, styles.cardTitleLight]}>Offres Flash</Text>
            <Text style={styles.cardSubLight}>Plats XL & gourmandises offertes ce soir !</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  card: {
    borderRadius: radius.xl + 2,
    padding: 16,
    minHeight: 142,
    justifyContent: 'space-between',
  },
  emoji: { fontSize: 26, marginBottom: 8 },
  cardContent: { marginTop: 'auto' },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: '#fff' },
  cardTitleLight: { color: '#fff' },
  cardSub: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.88)', marginTop: 4, lineHeight: 14 },
  cardSubLight: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, lineHeight: 14 },
});
