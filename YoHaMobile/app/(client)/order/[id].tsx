import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiBurst } from '../../../src/components/ConfettiBurst';
import { StatusPill } from '../../../src/components/StatusPill';
import { YohaButton } from '../../../src/components/ui/YohaButton';
import { useToast } from '../../../src/contexts/ToastContext';
import { Order, ordersApi } from '../../../src/lib/api';
import { useLayoutChrome } from '../../../src/lib/layoutChrome';
import {
  CLIENT_TRACK_STEPS,
  ORDER_STATES,
  ORDER_STATUS_TOASTS,
  formatMad,
  isActiveOrderStatus,
} from '../../../src/lib/constants';
import { brand, gradients, ink, radius, shadows } from '../../../src/theme';
import { fonts } from '../../../src/theme/fonts';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { footerBottomPadding } = useLayoutChrome();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const prevStatus = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ordersApi.get(String(id));
      if (prevStatus.current && prevStatus.current !== data.status) {
        const toast = ORDER_STATUS_TOASTS[data.status];
        if (toast) showToast(toast.title, toast.desc);
      }
      prevStatus.current = data.status;
      setOrder(data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const handleCancel = async () => {
    if (!order || !isActiveOrderStatus(order.status)) return;
    setCancelling(true);
    try {
      await ordersApi.cancelOrder(String(order.id), 'Annulée par le client');
      await load();
      showToast('Commande annulée', 'Votre commande a été annulée.');
    } catch {
      showToast('Erreur', 'Impossible d’annuler la commande.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: '#fff7ed' }]}>
        <ActivityIndicator color={brand[500]} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: '#fff7ed', padding: 24 }]}>
        <Text style={styles.error}>Commande introuvable</Text>
        <YohaButton title="Retour" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const state = ORDER_STATES[order.status] || ORDER_STATES.placed;
  const currentStep = CLIENT_TRACK_STEPS.indexOf(order.status);
  const isDelivered = order.status === 'delivered';
  const canCancel = isActiveOrderStatus(order.status);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff7ed' }}>
      <ConfettiBurst active={isDelivered} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: footerBottomPadding + 24 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={brand[500]} />}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>

        <LinearGradient colors={[...gradients.primary]} style={[styles.heroCard, shadows.glow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.heroEmoji}>{isDelivered ? '🎉' : '🛵'}</Text>
          <Text style={styles.heroTitle}>Commande #{order.id}</Text>
          <Text style={styles.heroResto}>{order.restaurantName}</Text>
          <StatusPill label={state.label} color={state.color} />
        </LinearGradient>

        {isActiveOrderStatus(order.status) ? (
          <View style={[styles.mapCard, shadows.card]}>
            <Text style={styles.mapTitle}>📍 Suivi en direct</Text>
            <View style={styles.mapPlaceholder}>
              <LinearGradient colors={['#e0f2fe', '#f0fdf4']} style={styles.mapGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.mapPin}>📍</Text>
                <Text style={styles.mapLabel}>CHU-Tanger</Text>
                <View style={styles.mapRoute}>
                  <Text style={styles.mapDot}>🍽️</Text>
                  <View style={styles.mapLine} />
                  <Text style={styles.mapDot}>🛵</Text>
                  <View style={styles.mapLine} />
                  <Text style={styles.mapDot}>🏠</Text>
                </View>
                <Text style={styles.mapEta}>Arrivée estimée · 15–20 min</Text>
              </LinearGradient>
            </View>
            {order.courierName ? (
              <Text style={styles.courier}>Livreur · {order.courierName}</Text>
            ) : (
              <Text style={styles.courier}>Un livreur sera assigné sous peu</Text>
            )}
          </View>
        ) : null}

        <View style={[styles.track, shadows.card]}>
          <Text style={styles.trackTitle}>Étapes de livraison</Text>
          {CLIENT_TRACK_STEPS.map((step, idx) => {
            const s = ORDER_STATES[step];
            const done = order.status === 'cancelled' ? false : currentStep >= idx;
            const active = order.status === step || (order.status === 'preparing' && step === 'pickup_confirmed');
            return (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{s.label}</Text>
                  {active ? <Text style={styles.stepMsg}>{s.clientMsg}</Text> : null}
                </View>
              </View>
            );
          })}
          {order.status === 'cancelled' ? (
            <Text style={styles.cancelled}>Cette commande a été annulée.</Text>
          ) : null}
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Articles</Text>
          {(order.items || []).map((item, i) => (
            <Text key={i} style={styles.itemLine}>
              {item.qty}× {item.name} — {formatMad(Number(item.price) * item.qty)}
            </Text>
          ))}
          <Text style={styles.total}>Total · {formatMad(Number(order.totalDh || 0))}</Text>
        </View>

        {order.customer?.address ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Livraison</Text>
            <Text style={styles.address}>{order.customer.address}</Text>
            {order.customer.phone ? <Text style={styles.phone}>{order.customer.phone}</Text> : null}
          </View>
        ) : null}

        {canCancel ? (
          <YohaButton
            title={cancelling ? 'Annulation…' : 'Annuler la commande'}
            variant="ghost"
            onPress={handleCancel}
            loading={cancelling}
            style={{ marginTop: 8 }}
          />
        ) : null}

        <YohaButton
          title="Retour aux commandes"
          onPress={() => router.push('/(client)/orders' as never)}
          style={{ marginTop: 16, marginBottom: 32 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  back: { fontFamily: fonts.semibold, color: brand[600], marginBottom: 16, fontSize: 15 },
  heroCard: { borderRadius: radius.xl, padding: 24, alignItems: 'center', marginBottom: 20 },
  heroEmoji: { fontSize: 48 },
  heroTitle: { marginTop: 8, fontFamily: fonts.display, fontSize: 24, color: '#fff' },
  heroResto: { marginTop: 4, fontFamily: fonts.medium, fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  mapTitle: { fontFamily: fonts.bold, fontSize: 16, color: ink[900], marginBottom: 12 },
  mapPlaceholder: { borderRadius: radius.lg, overflow: 'hidden' },
  mapGradient: { padding: 24, alignItems: 'center', minHeight: 160 },
  mapPin: { fontSize: 32 },
  mapLabel: { marginTop: 8, fontFamily: fonts.bold, fontSize: 15, color: ink[700] },
  mapRoute: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 4 },
  mapDot: { fontSize: 22 },
  mapLine: { width: 40, height: 3, backgroundColor: brand[300], borderRadius: 2 },
  mapEta: { marginTop: 16, fontFamily: fonts.semibold, fontSize: 13, color: '#15803d' },
  courier: { marginTop: 12, fontFamily: fonts.medium, fontSize: 13, color: ink[500], textAlign: 'center' },
  track: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  trackTitle: { fontSize: 16, fontFamily: fonts.extrabold, marginBottom: 16, color: ink[900] },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ink[200],
    marginTop: 4,
  },
  stepDotDone: { backgroundColor: brand[500] },
  stepDotActive: { width: 18, height: 18, borderRadius: 9, marginTop: 2, backgroundColor: brand[500] },
  stepLabel: { fontFamily: fonts.semibold, fontSize: 14, color: ink[500] },
  stepLabelActive: { color: ink[900], fontFamily: fonts.bold },
  stepMsg: { marginTop: 4, fontFamily: fonts.medium, fontSize: 13, color: ink[500], lineHeight: 18 },
  cancelled: { color: '#ef4444', fontFamily: fonts.medium, marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ink[100],
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: ink[900], marginBottom: 10 },
  itemLine: { fontFamily: fonts.medium, fontSize: 14, color: ink[600], marginBottom: 6 },
  total: { marginTop: 10, fontFamily: fonts.extrabold, fontSize: 18, color: brand[600] },
  address: { fontFamily: fonts.medium, fontSize: 14, color: ink[600] },
  phone: { marginTop: 4, fontFamily: fonts.medium, fontSize: 13, color: ink[400] },
  error: { fontSize: 16, fontFamily: fonts.medium, color: ink[600] },
});
