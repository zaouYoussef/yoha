import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STATIC_STORES, type StaticStore } from '../../../src/data/staticStores';
import { resolveImageUrl } from '../../../src/lib/resolveImageUrl';
import { useLayoutChrome } from '../../../src/lib/layoutChrome';
import { useCart } from '../../../src/contexts/CartContext';
import { hapticSuccess } from '../../../src/lib/haptics';
import { accent, gradients, line, radius, surface, text as palette } from '../../../src/theme';
import { Screen } from '../../../src/components/yoha/Screen';
import { Body, Display, Label } from '../../../src/components/yoha/Type';
import { GhostButton, Glyph, Pill, Stars } from '../../../src/components/yoha/Atoms';
import { EmberButton } from '../../../src/components/yoha/EmberButton';
import { StickyCartBar } from '../../../src/components/yoha/StickyCartBar';
import { fonts } from '../../../src/theme/fonts';

const HERO_H = 300;
const SERVICE_FEE = 20;

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { scrollBottomPadding } = useLayoutChrome();
  const { addItem } = useCart();

  const store = useMemo<StaticStore | null>(
    () => STATIC_STORES.find((s) => s.id === id) ?? null,
    [id],
  );

  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [details, setDetails] = useState('');
  const [added, setAdded] = useState(false);

  const needsName = !!store?.isCustomRequest;
  const ready =
    !!store &&
    details.trim().length >= 3 &&
    (!needsName || (storeName.trim().length >= 2 && storeAddress.trim().length >= 4));

  const add = useCallback(() => {
    if (!store || !ready) return;
    void hapticSuccess();
    addItem({
      id: `custom-${store.id}-${Date.now()}`,
      name: needsName
        ? `[${storeName.trim()}] ${details.trim()}`
        : `${store.name} - ${details.trim()}`,
      price: 0,
      img: store.cover,
      restaurantId: store.id,
      restaurantName: needsName ? storeName.trim() : store.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [addItem, store, ready, needsName, storeName, details]);

  if (!store) {
    return (
      <Screen>
        <View style={{ padding: 18, gap: 12 }}>
          <GhostButton glyph="back" label="Retour" onPress={() => router.back()} />
          <Display size="h2" tone="fog">
            Enseigne introuvable
          </Display>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        >
          {/* â”€â”€ HÃ©ro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={{ height: HERO_H }}>
            <Image
              source={{ uri: resolveImageUrl(store.cover) }}
              contentFit="cover"
              transition={380}
              style={[StyleSheet.absoluteFill, { backgroundColor: surface.smoke }]}
              accessibilityLabel={`Photo de ${store.name}`}
            />
            <LinearGradient
              colors={gradients.scrim}
              locations={gradients.scrimLocations}
              style={StyleSheet.absoluteFill}
            />

            <View
              style={{
                position: 'absolute',
                top: insets.top + 8,
                left: 18,
                right: 18,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <GhostButton glyph="back" label="Retour" onPress={() => router.back()} />
              <View style={{ flex: 1 }} />
              <Pill>{store.eta || '45-60 min'}</Pill>
            </View>

            <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
              <Label tone="ember">{store.cuisine}</Label>
              <Display size="h1" style={{ marginTop: 6 }} numberOfLines={2}>
                {store.name}
              </Display>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 12,
                  flexWrap: 'wrap',
                }}
              >
                <Stars value={store.rating} reviews={store.reviewsCount} />
                {store.distance ? (
                  <Body size="caption" tone="dim">
                    {store.distance}
                  </Body>
                ) : null}
                <Body size="caption" tone="dim">
                  {store.fee} de service
                </Body>
              </View>
            </View>
          </View>

          {/* â”€â”€ Contenu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
            {store.description ? (
              <Body size="small" tone="fog">
                {store.description}
              </Body>
            ) : null}

            {store.tags?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {store.tags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </View>
            ) : null}

            <Label tone="ember" style={{ marginTop: 26 }}>
              Commander sur-mesure
            </Label>

            {needsName ? (
              <>
                <Field
                  placeholder="Nom de l'Ã©tablissement *"
                  value={storeName}
                  onChangeText={setStoreName}
                  style={{ marginTop: 10 }}
                />
                <Field
                  placeholder="Adresse de l'Ã©tablissement *"
                  value={storeAddress}
                  onChangeText={setStoreAddress}
                  style={{ marginTop: 10 }}
                />
              </>
            ) : null}

            <TextInput
              placeholder="DÃ©taillez votre commande *"
              placeholderTextColor={palette.dim}
              value={details}
              onChangeText={setDetails}
              multiline
              style={{
                backgroundColor: surface.soot,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: line.hair,
                borderRadius: radius.lg,
                paddingHorizontal: 16,
                paddingVertical: 14,
                minHeight: 108,
                paddingTop: 14,
                marginTop: 10,
                color: palette.bone,
                fontFamily: fonts.body,
                fontSize: 14,
                textAlignVertical: 'top',
              }}
            />

            <View
              style={{
                marginTop: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                padding: 14,
                borderRadius: radius.lg,
                backgroundColor: 'rgba(255,90,31,0.07)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(255,90,31,0.22)',
              }}
            >
              <Glyph name="bolt" size={16} color={accent.ember} />
              <Body size="caption" style={{ flex: 1 }}>
                Frais de service fixes : <Body size="caption" tone="ember" weight="semibold">{SERVICE_FEE} DH</Body> â€” le
                prix d'achat rÃ©el sera ajoutÃ© Ã  la livraison.
              </Body>
            </View>

            <View style={{ marginTop: 18 }}>
              <EmberButton
                label={added ? 'AjoutÃ© !' : "Ajouter Ã  mon panier"}
                price={SERVICE_FEE}
                disabled={!ready}
                onPress={add}
              />
            </View>

            {!ready ? (
              <Body size="caption" tone="dim" style={{ textAlign: 'center', marginTop: 9 }}>
                {needsName && (!storeName.trim() || !storeAddress.trim())
                  ? 'Indique le nom et lâ€™adresse de lâ€™Ã©tablissement'
                  : 'DÃ©cris ta commande (au moins 3 caractÃ¨res)'}
              </Body>
            ) : null}
          </View>
        </ScrollView>

        <StickyCartBar />
      </KeyboardAvoidingView>
    </Screen>
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
