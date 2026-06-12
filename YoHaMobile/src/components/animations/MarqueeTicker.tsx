import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

const CHIPS = [
  { emoji: '🍕', label: 'Pizza dès 25 MAD', tint: '#fff7ed' },
  { emoji: '🛵', label: 'Livraison offerte', tint: '#ecfdf5' },
  { emoji: '⚡', label: '15–20 min CHU', tint: '#eff6ff' },
  { emoji: '🎁', label: '-20% Sushi Zen', tint: '#fdf2f8' },
  { emoji: '👤', label: 'Sans compte', tint: '#f5f3ff' },
  { emoji: '🏥', label: 'MedEat dispo', tint: '#ecfeff' },
];

export function MarqueeTicker() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CHIPS.map((c) => (
        <View key={c.label} style={[styles.chip, { backgroundColor: c.tint }, shadows.soft]}>
          <Text style={styles.emoji}>{c.emoji}</Text>
          <Text style={styles.label}>{c.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4, paddingRight: 4, marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ink[100],
  },
  emoji: { fontSize: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: ink[700] },
});
