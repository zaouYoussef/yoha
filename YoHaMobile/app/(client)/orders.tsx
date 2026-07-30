import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, FlatList, Pressable, RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ordersApi, type Order } from '../../src/lib/api';
import { brand, gradients, ink, radius, shadows, typography } from '../../src/theme';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  accepted: { label: 'Acceptée', color: '#3b82f6', bg: '#dbeafe' },
  preparing: { label: 'En préparation', color: '#8b5cf6', bg: '#ede9fe' },
  delivering: { label: 'En livraison', color: brand[500], bg: brand[100] },
  delivered: { label: 'Livrée', color: '#10b981', bg: '#d1fae5' },
  cancelled: { label: 'Annulée', color: '#ef4444', bg: '#fee2e2' },
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'En cours' },
  { key: 'delivered', label: 'Livrées' },
  { key: 'cancelled', label: 'Annulées' },
] as const;

function formatOrderDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getItemCount(items?: Order['items']): number {
  return (items || []).reduce((sum, i) => sum + (i.qty || 1), 0);
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function ClientOrders() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchOrders = useCallback(async () => {
    try {
      const list = await ordersApi.list();
      setOrders(list);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (activeTab === 'active') return orders.filter((o) => ['pending', 'accepted', 'preparing', 'delivering'].includes(o.status));
    if (activeTab === 'delivered') return orders.filter((o) => o.status === 'delivered');
    if (activeTab === 'cancelled') return orders.filter((o) => o.status === 'cancelled');
    return orders;
  }, [orders, activeTab]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient colors={['#fff7ed', '#ffffff']} style={StyleSheet.absoluteFill} />
        <Text style={styles.headerTitle}>Mes commandes</Text>
      </Animated.View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <AnimatedFlatList
        data={filtered}
        keyExtractor={(o: any) => String(o.id || o.public_id || Math.random())}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand[500]} />}
        renderItem={({ item: order }: { item: any }) => {

          const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: ink[500], bg: ink[100] };
          return (
            <Pressable
              onPress={() => router.push(`/(client)/order/${order.public_id || order.id}`)}
              style={({ pressed }) => [
                styles.card,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardRestoRow}>
                  <Text style={styles.cardRestaurant} numberOfLines={1}>
                    {order.restaurantName || 'Restaurant'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <View style={styles.cardMeta}>
                <Text style={styles.cardDate}>{formatOrderDate(order.createdAt)}</Text>
                <Text style={styles.cardDot}>·</Text>
                <Text style={styles.cardItems}>{getItemCount(order.items)} article(s)</Text>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.cardTotal}>Total: <Text style={styles.cardTotalValue}>{Number(order.totalDh || 0).toFixed(2)} DH</Text></Text>
                {order.items && order.items.length > 0 && (
                  <Text style={styles.cardItemPreview} numberOfLines={1}>
                    {order.items.slice(0, 3).map((i: any) => i.name).join(', ')}

                    {order.items.length > 3 ? '…' : ''}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
        ListHeaderComponent={
          loading ? (
            <View>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.skeleton, { marginBottom: 12 }]}>
                  <View style={[styles.skelLine, { width: '50%' }]} />
                  <View style={[styles.skelLine, { width: '30%', marginTop: 8 }]} />
                  <View style={[styles.skelLine, { width: '65%', marginTop: 8 }]} />
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>Aucune commande</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'all' ? 'Passez votre première commande dès maintenant.' : 'Aucune commande dans cette catégorie.'}
              </Text>
              <Pressable onPress={() => router.back()} style={styles.orderBtn}>
                <Text style={styles.orderBtnText}>Commander</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { ...typography.h1, color: ink[900] },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: ink[200],
  },
  tabActive: { backgroundColor: brand[500], borderColor: brand[500] },
  tabLabel: { fontSize: 13, fontWeight: '700', color: ink[600] },
  tabLabelActive: { color: '#ffffff' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: ink[100],
    shadowColor: ink[900], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardRestoRow: { flex: 1, marginRight: 8 },
  cardRestaurant: { ...typography.h3, color: ink[900] },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  cardDate: { fontSize: 12, color: ink[400], fontWeight: '500' },
  cardDot: { fontSize: 12, color: ink[300] },
  cardItems: { fontSize: 12, color: ink[400], fontWeight: '500' },
  cardBottom: {},
  cardTotal: { fontSize: 14, color: ink[500] },
  cardTotalValue: { fontSize: 15, fontWeight: '800', color: brand[500] },
  cardItemPreview: { fontSize: 12, color: ink[400], marginTop: 4 },
  skeleton: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: ink[200] },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...typography.h2, color: ink[900], marginBottom: 8 },
  emptyDesc: { ...typography.body, color: ink[500], textAlign: 'center', marginBottom: 24 },
  orderBtn: {
    backgroundColor: brand[500], paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: radius.full,
  },
  orderBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
});
