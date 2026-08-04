import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { ordersApi, type Order } from '../../src/lib/api';
import { resolveImageUrl } from '../../src/lib/resolveImageUrl';
import { getGuestOrderIds, getGuestOrderEmail } from '../../src/lib/guestOrders';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/contexts/CartContext';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { accent, line, radius, surface, text as palette } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label, Money } from '../../src/components/yoha/Type';
import { Glyph, Pill, SectionHeader, Skeleton } from '../../src/components/yoha/Atoms';
import { Rise } from '../../src/components/yoha/Motion';
import { EmberButton } from '../../src/components/yoha/EmberButton';

const LIVE = ['pending', 'accepted', 'preparing', 'ready', 'delivering'];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Reçue',
  accepted: 'Acceptée',
  preparing: 'En cuisine',
  ready: 'Prête',
  delivering: 'En route',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default function ClientOrders() {
  const { user } = useAuth();
  const { replaceItems } = useCart();
  const { scrollBottomPadding } = useLayoutChrome();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (user) {
        setOrders(await ordersApi.list());
      } else {
        const ids = await getGuestOrderIds();
        setOrders(ids.length ? await ordersApi.guestList(ids, await getGuestOrderEmail()) : []);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const live = useMemo(() => orders.filter((o) => LIVE.includes(o.status)), [orders]);
  const past = useMemo(() => orders.filter((o) => !LIVE.includes(o.status)), [orders]);

  /** Re-commander recharge le panier tel quel : zéro re-sélection. */
  const reorder = useCallback(
    (order: Order) => {
      const lines = (order.items ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        price: Number(i.price) || 0,
        qty: i.qty,
        img: i.img,
        restaurantId: String(order.restaurantId ?? ''),
        restaurantName: order.restaurantName ?? 'YoHa',
      }));
      if (!lines.length) return;
      replaceItems(lines);
      router.push('/(client)/cart');
    },
    [replaceItems],
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={accent.ember}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <Label tone="ember">Ton historique</Label>
          <Display size="h1" style={{ marginTop: 5 }}>
            Commandes
          </Display>
        </View>

        {loading ? (
          <View style={{ padding: 18, gap: 12 }}>
            <Skeleton height={100} />
            <Skeleton height={100} />
          </View>
        ) : !orders.length ? (
          <View style={{ alignItems: 'center', paddingTop: 90, paddingHorizontal: 32, gap: 12 }}>
            <Display size="h1" tone="fog">
              Rien encore
            </Display>
            <Body size="small" tone="dim" style={{ textAlign: 'center' }}>
              Ta première commande arrive en 20 minutes, et la livraison est offerte.
            </Body>
            <View style={{ width: '100%', maxWidth: 280, marginTop: 12 }}>
              <EmberButton label="Découvrir" onPress={() => router.push('/(client)')} />
            </View>
          </View>
        ) : (
          <>
            {live.length ? (
              <>
                <SectionHeader kicker="En direct" title="En cours" />
                <View style={{ paddingHorizontal: 18, gap: 10 }}>
                  {live.map((o, i) => (
                    <Rise key={o.id} delay={i * 50}>
                      <OrderRow order={o} onPress={() => router.push(`/(client)/order/${o.id}`)} live />
                    </Rise>
                  ))}
                </View>
              </>
            ) : null}

            {past.length ? (
              <>
                <SectionHeader kicker="Déjà goûté" title="Passées" />
                <View style={{ paddingHorizontal: 18, gap: 10 }}>
                  {past.map((o, i) => (
                    <Rise key={o.id} delay={i * 40}>
                      <OrderRow
                        order={o}
                        onPress={() => router.push(`/(client)/order/${o.id}`)}
                        onReorder={() => reorder(o)}
                      />
                    </Rise>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function OrderRow({
  order,
  onPress,
  onReorder,
  live,
}: {
  order: Order;
  onPress: () => void;
  onReorder?: () => void;
  live?: boolean;
}) {
  const first = order.items?.[0];
  const extra = Math.max(0, (order.items?.length ?? 0) - 1);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: radius.lg,
        backgroundColor: surface.soot,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: pressed ? accent.ember : live ? line.ember : line.hair,
      })}
    >
      <Image
        source={{ uri: resolveImageUrl(first?.img) }}
        contentFit="cover"
        style={{ width: 54, height: 54, borderRadius: radius.md, backgroundColor: surface.smoke }}
      />

      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Body size="small" weight="semibold" numberOfLines={1}>
          {order.restaurantName ?? 'YoHa'}
        </Body>
        <Body size="caption" tone="dim" numberOfLines={1}>
          {first?.name ?? '—'}
          {extra ? ` +${extra}` : ''}
        </Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <Pill tone={live ? 'mint' : 'dark'}>{STATUS_LABEL[order.status] ?? order.status}</Pill>
          <Money value={Number(order.totalDh ?? 0)} size={12} />
        </View>
      </View>

      {onReorder ? (
        <Body
          size="caption"
          weight="semibold"
          tone="ember"
          onPress={onReorder}
          suppressHighlighting
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: radius.full,
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: line.ember,
          }}
        >
          Reprendre
        </Body>
      ) : (
        <Glyph name="chevron" size={18} color={palette.dim} />
      )}
    </Pressable>
  );
}
