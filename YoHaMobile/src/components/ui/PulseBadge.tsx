import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius } from '../../theme';
import { fonts } from '../../theme/fonts';

export function PulseBadge({ label, emoji }: { label: string; emoji?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dot} />
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.35)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  emoji: { fontSize: 12 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: '#86efac' },
});
