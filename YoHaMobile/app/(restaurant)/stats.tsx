import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useOrders } from '../../src/hooks/useOrders';
import { useRestaurantMe } from '../../src/hooks/useRestaurantMe';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import {
  belongsToRestaurant,
  bucketOrderCountLast7Days,
  bucketRevenueLast7Days,
  last7DayLabels,
} from '../../src/lib/restaurantOrder';
import { isRestaurantStatsOrder } from '../../src/lib/constants';
import { accent, line, radius, surface } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label, Money } from '../../src/components/yoha/Type';
import { Hairline, SectionHeader, Skeleton } from '../../src/components/yoha/Atoms';
import { OpsCard, OpsEmpty, OpsHeader, StatStrip } from '../../src/components/yoha/Ops';

export default function RestaurantStats() {
  const { restaurant, restoId } = useRestaurantMe();
  const { orders, loading, refresh } = useOrders(30000);
  const { scrollBottomPadding } = useLayoutChrome();
  const [refreshing, setRefreshing] = useState(false);

  const mine = useMemo(
    () =>
      orders.filter((o) => belongsToRestaurant(o, restoId) && isRestaurantStatsOrder(o)),
    [orders, restoId],
  );

  const labels = useMemo(() => last7DayLabels(), []);
  const revenue = useMemo(
    () => bucketRevenueLast7Days(orders, String(restoId ?? '')),
    [orders, restoId],
  );
  const counts = useMemo(
    () => bucketOrderCountLast7Days(orders, String(restoId ?? '')),
    [orders, restoId],
  );

  const week = revenue.reduce((s, v) => s + v, 0);
  const weekCount = counts.reduce((s, v) => s + v, 0);
  const basket = weekCount ? week / weekCount : 0;

  /* Les plats les plus vendus : ce qu'il faut mettre en avant demain. */
  const top = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number }>();
    for (const o of mine) {
      for (const it of o.items ?? []) {
        const key = it.name;
        const entry = map.get(key) ?? { name: key, qty: 0, total: 0 };
        entry.qty += Number(it.qty) || 0;
        entry.total += (Number(it.price) || 0) * (Number(it.qty) || 0);
        map.set(key, entry);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [mine]);

  const peak = Math.max(1, ...revenue);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={accent.ember}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        }
      >
        <OpsHeader kicker={restaurant?.name ?? 'Cuisine'} title="Sept jours" />

        <StatStrip
          items={[
            { label: 'Chiffre 7j', value: '', money: week, tone: 'ember' },
            { label: 'Commandes', value: String(weekCount) },
            { label: 'Panier moyen', value: '', money: Math.round(basket) },
          ]}
        />

        {loading && !orders.length ? (
          <View style={{ padding: 18, gap: 12 }}>
            <Skeleton height={180} />
          </View>
        ) : !mine.length ? (
          <OpsEmpty
            title="Pas de données"
            line="Les statistiques apparaissent dès la première commande traitée."
          />
        ) : (
          <>
            {/* Histogramme en barres verticales : lisible d'un coup d'œil, aucune librairie. */}
            <SectionHeader kicker="Jour par jour" title="Recette" />
            <View
              style={{
                marginHorizontal: 18,
                padding: 16,
                borderRadius: radius.xl,
                backgroundColor: surface.soot,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: line.hair,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                  height: 132,
                }}
              >
                {revenue.map((v, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                    <Body size="caption" tone="dim">
                      {v ? Math.round(v) : ''}
                    </Body>
                    <View
                      style={{
                        width: '100%',
                        height: Math.max(3, (v / peak) * 92),
                        borderRadius: 6,
                        backgroundColor: v === peak && v > 0 ? accent.ember : line.soft,
                      }}
                    />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                {labels.map((l, i) => (
                  <Label key={`${l}-${i}`} tone="dim" style={{ flex: 1, textAlign: 'center' }}>
                    {l}
                  </Label>
                ))}
              </View>
            </View>

            {top.length ? (
              <>
                <SectionHeader kicker="Ce qui part" title="Top plats" />
                <OpsCard style={{ marginHorizontal: 18 }}>
                  {top.map((t, i) => (
                    <View key={t.name}>
                      {i ? <Hairline /> : null}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingVertical: 11,
                        }}
                      >
                        <Display size="h3" tone={i === 0 ? 'ember' : 'dim'} style={{ width: 26 }}>
                          {i + 1}
                        </Display>
                        <Body size="small" style={{ flex: 1 }} numberOfLines={1}>
                          {t.name}
                        </Body>
                        <Body size="caption" tone="dim">
                          ×{t.qty}
                        </Body>
                        <Money value={t.total} size={13} tone="fog" />
                      </View>
                    </View>
                  ))}
                </OpsCard>
              </>
            ) : null}

            <Body
              size="caption"
              tone="dim"
              style={{ textAlign: 'center', marginTop: 24, paddingHorizontal: 32 }}
            >
              Recette hors frais de livraison, calculée sur {mine.length} commandes traitées.
            </Body>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
