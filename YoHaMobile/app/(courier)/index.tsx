import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CourierDashShell } from '../../src/components/courier/CourierDashShell';
import { CourierHeroBanner } from '../../src/components/courier/CourierHeroBanner';
import { CourierOrderCard } from '../../src/components/courier/CourierOrderCard';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { useCourierMe } from '../../src/hooks/useCourierMe';
import { useOrders } from '../../src/hooks/useOrders';
import { ordersApi } from '../../src/lib/api';
import { brand, ink } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

export default function CourierAvailable() {
  const { courier } = useCourierMe();
  const { orders, loading, error, refresh } = useOrders(8000);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const available = useMemo(
    () => orders.filter((o) => !o.courierId && (o.status === 'placed' || o.status === 'preparing')),
    [orders],
  );

  const handleClaim = async (orderId: string) => {
    setClaiming(orderId);
    try {
      await ordersApi.claimOrder(orderId);
      await refresh();
      router.push('/(courier)/mine' as never);
    } finally {
      setClaiming(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <CourierDashShell
      title="Commandes disponibles"
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
        <CourierHeroBanner count={available.length} />

        {loading && orders.length === 0 ? (
          <ActivityIndicator color={brand[500]} style={{ marginTop: 32 }} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {available.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍕</Text>
            <Text style={styles.emptyTitle}>Pause bien méritée</Text>
            <Text style={styles.emptySub}>Aucune commande disponible pour l&apos;instant.</Text>
          </View>
        ) : null}

        {available.map((o) => (
          <CourierOrderCard key={o.id} order={o}>
            {o.status === 'preparing' ? (
              <View style={styles.readyBanner}>
                <Text style={styles.readyText}>
                  📦 Déjà prête au restaurant — confirmez pour récupérer
                </Text>
              </View>
            ) : null}
            <YohaButton
              title={claiming === o.id ? 'Confirmation…' : '✅ Confirmer la course'}
              onPress={() => handleClaim(o.id)}
              loading={claiming === o.id}
            />
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
  readyBanner: {
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  readyText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#6d28d9',
    textAlign: 'center',
  },
});
