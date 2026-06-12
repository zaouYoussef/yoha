import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

const STATS = [
  { emoji: '⚡', value: '26 min', label: 'Livraison moy.' },
  { emoji: '🏪', value: '12+', label: 'Restos actifs' },
  { emoji: '⭐', value: '4.8', label: 'Note moyenne' },
];

export function LiveStatsStrip() {
  return (
    <View style={styles.wrap}>
      {STATS.map((s, i) => (
        <View key={s.label} style={[styles.card, i === 1 && styles.cardCenter]}>
          <LinearGradient
            colors={i === 1 ? [brand[500], '#ec4899'] : ['#fff', '#fff']}
            style={styles.inner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={[styles.value, i === 1 && styles.valueLight]}>{s.value}</Text>
            <Text style={[styles.label, i === 1 && styles.labelLight]}>{s.label}</Text>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 10, marginVertical: 18 },
  card: { flex: 1, borderRadius: radius.lg + 2, overflow: 'hidden', ...shadows.soft },
  cardCenter: { ...shadows.glow },
  inner: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderRadius: radius.lg + 2,
    borderWidth: 1,
    borderColor: ink[100],
  },
  emoji: { fontSize: 20 },
  value: { fontFamily: fonts.extrabold, fontSize: 17, color: ink[900], marginTop: 6 },
  valueLight: { color: '#fff' },
  label: { fontFamily: fonts.medium, fontSize: 10, color: ink[500], marginTop: 2, textAlign: 'center' },
  labelLight: { color: 'rgba(255,255,255,0.85)' },
});
