import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { CUISINES } from '../../data/cuisines';
import { hapticSelection } from '../../lib/haptics';
import { brand, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

export function CuisineChips({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CUISINES.map((c) => {
        const isActive = active === c.id || (active === '' && c.id === 'all');
        return (
          <Pressable
            key={c.id}
            onPress={() => {
              hapticSelection();
              onSelect(c.id === 'all' ? '' : c.id);
            }}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={styles.emoji}>{c.emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: ink[100],
  },
  chipActive: { backgroundColor: brand[50], borderColor: brand[300] },
  emoji: { fontSize: 15 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: ink[600] },
  labelActive: { color: brand[700] },
});
