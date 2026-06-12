import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CancelOrderButton,
  CourierOrderCard,
} from '../../src/components/courier/CourierOrderCard';
import { CourierDashShell } from '../../src/components/courier/CourierDashShell';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { useCourierMe } from '../../src/hooks/useCourierMe';
import { useOrders } from '../../src/hooks/useOrders';
import { ordersApi } from '../../src/lib/api';
import { isActiveOrderStatus } from '../../src/lib/constants';
import { brand, ink } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

export default function CourierMine() {
  const { courier } = useCourierMe();
  const { orders, loading, error, refresh } = useOrders(8000);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mine = useMemo(
    () =>
      orders.filter(
        (o) =>
          courier?.id &&
          String(o.courierId) === String(courier.id) &&
          isActiveOrderStatus(o.status),
      ),
    [orders, courier?.id],
  );

  const updateStatus = async (orderId: string, status: string) => {
    setBusyId(orderId);
    try {
      await ordersApi.updateStatus(orderId, status);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (orderId: string, reason: string) => {
    await ordersApi.cancelOrder(orderId, reason);
    await refresh();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <CourierDashShell
      title="Mes courses en cours"
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
        {loading && mine.length === 0 ? (
          <ActivityIndicator color={brand[500]} style={{ marginTop: 32 }} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mine.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>Aucune course en cours</Text>
            <Text style={styles.emptySub}>Allez prendre une commande dans « Disponibles ».</Text>
          </View>
        ) : null}

        {mine.map((o) => (
          <CourierOrderCard key={o.id} order={o} showMap>
            {(o.status === 'pickup_confirmed' || o.status === 'preparing') && (
              <>
                <View
                  style={[
                    styles.statusBanner,
                    o.status === 'preparing' ? styles.bannerViolet : styles.bannerSky,
                  ]}
                >
                  <Text style={styles.statusBannerText}>
                    {o.status === 'preparing'
                      ? '📦 La commande vous attend au restaurant'
                      : '🛵 Direction le restaurant…'}
                  </Text>
                </View>
                <YohaButton
                  title={busyId === o.id ? 'Mise à jour…' : "✅ J'ai récupéré la commande"}
                  onPress={() => updateStatus(o.id, 'delivering')}
                  loading={busyId === o.id}
                />
                <CancelOrderButton phase="before_pickup" onCancel={(r) => cancel(o.id, r)} />
              </>
            )}
            {o.status === 'delivering' && (
              <>
                <View style={[styles.statusBanner, styles.bannerPink]}>
                  <Text style={styles.statusBannerText}>📍 Livraison en cours vers le client</Text>
                </View>
                <YohaButton
                  title={busyId === o.id ? 'Mise à jour…' : '✅ Marquer comme livré'}
                  onPress={() => updateStatus(o.id, 'delivered')}
                  loading={busyId === o.id}
                />
                <CancelOrderButton phase="after_pickup" onCancel={(r) => cancel(o.id, r)} />
              </>
            )}
          </CourierOrderCard>
        ))}
      </ScrollView>
    </CourierDashShell>
  );
}

const styles = StyleSheet.create({
  error: { color: '#ef4444', marginBottom: 12, fontFamily: fonts.medium },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { marginTop: 12, fontSize: 20, fontFamily: fonts.extrabold, color: ink[900] },
  emptySub: { marginTop: 6, fontSize: 14, fontFamily: fonts.medium, color: ink[500], textAlign: 'center' },
  statusBanner: {
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  bannerSky: { backgroundColor: 'rgba(14,165,233,0.12)' },
  bannerViolet: { backgroundColor: 'rgba(139,92,246,0.12)' },
  bannerPink: { backgroundColor: 'rgba(236,72,153,0.12)' },
  statusBannerText: { fontSize: 13, fontFamily: fonts.semibold, color: ink[700] },
});
