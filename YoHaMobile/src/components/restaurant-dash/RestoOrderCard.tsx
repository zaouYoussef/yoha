import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Order } from '../../lib/api';
import { CANCEL_PHASES, ORDER_STATES, formatMad } from '../../lib/constants';
import { formatOrderWhen, orderFoodTotal } from '../../lib/restaurantOrder';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';
import { StatusPill } from '../StatusPill';

type Props = {
  order: Order;
  completed?: boolean;
  children?: React.ReactNode;
};

export function RestoOrderCard({ order, completed, children }: Props) {
  const state = ORDER_STATES[order.status] || ORDER_STATES.placed;
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const phase = order.cancelledPhase
    ? CANCEL_PHASES[order.cancelledPhase as string]
    : null;

  return (
    <View style={[styles.card, shadows.card, completed && styles.cardDone]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.id}>#{order.id}</Text>
          <Text style={styles.client}>{order.customer?.name || 'Client'}</Text>
          {order.createdAt ? (
            <Text style={styles.when}>{formatOrderWhen(order.createdAt)}</Text>
          ) : null}
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.total}>{formatMad(orderFoodTotal(order), 0)}</Text>
          <Text style={styles.itemCount}>{itemCount} art.</Text>
          {!completed ? <StatusPill label={state.label} color={state.color} /> : null}
        </View>
      </View>

      <View style={styles.itemsBlock}>
        {items.map((it) => (
          <View key={`${it.id}-${it.name}`} style={styles.itemRow}>
            <Text style={styles.qty}>{it.qty}×</Text>
            <Text style={styles.itemName} numberOfLines={1}>
              {it.name}
            </Text>
          </View>
        ))}
      </View>

      {order.restaurantNotes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Notes client</Text>
          <Text style={styles.notesText}>{order.restaurantNotes}</Text>
        </View>
      ) : null}

      {order.courierName ? (
        <Text style={styles.courier}>🛵 {order.courierName}</Text>
      ) : null}

      {phase ? (
        <View style={styles.phaseBadge}>
          <Text style={styles.phaseText}>{phase.short}</Text>
        </View>
      ) : null}

      {order.cancellationReason ? (
        <Text style={styles.cancelReason}>Motif : {order.cancellationReason}</Text>
      ) : null}

      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ink[100],
  },
  cardDone: { opacity: 0.92 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  id: { fontSize: 16, fontFamily: fonts.extrabold, color: ink[900] },
  client: { marginTop: 2, fontSize: 12, fontFamily: fonts.medium, color: ink[500] },
  when: { marginTop: 2, fontSize: 10, fontFamily: fonts.medium, color: ink[400] },
  rightCol: { alignItems: 'flex-end', gap: 2 },
  total: { fontSize: 15, fontFamily: fonts.bold, color: ink[900] },
  itemCount: { fontSize: 10, fontFamily: fonts.medium, color: ink[400] },
  itemsBlock: { marginTop: 12, gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qty: { fontSize: 12, fontFamily: fonts.bold, color: brand[600], minWidth: 28 },
  itemName: { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: ink[700] },
  notesBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: brand[50],
    borderWidth: 1,
    borderColor: brand[100],
  },
  notesLabel: { fontSize: 10, fontFamily: fonts.bold, color: brand[700] },
  notesText: { marginTop: 4, fontSize: 12, fontFamily: fonts.medium, color: ink[700] },
  courier: { marginTop: 8, fontSize: 11, fontFamily: fonts.medium, color: ink[500] },
  phaseBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  phaseText: { fontSize: 10, fontFamily: fonts.bold, color: '#c2410c' },
  cancelReason: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: fonts.medium,
    color: ink[500],
    fontStyle: 'italic',
  },
  actions: { marginTop: 12 },
});
