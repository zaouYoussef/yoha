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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '../../src/components/animations/FadeInView';
import { PremiumBackground } from '../../src/components/PremiumBackground';
import { CheckoutSteps } from '../../src/components/ui/CheckoutSteps';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { YohaInput } from '../../src/components/ui/YohaInput';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/contexts/CartContext';
import { useToast } from '../../src/contexts/ToastContext';
import { ordersApi } from '../../src/lib/api';
import { ADDRESS_PRESETS } from '../../src/lib/addresses';
import { addGuestOrderId } from '../../src/lib/guestOrders';
import { DELIVERY_FEE_DH, formatMad, getServiceFeeMad } from '../../src/lib/constants';
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
  const { items, subtotal, clear, count } = useCart();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('CHU-Tanger');
  const [phone, setPhone] = useState('+212 6 12 34 56 78');
  const [notes, setNotes] = useState('');
  const [floor, setFloor] = useState('');
  const [addressPreset, setAddressPreset] = useState('chu');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (count === 0) router.replace('/(client)/cart' as never);
  }, [count]);

  const serviceFee = getServiceFeeMad(subtotal);
  const total = subtotal + serviceFee + DELIVERY_FEE_DH;

  const handlePreset = (id: string) => {
    setAddressPreset(id);
    const preset = ADDRESS_PRESETS.find((p) => p.id === id);
    if (preset && id !== 'custom') setAddress(preset.label);
  };

  const handleConfirm = async () => {
    setError('');
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
        })),
        customer_name: name.trim(),
        customer_email: email.trim() || undefined,
        customer_address: fullAddress,
        customer_phone: phone.trim(),
        delivery_instructions: notes.trim(),
        payment_method: payment,
      });
      if (!user && order.id) await addGuestOrderId(String(order.id));
      if (order.id) await subscribeOrdersPush([String(order.id)]);
      clear();
      hapticSuccess();
      showToast('Commande confirmée !', 'Votre repas arrive bientôt 🛵', '🎉');
      router.replace(`/(client)/order/${order.id}` as never);
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
                <Text key={i.id} style={styles.line}>
                  {i.qty}× {i.name}
                </Text>
              ))}
              <View style={styles.divider} />
              <Row label="Sous-total" value={formatMad(subtotal)} />
              <Row label="Frais de service" value={formatMad(serviceFee)} />
              <Row label="Livraison" value={DELIVERY_FEE_DH === 0 ? 'Offerte ✨' : formatMad(DELIVERY_FEE_DH)} />
              <Row label="Total" value={formatMad(total)} bold />
            </View>
          </FadeInView>

          {error ? (
            <FadeInView>
              <Text style={styles.error}>{error}</Text>
            </FadeInView>
          ) : null}

          <FadeInView delay={320}>
            <YohaButton
              title={loading ? 'Validation…' : `Confirmer · ${formatMad(total)}`}
              onPress={handleConfirm}
              loading={loading}
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
});
