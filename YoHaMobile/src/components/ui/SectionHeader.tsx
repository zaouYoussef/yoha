import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brand, gradients, ink, radius, typography } from '../../theme';

export function SectionHeader({
  title,
  subtitle,
  badge,
  gradient = false,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  gradient?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {gradient ? (
        <View>
          <Text style={[styles.title, { color: ink[900] }]}>{title.split(' ')[0]} </Text>
          <LinearGradient
            colors={[...gradients.hero]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientText}
          >
            <Text style={[styles.title, { color: brand[500] }]}>
              {title.split(' ').slice(1).join(' ') || title}
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: brand[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: 12,
  },
  badgeText: { color: brand[700], fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  title: { ...typography.h1, color: ink[900] },
  gradientText: { alignSelf: 'flex-start' },
  subtitle: { marginTop: 8, fontSize: 15, color: ink[500], lineHeight: 22, fontWeight: '500' },
});
