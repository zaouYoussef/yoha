import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { ink } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AuthFormCard({ title, subtitle, children }: Props) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: 'rgba(255,255,255,0.95)',
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: ink[900],
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: ink[500],
    lineHeight: 18,
  },
});
