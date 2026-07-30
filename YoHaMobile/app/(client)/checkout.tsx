import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCart } from '../../src/contexts/CartContext';
import { ordersApi } from '../../src/lib/api';
import { brand, gradients, ink, radius, shadows } from '../../src/theme';

const ADDRESS_PRESETS = [
  { id: 'chu', label: 'CHU-Tanger', emoji: '📍', detail: 'Centre Hospitalier Universitaire Tanger' },
  { id: 'facultet', label: 'Faculté de Médecine', emoji: '🏫', detail: 'Route de Boukhalef CHU' },
  { id: 'tovar', label: 'Hôpital Duc de Tovar', emoji: '🏥', detail: 'Quartier Tovar Tanger' },
  { id: 'residence', label: 'Résidence Universitaire', emoji: '🏢', detail: 'Campus CHU Tanger' },
  { id: 'other', label: 'Autre adresse', emoji: '🗺️', detail: 'Adresse personnalisée' },
];

export default function ClientCheckout() {
  const insets = useSafeAreaInsets();
  const { items, subtotal, restaurantId, clear } = useCart();
  const restaurantName = items[0]?.restaurantName || 'YoHa Partner';

  const [selectedPreset, setSelectedPreset] = useState('chu');
  const [customAddress, setCustomAddress] = useState('');
  const [phone, setPhone] = useState('+212 6 ');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = useMemo(() => {
    if (subtotal >= 200) return 0;
    if (subtotal >= 120) return 4.99;
    return 7.99;
  }, [subtotal]);

  const serviceFee = useMemo(() => {
    if (subtotal >= 200) return 0;
    return 3.99;
  }, [subtotal]);

  const total = useMemo(() => subtotal + deliveryFee + serviceFee + tip, [subtotal, deliveryFee, serviceFee, tip]);

  const finalAddress = useMemo(() => {
    if (selectedPreset === 'other') return customAddress.trim() || 'Tanger';
    const found = ADDRESS_PRESETS.find((p) => p.id === selectedPreset);
    return found ? `${found.label} (${found.detail})` : 'CHU-Tanger';
  }, [selectedPreset, customAddress]);

  const handleSubmit = useCallback(async () => {
    if (!phone.trim() || phone.trim().length < 8) {
      Alert.alert('Numéro requis', 'Veuillez saisir votre numéro de téléphone');
      return;
    }
    if (selectedPreset === 'other' && !customAddress.trim()) {
      Alert.alert('Adresse requise', 'Veuillez préciser votre adresse exacte');
      return;
    }

    setSubmitting(true);
    try {
      const order = await ordersApi.checkout({
        restaurant_id: restaurantId,
        items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, img: i.img })),
        address: finalAddress,
        city: 'Tanger',
        phone: phone.trim(),
        notes: notes.trim(),
        total: String(total.toFixed(2)),
      });
      clear();
      router.replace(`/(client)/order/${order.public_id || order.id}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de passer commande. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }, [phone, selectedPreset, customAddress, restaurantId, items, finalAddress, notes, total, clear]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Panier</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Validation de Commande</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 160 }}>
          {/* Address Selector */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📍 Adresse de livraison à Tanger</Text>
            <View style={styles.presetList}>
              {ADDRESS_PRESETS.map((preset) => {
                const active = selectedPreset === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => setSelectedPreset(preset.id)}
                    style={[styles.presetItem, active && styles.presetItemActive]}
                  >
                    <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                    <View style={styles.presetTextWrap}>
                      <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>{preset.label}</Text>
                      <Text style={styles.presetDetail}>{preset.detail}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {selectedPreset === 'other' && (
              <TextInput
                style={styles.input}
                placeholder="Ex: Rue Anoual, Appt 4, Tanger"
                placeholderTextColor={ink[400]}
                value={customAddress}
                onChangeText={setCustomAddress}
              />
            )}
          </View>

          {/* Contact Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📞 Coordonnées de livraison</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro de téléphone marocain</Text>
              <TextInput
                style={styles.input}
                placeholder="+212 6 12 34 56 78"
                placeholderTextColor={ink[400]}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Instructions pour le livreur (Optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Appeler à l'arrivée, devant la porte principale du CHU"
                placeholderTextColor={ink[400]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {/* Tip Courier Selector */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛵 Pourboire livreur (Optionnel)</Text>
            <View style={styles.tipRow}>
              {[0, 5, 10, 20].map((amount) => {
                const active = tip === amount;
                return (
                  <Pressable
                    key={amount}
                    onPress={() => setTip(amount)}
                    style={[styles.tipBtn, active && styles.tipBtnActive]}
                  >
                    <Text style={[styles.tipText, active && styles.tipTextActive]}>
                      {amount === 0 ? 'Aucun' : `+${amount} DH`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💳 Mode de paiement</Text>
            <View style={styles.paymentRow}>
              <Pressable
                onPress={() => setPaymentMethod('cash')}
                style={[styles.paymentCard, paymentMethod === 'cash' && styles.paymentCardActive]}
              >
                <Text style={styles.paymentEmoji}>💵</Text>
                <Text style={[styles.paymentLabel, paymentMethod === 'cash' && styles.paymentLabelActive]}>Espèces</Text>
                <Text style={styles.paymentSub}>À la livraison</Text>
              </Pressable>

              <Pressable
                onPress={() => setPaymentMethod('card')}
                style={[styles.paymentCard, paymentMethod === 'card' && styles.paymentCardActive]}
              >
                <Text style={styles.paymentEmoji}>💳</Text>
                <Text style={[styles.paymentLabel, paymentMethod === 'card' && styles.paymentLabelActive]}>Carte bancaire</Text>
                <Text style={styles.paymentSub}>Paiement sécurisé</Text>
              </Pressable>
            </View>
          </View>

          {/* Order Summary Recap */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>📋 Récapitulatif Final</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Établissement</Text>
              <Text style={styles.summaryValue}>{restaurantName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total ({items.length} articles)</Text>
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
            {tip > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pourboire livreur</Text>
                <Text style={styles.summaryValue}>+{tip.toFixed(2)} DH</Text>
              </View>
            ) : null}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Général</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)} DH</Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Order Confirmation CTA */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleSubmit} disabled={submitting} style={styles.submitBtnWrap}>
            <LinearGradient colors={gradients.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>
                {submitting ? 'Confirmation en cours…' : `Confirmer la commande (${total.toFixed(2)} DH) 🚀`}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
  },
  presetList: {
    gap: 8,
    marginBottom: 8,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetItemActive: {
    borderColor: brand[500],
    backgroundColor: '#fff7ed',
  },
  presetEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  presetTextWrap: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  presetLabelActive: {
    color: brand[600],
  },
  presetDetail: {
    fontSize: 11,
    fontWeight: '600',
    color: ink[400],
    marginTop: 1,
  },
  formGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipBtnActive: {
    backgroundColor: brand[500],
    borderColor: brand[500],
  },
  tipText: {
    fontSize: 12,
    fontWeight: '800',
    color: ink[700],
  },
  tipTextActive: {
    color: '#ffffff',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentCardActive: {
    borderColor: brand[500],
    backgroundColor: '#fff7ed',
  },
  paymentEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  paymentLabelActive: {
    color: brand[600],
  },
  paymentSub: {
    fontSize: 10,
    fontWeight: '600',
    color: ink[400],
    marginTop: 2,
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
  submitBtnWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  submitBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
});
