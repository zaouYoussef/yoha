import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { restaurantsApi, type Restaurant } from '../../src/lib/api';
import { resolveImageUrl } from '../../src/lib/resolveImageUrl';
import { STATIC_STORES } from '../../src/data/staticStores';
import { storeEtaMin, storeHook, storeToRestaurant } from '../../src/lib/staticStore';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { useLastOrder } from '../../src/hooks/useLastOrder';
import { hapticLight } from '../../src/lib/haptics';
import { accent, gradients, line, radius, surface, text as palette } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label, Money } from '../../src/components/yoha/Type';
import { Chip, Glyph, GhostButton, Pill, SectionHeader, Skeleton, Ticker } from '../../src/components/yoha/Atoms';
import { EmberField, LivePulse, Rise } from '../../src/components/yoha/Motion';
import { EmberButton } from '../../src/components/yoha/EmberButton';
import { VendorCard } from '../../src/components/yoha/Cards';
import { StickyCartBar } from '../../src/components/yoha/StickyCartBar';

const { height: SCREEN_H } = Dimensions.get('window');

const CRAVINGS = [
  { id: 'all', label: 'Tout', emoji: '✶' },
  { id: 'marocain', label: 'Marocain', emoji: '🍲' },
  { id: 'burger', label: 'Burger', emoji: '🍔' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'poisson', label: 'Poisson', emoji: '🐟' },
  { id: 'dessert', label: 'Sucré', emoji: '🥐' },
];

/** Services commandables (stores statiques) — chaque chip ouvre son listing. */
const SERVICES = [
  { id: 'pharmacy', label: 'Pharmacies', emoji: '💊' },
  { id: 'parapharmacy', label: 'Parapharma', emoji: '🌿' },
  { id: 'dessert', label: 'Pâtisseries', emoji: '🥐' },
  { id: 'supermarket', label: 'Supermarché', emoji: '🛒' },
  { id: 'shop', label: 'Magasins', emoji: '🛍️' },
];

/** Rotation d'accroches. Une phrase concrète vaut mieux qu'un slogan. */
const HOOKS = [
  'Four allumé — commandes prises jusqu’à 23 h',
  'Le plat signature part vite ce soir',
  'Arrivage du matin, quantités limitées',
  'Livraison offerte sur ta première commande',
];

function etaFor(r: Restaurant, i: number) {
  const d = parseFloat(String(r.distance ?? '').replace(/[^\d.]/g, ''));
  const base = Number.isFinite(d) ? 14 + d * 4 : 18 + (i % 4) * 3;
  return Math.round(base);
}

export default function ClientDiscover() {
  const insets = useSafeAreaInsets();
  const { scrollBottomPadding } = useLayoutChrome();
  const { lastOrder } = useLastOrder();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [crave, setCrave] = useState('all');
  const [roulette, setRoulette] = useState<Restaurant | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await restaurantsApi.list();
      setRestaurants(list);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = useMemo(() => restaurants.filter((r) => r.isOpen !== false), [restaurants]);

  /**
   * Le hero n'est pas une bannière marketing : c'est une vraie enseigne
   * ouverte, avec un vrai temps de livraison et un bouton qui y mène.
   * Le client peut commander sans jamais scroller.
   */
  const hero = open[0] ?? restaurants[0] ?? null;

  const filtered = useMemo(() => {
    const customResto = STATIC_STORES.find((s) => s.id === 'custom-restaurant');
    const rest = restaurants.filter((r) => r.id !== hero?.id);
    if (crave === 'all') {
      return customResto ? [storeToRestaurant(customResto), ...rest] : rest;
    }
    return rest.filter((r) =>
      String(r.cuisine ?? '').toLowerCase().includes(crave.toLowerCase()),
    );
  }, [restaurants, crave, hero]);

  const spin = useCallback(() => {
    void hapticLight();
    const pool = open.length ? open : restaurants;
    if (!pool.length) return;
    setRoulette(pool[Math.floor(Math.random() * pool.length)]);
  }, [open, restaurants]);

  const proof = useMemo(
    () => [
      `${open.length || 12} enseignes ouvertes autour de toi`,
      'Temps de livraison moyen ce soir : 21 min',
      'Yassine a commandé il y a 2 min',
      'Salma a noté 5★ il y a 4 min',
      '31 commandes livrées cette heure',
    ],
    [open.length],
  );

  return (
    <Screen edges={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={accent.ember}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {/* ── Hero : la photo est la seule source de lumière ─────────── */}
        <View style={{ height: Math.min(SCREEN_H * 0.74, 620) }}>
          {hero ? (
            <Image
              source={{ uri: resolveImageUrl(hero.cover) }}
              contentFit="cover"
              transition={420}
              style={StyleSheet.absoluteFill}
              accessibilityLabel={`Photo de ${hero.name}`}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: surface.ash }]} />
          )}

          <LinearGradient
            colors={gradients.scrim}
            locations={gradients.scrimLocations}
            style={StyleSheet.absoluteFill}
          />
          <EmberField height={SCREEN_H * 0.6} />

          <View
            style={{
              flex: 1,
              paddingTop: insets.top + 8,
              paddingHorizontal: 18,
              paddingBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Display size="h2" black>
                YO<Display size="h2" black tone="ember">HA</Display>
              </Display>
              <View style={{ flex: 1 }} />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: radius.full,
                  backgroundColor: 'rgba(10,8,6,0.5)',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: line.soft,
                }}
              >
                <Glyph name="pin" size={11} color={accent.ember} />
                <Body size="caption" weight="medium">
                  Malabata, Tanger
                </Body>
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Pill tone="ember">{hero ? `${etaFor(hero, 0)} min` : 'Ouvert'}</Pill>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <LivePulse />
                <Label tone="fog">Cuisine en service</Label>
              </View>
            </View>

            <Display size="hero" style={{ marginTop: 16 }} numberOfLines={2}>
              {hero?.name ?? 'Ce soir,'}
            </Display>

            <Body tone="fog" style={{ marginTop: 12, maxWidth: 300 }} numberOfLines={2}>
              {hero?.description || hero?.promo || HOOKS[0]}
            </Body>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <View style={{ flex: 1 }}>
                <EmberButton
                  label="Commander"
                  leading={<Glyph name="bolt" size={15} color={palette.onEmber} />}
                  onPress={() =>
                    hero
                      ? router.push(`/(client)/restaurant/${hero.slug}`)
                      : router.push('/(client)/orders')
                  }
                />
              </View>
              <GhostButton
                glyph="dice"
                size={56}
                label="Choisir pour moi"
                onPress={spin}
                style={{ borderRadius: radius.lg }}
              />
            </View>

            <Body size="caption" tone="dim" style={{ textAlign: 'center', marginTop: 11 }}>
              Livraison offerte sur ta première commande · aucun compte requis
            </Body>
          </View>
        </View>

        <Ticker items={proof} />

        {/* ── Roulette : supprime la paralysie du choix en un tap ────── */}
        {roulette ? (
          <Rise>
            <View
              style={{
                marginHorizontal: 18,
                marginTop: 18,
                padding: 14,
                flexDirection: 'row',
                gap: 14,
                borderRadius: radius.xl,
                backgroundColor: surface.ash,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: line.ember,
              }}
            >
              <Image
                source={{ uri: resolveImageUrl(roulette.cover) }}
                contentFit="cover"
                style={{ width: 92, height: 92, borderRadius: radius.lg, backgroundColor: surface.smoke }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Label tone="ember">Le sort a choisi</Label>
                <Display size="h3" numberOfLines={1} style={{ marginTop: 4 }}>
                  {roulette.name}
                </Display>
                <Body size="caption" tone="dim" numberOfLines={1}>
                  {roulette.cuisine}
                </Body>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <SmallAction
                    label="Je prends"
                    primary
                    onPress={() => router.push(`/(client)/restaurant/${roulette.slug}`)}
                  />
                  <SmallAction label="Relancer" onPress={spin} />
                </View>
              </View>
            </View>
          </Rise>
        ) : null}

        {/* ── Re-commander : le chemin le plus court vers une 2ᵉ vente ─ */}
        {lastOrder ? (
          <Rise delay={80}>
            <RecentOrderStrip
              title={lastOrder.restaurantName ?? 'Ta dernière commande'}
              total={Number(lastOrder.totalDh ?? 0)}
              img={lastOrder.items?.[0]?.img}
              onPress={() => router.push(`/(client)/order/${lastOrder.id}`)}
            />
          </Rise>
        ) : null}

        {/* ── Envies ────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingTop: 26 }}
        >
          {CRAVINGS.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              emoji={c.emoji}
              active={crave === c.id}
              onPress={() => setCrave(c.id)}
            />
          ))}
        </ScrollView>

        {/* ── Services commandables ─────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingTop: 10 }}
        >
          {SERVICES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              emoji={c.emoji}
              onPress={() =>
                router.push({
                  pathname: '/(client)/stores/[cuisine]',
                  params: { cuisine: c.id },
                })
              }
            />
          ))}
        </ScrollView>

        <SectionHeader kicker="Braise allumée" title="Ouvert maintenant" />

        <View style={{ paddingHorizontal: 18, gap: 14 }}>
          {loading ? (
            <>
              <Skeleton height={230} />
              <Skeleton height={230} />
            </>
          ) : filtered.length ? (
            filtered.map((r, i) => (
              <Rise key={r.id} delay={i * 60}>
                <VendorCard
                  restaurant={r}
                  eta={r.isCustomRequest ? storeEtaMin(STATIC_STORES.find((s) => s.id === r.id)!) : etaFor(r, i)}
                  hook={r.isCustomRequest ? storeHook(STATIC_STORES.find((s) => s.id === r.id)!) : r.promo ?? HOOKS[i % HOOKS.length]}
                  onPress={() =>
                    r.isCustomRequest
                      ? router.push({
                          pathname: '/(client)/store/[id]',
                          params: { id: r.id },
                        })
                      : router.push(`/(client)/restaurant/${r.slug}`)
                  }
                />
              </Rise>
            ))
          ) : (
            <EmptyState onReset={() => setCrave('all')} />
          )}
        </View>
      </ScrollView>

      <StickyCartBar />
    </Screen>
  );
}

function SmallAction({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <View
      style={{
        borderRadius: radius.full,
        overflow: 'hidden',
        backgroundColor: primary ? accent.ember : 'transparent',
        borderWidth: primary ? 0 : StyleSheet.hairlineWidth * 2,
        borderColor: line.soft,
      }}
    >
      <Body
        size="caption"
        weight="semibold"
        tone={primary ? 'void' : 'fog'}
        onPress={onPress}
        suppressHighlighting
        style={{ paddingHorizontal: 14, paddingVertical: 7 }}
      >
        {label}
      </Body>
    </View>
  );
}

function RecentOrderStrip({
  title,
  total,
  img,
  onPress,
}: {
  title: string;
  total: number;
  img?: string;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        marginHorizontal: 18,
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: radius.lg,
        backgroundColor: surface.soot,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: line.hair,
      }}
    >
      <Image
        source={{ uri: resolveImageUrl(img) }}
        contentFit="cover"
        style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: surface.smoke }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Label tone="dim">Ta dernière commande</Label>
        <Body size="small" weight="semibold" numberOfLines={1} style={{ marginTop: 2 }}>
          {title}
        </Body>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Money value={total} size={13} />
        <Body
          size="caption"
          weight="semibold"
          tone="ember"
          onPress={onPress}
          suppressHighlighting
        >
          Re-commander →
        </Body>
      </View>
    </View>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 46, gap: 10 }}>
      <Display size="h2" tone="fog">
        Rien ici
      </Display>
      <Body size="small" tone="dim" style={{ textAlign: 'center', maxWidth: 250 }}>
        Aucune enseigne pour cette envie. Essaie une autre catégorie — ou laisse le sort décider.
      </Body>
      <View style={{ marginTop: 8 }}>
        <SmallAction label="Tout afficher" primary onPress={onReset} />
      </View>
    </View>
  );
}
