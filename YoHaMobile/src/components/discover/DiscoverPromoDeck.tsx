import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { gradients, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export function DiscoverPromoDeck() {
  return (
    <View style={styles.row}>
      <Pressable style={{ flex: 1.2 }} onPress={() => router.push('/(client)/cart' as never)}>
        <LinearGradient colors={[...gradients.cta]} style={[styles.card, shadows.glow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.emoji}>🎁</Text>
          <Text style={styles.cardTitle}>0 DH livraison</Text>
          <Text style={styles.cardSub}>Paye à la porte · 2 min chrono</Text>
        </LinearGradient>
      </Pressable>
      <Pressable style={{ flex: 1 }} onPress={() => router.push('/(client)/orders' as never)}>
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={[styles.card, shadows.card]}>
          <Text style={styles.emoji}>⚡</Text>
          <Text style={[styles.cardTitle, styles.cardTitleLight]}>Offres flash</Text>
          <Text style={styles.cardSubLight}>Jusqu&apos;à -20% ce soir</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  card: { borderRadius: radius.xl + 2, padding: 18, minHeight: 118, justifyContent: 'flex-end' },
  emoji: { fontSize: 28, position: 'absolute', top: 14, left: 16 },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: '#fff' },
  cardTitleLight: { color: '#fff' },
  cardSub: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.88)', marginTop: 4 },
  cardSubLight: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
});
