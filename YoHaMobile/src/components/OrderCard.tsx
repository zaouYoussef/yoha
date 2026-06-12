import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ORDER_STATES } from '../lib/constants';
import { Order } from '../lib/api';
import { formatMad, isActiveOrderStatus } from '../lib/constants';
import { brand, ink, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';
import { StatusPill } from './StatusPill';

export function OrderCard({
  order,
  onReorder,
}: {
  order: Order;
  onReorder?: (order: Order) => void;
}) {
  const state = ORDER_STATES[order.status] || ORDER_STATES.placed;
  const items = order.items || [];
  const canReorder = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={[styles.accent, isActiveOrderStatus(order.status) && styles.accentLive]} />
      <View style={styles.header}>
        <View>
          <Text style={styles.id}>#{order.id}</Text>
          <Text style={styles.resto}>{order.restaurantName}</Text>
        </View>
        <StatusPill label={state.label} color={state.color} />
      </View>
      <Text style={styles.items} numberOfLines={2}>
        {items.map((i) => `${i.qty}× ${i.name}`).join(' · ') || '—'}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.total}>{formatMad(Number(order.totalDh || 0))}</Text>
        {order.createdAt ? <Text style={styles.date}>{order.createdAt}</Text> : null}
      </View>
      {canReorder && onReorder ? (
        <Pressable onPress={() => onReorder(order)} style={styles.reorderBtn}>
          <Text style={styles.reorderText}>↻ Commander à nouveau</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ink[100],
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: brand[500],
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  accentLive: { backgroundColor: '#22c55e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  id: { fontSize: 17, fontFamily: fonts.extrabold, color: ink[900] },
  resto: { marginTop: 2, fontSize: 13, fontFamily: fonts.medium, color: ink[500] },
  items: { marginTop: 12, fontSize: 14, fontFamily: fonts.medium, color: ink[600], lineHeight: 20 },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: { fontSize: 17, fontFamily: fonts.extrabold, color: brand[600] },
  date: { fontSize: 12, fontFamily: fonts.medium, color: ink[400] },
  reorderBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: brand[50],
    borderWidth: 1,
    borderColor: brand[200],
    alignItems: 'center',
  },
  reorderText: { fontFamily: fonts.bold, fontSize: 14, color: brand[700] },
});
