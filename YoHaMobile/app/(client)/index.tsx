import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, FlatList, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { restaurantsApi, type Restaurant } from '../../src/lib/api';
import { brand, gradients, ink, radius, shadows, typography } from '../../src/theme';
import { resolveImageUrl } from '../../src/lib/resolveImageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;

const MAIN_SERVICE_TABS = [
  { id: 'all', label: 'Restos', emoji: '🍔' },
  { id: 'pharmacy', label: 'Pharmacies', emoji: '💊' },
  { id: 'parapharmacy', label: 'Parapharma', emoji: '🌿' },
  { id: 'dessert', label: 'Pâtisseries', emoji: '🥐' },
  { id: 'supermarket', label: 'Supermarché', emoji: '🛒' },
  { id: 'shop', label: 'Magasins', emoji: '🛍️' },
];

const CUISINE_CATEGORIES = [
  { id: 'all', label: 'Tout', emoji: '🔥', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
  { id: 'tacos', label: 'Tacos', emoji: '🌮', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80' },
  { id: 'burger', label: 'Burgers', emoji: '🍔', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { id: 'kebab', label: 'Kebab', emoji: '🥙', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80' },
  { id: 'sandwich', label: 'Sandwich', emoji: '🥪', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80' },
  { id: 'healthy', label: 'Healthy', emoji: '🥗', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80' },
  { id: 'dessert', label: 'Desserts', emoji: '🍰', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80' },
];

const PROMO_BANNERS = [
  { id: 'p-1', title: 'Livraison Offerte 🏍️', subtitle: 'Sur vos 3 premières commandes YoHa', bg: ['#f97316', '#ec4899'] },
  { id: 'p-2', title: '-20% sur les Tacos 🌮', subtitle: 'Offre exclusive Snack Roma Tanger', bg: ['#8b5cf6', '#d946ef'] },
  { id: 'p-3', title: 'Les Coups de Cœur 🔥', subtitle: 'Sélection des meilleurs restos CHU', bg: ['#059669', '#10b981'] },
];

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatDistance(d: string | undefined) {
  if (!d) return '1.2 km';
  const num = parseFloat(d);
  if (isNaN(num)) return d;
  return num < 1 ? `${Math.round(num * 1000)} m` : `${num.toFixed(1)} km`;
}

function SkeletonCard() {
  return (
    <View style={[styles.card, { backgroundColor: '#ffffff' }]}>
      <View style={[styles.cardImage, { backgroundColor: ink[100] }]} />
      <View style={styles.cardBody}>
        <View style={[styles.skelLine, { width: '70%' }]} />
        <View style={[styles.skelLine, { width: '45%', marginTop: 8 }]} />
        <View style={[styles.skelLine, { width: '55%', marginTop: 8 }]} />
      </View>
    </View>
  );
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function ClientHome() {
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [serviceTab, setServiceTab] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const params: { cuisine?: string; q?: string } = {};
      if (cuisineFilter && cuisineFilter !== 'all') params.cuisine = cuisineFilter;
      if (search.trim()) params.q = search.trim();
      const list = await restaurantsApi.list(params);
      setRestaurants(list);
    } catch {
      setRestaurants([]);
    }
  }, [cuisineFilter, search]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const openCount = useMemo(() => restaurants.filter((r) => r.isOpen).length, [restaurants]);
  const featured = useMemo(() => restaurants.find((r) => r.promo || r.isOpen) || restaurants[0], [restaurants]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ═══ TOP HERO & SEARCH HEADER ═══ */}
      <View style={styles.topHeader}>
        <View style={styles.locationBar}>
          <View style={styles.locationPill}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationText}>CHU-Tanger</Text>
          </View>
          <View style={styles.openBadge}>
            <View style={styles.openDot} />
            <Text style={styles.openBadgeText}>{openCount || 4} ouverts</Text>
          </View>
        </View>

        <View style={styles.greetingWrap}>
          <Text style={styles.greetingText}>
            {timeGreeting()},{' '}
            <Text style={styles.greetingName}>YoHa Client</Text> 👋
          </Text>
          <Text style={styles.subtitleText}>Livraison · Maintenant · 🏍️ Frais offerts</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un restaurant, un plat…"
            placeholderTextColor={ink[400]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={styles.searchClear}>
              <Text style={styles.searchClearText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <AnimatedFlatList
        data={restaurants}
        keyExtractor={(r: any) => String(r.slug || r.id || Math.random())}
        numColumns={2}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        columnWrapperStyle={styles.row}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand[500]} />}
        ListHeaderComponent={
          <>
            {/* ═══ 1. TOP SERVICE TABS (Restos, Pharmacies, Parapharma...) ═══ */}
            <View style={styles.serviceTabsWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceTabsScroll}>
                {MAIN_SERVICE_TABS.map((tab) => {
                  const active = serviceTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setServiceTab(tab.id)}
                      style={[styles.serviceTabBtn, active && styles.serviceTabBtnActive]}
                    >
                      <Text style={[styles.serviceTabLabel, active && styles.serviceTabLabelActive]}>
                        {tab.label} {tab.emoji}
                      </Text>
                      {active && <View style={styles.serviceTabIndicator} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* ═══ 2. PROMO BANNERS CAROUSEL ═══ */}
            {!search ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
                {PROMO_BANNERS.map((p) => (
                  <LinearGradient
                    key={p.id}
                    colors={p.bg as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.promoCard}
                  >
                    <Text style={styles.promoTitle}>{p.title}</Text>
                    <Text style={styles.promoSubtitle}>{p.subtitle}</Text>
                  </LinearGradient>
                ))}
              </ScrollView>
            ) : null}

            {/* ═══ 3. FOOD CUISINE IMAGE CAROUSEL (Circles with Photos) ═══ */}
            {!search ? (
              <View style={styles.cuisineSection}>
                <Text style={styles.subSectionTitle}>Catégories Gourmandes</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cuisineScroll}>
                  {CUISINE_CATEGORIES.map((c) => {
                    const active = cuisineFilter === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setCuisineFilter(active ? 'all' : c.id)}
                        style={styles.cuisineCircleBtn}
                      >
                        <View style={[styles.cuisineImageWrap, active && styles.cuisineImageWrapActive]}>
                          <Image source={{ uri: c.image }} style={styles.cuisineImage} contentFit="cover" transition={300} />
                          <View style={styles.cuisineOverlay} />
                        </View>
                        <Text style={[styles.cuisineCircleLabel, active && styles.cuisineCircleLabelActive]} numberOfLines={1}>
                          {c.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* ═══ 4. FEATURED "COUP DE CŒUR" SPOTLIGHT ═══ */}
            {featured && !search && cuisineFilter === 'all' ? (
              <View style={styles.spotlightWrap}>
                <Pressable
                  onPress={() => router.push(`/(client)/restaurant/${featured.slug}`)}
                  style={({ pressed }) => [styles.spotlightCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <Image
                    source={{ uri: resolveImageUrl(featured.cover, featured.cuisine) }}
                    style={styles.spotlightImage}
                    contentFit="cover"
                    transition={400}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(2, 6, 23, 0.7)', 'rgba(2, 6, 23, 0.95)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.spotlightBody}>
                    <View style={styles.spotlightBadge}>
                      <Text style={styles.spotlightBadgeText}>🔥 COUP DE CŒUR</Text>
                    </View>
                    <Text style={styles.spotlightTitle}>{featured.name}</Text>
                    <View style={styles.spotlightMeta}>
                      {featured.promo && (
                        <View style={styles.spotlightTag}>
                          <Text style={styles.spotlightTagText}>🎁 {featured.promo}</Text>
                        </View>
                      )}
                      <View style={styles.spotlightTagGreen}>
                        <Text style={styles.spotlightTagGreenText}>{featured.isOpen ? '● Ouvert' : '🔒 Fermé'}</Text>
                      </View>
                      <View style={styles.spotlightTagDark}>
                        <Text style={styles.spotlightTagDarkText}>📍 {formatDistance(featured.distance)}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>
            ) : null}

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {cuisineFilter !== 'all'
                  ? `Restos ${CUISINE_CATEGORIES.find((c) => c.id === cuisineFilter)?.label}`
                  : 'Tous les Partenaires'}
              </Text>
              <Text style={styles.sectionCount}>{restaurants.length} disponibles</Text>
            </View>

            {loading && (
              <View style={styles.row}>
                {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </View>
            )}
          </>
        }
        renderItem={({ item: r, index }: { item: any; index: number }) => (
          <RestaurantCardItem
            restaurant={r}
            index={index}
            onPress={() => router.push(`/(client)/restaurant/${r.slug}`)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>Aucun restaurant disponible</Text>
              <Text style={styles.emptyDesc}>Essayez de modifier votre recherche ou vos filtres</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function RestaurantCardItem({ restaurant: r, index, onPress }: { restaurant: Restaurant; index: number; onPress: () => void }) {
  const emoji = { pizza: '🍕', tacos: '🌮', kebab: '🥙', sushi: '🍣', burger: '🍔', healthy: '🥗', medical: '🏥', pharmacy: '💊' }[r.cuisine || ''] || '🍽️';
  const hasPromo = !!r.promo;
  const coverUri = resolveImageUrl(r.cover, r.cuisine);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        hasPromo && styles.cardPromoBorder,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View style={styles.cardImageWrap}>
        <Image
          source={{ uri: coverUri }}
          style={styles.cardImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient colors={['transparent', 'rgba(15,23,42,0.85)']} style={styles.cardImageOverlay} />

        {/* Cuisine Badge Top Left */}
        <View style={styles.cardCuisineBadge}>
          <Text style={styles.cardCuisineText}>{emoji} {r.cuisine || 'Restau'}</Text>
        </View>

        {/* Rating Star Badge Top Right */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingText}>4.9</Text>
        </View>

        {/* Promo tag if any */}
        {hasPromo && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>{r.promo}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDist}>📍 {formatDistance(r.distance)}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={[styles.cardOpen, r.isOpen ? styles.open : styles.closed]}>
            {r.isOpen ? 'Ouvert' : 'Fermé'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardFee}>🏍️ {r.fee || 'Offerte'}</Text>
          <Text style={styles.cardTime}>25-35 min</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  locationPin: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  greetingWrap: {
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  greetingName: {
    color: brand[500],
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: ink[400],
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  searchClear: {
    padding: 4,
  },
  searchClearText: {
    fontSize: 14,
    color: ink[400],
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  serviceTabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 12,
  },
  serviceTabsScroll: {
    paddingHorizontal: 4,
    gap: 16,
  },
  serviceTabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    position: 'relative',
  },
  serviceTabBtnActive: {},
  serviceTabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ink[500],
  },
  serviceTabLabelActive: {
    fontSize: 13,
    fontWeight: '900',
    color: brand[600],
  },
  serviceTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: brand[500],
  },
  promoScroll: {
    paddingHorizontal: 4,
    paddingBottom: 14,
    gap: 10,
  },
  promoCard: {
    width: 220,
    height: 80,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  promoSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  cuisineSection: {
    marginBottom: 14,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  cuisineScroll: {
    paddingHorizontal: 4,
    gap: 12,
  },
  cuisineCircleBtn: {
    alignItems: 'center',
    width: 64,
  },
  cuisineImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
    marginBottom: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cuisineImageWrapActive: {
    borderColor: brand[500],
    borderWidth: 3,
  },
  cuisineImage: {
    width: '100%',
    height: '100%',
  },
  cuisineOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  cuisineCircleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ink[700],
    textAlign: 'center',
  },
  cuisineCircleLabelActive: {
    color: brand[600],
    fontWeight: '900',
  },
  spotlightWrap: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  spotlightCard: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    ...shadows.glowOrange,
  },
  spotlightImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  spotlightBody: {
    padding: 16,
  },
  spotlightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: brand[500],
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  spotlightBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  spotlightTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  spotlightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spotlightTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  spotlightTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  spotlightTagGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  spotlightTagGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a7f3d0',
  },
  spotlightTagDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  spotlightTagDarkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: brand[500],
  },
  row: {
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardPromoBorder: {
    borderColor: brand[400],
  },
  cardImageWrap: {
    height: 125,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  cardCuisineBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardCuisineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingStar: {
    fontSize: 11,
    color: '#f59e0b',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a',
  },
  promoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: brand[500],
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  promoText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },
  cardBody: {
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  cardDist: {
    fontSize: 11,
    color: ink[500],
    fontWeight: '700',
  },
  cardDot: {
    fontSize: 11,
    color: ink[300],
  },
  cardOpen: {
    fontSize: 11,
    fontWeight: '800',
  },
  open: {
    color: '#10b981',
  },
  closed: {
    color: ink[400],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },

  cardFee: {
    fontSize: 11,
    color: brand[600],
    fontWeight: '800',
  },
  cardTime: {
    fontSize: 10,
    color: ink[400],
    fontWeight: '700',
  },
  skelLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: ink[200],
  },
  empty: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: ink[500],
    textAlign: 'center',
  },
});
