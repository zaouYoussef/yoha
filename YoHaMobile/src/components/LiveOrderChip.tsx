import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Order } from '../lib/api';
import { ORDER_STATES } from '../lib/constants';
import { gradients, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

export function LiveOrderChip({ order }: { order: Order | null }) {
  const insets = useSafeAreaInsets();

  if (!order) return null;

  const state = ORDER_STATES[order.status] || ORDER_STATES.placed;

  return (
    <View style={[styles.wrap, { top: insets.top + 6 }]}>
      <Pressable onPress={() => router.push(`/(client)/order/${order.id}` as never)}>
        <LinearGradient
          colors={[...gradients.primary]}
          style={[styles.chip, shadows.glow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.pulse} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Commande en cours</Text>
            <Text style={styles.status} numberOfLines={1}>
              {state.label}
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  status: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  arrow: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
});
