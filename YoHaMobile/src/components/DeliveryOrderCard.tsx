import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { YohaButton } from './ui/YohaButton';
import { StatusPill } from './StatusPill';
import { Order } from '../lib/api';
import { ORDER_STATES, formatMad } from '../lib/constants';
import { brand, ink, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

type Props = { order: Order; children?: React.ReactNode };

export function DeliveryOrderCard({ order, children }: Props) {
  const state = ORDER_STATES[order.status] || ORDER_STATES.placed;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.topRow}>
        <Text style={styles.id}>#{order.id}</Text>
        <StatusPill label={state.label} color={state.color} />
      </View>
      <Text style={styles.resto}>{order.restaurantName}</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoLine}>👤 {order.customer?.name}</Text>
        <Text style={styles.infoLine}>📍 {order.customer?.address}</Text>
        {order.customer?.phone ? (
          <Text style={styles.infoLine}>📞 {order.customer.phone}</Text>
        ) : null}
      </View>
      {order.restaurantNotes ? (
        <Text style={styles.notes}>📝 {order.restaurantNotes}</Text>
      ) : null}
      <Text style={styles.total}>{formatMad(Number(order.totalDh || 0))}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

export function CancelReasonButton({
  label,
  onCancel,
}: {
  label: string;
  onCancel: (reason: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <YohaButton
      title={busy ? '…' : label}
      onPress={async () => {
        if (busy) return;
        setBusy(true);
        try {
          await onCancel(label);
        } finally {
          setBusy(false);
        }
      }}
      variant="ghost"
      size="md"
      style={{ marginTop: 8 }}
      textStyle={{ fontSize: 13 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontSize: 18, fontFamily: fonts.extrabold, color: ink[900] },
  resto: { marginTop: 8, fontSize: 16, fontFamily: fonts.bold, color: ink[800] },
  infoBox: {
    marginTop: 14,
    backgroundColor: ink[50],
    borderRadius: radius.md,
    padding: 14,
    gap: 6,
  },
  infoLine: { fontSize: 13, fontFamily: fonts.medium, color: ink[600], lineHeight: 18 },
  notes: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: brand[700],
    backgroundColor: brand[50],
    padding: 10,
    borderRadius: radius.sm,
  },
  total: { marginTop: 14, fontSize: 18, fontFamily: fonts.extrabold, color: brand[600] },
  actions: { marginTop: 14 },
});
