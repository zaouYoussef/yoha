import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatMad } from '../../lib/constants';
import { ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  count: number;
  totalMad: number;
};

export function CourierTodayGains({ count, totalMad }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text style={styles.label}>Aujourd&apos;hui</Text>
        <Text style={styles.amount}>+{formatMad(totalMad, 0)}</Text>
        <Text style={styles.sub}>
          {count} livraison{count > 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={styles.emoji}>💰</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  copy: { flex: 1 },
  label: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  amount: {
    marginTop: 4,
    fontSize: 28,
    fontFamily: fonts.extrabold,
    color: '#059669',
    letterSpacing: -0.5,
  },
  sub: { marginTop: 2, fontSize: 13, fontFamily: fonts.medium, color: ink[500] },
  emoji: { fontSize: 32 },
});
