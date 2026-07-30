import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useCart } from '../../src/contexts/CartContext';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { line, radius, surface } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label } from '../../src/components/yoha/Type';
import { Glyph, Hairline } from '../../src/components/yoha/Atoms';
import { Rise } from '../../src/components/yoha/Motion';
import { EmberButton, OutlineButton } from '../../src/components/yoha/EmberButton';
import { CartRow, TotalRow } from '../../src/components/yoha/Cards';

/** Barème de livraison. Le palier gratuit est affiché, pas caché. */
const FREE_DELIVERY_FROM = 200;
const BASE_FEE = 15;

export default function ClientCart() {
  const { items, subtotal, updateQty, clear } = useCart();
  const { footerBottomPadding } = useLayoutChrome();

  const fee = subtotal >= FREE_DELIVERY_FROM ? 0 : BASE_FEE;
  const total = subtotal + fee;
  const missing = Math.max(0, FREE_DELIVERY_FROM - subtotal);

  const vendor = items[0]?.restaurantName;

  const progress = useMemo(
    () => Math.min(1, subtotal / FREE_DELIVERY_FROM),
    [subtotal],
  );

  if (!items.length) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
          <Display size="hero" tone="fog">
            Vide
          </Display>
          <Body size="small" tone="dim" style={{ textAlign: 'center', maxWidth: 260 }}>
            Ton panier attend. Les cuisines sont ouvertes et le premier plat arrive en 20 minutes.
          </Body>
          <View style={{ width: '100%', maxWidth: 280, marginTop: 14 }}>
            <EmberButton label="Découvrir" onPress={() => router.push('/(client)')} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <Label tone="ember">{vendor}</Label>
          <Display size="h1" style={{ marginTop: 5 }}>
            Panier
          </Display>
        </View>
        <Body size="caption" tone="dim" onPress={clear} suppressHighlighting>
          Vider
        </Body>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}
      >
        <View style={{ gap: 10 }}>
          {items.map((l, i) => (
            <Rise key={l.id} delay={i * 45}>
              <CartRow
                name={l.name}
                vendor={l.restaurantName}
                price={l.price}
                qty={l.qty}
                img={l.img}
                onDec={() => updateQty(l.id, l.qty - 1)}
                onInc={() => updateQty(l.id, l.qty + 1)}
              />
            </Rise>
          ))}
        </View>

        {/* Jauge livraison offerte : un objectif chiffré fait monter le panier moyen. */}
        {missing > 0 ? (
          <View
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: radius.lg,
              backgroundColor: surface.soot,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: line.hair,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Glyph name="bolt" size={13} color="#ff5a1f" />
              <Body size="caption" tone="fog" style={{ flex: 1 }}>
                Encore {Math.round(missing)} DH et la livraison passe à zéro
              </Body>
            </View>
            <View
              style={{
                height: 3,
                borderRadius: 3,
                backgroundColor: line.soft,
                marginTop: 10,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  backgroundColor: '#ff5a1f',
                }}
              />
            </View>
          </View>
        ) : null}

        <View
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: radius.lg,
            backgroundColor: surface.ash,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: line.hair,
          }}
        >
          <TotalRow label="Sous-total" value={subtotal} />
          <TotalRow label="Livraison" value={BASE_FEE} />
          {fee === 0 ? <TotalRow label="Livraison offerte" value={BASE_FEE} tone="discount" /> : null}
          <TotalRow label="Total" value={total} tone="total" />
        </View>

        <Hairline style={{ marginVertical: 20 }} />

        <OutlineButton label="Ajouter autre chose" onPress={() => router.push('/(client)')} />
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
          label="Payer maintenant"
          price={total}
          onPress={() => router.push('/(client)/checkout')}
        />
      </View>
    </Screen>
  );
}
