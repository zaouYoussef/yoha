import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Order } from '../../lib/api';
import { MOCK_COURIER_GAIN_PER_DELIVERY_MAD, ORDER_STATES, formatMad } from '../../lib/constants';
import { parseAmount } from '../../lib/courierOrder';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';
import { StatusPill } from '../StatusPill';

export function CourierHistoryRow({ order }: { order: Order }) {
  const state = ORDER_STATES[order.status] || ORDER_STATES.placed;
  const isDelivered = order.status === 'delivered';

  return (
    <View style={[styles.row, shadows.soft]}>
      <View style={styles.left}>
        <Text style={styles.id}>#{order.id}</Text>
        <Text style={styles.resto} numberOfLines={1}>
          {order.restaurantName}
        </Text>
        <Text style={styles.client} numberOfLines={1}>
          {order.customer?.name || 'Client'}
        </Text>
        {order.cancellationReason ? (
          <Text style={styles.cancel} numberOfLines={2}>
            {order.cancellationReason}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <StatusPill label={state.label} color={state.color} />
        <Text style={styles.total}>{formatMad(parseAmount(order.totalDh), 2)}</Text>
        {isDelivered ? (
          <Text style={styles.gain}>+{MOCK_COURIER_GAIN_PER_DELIVERY_MAD} MAD</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ink[100],
  },
  left: { flex: 1, minWidth: 0 },
  right: { alignItems: 'flex-end', gap: 6 },
  id: { fontSize: 15, fontFamily: fonts.extrabold, color: ink[900] },
  resto: { marginTop: 2, fontSize: 13, fontFamily: fonts.semibold, color: ink[700] },
  client: { marginTop: 2, fontSize: 12, fontFamily: fonts.medium, color: ink[500] },
  cancel: { marginTop: 6, fontSize: 11, fontFamily: fonts.medium, color: '#b45309', fontStyle: 'italic' },
  total: { fontSize: 13, fontFamily: fonts.bold, color: ink[800] },
  gain: { fontSize: 12, fontFamily: fonts.bold, color: '#059669' },
});
