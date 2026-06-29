import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryBannerScroll } from '../../src/components/ui/CategoryBannerScroll';
import { DiscoverBento } from '../../src/components/discover/DiscoverBento';
import { DiscoverEmptyWow } from '../../src/components/discover/DiscoverEmptyWow';
import { CraveRoulette } from '../../src/components/discover/CraveRoulette';
import { DiscoverHero } from '../../src/components/discover/DiscoverHero';
import { DiscoverPromoDeck } from '../../src/components/discover/DiscoverPromoDeck';
import { DiscoverSectionHeader } from '../../src/components/discover/DiscoverSectionHeader';
import { FavoritesRow } from '../../src/components/discover/FavoritesRow';
import { OrderAgainStrip } from '../../src/components/discover/OrderAgainStrip';
import { TrendingCarousel } from '../../src/components/discover/TrendingCarousel';
import { PromoRow } from '../../src/components/discover/PromoRow';
import { PremiumBackground } from '../../src/components/PremiumBackground';
import { RestaurantCard } from '../../src/components/RestaurantCard';
import { SocialProofBanner } from '../../src/components/SocialProofBanner';
import { StickyCartBar } from '../../src/components/StickyCartBar';
import { RestaurantSkeleton } from '../../src/components/ui/Skeleton';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/contexts/CartContext';
import { useToast } from '../../src/contexts/ToastContext';
import { useActiveOrder } from '../../src/hooks/useActiveOrder';
import { useLastOrder } from '../../src/hooks/useLastOrder';
import { Restaurant, restaurantsApi } from '../../src/lib/api';
import { getFavoriteIds } from '../../src/lib/favorites';
import { hapticSuccess } from '../../src/lib/haptics';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { orderToCartItems } from '../../src/lib/reorder';
import { hasAnyRestaurantOpen } from '../../src/lib/openingHours';
import { STATIC_STORES } from '../../src/data/staticStores';
import { brand } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

const AnimatedScroll = Animated.createAnimatedComponent(ScrollView);

function ServiceGrid({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  const services = [
    { id: '', label: 'Restaurants', emoji: '🍽️', colors: ['#fb923c', '#f97316'] as [string, string] },
    { id: 'dessert', label: 'Pâtisseries', emoji: '🥐', colors: ['#f472b6', '#ec4899'] as [string, string] },
    { id: 'pharmacy', label: 'Pharmacies', emoji: '💊', colors: ['#34d399', '#10b981'] as [string, string] },
    { id: 'parapharmacy', label: 'Parapharma', emoji: '🌿', colors: ['#6ee7b7', '#059669'] as [string, string] },
    { id: 'supermarket', label: 'Supermarché', emoji: '🛒', colors: ['#60a5fa', '#3b82f6'] as [string, string] },
    { id: 'shop', label: 'Magasins', emoji: '🛍️', colors: ['#c084fc', '#a855f7'] as [string, string] },
  ];

  return (
    <View style={styles.serviceGrid}>
      {services.map(s => {
        const isActive = active === s.id;
        return (
          <Pressable
            key={s.id}
            onPress={() => onSelect(s.id)}
            style={[styles.serviceCard, isActive && styles.serviceCardActive]}
          >
            <LinearGradient colors={s.colors} style={styles.serviceGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.serviceEmoji}>{s.emoji}</Text>
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </LinearGradient>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ClientHome() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeOrder } = useActiveOrder();
  const { lastOrder } = useLastOrder();
  const { replaceItems } = useCart();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ filterCuisine?: string; searchVal?: string }>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const scrollY = useSharedValue(0);
  const isFirstLoad = useRef(true);
  const { scrollBottomPadding } = useLayoutChrome();

  useEffect(() => {
    if (params.filterCuisine !== undefined) {
      setCuisine(params.filterCuisine === 'all' ? '' : params.filterCuisine);
    }
  }, [params.filterCuisine]);

  useEffect(() => {
    if (params.searchVal !== undefined) {
      setQuery(params.searchVal);
    }
  }, [params.searchVal]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const load = useCallback(async (opts?: { pull?: boolean; showSkeleton?: boolean }) => {
    setError('');
    if (opts?.pull) setRefreshing(true);
    else if (opts?.showSkeleton) setLoading(true);
    try {
      if (['pharmacy', 'dessert', 'parapharmacy', 'supermarket', 'shop'].includes(cuisine)) {
        let filtered = STATIC_STORES.filter(s => s.cuisine === cuisine);
        if (query) {
          const q = query.toLowerCase();
          filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(q) || 
            s.tags.some(t => t.toLowerCase().includes(q))
          );
        }
        const mapped = filtered.map(s => ({
          id: s.id,
          slug: s.id,
          name: s.name,
          cuisine: s.cuisine,
          cover: s.cover,
          logo: s.logo,
          description: s.description,
          fee: s.fee,
          distance: s.distance,
          eta: s.eta,
          tags: s.tags,
          isOpen: s.isOpen,
          isStatic: s.isStatic,
          isCustomRequest: s.isCustomRequest,
          menu: []
        } as Restaurant));
        setRestaurants(mapped);
      } else {
        const data = await restaurantsApi.list({
          ...(query ? { q: query } : {}),
          ...(cuisine && cuisine !== 'promos' ? { cuisine } : {}),
        });
        if (cuisine === 'promos') {
          setRestaurants(data.filter((r) => !!r.promo));
        } else {
          setRestaurants(data);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, cuisine]);

  useEffect(() => {
    const showSkeleton = isFirstLoad.current;
    const t = setTimeout(() => {
      load({ showSkeleton });
      isFirstLoad.current = false;
    }, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query, cuisine]);

  useFocusEffect(
    useCallback(() => {
      getFavoriteIds().then(setFavoriteIds);
    }, []),
  );

  const name = useMemo(() => {
    if (!user?.displayName) return 'toi';
    return user.displayName.split(/\s+/)[0];
  }, [user]);

  const userInitial = user?.displayName?.[0]?.toUpperCase() ?? 'Y';
  const isGuest = !user;
  const hasFilter = !!(query || cuisine);
  const showWowSections = !hasFilter && !loading && !error;

  const favorites = useMemo(
    () => restaurants.filter((r) => favoriteIds.includes(r.slug)),
    [restaurants, favoriteIds],
  );

  const trending = useMemo(() => restaurants.slice(0, 6), [restaurants]);
  const bentoRestaurants = useMemo(() => restaurants.slice(0, 5), [restaurants]);
  const listRestaurants = useMemo(
    () => (hasFilter ? restaurants : restaurants.slice(1)),
    [hasFilter, restaurants],
  );

  const anyRestoOpen = useMemo(() => hasAnyRestaurantOpen(restaurants), [restaurants]);

  const applyCuisine = useCallback((id: string) => {
    setCuisine(id);
    setQuery('');
  }, []);

  const handleSelectCuisine = useCallback((id: string) => {
    applyCuisine(id === 'all' ? '' : id);
  }, [applyCuisine]);

  const handleReorder = useCallback((order: typeof lastOrder) => {
    if (!order) return;
    const lines = orderToCartItems(order);
    if (!lines.length) {
      showToast('Panier vide', 'Cette commande ne contient pas d’articles.');
      return;
    }
    const cartLines = lines.map((l) => {
      const qty = order.items?.find((i) => String(i.id) === l.id)?.qty || 1;
      return { ...l, qty };
    });
    replaceItems(cartLines);
    showToast('Panier rempli !', 'Commandez à nouveau en un clic', '↻');
    router.push('/(client)/cart' as never);
    hapticSuccess();
  }, [replaceItems, showToast]);

  return (
    <PremiumBackground variant="warm">
      <View style={{ flex: 1 }}>


        <AnimatedScroll
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load({ pull: true })}
              tintColor={brand[500]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <DiscoverHero
            name={name}
            userInitial={userInitial}
            isGuest={isGuest}
            query={query}
            onQueryChange={setQuery}
            activeOrder={activeOrder}
            topInset={insets.top}
            onPromoPress={() => handleSelectCuisine('promos')}
          />

          <View style={styles.body}>
            <ServiceGrid
              active={cuisine}
              onSelect={handleSelectCuisine}
            />

            {!['pharmacy', 'parapharmacy', 'supermarket', 'shop', 'dessert'].includes(cuisine) ? (
              <CategoryBannerScroll
                active={cuisine || 'all'}
                onSelect={handleSelectCuisine}
              />
            ) : null}

            {showWowSections && restaurants.length > 0 ? (
              <DiscoverBento restaurants={bentoRestaurants} activeOrder={activeOrder} />
            ) : null}

            {showWowSections && lastOrder && lastOrder.status === 'delivered' ? (
              <OrderAgainStrip order={lastOrder} onReorder={handleReorder} />
            ) : null}

            {showWowSections && restaurants.length > 0 ? (
              <CraveRoulette restaurants={restaurants} />
            ) : null}

            {showWowSections && restaurants.length > 0 ? (
              <PromoRow restaurants={restaurants} />
            ) : null}

            {anyRestoOpen ? <SocialProofBanner /> : null}
            <DiscoverPromoDeck onOffresFlashPress={() => handleSelectCuisine('promos')} />

            {showWowSections && favorites.length > 0 ? (
              <FavoritesRow restaurants={favorites} />
            ) : null}

            {showWowSections && restaurants.length > 0 ? (
              <TrendingCarousel restaurants={trending} />
            ) : null}

            {!loading && !error && restaurants.length > 0 ? (
              <DiscoverSectionHeader
                cuisine={cuisine}
                count={restaurants.length}
                loading={loading}
                onClearFilter={() => applyCuisine('')}
              />
            ) : null}

            {loading && restaurants.length === 0 ? (
              <View style={{ marginTop: 12 }}>
                {[1, 2, 3].map((i) => <RestaurantSkeleton key={i} />)}
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <YohaButton title="Réessayer" onPress={() => load()} size="md" style={{ marginTop: 14 }} />
              </View>
            ) : null}

            {!loading && !error && restaurants.length === 0 ? (
              <DiscoverEmptyWow onReset={() => applyCuisine('')} />
            ) : null}

            {listRestaurants.map((r, i) => (
              <RestaurantCard
                key={r.slug}
                restaurant={r}
                featured={hasFilter && i === 0}
                onPress={() => router.push(`/(client)/restaurant/${r.slug}` as never)}
              />
            ))}
          </View>
        </AnimatedScroll>

        <StickyCartBar />
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 20 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 16, padding: 18, marginBottom: 16 },
  errorText: { color: '#b91c1c', fontSize: 14, fontFamily: fonts.medium },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  serviceCard: {
    width: '48%',
    height: 80,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  serviceCardActive: {
    borderWidth: 2.5,
    borderColor: '#fff',
    elevation: 4,
    shadowOpacity: 0.15,
  },
  serviceGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  serviceEmoji: {
    fontSize: 24,
  },
  serviceLabel: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
});
