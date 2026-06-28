function formatScheduledRange(iso: string) {
  try {
    const s = new Date(iso);
    const e = new Date(s.getTime() + 30 * 60 * 1000);
    const day = s.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const sh = String(s.getHours()).padStart(2, '0');
    const sm = String(s.getMinutes()).padStart(2, '0');
    const eh = String(e.getHours()).padStart(2, '0');
    const em = String(e.getMinutes()).padStart(2, '0');
    return `${day}, ${sh}:${sm} → ${eh}:${em}`;
  } catch {
    return iso;
  }
}

import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '../../lib/api';
import {
  MOCK_COURIER_GAIN_PER_DELIVERY_MAD,
  ORDER_STATES,
  formatMad,
} from '../../lib/constants';
import { brand, ink, radius, shadows } from '../../theme';
import { parseAmount } from '../../lib/courierOrder';
import { fonts } from '../../theme/fonts';
import { StatusPill } from '../StatusPill';
import { YohaButton } from '../ui/YohaButton';
import { DeliveryRouteMap } from './DeliveryRouteMap';
import { OrderItemsDetail } from './OrderItemsDetail';

type Props = {
  order: Order;
  showMap?: boolean;
  children?: React.ReactNode;
};

const CANCEL_BEFORE = [
  'Restaurant fermé',
  'Commande introuvable au restaurant',
  'Impassible de récupérer',
];

const CANCEL_AFTER = [
  'Client injoignable',
  'Adresse incorrecte',
  'Client refuse la commande',
];

export function CourierOrderCard({ order, showMap, children }: Props) {
  const state = ORDER_STATES[order.status] || ORDER_STATES.placed;
  const restaurantPhone = order.restaurantPhone || '';

  const dial = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.id}>#{order.id}</Text>
          <Text style={styles.resto} numberOfLines={1}>
            {order.restaurantName}
          </Text>
        </View>
        <StatusPill label={state.label} color={state.color} />
      </View>

      {showMap ? <DeliveryRouteMap /> : null}

      <View style={styles.locBlock}>
        <View style={styles.locRow}>
          <View style={[styles.locIcon, styles.locIconPink]}>
            <Text style={styles.locEmoji}>👨‍🍳</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locLabel}>Récupérer</Text>
            <Text style={styles.locValue}>{order.restaurantName}</Text>
            {restaurantPhone ? (
              <Pressable onPress={() => dial(restaurantPhone)}>
                <Text style={styles.phone}>📞 {restaurantPhone}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.locRow}>
          <View style={[styles.locIcon, styles.locIconGreen]}>
            <Text style={styles.locEmoji}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locLabel}>Livrer à</Text>
            <Text style={styles.locValue}>
              {order.customer?.name}
              {order.customer?.address ? ` · ${order.customer.address}` : ''}
            </Text>
            {order.customer?.phone ? (
              <Pressable onPress={() => dial(order.customer?.phone)}>
                <Text style={styles.phone}>{order.customer.phone}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <OrderItemsDetail order={order} restaurantPhone={restaurantPhone} />

        {order.scheduledDeliveryAt ? (
          <View style={styles.scheduledRow}>
            <Text style={styles.scheduledEmoji}>🕐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduledLabel}>Livraison programmée</Text>
              <Text style={styles.scheduledValue}>
                {formatScheduledRange(String(order.scheduledDeliveryAt))}
              </Text>
            </View>
          </View>
        ) : null}

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>{formatMad(parseAmount(order.totalDh), 2)}</Text>
        </View>
        <View style={styles.gainCol}>
          <Text style={styles.footerLabel}>Vous gagnez</Text>
          <Text style={styles.gain}>+{MOCK_COURIER_GAIN_PER_DELIVERY_MAD} MAD</Text>
        </View>
      </View>

      {order.cancellationReason ? (
        <Text style={styles.cancelNote}>Motif : {order.cancellationReason}</Text>
      ) : null}

      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

export function CancelOrderButton({
  phase,
  onCancel,
}: {
  phase: 'before_pickup' | 'after_pickup';
  onCancel: (reason: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const options = phase === 'after_pickup' ? CANCEL_AFTER : CANCEL_BEFORE;
  const label =
    phase === 'after_pickup' ? 'Client injoignable — annuler' : 'Annuler la commande';

  const open = () => {
    Alert.alert(
      'Annuler la course',
      'Choisissez un motif',
      [
        ...options.map((reason) => ({
          text: reason,
          onPress: async () => {
            setBusy(true);
            try {
              await onCancel(reason);
            } finally {
              setBusy(false);
            }
          },
        })),
        { text: 'Retour', style: 'cancel' },
      ],
    );
  };

  return (
    <YohaButton
      title={busy ? '…' : label}
      onPress={open}
      variant="ghost"
      size="md"
      style={{ marginTop: 8 }}
      textStyle={{ fontSize: 13, color: '#dc2626' }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  id: { fontSize: 20, fontFamily: fonts.extrabold, color: ink[900] },
  resto: { marginTop: 2, fontSize: 12, fontFamily: fonts.medium, color: ink[500] },
  locBlock: { marginTop: 14, gap: 12 },
  locRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  locIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locIconPink: { backgroundColor: 'rgba(236,72,153,0.12)' },
  locIconGreen: { backgroundColor: 'rgba(16,185,129,0.12)' },
  locEmoji: { fontSize: 14 },
  locLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locValue: { fontSize: 14, fontFamily: fonts.semibold, color: ink[800], marginTop: 2 },
  phone: { marginTop: 4, fontSize: 12, fontFamily: fonts.medium, color: brand[600] },
  footer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: ink[200],
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footerTotal: { marginTop: 2, fontSize: 16, fontFamily: fonts.bold, color: ink[900] },
  gainCol: { alignItems: 'flex-end' },
  gain: { marginTop: 2, fontSize: 16, fontFamily: fonts.bold, color: '#059669' },
  scheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: '#fef3c7',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  scheduledEmoji: { fontSize: 16 },
  scheduledLabel: { fontFamily: fonts.bold, fontSize: 11, color: '#92400e' },
  scheduledValue: { fontFamily: fonts.bold, fontSize: 13, color: '#b45309', marginTop: 2 },
  cancelNote: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: ink[500],
    fontStyle: 'italic',
  },
  actions: { marginTop: 14 },
});
