import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatMad } from '../../lib/constants';
import { last7DayLabels } from '../../lib/restaurantOrder';
import { brand, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  title: string;
  data: number[];
  mode: 'count' | 'revenue';
};

export function RestoWeekChart({ title, data, mode }: Props) {
  const labels = last7DayLabels();
  const max = Math.max(...data, 1);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chart}>
        {data.map((v, i) => {
          const h = Math.max(8, (v / max) * 100);
          return (
            <View key={i} style={styles.col}>
              <Text style={styles.val} numberOfLines={1}>
                {mode === 'revenue' ? (v > 0 ? formatMad(v, 0).replace(' MAD', '') : '0') : v}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: `${h}%` }]} />
              </View>
              <Text style={styles.day}>{labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: ink[100],
    marginBottom: 14,
  },
  title: { fontSize: 16, fontFamily: fonts.bold, color: ink[900], marginBottom: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  col: { flex: 1, alignItems: 'center', height: '100%' },
  val: { fontSize: 9, fontFamily: fonts.bold, color: ink[400], marginBottom: 4 },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: ink[50],
    borderRadius: 8,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: brand[500],
    borderRadius: 8,
    minHeight: 8,
  },
  day: { marginTop: 6, fontSize: 10, fontFamily: fonts.medium, color: ink[500] },
});
