import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brand, ink, radius, shadows } from '../theme';

export function BrandHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Y</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '800', color: ink[900], letterSpacing: -0.5 },
  subtitle: { marginTop: 2, fontSize: 14, color: ink[500] },
  badge: {
    backgroundColor: brand[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  badgeText: { color: brand[700], fontWeight: '700', fontSize: 12 },
});
