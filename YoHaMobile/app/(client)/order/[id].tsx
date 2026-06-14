import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
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
import { PremiumBackground } from '../../../src/components/PremiumBackground';
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

function formatScheduledTime(iso: string) {
  try {
    const s = new Date(iso);
    const e = new Date(s.getTime() + 30 * 60 * 1000);
    const opts: Intl.DateTimeFormatOptions = {
      weekday: 'short', day: 'numeric', month: 'short',
    };
    const day = s.toLocaleDateString('fr-FR', opts);
    const sh = String(s.getHours()).padStart(2, '0');
    const sm = String(s.getMinutes()).padStart(2, '0');
    const eh = String(e.getHours()).padStart(2, '0');
    const em = String(e.getMinutes()).padStart(2, '0');
    return `${day}, ${sh}:${sm} → ${eh}:${em}`;
  } catch {
    return iso;
  }
}

export default function OrderDetailScreen() {
  const { id, justPlaced } = useLocalSearchParams<{ id: string; justPlaced?: string }>();
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
    <PremiumBackground>
      <View style={{ flex: 1 }}>
        <ConfettiBurst active={isDelivered || justPlaced === 'true'} />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: footerBottomPadding + 24 }]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={brand[500]} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Action Row */}
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Retour</Text>
            </Pressable>
            <View style={styles.headerDot} />
            <Text style={styles.headerSubtitle}>Suivi de commande</Text>
          </View>

          {/* Hero Order Card */}
          <LinearGradient
            colors={['#1e1b4b', '#3b0764']}
            style={[styles.heroCard, shadows.glow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroGlowCircle} />
            <Text style={styles.heroEmoji}>{isDelivered ? '🎉' : '🛵'}</Text>
            <Text style={styles.heroTitle}>Commande #{order.id}</Text>
            <Text style={styles.heroResto}>👨‍🍳 {order.restaurantName}</Text>
            <View style={{ marginTop: 8 }}>
              <StatusPill label={state.label} color={state.color} />
            </View>
          </LinearGradient>

          {/* GPS Live Tracking Radar Card */}
          {isActiveOrderStatus(order.status) ? (
            <View style={[styles.mapCard, shadows.card]}>
              <Text style={styles.cardTitle}>📍 Suivi GPS en direct</Text>
              <View style={styles.mapPlaceholder}>
                <LinearGradient
                  colors={['#fff7ed', '#ffedd5']}
                  style={styles.mapGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.mapRoute}>
                    <View style={styles.mapPoint}>
                      <Text style={{ fontSize: 20 }}>🍳</Text>
                    </View>
                    
                    <View style={styles.mapLineContainer}>
                      <View style={[styles.mapLineFill, { width: `${Math.min(100, Math.max(10, (currentStep + 1) * 25))}%` }]} />
                    </View>

                    <View style={[styles.mapPoint, styles.pulsingCourier]}>
                      <Text style={{ fontSize: 20 }}>🛵</Text>
                    </View>

                    <View style={styles.mapLineContainer}>
                      <View style={[styles.mapLineFill, { width: '0%' }]} />
                    </View>

                    <View style={styles.mapPoint}>
                      <Text style={{ fontSize: 20 }}>🏠</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.mapEta}>Livraison estimée · 15–20 min</Text>
                </LinearGradient>
              </View>
              {order.courierName ? (
                <View style={styles.courierInfo}>
                  <Text style={styles.courierNameText}>Livreur assigné : {order.courierName} 📱</Text>
                  <Text style={styles.courierSubText}>En route vers votre adresse</Text>
                </View>
              ) : (
                <View style={styles.courierInfo}>
                  <Text style={styles.courierNameText}>Recherche d'un livreur... ⚡</Text>
                  <Text style={styles.courierSubText}>Votre repas est déjà en cours de préparation</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Stepper Timeline */}
          <View style={[styles.trackCard, shadows.card]}>
            <Text style={styles.cardTitle}>Étapes de livraison</Text>
            
            <View style={styles.timelineContainer}>
              {/* Vertical connector line */}
              <View style={styles.timelineVerticalLine} />

              {CLIENT_TRACK_STEPS.map((step, idx) => {
                const s = ORDER_STATES[step];
                const done = order.status === 'cancelled' ? false : currentStep >= idx;
                const active = order.status === step || (order.status === 'preparing' && step === 'pickup_confirmed');
                
                return (
                  <View key={step} style={styles.stepRow}>
                    <View style={styles.stepDotContainer}>
                      {active ? (
                        <View style={styles.pulsingDotOuter}>
                          <View style={styles.pulsingDotInner} />
                        </View>
                      ) : (
                        <View style={[styles.stepDotStatic, done && styles.stepDotDone]} />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && !active && styles.stepLabelDone]}>
                        {s.label}
                      </Text>
                      {active ? (
                        <View style={styles.activeMsgBox}>
                          <Text style={styles.stepMsg}>{s.clientMsg}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            {order.status === 'cancelled' ? (
              <View style={styles.cancelledBox}>
                <Text style={styles.cancelledText}>❌ Commande annulée</Text>
                <Text style={styles.cancelledReason}>{order.cancellationReason || 'Annulée à la demande de l\'utilisateur.'}</Text>
              </View>
            ) : null}
          </View>

          {/* Articles/Receipt Card */}
          <View style={[styles.receiptCard, shadows.card]}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>🧾 Détail de la commande</Text>
            </View>
            
            <View style={styles.receiptBody}>
              {(order.items || []).map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  {item.img ? (
                    <Image source={{ uri: item.img }} style={styles.itemImage} contentFit="cover" />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Text style={{ fontSize: 14 }}>🍔</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemQtyPrice}>Quantité : {item.qty} · {formatMad(Number(item.price))}</Text>
                  </View>
                  <Text style={styles.itemTotalLine}>{formatMad(Number(item.price) * item.qty)}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.receiptDivider} />
            
            <View style={styles.receiptFooter}>
              <Text style={styles.totalLabel}>Total payé</Text>
              <Text style={styles.totalValue}>{formatMad(Number(order.totalDh || 0))}</Text>
            </View>
          </View>

          {/* Delivery Details */}
          {order.customer?.address ? (
            <View style={[styles.infoCard, shadows.card]}>
              <Text style={styles.cardTitle}>📍 Détails de livraison</Text>
              {order.scheduledDeliveryAt ? (
                <View style={styles.scheduledTimeRow}>
                  <Text style={styles.scheduledTimeEmoji}>🕐</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduledTimeLabel}>Livraison programmée</Text>
                    <Text style={styles.scheduledTimeValue}>{formatScheduledTime(String(order.scheduledDeliveryAt))}</Text>
                  </View>
                </View>
              ) : null}
              <Text style={styles.addressText}>{order.customer.address}</Text>
              {order.customer.name ? (
                <Text style={styles.infoMetaText}>👤 Destinataire : {order.customer.name}</Text>
              ) : null}
              {order.customer.phone ? (
                <Text style={styles.infoMetaText}>📞 Téléphone : {order.customer.phone}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Cancel button */}
          {canCancel ? (
            <YohaButton
              title={cancelling ? 'Annulation en cours…' : 'Annuler la commande'}
              variant="ghost"
              onPress={handleCancel}
              loading={cancelling}
              style={{ marginTop: 12 }}
            />
          ) : null}

          <YohaButton
            title="← Retour aux commandes"
            onPress={() => router.push('/(client)/orders' as never)}
            style={{ marginTop: 14, marginBottom: 32 }}
          />
        </ScrollView>
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  backText: {
    fontFamily: fonts.bold,
    color: brand[700],
    fontSize: 13,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ink[300],
    marginHorizontal: 12,
  },
  headerSubtitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: ink[500],
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    filter: 'blur(30px)',
  },
  heroEmoji: { fontSize: 52 },
  heroTitle: { marginTop: 8, fontFamily: fonts.display, fontSize: 26, color: '#ffffff', letterSpacing: -0.5 },
  heroResto: { marginTop: 4, fontFamily: fonts.medium, fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  mapCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: ink[800], marginBottom: 12 },
  mapPlaceholder: { borderRadius: radius.lg, overflow: 'hidden' },
  mapGradient: { padding: 20, alignItems: 'center', minHeight: 120, position: 'relative', justifyContent: 'center' },
  mapRoute: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapPoint: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ink[200],
  },
  pulsingCourier: {
    backgroundColor: brand[500],
    borderColor: '#ffffff',
    transform: [{ scale: 1.15 }],
  },
  mapLineContainer: {
    width: 44,
    height: 4,
    backgroundColor: ink[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  mapLineFill: {
    height: '100%',
    backgroundColor: brand[500],
  },
  mapEta: { marginTop: 14, fontFamily: fonts.bold, fontSize: 13, color: brand[700] },
  courierInfo: {
    marginTop: 14,
    alignItems: 'center',
    backgroundColor: ink[50],
    borderRadius: radius.md,
    padding: 10,
  },
  courierNameText: { fontFamily: fonts.bold, fontSize: 13, color: ink[800] },
  courierSubText: { fontFamily: fonts.medium, fontSize: 11, color: ink[400], marginTop: 2 },
  trackCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  timelineContainer: {
    position: 'relative',
    marginTop: 10,
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 17,
    top: 10,
    bottom: 20,
    width: 3,
    backgroundColor: ink[100],
  },
  stepRow: { flexDirection: 'row', gap: 16, marginBottom: 20, alignItems: 'flex-start' },
  stepDotContainer: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotStatic: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ink[200],
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  stepDotDone: {
    backgroundColor: brand[500],
  },
  pulsingDotOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(236,72,153,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: brand[500],
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  stepContent: { flex: 1, paddingTop: 2 },
  stepLabel: { fontFamily: fonts.semibold, fontSize: 14, color: ink[400] },
  stepLabelActive: { color: ink[800], fontFamily: fonts.extrabold, fontSize: 15 },
  stepLabelDone: { color: ink[700] },
  activeMsgBox: {
    marginTop: 6,
    backgroundColor: brand[50],
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: brand[100],
  },
  stepMsg: { fontFamily: fonts.medium, fontSize: 12, color: brand[800], lineHeight: 17 },
  cancelledBox: {
    marginTop: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: radius.md,
    padding: 12,
  },
  cancelledText: { color: '#dc2626', fontFamily: fonts.bold, fontSize: 14 },
  cancelledReason: { color: '#7f1d1d', fontFamily: fonts.medium, fontSize: 12, marginTop: 4 },
  
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  receiptHeader: {
    marginBottom: 14,
  },
  receiptTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: ink[800] },
  receiptBody: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
  },
  itemImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink[800],
  },
  itemQtyPrice: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: ink[400],
    marginTop: 2,
  },
  itemTotalLine: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink[800],
  },
  receiptDivider: {
    height: 1,
    backgroundColor: ink[100],
    marginVertical: 14,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink[800],
  },
  totalValue: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: brand[600],
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  addressText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: ink[700],
    lineHeight: 18,
  },
  infoMetaText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink[400],
    marginTop: 6,
  },
  error: { fontSize: 16, fontFamily: fonts.medium, color: ink[600] },
  scheduledTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    backgroundColor: brand[50],
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: brand[100],
  },
  scheduledTimeEmoji: { fontSize: 18 },
  scheduledTimeLabel: { fontFamily: fonts.bold, fontSize: 12, color: brand[800] },
  scheduledTimeValue: { fontFamily: fonts.bold, fontSize: 14, color: brand[600], marginTop: 2 },
});
