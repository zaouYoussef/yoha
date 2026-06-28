import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '../../src/components/animations/FadeInView';
import { PremiumBackground } from '../../src/components/PremiumBackground';
import { CheckoutSteps } from '../../src/components/ui/CheckoutSteps';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { YohaInput } from '../../src/components/ui/YohaInput';
import { TimeSlotPicker } from '../../src/components/ui/TimeSlotPicker';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/contexts/CartContext';
import { useToast } from '../../src/contexts/ToastContext';
import { ordersApi } from '../../src/lib/api';
import { ADDRESS_PRESETS } from '../../src/lib/addresses';
import { addGuestOrderId } from '../../src/lib/guestOrders';
import { getStoredDeliveryDetails, saveDeliveryDetails } from '../../src/lib/deliveryDetails';
import { formatMad, getServiceFeeMad } from '../../src/lib/constants';
import { hapticSuccess } from '../../src/lib/haptics';
import { subscribeOrdersPush } from '../../src/lib/pushRegistration';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { brand, gradients, ink, radius, shadows } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

type PaymentMethod = 'cash' | 'card';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { footerBottomPadding } = useLayoutChrome();
  const { user } = useAuth();
  const { items, subtotal, clear, count, replaceItems } = useCart();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('Urgences CHU Tanger');
  const [phone, setPhone] = useState('+212 6 12 34 56 78');
  const [notes, setNotes] = useState('');
  const [floor, setFloor] = useState('Pavillon des Urgences, RDC');
  const [addressPreset, setAddressPreset] = useState('chu-urgences');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [scheduledTime, setScheduledTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      const stored = await getStoredDeliveryDetails();
      if (stored) {
        if (stored.name) setName(stored.name);
        if (stored.email) setEmail(stored.email);
        if (stored.address) setAddress(stored.address);
        if (stored.phone) setPhone(stored.phone);
        if (stored.notes !== undefined) setNotes(stored.notes);
        if (stored.floor !== undefined) setFloor(stored.floor);
        if (stored.addressPreset) setAddressPreset(stored.addressPreset);
        if (stored.payment) setPayment(stored.payment);
        if (stored.scheduledTime) setScheduledTime(stored.scheduledTime);
      }
      setLoaded(true);
    }
    loadDetails();
  }, []);

  useEffect(() => {
    if (!loaded) return;
      saveDeliveryDetails({
      name,
      email,
      address,
      floor,
      phone,
      notes,
      addressPreset,
      payment,
      scheduledTime: scheduledTime || undefined,
    });
  }, [name, email, address, floor, phone, notes, addressPreset, payment, scheduledTime, loaded]);

  useEffect(() => {
    if (count === 0) router.replace('/(client)/cart' as never);
  }, [count]);

  const isCustom = items.some(i => (i as any).isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes((i as any).restaurantCuisine));
  const customItems = items.filter(i => (i as any).isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes((i as any).restaurantCuisine));
  const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
  const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;
  const isLimitBlocked = !isCustom && subtotal < 70;
  const serviceFee = getServiceFeeMad(subtotal);
  const total = subtotal + serviceFee + deliveryFee;

  const handlePreset = (id: string) => {
    setAddressPreset(id);
    const preset = ADDRESS_PRESETS.find((p) => p.id === id);
    if (preset) {
      setAddress(preset.label);
      setFloor(preset.detail);
    }
  };

  const handleConfirm = async () => {
    setError('');
    if (isLimitBlocked) {
      setError('Commande inférieure à 70 DH non acceptée.');
      return;
    }
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError('Nom, adresse et téléphone sont obligatoires.');
      return;
    }
    if (!user && !email.trim()) {
      setError('E-mail obligatoire pour commander en mode invité.');
      return;
    }
    setLoading(true);
    try {
      const fullAddress = floor.trim() ? `${address.trim()} — ${floor.trim()}` : address.trim();
      const order = await ordersApi.checkout({
        items: items.map((i) => ({
          menu_item_id: i.id,
          restaurant_slug: i.restaurantId,
          quantity: i.qty,
          item_name: i.name,
          item_price: i.price,
          restaurant_name: i.restaurantName,
        })),
        customer_name: name.trim(),
        customer_email: email.trim() || undefined,
        customer_address: fullAddress,
        customer_phone: phone.trim(),
        delivery_instructions: notes.trim(),
        payment_method: payment,
        scheduled_delivery_at: scheduledTime || undefined,
      });
      if (!user && order.id) await addGuestOrderId(String(order.id));
      if (order.id) await subscribeOrdersPush([String(order.id)]);
      clear();
      showToast('Commande confirmée !', 'Votre repas arrive bientôt 🛵', '🎉');
      router.replace(`/(client)/order/${order.id}?justPlaced=true` as never);
      hapticSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Commande impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumBackground variant="cream">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: footerBottomPadding + 88 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FadeInView>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.back}>← Retour au panier</Text>
            </Pressable>
          </FadeInView>

          <FadeInView delay={60}>
            <CheckoutSteps current={2} />
          </FadeInView>

          <FadeInView delay={80}>
            <LinearGradient colors={[...gradients.cta]} style={[styles.heroIcon, shadows.glow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: 36 }}>🛵</Text>
            </LinearGradient>
            <Text style={styles.title}>Presque livré !</Text>
            <Text style={styles.sub}>
              {user ? 'Vérifiez vos infos de livraison.' : 'Mode invité — l’e-mail sert à confirmer votre commande.'}
            </Text>
          </FadeInView>

          <FadeInView delay={120}>
            <Text style={styles.sectionLabel}>Adresse de livraison</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
              {ADDRESS_PRESETS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => handlePreset(p.id)}
                  style={[styles.preset, addressPreset === p.id && styles.presetActive]}
                >
                  <Text style={styles.presetIcon}>{p.icon}</Text>
                  <Text style={[styles.presetLabel, addressPreset === p.id && styles.presetLabelActive]}>{p.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </FadeInView>

          <FadeInView delay={160}>
            <GlassCard>
              <YohaInput label="Nom complet *" value={name} onChangeText={setName} placeholder="Votre nom" />
              <YohaInput
                label={user ? 'E-mail' : 'E-mail *'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="vous@email.com"
              />
              <YohaInput label="Adresse *" value={address} onChangeText={setAddress} placeholder="Quartier, rue, repère…" />
              <YohaInput label="Étage / Service / Bâtiment" value={floor} onChangeText={setFloor} placeholder="Ex. Bloc A, 3e étage" />
              <YohaInput label="Téléphone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <YohaInput label="Remarques" value={notes} onChangeText={setNotes} placeholder="Sonnette, sans oignons…" multiline />
            </GlassCard>
          </FadeInView>

          <FadeInView delay={200}>
            <Text style={styles.sectionLabel}>🕐 Livraison</Text>
            <TimeSlotPicker selected={scheduledTime} onSelect={setScheduledTime} />
          </FadeInView>

          <FadeInView delay={220}>
            <Text style={styles.sectionLabel}>Mode de paiement</Text>
            <View style={styles.payRow}>
              <Pressable
                onPress={() => setPayment('cash')}
                style={[styles.payCard, payment === 'cash' && styles.payCardActive]}
              >
                <Text style={styles.payEmoji}>💵</Text>
                <Text style={[styles.payTitle, payment === 'cash' && styles.payTitleActive]}>Espèces</Text>
                <Text style={styles.paySub}>À la livraison</Text>
              </Pressable>
              <Pressable
                onPress={() => setPayment('card')}
                style={[styles.payCard, payment === 'card' && styles.payCardActive]}
              >
                <Text style={styles.payEmoji}>💳</Text>
                <Text style={[styles.payTitle, payment === 'card' && styles.payTitleActive]}>Carte</Text>
                <Text style={styles.paySub}>Bientôt disponible</Text>
              </Pressable>
            </View>
          </FadeInView>

          <FadeInView delay={240}>
            <View style={[styles.summary, shadows.card]}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              {items.map((i) => (
                <View key={i.id} style={{ marginBottom: 12 }}>
                  {(i as any).isCustom ? (
                    <View style={{ gap: 4 }}>
                      <Text style={[styles.line, { fontFamily: fonts.bold }]}>{i.qty}× Demande sur-mesure</Text>
                      {(i as any).customDetails?.storeAddress && (
                        <Text style={{ fontSize: 11, color: ink[500], fontFamily: fonts.semibold }}>
                          Établissement : {(i as any).customDetails.storeName}
                        </Text>
                      )}
                      <TextInput
                        value={(i as any).customDetails?.details || ''}
                        onChangeText={(newDetails) => {
                          const updated = items.map((p) => {
                            if (p.id === i.id) {
                              const customDetails = (p as any).customDetails || {};
                              const storeName = customDetails.storeName || p.restaurantName;
                              const name = customDetails.storeAddress 
                                ? `[${storeName}] ${newDetails.trim()}`
                                : `${p.restaurantName} - ${newDetails.trim()}`;
                              return {
                                ...p,
                                name,
                                customDetails: {
                                  ...customDetails,
                                  details: newDetails
                                }
                              };
                            }
                            return p;
                          });
                          replaceItems(updated);
                        }}
                        placeholder="Modifier les détails de votre demande..."
                        placeholderTextColor="#9ca3af"
                        multiline
                        numberOfLines={2}
                        style={{
                          fontSize: 13,
                          fontFamily: fonts.medium,
                          color: ink[900],
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          borderWidth: 1,
                          borderColor: ink[200],
                          borderRadius: radius.md,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          textAlignVertical: 'top',
                        }}
                      />
                    </View>
                  ) : (
                    <Text style={styles.line}>
                      {i.qty}× {i.name}
                    </Text>
                  )}
                </View>
              ))}
              <View style={styles.divider} />
              <Row
                label="Sous-total"
                value={isCustom
                  ? (subtotal > 0 ? `${formatMad(subtotal)} + achats` : 'Sur ticket')
                  : formatMad(subtotal)
                }
              />
              <Row label="Frais de service" value={formatMad(serviceFee)} />
              <Row
                label="Livraison"
                value={deliveryFee > 0 ? formatMad(deliveryFee) : 'Offerte ✨'}
              />
              <Row
                label="Total"
                value={isCustom
                  ? `${formatMad(total)} + achats`
                  : formatMad(total)
                }
                bold
              />
            </View>
          </FadeInView>

          {isLimitBlocked ? (
            <FadeInView delay={260}>
              <View style={styles.warnBanner}>
                <Text style={styles.warnText}>
                  ⚠️ Commande minimale de 70 DH non atteinte. Veuillez retourner au panier pour ajouter des articles.
                </Text>
              </View>
            </FadeInView>
          ) : null}

          {error ? (
            <FadeInView>
              <Text style={styles.error}>{error}</Text>
            </FadeInView>
          ) : null}

          <FadeInView delay={320}>
            <YohaButton
              title={
                loading
                  ? 'Validation…'
                  : isLimitBlocked
                    ? 'Minimum 70 DH requis'
                    : isCustom
                      ? `Confirmer · ${formatMad(total)} + achats`
                      : `Confirmer · ${formatMad(total)}`
              }
              onPress={handleConfirm}
              loading={loading}
              disabled={isLimitBlocked || loading}
              style={{ marginTop: 20 }}
            />
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumBackground>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  back: { fontFamily: fonts.semibold, color: brand[600], marginBottom: 16, fontSize: 15 },
  heroIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 30, color: ink[900], letterSpacing: -0.8 },
  sub: { marginTop: 6, fontFamily: fonts.medium, color: ink[500], lineHeight: 22, marginBottom: 20 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 15, color: ink[800], marginBottom: 12 },
  presetRow: { gap: 10, marginBottom: 16 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: ink[100],
    minWidth: 110,
  },
  presetActive: { borderColor: brand[400], backgroundColor: brand[50] },
  presetIcon: { fontSize: 22, marginBottom: 4 },
  presetLabel: { fontFamily: fonts.semibold, fontSize: 12, color: ink[600] },
  presetLabelActive: { color: brand[700] },
  payRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  payCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    borderColor: ink[100],
    alignItems: 'center',
  },
  payCardActive: { borderColor: brand[400], backgroundColor: brand[50] },
  payEmoji: { fontSize: 28 },
  payTitle: { marginTop: 8, fontFamily: fonts.bold, fontSize: 15, color: ink[700] },
  payTitleActive: { color: brand[700] },
  paySub: { marginTop: 2, fontFamily: fonts.medium, fontSize: 11, color: ink[400] },
  summary: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: ink[100],
  },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 17, color: ink[900], marginBottom: 10 },
  line: { fontFamily: fonts.medium, fontSize: 14, color: ink[600], marginBottom: 4 },
  divider: { height: 1, backgroundColor: ink[100], marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontFamily: fonts.medium, color: ink[500], fontSize: 14 },
  rowValue: { fontFamily: fonts.semibold, color: ink[800], fontSize: 14 },
  bold: { fontFamily: fonts.extrabold, color: ink[900], fontSize: 18 },
  error: { color: '#ef4444', marginTop: 12, fontFamily: fonts.medium, textAlign: 'center' },
  warnBanner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: 16,
    marginTop: 16,
  },
  warnText: {
    color: '#b45309',
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
