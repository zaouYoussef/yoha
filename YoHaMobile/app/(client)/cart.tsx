import React, { useCallback, useMemo } from 'react';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCart } from '../../src/contexts/CartContext';
import { brand, gradients, ink, radius, shadows, typography } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ClientCart() {
  const insets = useSafeAreaInsets();
  const { items, count, subtotal, restaurantId, updateQty, removeItem, clear } = useCart();
  const restaurantName = items[0]?.restaurantName;

  const serviceFee = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const deliveryFee = subtotal >= 40 ? 0 : 8;
  const total = subtotal + serviceFee + deliveryFee;

  const handleCheckout = useCallback(() => {
    if (items.length === 0) return;
    router.push('/(client)/checkout');
  }, [items.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#fff7ed', '#ffffff']} style={styles.header}>
        <Text style={styles.headerTitle}>Mon panier</Text>
        <Text style={styles.headerCount}>{count} article{count > 1 ? 's' : ''}</Text>
        {items.length > 0 && (
          <Pressable onPress={clear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Vider</Text>
          </Pressable>
        )}
      </LinearGradient>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyDesc}>Ajoutez quelques délices et ils apparaîtront ici.</Text>
          <Pressable onPress={() => router.back()} style={styles.browseBtn}>
            <Text style={styles.browseBtnText}>Découvrir les restaurants</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 200 }}>
            <View style={styles.restoLabel}>
              <Text style={styles.restoLabelText}>📍 {restaurantName || 'Restaurant'}</Text>
            </View>

            {items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <Image
                  source={{ uri: item.img }}
                  style={styles.itemImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price} DH</Text>
                </View>
                <View style={styles.qtyControls}>
                  <Pressable onPress={() => updateQty(item.id, item.qty - 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>{item.qty === 1 ? '🗑️' : '−'}</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{item.qty}</Text>
                  <Pressable onPress={() => updateQty(item.id, item.qty + 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{subtotal.toFixed(2)} DH</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frais de service</Text>
                <Text style={styles.summaryValue}>{serviceFee.toFixed(2)} DH</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Livraison</Text>
                <Text style={[styles.summaryValue, deliveryFee === 0 && styles.free]}>
                  {deliveryFee === 0 ? 'OFFERTE' : `${deliveryFee.toFixed(2)} DH`}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{total.toFixed(2)} DH</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.bottomTotal}>
              <Text style={styles.bottomTotalLabel}>Total</Text>
              <Text style={styles.bottomTotalValue}>{total.toFixed(2)} DH</Text>
            </View>
            <Pressable onPress={handleCheckout} style={styles.checkoutBtn}>
              <LinearGradient colors={[...gradients.hero]} style={StyleSheet.absoluteFill} />
              <Text style={styles.checkoutBtnText}>Commander</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 16, gap: 8,
  },
  headerTitle: { ...typography.h1, color: ink[900] },
  headerCount: { ...typography.caption, color: ink[400] },
  clearBtn: { marginLeft: 'auto', padding: 4 },
  clearText: { fontSize: 13, fontWeight: '700', color: brand[500] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...typography.h2, color: ink[900], marginBottom: 8 },
  emptyDesc: { ...typography.body, color: ink[500], textAlign: 'center', marginBottom: 24 },
  browseBtn: {
    backgroundColor: brand[500], paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: radius.full,
  },
  browseBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  scroll: { flex: 1 },
  restoLabel: { paddingHorizontal: 20, paddingVertical: 12 },
  restoLabelText: { fontSize: 13, fontWeight: '700', color: ink[500] },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#ffffff', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: ink[100],
    shadowColor: ink[900], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  itemImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: ink[100] },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { ...typography.h3, color: ink[900], marginBottom: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: brand[600] },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: ink[100],
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '800', color: ink[700] },
  qtyValue: { fontSize: 16, fontWeight: '800', color: ink[900], minWidth: 20, textAlign: 'center' },
  summary: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: ink[500], fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: ink[900] },
  free: { color: '#10b981' },
  totalRow: { borderTopWidth: 1, borderTopColor: ink[100], paddingTop: 12, marginTop: 4 },
  totalLabel: { ...typography.h3, color: ink[900] },
  totalValue: { ...typography.h3, color: brand[500] },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: ink[100],
    shadowColor: ink[900], shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 8,
  },
  bottomTotal: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bottomTotalLabel: { ...typography.h2, color: ink[900] },
  bottomTotalValue: { ...typography.h2, color: brand[500] },
  checkoutBtn: {
    height: 52, borderRadius: radius.md, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  checkoutBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 17 },
});
