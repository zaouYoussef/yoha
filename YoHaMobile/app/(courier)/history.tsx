import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { type Order } from '../../src/lib/api';
import { useCourierMe } from '../../src/hooks/useCourierMe';
import { useOrders } from '../../src/hooks/useOrders';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { getTodayCourierStats } from '../../src/lib/courierOrder';
import { MOCK_COURIER_GAIN_PER_DELIVERY_MAD } from '../../src/lib/constants';
import { formatOrderWhen, orderFoodTotal, sortOrdersNewest } from '../../src/lib/restaurantOrder';
import { accent, line, radius, surface } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label, Money } from '../../src/components/yoha/Type';
import { Hairline, SectionHeader, Skeleton } from '../../src/components/yoha/Atoms';
import { Rise } from '../../src/components/yoha/Motion';
import { OpsEmpty, OpsHeader, StatStrip } from '../../src/components/yoha/Ops';

export default function CourierHistory() {
  const { courier } = useCourierMe();
  const { orders, loading, refresh } = useOrders(20000);
  const { scrollBottomPadding } = useLayoutChrome();
  const [refreshing, setRefreshing] = useState(false);

  const delivered = useMemo(() => {
    const id = String(courier?.id ?? '');
    if (!id) return [];
    return sortOrdersNewest(
      orders.filter((o) => String(o.courierId ?? '') === id && o.status === 'delivered'),
    );
  }, [orders, courier]);

  const today = getTodayCourierStats(delivered, MOCK_COURIER_GAIN_PER_DELIVERY_MAD);
  const totalGain = delivered.length * MOCK_COURIER_GAIN_PER_DELIVERY_MAD;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={accent.violet}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        }
      >
        <OpsHeader kicker={courier?.name ?? 'Livreur'} title="Historique" tone="violet" />

        <StatStrip
          items={[
            { label: "Aujourd'hui", value: String(today.count) },
            { label: 'Gagné ce jour', value: '', money: today.totalMad, tone: 'violet' },
            { label: 'Total courses', value: String(delivered.length) },
          ]}
        />

        {/* Le cumul global, en petit : la journée compte plus que la carrière. */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 12,
            padding: 14,
            borderRadius: radius.lg,
            backgroundColor: surface.ash,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: line.hair,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Label tone="dim" style={{ flex: 1 }}>
            Cumul depuis le début
          </Label>
          <Money value={totalGain} size={16} />
        </View>

        {loading && !orders.length ? (
          <View style={{ padding: 18, gap: 12 }}>
            <Skeleton height={70} />
            <Skeleton height={70} />
          </View>
        ) : !delivered.length ? (
          <OpsEmpty
            title="Rien de livré"
            line="Ta première course apparaîtra ici, avec le gain correspondant."
          />
        ) : (
          <>
            <SectionHeader kicker="Terminé" title="Courses livrées" tone="violet" />
            <View style={{ paddingHorizontal: 18 }}>
              {delivered.map((o, i) => (
                <Rise key={o.id} delay={Math.min(i, 8) * 35}>
                  <HistoryRow order={o} first={i === 0} />
                </Rise>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function HistoryRow({ order, first }: { order: Order; first: boolean }) {
  return (
    <View>
      {first ? null : <Hairline />}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Body size="small" weight="semibold" numberOfLines={1}>
            {order.restaurantName ?? 'Restaurant'}
          </Body>
          <Body size="caption" tone="dim" numberOfLines={1} style={{ marginTop: 2 }}>
            {order.customer?.address || formatOrderWhen(order.createdAt) || `#${order.id}`}
          </Body>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Money value={MOCK_COURIER_GAIN_PER_DELIVERY_MAD} size={14} tone="mint" />
          <Body size="caption" tone="dim" style={{ marginTop: 2 }}>
            panier {Math.round(orderFoodTotal(order))} DH
          </Body>
        </View>
      </View>
    </View>
  );
}
