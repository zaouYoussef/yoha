import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ordersApi } from '../../src/lib/api';
import { useCart } from '../../src/contexts/CartContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { STATIC_STORES } from '../../src/data/staticStores';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { addGuestOrderId } from '../../src/lib/guestOrders';
import { hapticSuccess } from '../../src/lib/haptics';
import { accent, line, radius, surface, text as palette } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';
import { Screen, ScreenHeader } from '../../src/components/yoha/Screen';
import { Body, Display, Label } from '../../src/components/yoha/Type';
import { Glyph, Hairline } from '../../src/components/yoha/Atoms';
import { EmberButton } from '../../src/components/yoha/EmberButton';
import { TotalRow } from '../../src/components/yoha/Cards';

const ADDRESSES = [
  { id: 'chu', label: 'CHU Tanger', detail: 'Centre Hospitalier Universitaire' },
  { id: 'malabata', label: 'Malabata', detail: 'Corniche, résidences' },
  { id: 'medina', label: 'Médina', detail: 'Grand Socco et alentours' },
  { id: 'other', label: 'Autre adresse', detail: 'Je précise ci-dessous' },
];

const STATIC_SERVICE_FEE = 20;

/** Créneau d'arrivée annoncé. Une promesse chiffrée rassure plus qu'un « rapide ». */
function arrivalLabel(minutes: number) {
  const d = new Date(Date.now() + minutes * 60000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ClientCheckout() {
  const { items, subtotal, restaurantId, clear } = useCart();
  const { user } = useAuth();
  const { footerBottomPadding } = useLayoutChrome();

  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [addressId, setAddressId] = useState('chu');
  const [custom, setCustom] = useState('');
  const [phone, setPhone] = useState('+212 6 ');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<'cash' | 'card'>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staticIds = useMemo(() => new Set(STATIC_STORES.map((s) => s.id)), []);
  const isStatic = !!restaurantId && staticIds.has(restaurantId);
  const fee = isStatic ? STATIC_SERVICE_FEE : 0;
  const total = subtotal + fee;
  const eta = useMemo(() => arrivalLabel(45), []);

  const address = useMemo(() => {
    if (addressId === 'other') return custom.trim();
    const found = ADDRESSES.find((a) => a.id === addressId);
    return found ? `${found.label} — ${found.detail}` : '';
  }, [addressId, custom]);

  const nameOk = name.trim().length >= 2;
  const phoneOk = phone.replace(/\D/g, '').length >= 9;
  const emailOk = !!user || /^\S+@\S+\.\S+$/.test(email.trim());
  const ready = nameOk && !!address && phoneOk && emailOk && !!items.length;

  const submit = useCallback(async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
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
        customer_address: address,
        customer_phone: phone.trim(),
        delivery_instructions: notes.trim(),
        scheduled_delivery_at: null,
      });
      await addGuestOrderId(order.id, email.trim());
      void hapticSuccess();
      clear();
      router.replace(`/(client)/order/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La commande n’a pas pu être envoyée.');
      setSubmitting(false);
    }
  }, [ready, submitting, items, name, email, address, phone, notes, clear]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Confirmer" onBack={() => router.back()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 28 }}
        >
          {/* ── Qui reçoit ─────────────────────────────────────────── */}
          <Label tone="ember">Ton nom</Label>
          <Field
            placeholder="Prénom et nom"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={{ marginTop: 10 }}
          />

          {/* ── Adresse ─────────────────────────────────────────────── */}
          <Label tone="ember" style={{ marginTop: 26 }}>
            Livrer à
          </Label>
          <View style={{ gap: 8, marginTop: 10 }}>
            {ADDRESSES.map((a) => (
              <Option
                key={a.id}
                active={addressId === a.id}
                title={a.label}
                sub={a.detail}
                onPress={() => setAddressId(a.id)}
              />
            ))}
          </View>

          {addressId === 'other' ? (
            <Field
              placeholder="Rue, immeuble, étage…"
              value={custom}
              onChangeText={setCustom}
              style={{ marginTop: 10 }}
            />
          ) : null}

          {/* ── Contact ─────────────────────────────────────────────── */}
          <Label tone="ember" style={{ marginTop: 26 }}>
            Téléphone
          </Label>
          <Field
            placeholder="+212 6 12 34 56 78"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{ marginTop: 10 }}
          />
          <Body size="caption" tone="dim" style={{ marginTop: 7 }}>
            Le livreur t’appelle uniquement à l’arrivée.
          </Body>

          <Label tone="ember" style={{ marginTop: 26 }}>
            Email
          </Label>
          <Field
            placeholder="adresse@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ marginTop: 10 }}
          />
          <Body size="caption" tone="dim" style={{ marginTop: 7 }}>
            {user ? 'Réservé au suivi de ta commande.' : 'Requis pour suivre ta commande.'}
          </Body>

          <Field
            placeholder="Instructions (interphone, étage, sans oignons…)"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={{ marginTop: 14, minHeight: 76, paddingTop: 14 }}
          />

          {/* ── Paiement ────────────────────────────────────────────── */}
          <Label tone="ember" style={{ marginTop: 26 }}>
            Paiement
          </Label>
          <View style={{ gap: 8, marginTop: 10 }}>
            <Option
              active={payment === 'cash'}
              title="Espèces à la livraison"
              sub="Prépare l’appoint si possible"
              onPress={() => setPayment('cash')}
            />
            <Option
              active={payment === 'card'}
              title="Carte bancaire"
              sub="Paiement sécurisé à la livraison"
              badge="Sans contact"
              onPress={() => setPayment('card')}
            />
          </View>

          {/* ── Promesse ────────────────────────────────────────────── */}
          <View
            style={{
              marginTop: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
              padding: 15,
              borderRadius: radius.lg,
              backgroundColor: 'rgba(74,222,155,0.07)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'rgba(74,222,155,0.24)',
            }}
          >
            <Glyph name="clock" size={16} color={accent.mint} />
            <Body size="caption" style={{ flex: 1 }}>
              Arrivée estimée{' '}
              <Body size="caption" tone="mint" style={{ fontFamily: fonts.monoMedium }}>
                {eta}
              </Body>{' '}
              — au-delà, la livraison t’est remboursée.
            </Body>
          </View>

          <Hairline style={{ marginVertical: 22 }} />

          <TotalRow label="Sous-total" value={subtotal} />
          {isStatic ? (
            <TotalRow label="Frais de service" value={fee} />
          ) : (
            <TotalRow label="Livraison offerte" value={0} tone="discount" />
          )}
          <TotalRow label="Total" value={total} tone="total" />

          {error ? (
            <Body size="caption" tone="ember" style={{ marginTop: 16 }}>
              {error}
            </Body>
          ) : null}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: footerBottomPadding,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: line.hair,
            backgroundColor: surface.soot,
          }}
        >
          <EmberButton
            label={submitting ? 'Envoi en cuisine…' : 'Confirmer'}
            price={submitting ? undefined : total}
            loading={submitting}
            disabled={!ready}
            onPress={submit}
          />
          {!ready && !submitting ? (
            <Body size="caption" tone="dim" style={{ textAlign: 'center', marginTop: 9 }}>
              {!nameOk
                ? 'Indique ton nom pour continuer'
                : !emailOk
                  ? 'Ajoute un email valide'
                  : !phoneOk
                    ? 'Ajoute ton numéro pour continuer'
                    : 'Choisis une adresse'}
            </Body>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Option({
  active,
  title,
  sub,
  badge,
  onPress,
}: {
  active: boolean;
  title: string;
  sub: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 15,
        borderRadius: radius.lg,
        backgroundColor: active ? 'rgba(255,90,31,0.08)' : surface.soot,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: active ? accent.ember : line.hair,
      }}
    >
      <View
        style={{
          width: 19,
          height: 19,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: active ? accent.ember : line.strong,
          backgroundColor: active ? accent.ember : 'transparent',
        }}
      >
        {active ? <Glyph name="check" size={11} color={palette.onEmber} /> : null}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Body size="small" weight="semibold" numberOfLines={1}>
          {title}
        </Body>
        <Body size="caption" tone="dim" numberOfLines={1}>
          {sub}
        </Body>
      </View>

      {badge ? (
        <View
          style={{
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: radius.full,
            backgroundColor: 'rgba(255,90,31,0.16)',
          }}
        >
          <Label tone="ember">{badge}</Label>
        </View>
      ) : null}
    </Pressable>
  );
}

function Field({
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & { style?: object }) {
  return (
    <TextInput
      placeholderTextColor={palette.dim}
      {...props}
      style={[
        {
          backgroundColor: surface.soot,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: line.hair,
          borderRadius: radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: palette.bone,
          fontFamily: fonts.body,
          fontSize: 14,
        },
        style,
      ]}
    />
  );
}
