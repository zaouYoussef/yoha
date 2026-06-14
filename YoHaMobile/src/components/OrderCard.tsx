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

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Find the first item with an image, if any
  const firstItemWithImg = items.find((i) => i.img);
  const imgUrl = firstItemWithImg?.img;

  return (
    <View style={[styles.card, shadows.float]}>
      {/* Live color strip at the left */}
      <View style={[styles.accent, isActiveOrderStatus(order.status) && styles.accentLive]} />

      <View style={styles.bodyRow}>
        {/* Left: Food thumbnail or gradient placeholder */}
        <View style={styles.thumbnailContainer}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.thumbnail} contentFit="cover" transition={200} />
          ) : (
            <LinearGradient
              colors={['#7c3aed', '#ec4899']}
              style={styles.thumbnailPlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.placeholderEmoji}>🍕</Text>
            </LinearGradient>
          )}

          {isActiveOrderStatus(order.status) ? (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
            </View>
          ) : null}
        </View>

        {/* Right: Info details */}
        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={styles.resto} numberOfLines={1}>
              👨‍🍳 {order.restaurantName}
            </Text>
            <StatusPill label={state.label} color={state.color} />
          </View>

          <Text style={styles.id}>Commande #{order.id}</Text>

          <Text style={styles.items} numberOfLines={1}>
            {items.map((i) => `${i.qty}× ${i.name}`).join(' · ') || 'Aucun article'}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.total}>{formatMad(Number(order.totalDh || 0))}</Text>
            <View style={styles.footerRight}>
              {order.scheduledDeliveryAt ? (
                <Text style={styles.scheduledDate} numberOfLines={1}>
                  🕐 {formatScheduledRange(String(order.scheduledDeliveryAt))}
                </Text>
              ) : order.createdAt ? (
                <Text style={styles.date}>🕒 {order.createdAt}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {canReorder && onReorder ? (
        <Pressable onPress={() => onReorder(order)} style={({ pressed }) => [styles.reorderBtn, pressed && { opacity: 0.94 }]}>
          <LinearGradient
            colors={[brand[50], '#ffffff']}
            style={styles.reorderGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.reorderText}>↻ Commander à nouveau</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
    position: 'relative',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: brand[200],
  },
  accentLive: {
    backgroundColor: '#22c55e',
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailContainer: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: ink[100],
    borderWidth: 1,
    borderColor: ink[100],
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 26,
  },
  liveIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(34,197,94,0.9)',
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  resto: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: ink[800],
    flex: 1,
  },
  id: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: ink[400],
    marginTop: 2,
  },
  items: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: ink[500],
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  footerRight: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  total: {
    fontSize: 14,
    fontFamily: fonts.extrabold,
    color: brand[600],
  },
  date: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: ink[400],
  },
  scheduledDate: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#b45309',
  },
  reorderBtn: {
    marginTop: 12,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: brand[100],
  },
  reorderGrad: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  reorderText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: brand[700],
  },
});
