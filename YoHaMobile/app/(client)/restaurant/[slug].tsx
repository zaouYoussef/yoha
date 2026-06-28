import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { STATIC_STORES } from '../../../src/data/staticStores';
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
import { MenuItem, Restaurant, restaurantsApi, mediaUrl } from '../../../src/lib/api';
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

  // States for custom requests (pharmacies and patisseries)
  const [customStoreName, setCustomStoreName] = useState('');
  const [customStoreAddress, setCustomStoreAddress] = useState('');
  const [customDetails, setCustomDetails] = useState('');
  const [isAdded, setIsAdded] = useState(false);
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

    // Check if it's a static store
    const staticStore = STATIC_STORES.find(s => s.id === restaurantSlug);
    if (staticStore) {
      setRestaurant({
        id: staticStore.id,
        slug: staticStore.id,
        name: staticStore.name,
        cuisine: staticStore.cuisine,
        cover: staticStore.cover,
        logo: staticStore.logo,
        description: staticStore.description,
        fee: staticStore.fee,
        distance: staticStore.distance,
        eta: staticStore.eta,
        tags: staticStore.tags,
        isOpen: staticStore.isOpen,
        isStatic: staticStore.isStatic,
        isCustomRequest: staticStore.isCustomRequest,
        menu: []
      } as Restaurant);
      setLoading(false);
      return;
    }

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
    showToast('Ajouté au panier', `${item.name} × ${qty}`, '✓');
    hapticSuccess();
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

          {restaurant.isStatic ? (
            <View style={styles.customFormCard}>
              <Text style={styles.customFormTitle}>📝 Commander sur-mesure</Text>
              <Text style={styles.customFormSub}>
                {restaurant.cuisine === 'pharmacy' ? "Nous n'avons pas de menu pré-enregistré pour les pharmacies. Indiquez-nous ce que vous voulez, et notre livreur s'occupe de tout !" :
                 restaurant.cuisine === 'parapharmacy' ? "Nous n'avons pas de menu pré-enregistré pour les parapharmacies. Indiquez-nous ce que vous voulez, et notre livreur s'occupe de tout !" :
                 restaurant.cuisine === 'supermarket' ? "Nous n'avons pas de menu pré-enregistré pour les supermarchés. Indiquez-nous ce que vous voulez, et notre livreur s'occupe de tout !" :
                 restaurant.cuisine === 'shop' ? "Nous n'avons pas de menu pré-enregistré pour les magasins. Indiquez-nous ce que vous voulez, et notre livreur s'occupe de tout !" :
                 "Nous n'avons pas de menu pré-enregistré pour les pâtisseries. Indiquez-nous ce que vous voulez, et notre livreur s'occupe de tout !"}
              </Text>
              
              {restaurant.isCustomRequest ? (
                <>
                  <Text style={styles.inputLabel}>Nom de l&apos;établissement *</Text>
                  <TextInput
                    value={customStoreName}
                    onChangeText={setCustomStoreName}
                    placeholder="Ex: Pharmacie du Progrès, Pâtisserie Paul..."
                    placeholderTextColor="#9ca3af"
                    style={styles.textInput}
                  />
                  
                  <Text style={styles.inputLabel}>Adresse de l&apos;établissement *</Text>
                  <TextInput
                    value={customStoreAddress}
                    onChangeText={setCustomStoreAddress}
                    placeholder="Ex: Boulevard Mohammed V, Tanger"
                    placeholderTextColor="#9ca3af"
                    style={styles.textInput}
                  />
                </>
              ) : null}
              
              <Text style={styles.inputLabel}>Détaillez votre commande *</Text>
              <TextInput
                value={customDetails}
                onChangeText={setCustomDetails}
                placeholder={
                  restaurant.cuisine === 'pharmacy'
                    ? "Ex: 2 boîtes de Doliprane 1000mg, 1 sirop Toplexil..."
                    : restaurant.cuisine === 'parapharmacy'
                    ? "Ex: Crème solaire SPF 50+, gel moussant Bioderma..."
                    : restaurant.cuisine === 'supermarket'
                    ? "Ex: 2L de lait, 1kg de sucre, 1 paquet de café..."
                    : restaurant.cuisine === 'shop'
                    ? "Ex: Chargeur iPhone USB-C, écouteurs, piles AA..."
                    : "Ex: 1 boîte de 12 macarons, 1 tarte au citron pour 6 personnes..."
                }
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                style={[styles.textInput, styles.textArea]}
              />

              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerTitle}>💵 Mode de tarification</Text>
                <Text style={styles.infoBannerText}>
                  Frais de livraison fixes de <Text style={{ fontFamily: fonts.bold }}>20 DH</Text> pour cette commande. Le prix d&apos;achat réel des articles sera ajouté directement à la livraison sur présentation du ticket de caisse.
                </Text>
              </View>

              <YohaButton
                title={isAdded ? "Commande ajoutée !" : "Ajouter à mon panier"}
                disabled={
                  (restaurant.isCustomRequest && (!customStoreName.trim() || !customStoreAddress.trim())) ||
                  !customDetails.trim()
                }
                onPress={() => {
                  if (restaurant.isCustomRequest && (!customStoreName.trim() || !customStoreAddress.trim())) return;
                  if (!customDetails.trim()) return;

                  addItem({
                    id: `custom-${restaurant.slug}-${Date.now()}`,
                    name: restaurant.isCustomRequest 
                      ? `[${customStoreName.trim()}] ${customDetails.trim()}`
                      : `${restaurant.name} - ${customDetails.trim()}`,
                    price: 0,
                    img: restaurant.cuisine === 'pharmacy' ? mediaUrl('/media/restaurants/custom-pharmacy.png') :
                         restaurant.cuisine === 'parapharmacy' ? mediaUrl('/media/restaurants/custom-parapharmacy.png') :
                         restaurant.cuisine === 'supermarket' ? mediaUrl('/media/restaurants/custom-supermarket.png') :
                         restaurant.cuisine === 'shop' ? mediaUrl('/media/restaurants/custom-shop.png') :
                         mediaUrl('/media/restaurants/custom-patisserie.png'),
                    restaurantId: restaurant.slug,
                    restaurantName: restaurant.isCustomRequest ? customStoreName.trim() : restaurant.name,
                    restaurantCuisine: restaurant.cuisine,
                    isCustom: true,
                    customDetails: {
                      storeName: restaurant.isCustomRequest ? customStoreName.trim() : restaurant.name,
                      storeAddress: restaurant.isCustomRequest ? customStoreAddress.trim() : restaurant.distance,
                      details: customDetails.trim()
                    }
                  } as any, 1);

                  setCustomDetails('');
                  if (restaurant.isCustomRequest) {
                    setCustomStoreName('');
                    setCustomStoreAddress('');
                  }
                  setIsAdded(true);
                  setTimeout(() => setIsAdded(false), 2000);
                  showToast('Ajouté au panier', 'Votre demande sur-mesure a été ajoutée.', '✓');
                  hapticSuccess();
                }}
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            <>
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
            </>
          )}
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
  customFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.1)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  customFormTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: ink[900],
    marginBottom: 8,
  },
  customFormSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: ink[500],
    lineHeight: 18,
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink[700],
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: ink[900],
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoBanner: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    marginBottom: 16,
  },
  infoBannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#b45309',
    marginBottom: 4,
  },
  infoBannerText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#d97706',
    lineHeight: 16,
  },
});
