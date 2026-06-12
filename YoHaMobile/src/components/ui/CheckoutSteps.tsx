import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brand, gradients, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

const STEPS = [
  { id: 1, label: 'Panier', emoji: '🛒' },
  { id: 2, label: 'Livraison', emoji: '📍' },
  { id: 3, label: 'Confirmé', emoji: '✓' },
];

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={styles.wrap}>
      {STEPS.map((step, i) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <React.Fragment key={step.id}>
            <View style={styles.step}>
              {active ? (
                <LinearGradient colors={[...gradients.primary]} style={styles.circleActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.circleEmoji}>{step.emoji}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.circle, done && styles.circleDone]}>
                  <Text style={styles.circleEmoji}>{done ? '✓' : step.emoji}</Text>
                </View>
              )}
              <Text style={[styles.label, active && styles.labelActive]}>{step.label}</Text>
            </View>
            {i < STEPS.length - 1 ? (
              <View style={[styles.line, (done || active) && styles.lineActive]} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  step: { alignItems: 'center', gap: 6 },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ink[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ink[200],
  },
  circleDone: { backgroundColor: brand[50], borderColor: brand[300] },
  circleActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmoji: { fontSize: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: ink[400] },
  labelActive: { color: brand[600], fontFamily: fonts.bold },
  line: { width: 36, height: 3, backgroundColor: ink[200], borderRadius: 2, marginBottom: 18 },
  lineActive: { backgroundColor: brand[300] },
});
