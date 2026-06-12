import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { hapticSelection } from '../../lib/haptics';
import { brand, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

const CRAVINGS = [
  { label: 'Pizza', emoji: '🍕', q: 'pizza' },
  { label: 'Tacos', emoji: '🌮', q: 'tacos' },
  { label: 'Sushi', emoji: '🍣', q: 'sushi' },
  { label: 'Healthy', emoji: '🥗', q: 'healthy' },
  { label: 'MedEat', emoji: '🏥', q: 'medical' },
  { label: 'Dessert', emoji: '🍰', q: 'dessert' },
];

export function QuickCravings({
  onPick,
  active,
}: {
  onPick: (cuisine: string) => void;
  active: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Text style={styles.label}>Envie de</Text>
      {CRAVINGS.map((c) => {
        const isActive = active === c.q;
        return (
          <Pressable
            key={c.q}
            onPress={() => { hapticSelection(); onPick(isActive ? '' : c.q); }}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={styles.emoji}>{c.emoji}</Text>
            <Text style={[styles.text, isActive && styles.textActive]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', gap: 8, paddingVertical: 4 },
  label: { fontFamily: fonts.bold, fontSize: 13, color: ink[500], marginRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: ink[200],
  },
  chipActive: { backgroundColor: brand[50], borderColor: brand[300] },
  emoji: { fontSize: 14 },
  text: { fontFamily: fonts.semibold, fontSize: 12, color: ink[700] },
  textActive: { color: brand[700] },
});
