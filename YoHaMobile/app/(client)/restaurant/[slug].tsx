import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { restaurantsApi, type MenuItem, type Restaurant } from '../../../src/lib/api';
import { resolveImageUrl } from '../../../src/lib/resolveImageUrl';
import { useLayoutChrome } from '../../../src/lib/layoutChrome';
import { useCart } from '../../../src/contexts/CartContext';
import { hapticSuccess } from '../../../src/lib/haptics';
import { accent, gradients, line, radius, surface, text as palette } from '../../../src/theme';
import { Screen } from '../../../src/components/yoha/Screen';
import { Body, Display, Label, Money } from '../../../src/components/yoha/Type';
import { Chip, GhostButton, Glyph, Pill, Skeleton, Stars } from '../../../src/components/yoha/Atoms';
import { Rise } from '../../../src/components/yoha/Motion';
import { EmberButton } from '../../../src/components/yoha/EmberButton';
import { DishRow, Stepper } from '../../../src/components/yoha/Cards';
import { Sheet } from '../../../src/components/yoha/Sheet';
import { StickyCartBar } from '../../../src/components/yoha/StickyCartBar';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 320;

function num(v: unknown, fallback = 0) {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { scrollBottomPadding } = useLayoutChrome();
  const { addItem } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuItem | null>(null);

  const scrollY = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await restaurantsApi.get(String(slug));
        if (alive) setRestaurant(data);
      } catch {
        if (alive) setRestaurant(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const categories = restaurant?.menu ?? [];
  const activeCategory = category ?? categories[0]?.id ?? null;

  const items = useMemo(() => {
    if (!categories.length) return [] as MenuItem[];
    const found = categories.find((c) => c.id === activeCategory) ?? categories[0];
    return (found?.items ?? []) as MenuItem[];
  }, [categories, activeCategory]);

  const add = useCallback(
    (item: MenuItem, qty: number) => {
      if (!restaurant) return;
      void hapticSuccess();
      addItem(
        {
          id: item.id,
          name: item.name,
          price: num(item.price),
          img: item.img,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        },
        qty,
      );
      setSelected(null);
    },
    [addItem, restaurant],
  );

  /* Le titre condensé glisse dans la barre quand la photo sort de l'écran. */
  const barOpacity = scrollY.interpolate({
    inputRange: [HERO_H - 140, HERO_H - 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Screen edges={false}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      >
        <View style={{ height: HERO_H }}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  {
                    /* Parallaxe douce : la photo recule moins vite que la page. */
                    translateY: scrollY.interpolate({
                      inputRange: [-HERO_H, 0, HERO_H],
                      outputRange: [HERO_H / 2, 0, -HERO_H / 3],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: resolveImageUrl(restaurant?.cover) }}
              contentFit="cover"
              transition={380}
              style={[StyleSheet.absoluteFill, { backgroundColor: surface.smoke }]}
              accessibilityLabel={restaurant ? `Photo de ${restaurant.name}` : 'Chargement'}
            />
          </Animated.View>

          <LinearGradient
            colors={gradients.scrim}
            locations={gradients.scrimLocations}
            style={StyleSheet.absoluteFill}
          />

          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
            <Label tone="ember">{restaurant?.cuisine ?? '—'}</Label>
            <Display size="h1" style={{ marginTop: 6 }} numberOfLines={2}>
              {restaurant?.name ?? '…'}
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
              <Stars value={4.8} reviews={512} />
              {restaurant?.distance ? (
                <Body size="caption" tone="dim">
                  {restaurant.distance}
                </Body>
              ) : null}
              {restaurant?.fee ? (
                <Body size="caption" tone="dim">
                  {restaurant.fee} de livraison
                </Body>
              ) : null}
              {restaurant?.openLabel ? <Pill tone="mint">{restaurant.openLabel}</Pill> : null}
            </View>
          </View>
        </View>

        {restaurant?.promo ? (
          <View
            style={{
              marginHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: radius.lg,
              backgroundColor: 'rgba(255,90,31,0.09)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: line.ember,
            }}
          >
            <Glyph name="bolt" size={14} color={accent.ember} />
            <Body size="caption" style={{ flex: 1 }}>
              {restaurant.promo}
            </Body>
          </View>
        ) : null}

        {categories.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingTop: 22 }}
          >
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={String(c.name ?? 'Menu')}
                active={activeCategory === c.id}
                onPress={() => setCategory(c.id)}
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={{ paddingHorizontal: 18, paddingTop: 20, gap: 10 }}>
          {loading ? (
            <>
              <Skeleton height={116} />
              <Skeleton height={116} />
              <Skeleton height={116} />
            </>
          ) : items.length ? (
            items.map((item, i) => (
              <Rise key={item.id} delay={i * 45}>
                <DishRow
                  item={item}
                  tag={i === 0 ? 'Le plus commandé' : undefined}
                  onPress={() => setSelected(item)}
                />
              </Rise>
            ))
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
              <Display size="h3" tone="fog">
                Carte indisponible
              </Display>
              <Body size="caption" tone="dim">
                Réessaie dans un instant.
              </Body>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Barre compacte qui prend le relais du titre au scroll */}
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(10,8,6,0.94)',
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: line.hair,
              opacity: barOpacity,
            },
          ]}
        />
        <GhostButton glyph="back" label="Retour" onPress={() => router.back()} />
        <Animated.View style={{ opacity: barOpacity, flex: 1 }}>
          <Display size="h3" numberOfLines={1}>
            {restaurant?.name ?? ''}
          </Display>
        </Animated.View>
      </Animated.View>

      <Sheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && restaurant ? (
          <DishSheet item={selected} restaurantName={restaurant.name} onAdd={add} />
        ) : null}
      </Sheet>

      <StickyCartBar />
    </Screen>
  );
}

/**
 * Fiche plat.
 *
 * Photo pleine largeur, description complète, sélecteur de quantité, et
 * un seul bouton. Aucun champ optionnel : chaque question posée ici est
 * une occasion d'abandonner.
 */
function DishSheet({
  item,
  restaurantName,
  onAdd,
}: {
  item: MenuItem;
  restaurantName: string;
  onAdd: (item: MenuItem, qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const price = num(item.price);

  return (
    <View>
      <View style={{ height: 208, backgroundColor: surface.smoke }}>
        <Image
          source={{ uri: resolveImageUrl(item.img) }}
          contentFit="cover"
          transition={280}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={item.name}
        />
        <LinearGradient
          colors={['transparent', surface.soot]}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
        <Display size="h1" numberOfLines={3}>
          {item.name}
        </Display>
        <Body size="caption" tone="dim" style={{ marginTop: 6 }}>
          {restaurantName}
        </Body>

        {item.desc ? (
          <Body tone="fog" style={{ marginTop: 16 }}>
            {item.desc}
          </Body>
        ) : null}

        {item.ingredients ? (
          <>
            <Label tone="dim" style={{ marginTop: 18 }}>
              Ingrédients
            </Label>
            <Body size="small" tone="fog" style={{ marginTop: 6 }}>
              {item.ingredients}
            </Body>
          </>
        ) : null}

        <View
          style={{
            marginTop: 22,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 8,
            paddingLeft: 16,
            borderRadius: radius.lg,
            backgroundColor: surface.ash,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: line.hair,
          }}
        >
          <Body size="small" tone="fog">
            Quantité
          </Body>
          <Stepper
            qty={qty}
            size={38}
            onDec={() => setQty((q) => Math.max(1, q - 1))}
            onInc={() => setQty((q) => Math.min(50, q + 1))}
          />
        </View>

        <View style={{ marginTop: 14 }}>
          <EmberButton
            label="Ajouter au panier"
            price={price * qty}
            onPress={() => onAdd(item, qty)}
          />
        </View>

        <Body size="caption" tone="dim" style={{ textAlign: 'center', marginTop: 10 }}>
          Annulation gratuite tant que la cuisine n’a pas accepté
        </Body>
      </View>
    </View>
  );
}

export const DISH_SHEET_WIDTH = SCREEN_W;
