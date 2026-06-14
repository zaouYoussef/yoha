import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuItemSheet } from '../../../src/components/MenuItemSheet';
import { MenuHighlights } from '../../../src/components/restaurant/MenuHighlights';
import { MenuCategorySection } from '../../../src/components/restaurant/MenuCategorySection';
import { RestaurantMenuHero } from '../../../src/components/restaurant/RestaurantMenuHero';
import { RestaurantMenuLoading } from '../../../src/components/restaurant/RestaurantMenuLoading';
import { StickyMenuCategories } from '../../../src/components/restaurant/StickyMenuCategories';
import { StickyCartBar } from '../../../src/components/StickyCartBar';
import { YohaButton } from '../../../src/components/ui/YohaButton';
import { useCart } from '../../../src/contexts/CartContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { MenuItem, Restaurant, restaurantsApi } from '../../../src/lib/api';
import { hapticSuccess } from '../../../src/lib/haptics';
import { CART_BAR_HEIGHT, CHROME_GAP, useLayoutChrome } from '../../../src/lib/layoutChrome';
import { ink } from '../../../src/theme';
import { fonts } from '../../../src/theme/fonts';

const AnimatedScroll = Animated.createAnimatedComponent(ScrollView);
const STICKY_OFFSET = 120;
const HERO_HEIGHT = 340;

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { addItem, count, restaurantId } = useCart();
  const { showToast } = useToast();
  const { scrollBottomPadding, cartBarBottom } = useLayoutChrome();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [activeCat, setActiveCat] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const scrollY = useSharedValue(0);
  const lastUpdate = useSharedValue(0);

  const syncActiveCategory = useCallback((scrollPos: number) => {
    const cats = restaurant?.menu || [];
    if (!cats.length) return;
    let current = cats[0].id;
    for (const cat of cats) {
      const offset = sectionOffsets.current[cat.id];
      if (offset != null && offset <= scrollPos) current = cat.id;
    }
    setActiveCat((prev) => (prev === current ? prev : current));
  }, [restaurant?.menu]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      const now = Date.now();
      if (now - lastUpdate.value >= 100) {
        lastUpdate.value = now;
        runOnJS(syncActiveCategory)(e.contentOffset.y + STICKY_OFFSET);
      }
    },
  });

  useEffect(() => {
    const raw = Array.isArray(slug) ? slug[0] : slug;
    if (!raw) return;
    const restaurantSlug = decodeURIComponent(String(raw));
    setLoading(true);
    setError('');
    (async () => {
      try {
        const data = await restaurantsApi.get(restaurantSlug);
        setRestaurant(data);
        if (data.menu?.[0]) setActiveCat(data.menu[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const categories = restaurant?.menu || [];

  const highlightItems = useMemo(() => {
    const all = categories.flatMap((c) => c.items || []).filter((i) => i.isAvailable !== false);
    return all.slice(0, 6);
  }, [categories]);

  const scrollToCategory = (catId: string) => {
    setActiveCat(catId);
    const y = sectionOffsets.current[catId];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  };

  const handleAdd = (item: MenuItem, qty = 1) => {
    if (!restaurant || item.isAvailable === false) return;
    if (restaurant.isOpen === false) {
      showToast('Restaurant fermé', restaurant.openLabel || 'Commande indisponible pour le moment', '🔒');
      return;
    }
    addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      img: item.img,
      restaurantId: restaurant.slug,
      restaurantName: restaurant.name,
    }, qty);
    hapticSuccess();
    showToast('Ajouté au panier', `${item.name} × ${qty}`, '✓');
  };

  if (loading) return <RestaurantMenuLoading />;

  if (error || !restaurant) {
    return (
      <View style={[styles.center, { padding: 24, flex: 1, backgroundColor: '#fff7ed' }]}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.error}>{error || 'Restaurant introuvable'}</Text>
        <YohaButton title="Retour" onPress={() => router.back()} style={{ marginTop: 20, alignSelf: 'stretch' }} />
      </View>
    );
  }

  const showCartWarn = !!(restaurantId && restaurantId !== restaurant.slug && count > 0);
  const isOpen = restaurant.isOpen !== false;

  return (
    <View style={styles.root}>
      <StickyMenuCategories
        categories={categories}
        activeId={activeCat}
        onSelect={scrollToCategory}
        scrollY={scrollY}
        topInset={insets.top}
        onBack={() => router.back()}
      />

      <AnimatedScroll
        ref={scrollRef as never}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding + (showCartWarn ? 52 : 0) }}
      >
        <RestaurantMenuHero
          restaurant={restaurant}
          scrollY={scrollY}
          topInset={insets.top}
          onBack={() => router.back()}
        />

        <View style={styles.content}>
          {!isOpen ? (
            <View style={styles.closedBanner}>
              <Text style={styles.closedTitle}>🔒 Restaurant fermé</Text>
              <Text style={styles.closedSub}>{restaurant.openLabel || 'Revenez aux heures d\'ouverture.'}</Text>
            </View>
          ) : null}
          <StickyMenuCategories
            categories={categories}
            activeId={activeCat}
            onSelect={scrollToCategory}
            scrollY={scrollY}
            topInset={insets.top}
            inline
          />

          <MenuHighlights
            items={highlightItems}
            onPress={setSheetItem}
            onAdd={(item) => handleAdd(item)}
            orderingDisabled={!isOpen}
          />

          {categories.map((cat) => (
            <View
              key={cat.id}
              onLayout={(e) => { sectionOffsets.current[cat.id] = HERO_HEIGHT + e.nativeEvent.layout.y; }}
            >
              <MenuCategorySection
                category={cat}
                onItemPress={setSheetItem}
                onItemAdd={(item) => handleAdd(item)}
                orderingDisabled={!isOpen}
              />
            </View>
          ))}
        </View>
      </AnimatedScroll>

      <MenuItemSheet
        item={sheetItem}
        visible={!!sheetItem}
        onClose={() => setSheetItem(null)}
        onAdd={(qty) => sheetItem && handleAdd(sheetItem, qty)}
        orderingDisabled={!isOpen}
      />

      <StickyCartBar restaurantName={restaurant.name} />

      {showCartWarn ? (
        <View style={[styles.cartWarnWrap, { bottom: cartBarBottom + CART_BAR_HEIGHT + CHROME_GAP }]}>
          <Text style={styles.cartWarn}>⚠️ Panier d&apos;un autre restaurant — il sera remplacé</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff7ed' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  closedBanner: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  closedTitle: { fontFamily: fonts.bold, fontSize: 15, color: '#b91c1c', textAlign: 'center' },
  closedSub: { marginTop: 4, fontFamily: fonts.medium, fontSize: 13, color: '#dc2626', textAlign: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorEmoji: { fontSize: 52 },
  error: { marginTop: 12, color: '#ef4444', textAlign: 'center', fontFamily: fonts.medium, fontSize: 15 },
  cartWarnWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  cartWarn: { textAlign: 'center', fontSize: 11, color: ink[600], fontFamily: fonts.medium },
});
