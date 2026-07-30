import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCart } from '../../src/contexts/CartContext';
import { brand, gradients, ink, radius, shadows } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ClientCart() {
  const insets = useSafeAreaInsets();
  const { items, count, subtotal, restaurantId, updateQty, removeItem, clear } = useCart();
  const restaurantName = items[0]?.restaurantName || 'Restaurant partenaire';

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoErr, setPromoErr] = useState('');

  // Structure tarifaire 100% livraison offerte partout :
  // - Livraison : 0.00 MAD (OFFERTE)
  // - Frais de service : 9.99 MAD
  const deliveryFee: number = 0;
  const serviceFee: number = 9.99;



  const applyPromo = useCallback(() => {
    setPromoErr('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'YOHA50') {
      setDiscount(50);
    } else if (code === 'YOHA10') {
      setDiscount(10);
    } else if (code.length > 0) {
      setPromoErr('Code promo invalide');
    }
  }, [promoCode]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + deliveryFee + serviceFee - discount);
  }, [subtotal, deliveryFee, serviceFee, discount]);

  const handleCheckout = useCallback(() => {
    if (items.length === 0) return;
    router.push('/(client)/checkout');
  }, [items.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </Pressable>
        <Image source={require('../../assets/images/logo.png')} style={{ width: 28, height: 28, borderRadius: 6, marginRight: 6 }} contentFit="contain" />
        <Text style={styles.headerTitle}>Mon Panier</Text>
        <Text style={styles.headerCount}>{count} article{count > 1 ? 's' : ''}</Text>
        {items.length > 0 && (
          <Pressable onPress={clear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Vider</Text>
          </Pressable>
        )}
      </View>


      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyDesc}>Ajoutez quelques délices de nos restaurants partenaires à Tanger</Text>
          <Pressable onPress={() => router.replace('/(client)')} style={styles.browseBtnWrap}>
            <LinearGradient colors={gradients.hero} style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>Découvrir les restaurants ➔</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 180 }}>
            {/* Restaurant Badge */}
            <View style={styles.restoBadge}>
              <Text style={styles.restoBadgeText}>📍 {restaurantName}</Text>
            </View>

            {/* Cart Items List */}
            {items.map((item) => (
              <View key={item.id} style={styles.cartItemCard}>
                <Image
                  source={{ uri: item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80' }}
                  style={styles.itemImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price} DH</Text>
                </View>

                {/* Qty Controls */}
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

            {/* Promo Code Box */}
            <View style={styles.promoCard}>
              <Text style={styles.promoTitle}>🎁 Code Promo</Text>
              <View style={styles.promoRow}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Code promo (ex: YOHA50)"
                  placeholderTextColor={ink[400]}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                />
                <Pressable onPress={applyPromo} style={styles.applyBtn}>
                  <Text style={styles.applyBtnText}>Appliquer</Text>
                </Pressable>
              </View>
              {promoErr ? <Text style={styles.promoErrText}>{promoErr}</Text> : null}
              {discount > 0 ? <Text style={styles.promoSuccessText}>- {discount} DH de réduction appliquée ! 🎉</Text> : null}
            </View>

            {/* Summary Box */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{subtotal.toFixed(2)} DH</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frais de livraison</Text>
                <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeText]}>
                  {deliveryFee === 0 ? 'OFFERTE 🛵' : `${deliveryFee.toFixed(2)} DH`}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frais de service</Text>
                <Text style={[styles.summaryValue, serviceFee === 0 && styles.freeText]}>
                  {serviceFee === 0 ? 'OFFERT' : `${serviceFee.toFixed(2)} DH`}
                </Text>
              </View>
              {discount > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Réduction</Text>
                  <Text style={styles.discountValue}>- {discount.toFixed(2)} DH</Text>
                </View>
              ) : null}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total à payer</Text>
                <Text style={styles.totalValue}>{grandTotal.toFixed(2)} DH</Text>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.bottomTotal}>
              <Text style={styles.bottomTotalLabel}>Total</Text>
              <Text style={styles.bottomTotalValue}>{grandTotal.toFixed(2)} DH</Text>
            </View>
            <Pressable onPress={handleCheckout} style={styles.checkoutBtnWrap}>
              <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.checkoutBtn}>
                <Text style={styles.checkoutBtnText}>Valider la commande ➔</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand[500],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginRight: 6,
  },
  headerCount: {
    fontSize: 12,
    fontWeight: '700',
    color: ink[400],
  },
  clearBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '800',
    color: brand[500],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
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
  browseBtnWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  browseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  browseBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  restoBadge: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  restoBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: ink[100],
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: brand[600],
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    minWidth: 20,
    textAlign: 'center',
  },
  promoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  applyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  promoErrText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 6,
  },
  promoSuccessText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ink[500],
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  freeText: {
    color: '#10b981',
  },
  discountValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: brand[500],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bottomTotalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: brand[500],
  },
  checkoutBtnWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  checkoutBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
});
