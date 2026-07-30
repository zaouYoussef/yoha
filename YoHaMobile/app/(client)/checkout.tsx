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
import { brand, gradients, ink, radius, shadows, typography } from '../../src/theme';

type Step = 'address' | 'contact' | 'confirm';

export default function ClientCheckout() {
  const insets = useSafeAreaInsets();
  const { items, subtotal, restaurantId, clear } = useCart();
  const restaurantName = items[0]?.restaurantName;

  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const serviceFee = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const deliveryFee = subtotal >= 40 ? 0 : 8;
  const total = subtotal + serviceFee + deliveryFee;

  const stepProgress = { address: 1, contact: 2, confirm: 3 };

  const handleSubmit = useCallback(async () => {
    if (!address.trim() || !city.trim() || !phone.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs');
      return;
    }
    setSubmitting(true);
    try {
      const order = await ordersApi.checkout({
        restaurant_id: restaurantId,
        items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, img: i.img })),
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        total: String(total),
      });
      clear();
      router.replace(`/(client)/order/${order.public_id || order.id}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de passer commande. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }, [address, city, phone, notes, total, restaurantId, items, clear]);

  const nextStep = useCallback(() => {
    if (step === 'address') {
      if (!address.trim() || !city.trim()) { Alert.alert('Champs requis', 'Adresse et ville requises'); return; }
      setStep('contact');
    } else if (step === 'contact') {
      if (!phone.trim()) { Alert.alert('Champs requis', 'Numéro de téléphone requis'); return; }
      setStep('confirm');
    }
  }, [step, address, city, phone]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#fff7ed', '#ffffff']} style={styles.header}>
          <Pressable onPress={() => step === 'address' ? router.back() : setStep(step === 'contact' ? 'address' : 'contact')} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Commander</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(stepProgress[step] / 3) * 100}%` }]} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 160 }}>
          {step === 'address' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Adresse de livraison</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse"
                placeholderTextColor={ink[400]}
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="Ville"
                placeholderTextColor={ink[400]}
                value={city}
                onChangeText={setCity}
              />
            </View>
          )}

          {step === 'contact' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📞 Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de téléphone"
                placeholderTextColor={ink[400]}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes pour le livreur (optionnel)"
                placeholderTextColor={ink[400]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          )}

          {step === 'confirm' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Récapitulatif</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Restaurant</Text>
                  <Text style={styles.infoValue}>{restaurantName || '—'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Adresse</Text>
                  <Text style={styles.infoValue}>{address}, {city}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{phone}</Text>
                </View>
                {notes ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Notes</Text>
                    <Text style={styles.infoValue}>{notes}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛍️ Articles</Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.qty}x {item.name}</Text>
                    <Text style={styles.itemPrice}>{(item.qty * item.price).toFixed(2)} DH</Text>
                  </View>
                ))}
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Sous-total</Text>
                  <Text style={styles.summaryValue}>{subtotal.toFixed(2)} DH</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service</Text>
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
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {step !== 'confirm' ? (
            <Pressable onPress={nextStep} style={styles.primaryBtn}>
              <LinearGradient colors={[...gradients.hero]} style={StyleSheet.absoluteFill} />
              <Text style={styles.primaryBtnText}>Continuer</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleSubmit} disabled={submitting} style={styles.primaryBtn}>
              <LinearGradient colors={[...gradients.hero]} style={StyleSheet.absoluteFill} />
              <Text style={styles.primaryBtnText}>
                {submitting ? 'Commande en cours…' : `Payer ${total.toFixed(2)} DH`}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '700', color: brand[500] },
  headerTitle: { ...typography.h1, color: ink[900], marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: ink[200], borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: brand[500], borderRadius: 2 },
  scroll: { flex: 1 },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  sectionTitle: { ...typography.h3, color: ink[900], marginBottom: 12 },
  input: {
    height: 48, borderWidth: 1, borderColor: ink[200], borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, fontWeight: '500', color: ink[900],
    backgroundColor: '#ffffff', marginBottom: 10,
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: ink[500] },
  infoValue: { fontSize: 14, fontWeight: '700', color: ink[900], maxWidth: '55%', textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { fontSize: 14, color: ink[900] },
  itemPrice: { fontSize: 14, fontWeight: '700', color: ink[900] },
  summary: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
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
  primaryBtn: {
    height: 52, borderRadius: radius.md, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 17 },
});
