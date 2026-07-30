import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, FlatList, Pressable, RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { Image } from 'expo-image';

import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ordersApi, type Order } from '../../src/lib/api';
import { brand, gradients, ink, radius, shadows } from '../../src/theme';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'En attente', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
  accepted: { label: 'Acceptée', color: '#2563eb', bg: '#dbeafe', icon: '👍' },
  preparing: { label: 'En préparation', color: '#7c3aed', bg: '#ede9fe', icon: '🍳' },
  delivering: { label: 'En cours de livraison', color: brand[600], bg: '#fff7ed', icon: '🏍️' },
  delivered: { label: 'Livrée avec succès', color: '#059669', bg: '#d1fae5', icon: '✅' },
  cancelled: { label: 'Annulée', color: '#dc2626', bg: '#fee2e2', icon: '❌' },
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'En cours 🏍️' },
  { key: 'delivered', label: 'Livrées ✅' },
  { key: 'cancelled', label: 'Annulées' },
] as const;

function formatOrderDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 32, height: 32, borderRadius: 8 }} contentFit="contain" />
          <Text style={styles.headerTitle}>Mes Commandes YoHa</Text>
        </View>
        <Text style={styles.headerSub}>Suivez la livraison de vos plats et produits en direct</Text>
      </View>


      {/* Tabs Row */}
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
          const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: ink[500], bg: ink[100], icon: '📋' };
          const isDelivered = order.status === 'delivered';

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
                    📍 {order.restaurantName || 'Restaurant YoHa'}
                  </Text>
                  <Text style={styles.cardDate}>{formatOrderDate(order.createdAt)}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.color }]}>
                    {cfg.icon} {cfg.label}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Items Summary */}
              {order.items && order.items.length > 0 && (
                <View style={styles.itemsWrap}>
                  {order.items.slice(0, 3).map((item: any, idx: number) => (
                    <Text key={idx} style={styles.itemRowText} numberOfLines={1}>
                      • {item.qty || 1}x {item.name}
                    </Text>
                  ))}
                  {order.items.length > 3 ? (
                    <Text style={styles.moreItemsText}>+ {order.items.length - 3} autres articles</Text>
                  ) : null}
                </View>
              )}

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardTotalLabel}>
                  Total : <Text style={styles.cardTotalValue}>{Number(order.totalDh || 0).toFixed(2)} DH</Text>
                </Text>

                {isDelivered && (
                  <View style={styles.reorderBtn}>
                    <Text style={styles.reorderBtnText}>Recommander 🔄</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>Aucune commande trouvée</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'all' ? 'Vous n’avez pas encore passé de commande.' : 'Aucune commande dans cette section.'}
              </Text>
              <Pressable onPress={() => router.replace('/(client)')} style={styles.orderBtnWrap}>
                <LinearGradient colors={gradients.hero} style={styles.orderBtn}>
                  <Text style={styles.orderBtnText}>Commander maintenant ➔</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: ink[400],
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabActive: {
    backgroundColor: brand[500],
    borderColor: brand[500],
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: ink[600],
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardRestoRow: {
    flex: 1,
    marginRight: 10,
  },
  cardRestaurant: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 11,
    fontWeight: '600',
    color: ink[400],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  itemsWrap: {
    marginBottom: 10,
  },
  itemRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: ink[700],
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 11,
    fontWeight: '700',
    color: brand[500],
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ink[500],
  },
  cardTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: brand[600],
  },
  reorderBtn: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: brand[600],
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: ink[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  orderBtnWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  orderBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  orderBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
});
