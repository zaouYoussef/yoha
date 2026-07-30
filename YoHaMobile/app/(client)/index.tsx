import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, FlatList, Pressable, RefreshControl,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { restaurantsApi, type Restaurant } from '../../src/lib/api';
import { brand, gradients, ink, radius, shadows, typography } from '../../src/theme';
import { resolveImageUrl } from '../../src/lib/resolveImageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2;

const CUISINES = [
  { key: '', label: 'Tout', emoji: '🔥' },
  { key: 'pizza', label: 'Pizza', emoji: '🍕' },
  { key: 'tacos', label: 'Tacos', emoji: '🌮' },
  { key: 'burger', label: 'Burger', emoji: '🍔' },
  { key: 'sushi', label: 'Sushi', emoji: '🍣' },
  { key: 'kebab', label: 'Kebab', emoji: '🥙' },
  { key: 'sandwich', label: 'Sandwich', emoji: '🥪' },
  { key: 'healthy', label: 'Healthy', emoji: '🥗' },
];

function formatDistance(d: string | undefined) {
  if (!d) return null;
  const num = parseFloat(d);
  if (isNaN(num)) return d;
  return num < 1 ? `${Math.round(num * 1000)} m` : `${num.toFixed(1)} km`;
}

function SkeletonCard() {
  return (
    <View style={[styles.card, { backgroundColor: ink[100] }]}>
      <View style={[styles.cardImage, { backgroundColor: ink[200] }]} />
      <View style={styles.cardBody}>
        <View style={[styles.skelLine, { width: '70%' }]} />
        <View style={[styles.skelLine, { width: '45%', marginTop: 6 }]} />
        <View style={[styles.skelLine, { width: '55%', marginTop: 6 }]} />
      </View>
    </View>
  );
}

export default function ClientHome() {
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const params: { cuisine?: string; q?: string } = {};
      if (cuisine) params.cuisine = cuisine;
      if (search.trim()) params.q = search.trim();
      const list = await restaurantsApi.list(params);
      setRestaurants(list);
    } catch {
      setRestaurants([]);
    }
  }, [cuisine, search]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const featured = useMemo(() => restaurants.filter((r) => r.promo).slice(0, 4), [restaurants]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.hero, { opacity: headerOpacity }]}>
        <LinearGradient colors={['#fff7ed', '#ffffff']} style={StyleSheet.absoluteFill} />
        <View style={styles.heroContent}>
          <Text style={styles.greeting}>Découvrez</Text>
          <Text style={styles.title}>Les meilleurs <Text style={styles.titleAccent}>restaurants</Text></Text>
        </View>
      </Animated.View>

      <View style={[styles.searchWrap, { paddingHorizontal: 16 }]}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un restaurant…"
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

      <FlatList
        data={restaurants}
        keyExtractor={(r) => r.slug}
        numColumns={2}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        columnWrapperStyle={styles.row}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand[500]} />}
        ListHeaderComponent={
          <>
            <View style={styles.cuisineRow}>
              {CUISINES.map((c) => {
                const active = cuisine === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setCuisine(c.key)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={styles.chipEmoji}>{c.emoji}</Text>
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {loading && (
              <View style={styles.row}>
                {[0, 1].map((i) => <SkeletonCard key={i} />)}
              </View>
            )}
          </>
        }
        renderItem={({ item: r, index }) => (
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
              <Text style={styles.emptyTitle}>Aucun restaurant trouvé</Text>
              <Text style={styles.emptyDesc}>Essayez de modifier vos filtres</Text>
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
        hasPromo && styles.cardPromo,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <LinearGradient colors={['#ffffff', '#fff7ed']} style={StyleSheet.absoluteFill} />
      <View style={styles.cardImageWrap}>
        <Image
          source={{ uri: coverUri }}
          style={styles.cardImage}
          contentFit="cover"
          transition={300}
          placeholder={{ uri: 'https://placehold.co/400x300/f5f5f5/a0a0a0?text=YoHa' }}
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.cardImageOverlay} />
        <View style={styles.cardCuisineBadge}>
          <Text style={styles.cardCuisineText}>{emoji} {r.cuisine}</Text>
        </View>
        {hasPromo && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>{r.promo}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDist}>{formatDistance(r.distance) || '—'}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={[styles.cardOpen, r.isOpen ? styles.open : styles.closed]}>
            {r.isOpen ? 'Ouvert' : 'Fermé'}
          </Text>
        </View>
        <Text style={styles.cardFee}>{r.fee || 'Livraison offerte'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  heroContent: {},
  greeting: { ...typography.caption, color: brand[500], textTransform: 'uppercase', letterSpacing: 1 },
  title: { ...typography.h1, color: ink[900], marginTop: 2 },
  titleAccent: { color: brand[500] },
  searchWrap: { paddingBottom: 8, zIndex: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderRadius: 16, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: ink[200],
    shadowColor: ink[900], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', color: ink[900] },
  searchClear: { padding: 4 },
  searchClearText: { fontSize: 14, color: ink[400], fontWeight: '700' },
  cuisineRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: ink[200],
    shadowColor: ink[900], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  chipActive: { backgroundColor: brand[500], borderColor: brand[500] },
  chipEmoji: { fontSize: 14, marginRight: 4 },
  chipLabel: { fontSize: 12, fontWeight: '700', color: ink[600] },
  chipLabelActive: { color: '#ffffff' },
  list: { paddingHorizontal: 12, paddingTop: 8 },
  row: { gap: 8, justifyContent: 'space-between', paddingHorizontal: 4 },
  card: {
    width: CARD_WIDTH, marginBottom: 12, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden', ...shadows.card,
  },
  cardPromo: { borderColor: brand[300] },
  cardImageWrap: { height: 120, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 },
  cardCuisineBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  cardCuisineText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
  promoBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: brand[500], borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  promoText: { fontSize: 10, fontWeight: '800', color: '#ffffff' },
  cardBody: { padding: 12 },
  cardName: { ...typography.h3, color: ink[900], marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  cardDist: { fontSize: 11, color: ink[400], fontWeight: '600' },
  cardDot: { fontSize: 11, color: ink[300] },
  cardOpen: { fontSize: 11, fontWeight: '700' },
  open: { color: '#10b981' },
  closed: { color: ink[400] },
  cardFee: { fontSize: 11, color: brand[600], fontWeight: '700' },
  skelLine: { height: 10, borderRadius: 5, backgroundColor: ink[200] },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...typography.h2, color: ink[900], marginBottom: 8 },
  emptyDesc: { ...typography.body, color: ink[500], textAlign: 'center' },
});
