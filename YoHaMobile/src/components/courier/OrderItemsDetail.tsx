import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '../../lib/api';
import { buildOrderCopyText, parseAmount, whatsAppUrl } from '../../lib/courierOrder';
import { copyText } from '../../lib/copyText';
import { formatMad } from '../../lib/constants';
import { brand, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  order: Order;
  restaurantPhone?: string;
};

export function OrderItemsDetail({ order, restaurantPhone }: Props) {
  const [copyLabel, setCopyLabel] = useState('Copier');
  const items = Array.isArray(order.items) ? order.items : [];
  const waUrl = whatsAppUrl(restaurantPhone, buildOrderCopyText(order));

  const handleCopy = async () => {
    const result = await copyText(buildOrderCopyText(order));
    if (result === 'copied') setCopyLabel('✓ Copié');
    else if (result === 'shared') setCopyLabel('✓ Partagé');
    else setCopyLabel('Erreur');
    setTimeout(() => setCopyLabel('Copier'), 2000);
  };

  const handleWhatsApp = () => {
    if (!waUrl) return;
    Linking.openURL(waUrl);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧾 Détail commande</Text>
        <View style={styles.actions}>
          <Pressable onPress={handleCopy} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>{copyLabel}</Text>
          </Pressable>
          <Pressable
            onPress={handleWhatsApp}
            disabled={!waUrl}
            style={[styles.actionBtn, styles.waBtn, !waUrl && styles.actionDisabled]}
          >
            <Text style={[styles.actionBtnText, styles.waText]}>WhatsApp</Text>
          </Pressable>
        </View>
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>Aucun article listé</Text>
      ) : (
        items.map((item, idx) => {
          const qty = item.qty || 1;
          const lineTotal = parseAmount(item.price) * qty;
          return (
            <View key={item.id || String(idx)} style={styles.line}>
              <Text style={styles.lineName} numberOfLines={2}>
                <Text style={styles.qty}>{qty}× </Text>
                {item.name}
              </Text>
              <Text style={styles.linePrice}>{formatMad(lineTotal, 2)}</Text>
            </View>
          );
        })
      )}

      {items.length > 0 ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total commande</Text>
          <Text style={styles.totalValue}>{formatMad(parseAmount(order.totalDh), 2)}</Text>
        </View>
      ) : null}

      {order.restaurantNotes?.trim() ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Remarques client (restaurant)</Text>
          <Text style={styles.notesText}>{order.restaurantNotes.trim()}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: ink[200],
    backgroundColor: ink[50],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ink[200],
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.bold,
    color: ink[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: ink[900],
  },
  actionBtnText: { fontSize: 11, fontFamily: fonts.bold, color: '#fff' },
  waBtn: { backgroundColor: '#059669' },
  waText: { color: '#fff' },
  actionDisabled: { opacity: 0.4 },
  empty: { padding: 14, fontSize: 13, color: ink[500], fontFamily: fonts.medium },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ink[200],
  },
  lineName: { flex: 1, fontSize: 14, fontFamily: fonts.semibold, color: ink[800] },
  qty: { color: brand[600], fontFamily: fonts.bold },
  linePrice: { fontSize: 14, fontFamily: fonts.semibold, color: ink[600] },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  totalLabel: { fontSize: 13, fontFamily: fonts.semibold, color: ink[500] },
  totalValue: { fontSize: 15, fontFamily: fonts.extrabold, color: brand[600] },
  notesBox: {
    margin: 10,
    marginTop: 0,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: brand[50],
    borderWidth: 1,
    borderColor: brand[100],
  },
  notesTitle: { fontSize: 10, fontFamily: fonts.bold, color: brand[700], marginBottom: 4 },
  notesText: { fontSize: 12, fontFamily: fonts.medium, color: ink[700], lineHeight: 18 },
});
