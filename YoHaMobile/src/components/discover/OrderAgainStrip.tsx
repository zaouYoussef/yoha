import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '../../lib/api';
import { formatMad } from '../../lib/constants';
import { hapticSuccess } from '../../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export function OrderAgainStrip({
  order,
  onReorder,
}: {
  order: Order;
  onReorder: (order: Order) => void;
}) {
  const itemCount = order.items?.length ?? 0;
  const total = order.totalDh ?? order.subtotalDh ?? 0;

  return (
    <Pressable
      onPress={() => {
        onReorder(order);
        hapticSuccess();
      }}
      style={[styles.wrap, shadows.glowOrange]}
    >
      <LinearGradient colors={['#fff', brand[50]]} style={styles.inner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>↻</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Commander à nouveau</Text>
          <Text style={styles.title} numberOfLines={1}>
            {order.restaurantName || 'Ton dernier resto'}
          </Text>
          <Text style={styles.sub}>
            {itemCount} article{itemCount > 1 ? 's' : ''} · {formatMad(Number(total), 0)}
          </Text>
        </View>
        <LinearGradient colors={[...gradients.cta]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.btnText}>GO</Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20, borderRadius: radius.xl + 2, overflow: 'hidden' },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.xl + 2,
    borderWidth: 1.5,
    borderColor: brand[200],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22, color: brand[700] },
  label: { fontFamily: fonts.bold, fontSize: 10, color: brand[600], textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontFamily: fonts.extrabold, fontSize: 17, color: ink[900], marginTop: 2 },
  sub: { fontFamily: fonts.medium, fontSize: 12, color: ink[500], marginTop: 2 },
  btn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.lg },
  btnText: { fontFamily: fonts.extrabold, fontSize: 14, color: '#fff' },
});
