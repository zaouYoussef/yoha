import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export function StickyLandingCTA({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, shadows.float]}>
        <Pressable onPress={onLogin} style={styles.ghost}>
          <Text style={styles.ghostText}>Connexion</Text>
        </Pressable>
        <Pressable onPress={onStart} style={{ flex: 1 }}>
          <LinearGradient colors={[...gradients.cta]} style={styles.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.primaryText}>Commander →</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(241,245,249,0.9)',
  },
  bar: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ghost: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  ghostText: { fontFamily: fonts.bold, fontSize: 14, color: '#475569' },
  primary: { paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center' },
  primaryText: { fontFamily: fonts.extrabold, fontSize: 15, color: '#fff' },
});
