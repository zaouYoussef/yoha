import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CourierDashShell } from '../../src/components/courier/CourierDashShell';
import { CourierHistoryRow } from '../../src/components/courier/CourierHistoryRow';
import { CourierTodayGains } from '../../src/components/courier/CourierTodayGains';
import { useCourierMe } from '../../src/hooks/useCourierMe';
import { useOrders } from '../../src/hooks/useOrders';
import {
  MOCK_COURIER_GAIN_PER_DELIVERY_MAD,
  formatMad,
} from '../../src/lib/constants';
import { getTodayCourierStats } from '../../src/lib/courierOrder';
import { brand, ink } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

export default function CourierHistory() {
  const { courier } = useCourierMe();
  const { orders, loading, refresh } = useOrders(15000);
  const [refreshing, setRefreshing] = useState(false);

  const done = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            courier?.id &&
            String(o.courierId) === String(courier.id) &&
            (o.status === 'delivered' || o.status === 'cancelled'),
        )
        .sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        }),
    [orders, courier?.id],
  );

  const deliveredOnly = useMemo(() => done.filter((o) => o.status === 'delivered'), [done]);
  const todayStats = useMemo(
    () => getTodayCourierStats(deliveredOnly, MOCK_COURIER_GAIN_PER_DELIVERY_MAD),
    [deliveredOnly],
  );
  const totalGain = deliveredOnly.length * MOCK_COURIER_GAIN_PER_DELIVERY_MAD;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <CourierDashShell
      title="Historique"
      subtitle={courier ? `Connecté en tant que ${courier.name}` : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand[500]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <CourierTodayGains count={todayStats.count} totalMad={todayStats.totalMad} />

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total livraisons terminées</Text>
          <Text style={styles.summaryValue}>{deliveredOnly.length}</Text>
          <Text style={styles.summaryGain}>
            Gains estimés · {formatMad(totalGain, 0)} ({formatMad(MOCK_COURIER_GAIN_PER_DELIVERY_MAD, 0)} / course)
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          {done.length} course{done.length > 1 ? 's' : ''} terminée{done.length > 1 ? 's' : ''}
        </Text>

        {done.length === 0 && !loading ? (
          <Text style={styles.empty}>Aucune course terminée.</Text>
        ) : (
          done.map((o) => <CourierHistoryRow key={o.id} order={o} />)
        )}
      </ScrollView>
    </CourierDashShell>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: ink[100],
  },
  summaryLabel: { fontSize: 12, fontFamily: fonts.semibold, color: ink[500] },
  summaryValue: { marginTop: 4, fontSize: 28, fontFamily: fonts.extrabold, color: brand[600] },
  summaryGain: { marginTop: 6, fontSize: 13, fontFamily: fonts.medium, color: ink[600] },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 14,
    fontFamily: fonts.bold,
    color: ink[800],
  },
  empty: { textAlign: 'center', color: ink[500], marginTop: 24, fontFamily: fonts.medium },
});
