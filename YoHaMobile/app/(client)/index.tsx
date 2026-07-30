import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { restaurantsApi, type Restaurant } from '../../src/lib/api';
import { brand, gradients, ink, radius, shadows, typography } from '../../src/theme';
import { resolveImageUrl } from '../../src/lib/resolveImageUrl';
import { hapticLight, hapticSelection, hapticSuccess } from '../../src/lib/haptics';
import { CraveRoulette } from '../../src/components/CraveRoulette';
import { ReorderBanner } from '../../src/components/ReorderBanner';
import { LoyaltyStreakCard } from '../../src/components/LoyaltyStreakCard';
import { AuroraHero } from '../../src/components/animations/AuroraHero';
import { FloatingOrbs } from '../../src/components/animations/FloatingOrbs';
import { FadeInView } from '../../src/components/animations/FadeInView';




const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;
const HORIZONTAL_CARD_W = 250;

const CATEGORY_GLOW: Record<string, string> = {
  pizza: '#f97316', tacos: '#d97706', kebab: '#ea580c',
  healthy: '#10b981', burger: '#f59e0b', sushi: '#ec4899',
  asian: '#a855f7', medical: '#0ea5e9', dessert: '#ec4899',
  pharmacy: '#10b981', parapharmacy: '#34d399', supermarket: '#06b6d4',
  shop: '#c084fc', drinks: '#06b6d4',
};

const MAIN_SERVICE_TABS = [
  { id: 'all', label: 'Restos', emoji: '🍔' },
  { id: 'pharmacy', label: 'Pharmacies', emoji: '💊' },
  { id: 'parapharmacy', label: 'Parapharma', emoji: '🌿' },
  { id: 'dessert', label: 'Pâtisseries', emoji: '🥐' },
  { id: 'supermarket', label: 'Supermarché', emoji: '🛒' },
  { id: 'shop', label: 'Magasins', emoji: '🛍️' },
];

const SUB_CATEGORIES: Record<string, { id: string; label: string; emoji: string; image: string }[]> = {
  pharmacy: [
    { id: 'pharm-meds', label: 'Médicaments', emoji: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80' },
    { id: 'pharm-hygiene', label: 'Hygiène', emoji: '🧼', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=80' },
    { id: 'pharm-bebe', label: 'Bébé', emoji: '👶', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=80' },
    { id: 'pharm-vit', label: 'Vitamines', emoji: '💪', image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=80' },
  ],
  parapharmacy: [
    { id: 'para-beaute', label: 'Beauté', emoji: '💄', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80' },
    { id: 'para-soin', label: 'Soin Visage', emoji: '🧴', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80' },
    { id: 'para-cheveux', label: 'Cheveux', emoji: '💆', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80' },
  ],
  dessert: [
    { id: 'des-patisserie', label: 'Pâtisseries', emoji: '🥐', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80' },
    { id: 'des-gateau', label: 'Gâteaux', emoji: '🍰', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80' },
    { id: 'des-glace', label: 'Glaces', emoji: '🍨', image: 'https://images.unsplash.com/photo-1560008511-11c63416e52d?w=500&auto=format&fit=crop&q=80' },
  ],
  supermarket: [
    { id: 'sup-fruits', label: 'Fruits', emoji: '🍎', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80' },
    { id: 'sup-legumes', label: 'Légumes', emoji: '🥬', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80' },
    { id: 'sup-lait', label: 'Laitiers', emoji: '🥛', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80' },
    { id: 'sup-boissons', label: 'Boissons', emoji: '🥤', image: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=500&auto=format&fit=crop&q=80' },
  ],
  shop: [
    { id: 'shop-vet', label: 'Vêtements', emoji: '👕', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=80' },
    { id: 'shop-elec', label: 'Électronique', emoji: '📱', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80' },
  ],
};

const STATIC_SERVICE_STORES: Record<string, Restaurant[]> = {
  pharmacy: [
    { id: 'custom-pharmacy', slug: 'pharmacie-sur-mesure', name: 'Pharmacie sur-mesure 💊', cuisine: 'pharmacy', distance: '0.1 km', isOpen: true, fee: '20 DH', promo: 'Prescription & Urgences', cover: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&auto=format&fit=crop&q=85' },
    { id: 'pharmacie-provence', slug: 'pharmacie-provence', name: 'Pharmacie Provence', cuisine: 'pharmacy', distance: '1.7 km', isOpen: true, fee: '20 DH', cover: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=85' },
    { id: 'pharmacie-cervantes', slug: 'pharmacie-cervantes', name: 'Pharmacie Cervantes', cuisine: 'pharmacy', distance: '1.6 km', isOpen: true, fee: '20 DH', cover: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=85' },
    { id: 'pharmacie-gibraltar', slug: 'pharmacie-gibraltar', name: 'Pharmacie Gibraltar', cuisine: 'pharmacy', distance: '1.1 km', isOpen: true, fee: '20 DH', cover: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=85' },
    { id: 'pharmacie-city-center', slug: 'pharmacie-city-center', name: 'Pharmacie City Center', cuisine: 'pharmacy', distance: '0.8 km', isOpen: true, fee: '20 DH', cover: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=crop&q=85' },
  ],
  parapharmacy: [
    { id: 'para-beautyshop', slug: 'parapharma-beauty', name: 'Parapharma Beauty Care 🌿', cuisine: 'parapharmacy', distance: '1.2 km', isOpen: true, fee: '15 DH', promo: '-15% Soins', cover: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=85' },
    { id: 'para-tanger-centre', slug: 'parapharma-tanger', name: 'Para Tanger Centre', cuisine: 'parapharmacy', distance: '2.1 km', isOpen: true, fee: '15 DH', cover: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=85' },
  ],
  dessert: [
    { id: 'patisserie-rahal', slug: 'patisserie-rahal', name: 'Pâtisserie Rahal Tanger 🥐', cuisine: 'dessert', distance: '0.9 km', isOpen: true, fee: '15 DH', promo: 'Croissants Frais', cover: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=85' },
    { id: 'maison-du-chocolat', slug: 'maison-chocolat', name: 'Maison du Chocolat 🍰', cuisine: 'dessert', distance: '1.4 km', isOpen: true, fee: '15 DH', cover: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=85' },
  ],
  supermarket: [
    { id: 'marjane-market', slug: 'marjane-market', name: 'Marjane Market CHU 🛒', cuisine: 'supermarket', distance: '1.0 km', isOpen: true, fee: '20 DH', promo: 'Courses Rapides', cover: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=85' },
    { id: 'carrefour-express', slug: 'carrefour-express', name: 'Carrefour Express Tanger', cuisine: 'supermarket', distance: '1.8 km', isOpen: true, fee: '20 DH', cover: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85' },
  ],
  shop: [
    { id: 'tech-shop-tanger', slug: 'tech-shop-tanger', name: 'Tech & High-Tech Tanger 📱', cuisine: 'shop', distance: '1.5 km', isOpen: true, fee: '25 DH', cover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=85' },
  ],
};

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
  { id: 'p-1', title: 'Livraison Offerte 🏍️', subtitle: 'Sur vos 3 premières commandes YoHa', bg: ['#f97316', '#ec4899'] as const },
  { id: 'p-2', title: '-20% sur les Tacos 🌮', subtitle: 'Offre exclusive Snack Roma Tanger', bg: ['#8b5cf6', '#d946ef'] as const },
  { id: 'p-3', title: 'Les Coups de Cœur 🔥', subtitle: 'Sélection des meilleurs restos CHU', bg: ['#059669', '#10b981'] as const },
];

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatDistance(d: string | undefined): string {
  if (!d) return '1.2 km';
  const num = parseFloat(d);
  if (isNaN(num)) return d;
  return num < 1 ? `${Math.round(num * 1000)} m` : `${num.toFixed(1)} km`;
}

function formatTag(tag: string): string {
  if (!tag || typeof tag !== 'string') return '';
  const trimmed = tag.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatTags(tags: string[] | string | undefined, separator = ' • '): string {
  if (!tags) return '';
  const list = Array.isArray(tags) ? tags : [tags];
  return list.map(formatTag).filter(Boolean).join(separator);
}

function getCuisineEmoji(cuisine?: string): string {
  const map: Record<string, string> = {
    pizza: '🍕', tacos: '🌮', kebab: '🥙', sushi: '🍣',
    burger: '🍔', healthy: '🥗', medical: '🏥', pharmacy: '💊',
    parapharmacy: '🌿', dessert: '🥐', supermarket: '🛒', shop: '🛍️',
    asian: '🥢', sandwich: '🥪', chicken: '🍗', drinks: '🥤',
  };
  return (cuisine && map[cuisine]) || '🍽️';
}

function isRestaurantOpen(r: Restaurant): boolean {
  return r.isOpen ?? true;
}

function SkeletonCard() {
  return (
    <View style={styles.skelCard}>
      <View style={styles.skelImage} />
      <View style={styles.skelBody}>
        <View style={[styles.skelLine, { width: '75%' }]} />
        <View style={[styles.skelLine, { width: '50%', marginTop: 8 }]} />
        <View style={[styles.skelLine, { width: '60%', marginTop: 8 }]} />
      </View>
    </View>
  );
}

function SkeletonHorizontalCard() {
  return (
    <View style={styles.skelHCard}>
      <View style={styles.skelHImage} />
      <View style={styles.skelHBody}>
        <View style={[styles.skelLine, { width: '70%' }]} />
        <View style={[styles.skelLine, { width: '45%', marginTop: 6 }]} />
        <View style={{ height: 1, backgroundColor: ink[100], marginVertical: 6 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[styles.skelLine, { width: '35%' }]} />
          <View style={[styles.skelLine, { width: '40%' }]} />
        </View>
      </View>
    </View>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.searchWrap, focused && styles.searchWrapFocused]}>
      <LinearGradient
        colors={['#f97316', '#ec4899', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.searchGlow, { opacity: focused ? 0.55 : 0 }]}
      />
      <View style={[styles.searchInner, focused && styles.searchInnerFocused]}>
        <Text style={[styles.searchIcon, focused && { color: brand[500] }]}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Pizza, sushi, bowls healthy…"
          placeholderTextColor={ink[400]}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChange('')} style={styles.searchClearBtn}>
            <Text style={styles.searchClearText}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PromoBannersCarousel({ onSelectCategory }: { onSelectCategory?: (cat: string) => void }) {
  return (
    <View style={{ gap: 12 }}>
      <ReorderBanner
        lastOrderName="Tacos XL Double & Frites"
        lastOrderPrice="45 DH"
        onReorder={() => router.push('/(client)/cart')}
      />
      <LoyaltyStreakCard points={140} streakCount={3} level="Argent 🥈" />
      {onSelectCategory ? <CraveRoulette onSelectCategory={onSelectCategory} /> : null}

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
    </View>
  );
}


function CuisineCategories({ filter, onFilter }: { filter: string; onFilter: (id: string) => void }) {
  return (
    <View style={styles.cuisineSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cuisineScroll}>
        {CUISINE_CATEGORIES.map((c) => {
          const active = filter === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => onFilter(active ? 'all' : c.id)}
              style={styles.cuisineBtn}
            >
              <View style={[styles.cuisineImageWrap, active && styles.cuisineImageWrapActive]}>
                <Image source={{ uri: c.image }} style={styles.cuisineImage} contentFit="cover" transition={300} />
                <View style={styles.cuisineOverlay} />
              </View>
              <Text style={[styles.cuisineLabel, active && styles.cuisineLabelActive]} numberOfLines={1}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FeaturedSpotlightCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const open = isRestaurantOpen(restaurant);
  const tags = Array.isArray(restaurant.tags) ? restaurant.tags : [];
  return (
    <View style={styles.featuredWrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.featuredCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      >
        <Image source={{ uri: resolveImageUrl(restaurant.cover, restaurant.cuisine) }} style={styles.featuredImage} contentFit="cover" transition={400} />
        <LinearGradient colors={['#020617', '#020617cc', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={styles.featuredGlowMesh} />
        <View style={styles.featuredBody}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>🔥 COUP DE CŒUR</Text>
          </View>
          <Text style={styles.featuredTitle}>{restaurant.name}</Text>
          <Text style={styles.featuredTags} numberOfLines={1}>{formatTags(tags, ' · ')}</Text>
          <View style={styles.featuredMeta}>
            {restaurant.promo && (
              <View style={styles.featuredTag}>
                <Text style={styles.featuredTagText}>🎁 {restaurant.promo}</Text>
              </View>
            )}
            <View style={styles.featuredTagGreen}>
              <Text style={styles.featuredTagGreenText}>{open ? '● Ouvert' : '🔒 Fermé'}</Text>
            </View>
            <View style={styles.featuredTagDark}>
              <Text style={styles.featuredTagDarkText}>📍 {formatDistance(restaurant.distance)}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const open = isRestaurantOpen(restaurant);
  const hasPromo = !!restaurant.promo;
  const coverUri = resolveImageUrl(restaurant.cover, restaurant.cuisine);
  const cuisineEmoji = getCuisineEmoji(restaurant.cuisine);
  const rating = (restaurant as any).rating ?? 4.9;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, hasPromo && styles.cardPromo, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: coverUri }} style={styles.cardImage} contentFit="cover" transition={300} />
        <LinearGradient colors={['transparent', 'rgba(2,6,23,0.85)']} style={styles.cardImageOverlay} />
        {!open && (
          <View style={styles.cardClosed}>
            <Text style={styles.cardClosedText}>🔒 Fermé</Text>
          </View>
        )}
        <View style={styles.cardCuisineBadge}>
          <Text style={styles.cardCuisineText}>{cuisineEmoji} {restaurant.cuisine || 'Restau'}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingText}>{typeof rating === 'number' ? rating.toFixed(1) : '4.9'}</Text>
        </View>
        {hasPromo && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>{restaurant.promo}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{restaurant.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDist}>📍 {formatDistance(restaurant.distance) || '1.2 km'}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={[styles.cardOpen, open ? styles.openText : styles.closedText]}>
            {open ? 'Ouvert' : 'Fermé'}
          </Text>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardFooter}>
          <View style={styles.cardFeeRow}>
            <Text style={styles.cardFeeOld}>19,99 MAD</Text>
            <Text style={styles.cardFeeFree}>0,00 MAD</Text>
          </View>
          <Text style={styles.cardTime}>{(restaurant as any).eta || '25-35 min'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function RestaurantCardHorizontal({ restaurant, onPress, promo }: { restaurant: Restaurant; onPress: () => void; promo?: boolean }) {
  const open = isRestaurantOpen(restaurant);
  const coverUri = resolveImageUrl(restaurant.cover, restaurant.cuisine);
  const rating = (restaurant as any).rating ?? 4.4;
  const isNonFood = ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(restaurant.cuisine || '');

  return (
    <Pressable onPress={onPress} style={styles.hCard}>
      <View style={styles.hCardInner}>
        <View style={styles.hCardImageWrap}>
          <Image
            source={{ uri: coverUri }}
            style={[styles.hCardImage, !open && styles.hCardImageClosed]}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.hCardTimeBadge}>
            <Text style={styles.hCardTimeText}>{(restaurant as any).eta || '30-45 min'}</Text>
          </View>
          {!open && (
            <View style={styles.hCardClosedOverlay}>
              <Text style={styles.hCardClosedText}>🔒 Fermé</Text>
            </View>
          )}
        </View>
        <View style={styles.hCardBody}>
          <Text style={styles.hCardName} numberOfLines={1}>{restaurant.name}</Text>
          <View style={styles.hCardRatingRow}>
            <Text style={styles.hCardRatingStar}>★</Text>
            <Text style={styles.hCardRatingNum}>{String(rating).replace('.', ',')}</Text>
            <Text style={styles.hCardDot}>·</Text>
            <Text style={styles.hCardDist}>{formatDistance(restaurant.distance)}</Text>
            <Text style={styles.hCardDot}>·</Text>
            <Text style={styles.hCardFast}>⚡ Rapide</Text>
          </View>
          <View style={styles.hCardFeeRow}>
            {isNonFood ? (
              <Text style={styles.hCardFee}>20 MAD de livraison</Text>
            ) : (
              <>
                <Text style={styles.hCardFeeOld}>% 19,99 MAD</Text>
                <Text style={styles.hCardFeeFree}>0,00 MAD de livraison</Text>
              </>
            )}
          </View>
          <View style={styles.hCardTagRow}>
            <Text style={styles.hCardSponsor}>Sponsorisé</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function HorizontalRow({
  title, subtitle, count, children, onSeeAll,
}: {
  title: string; subtitle?: string; count?: number; children: React.ReactNode; onSeeAll?: () => void;
}) {
  return (
    <View style={styles.hRow}>
      <View style={styles.hRowHeader}>
        <View>
          <Text style={styles.hRowTitle}>{title}</Text>
          {subtitle && <Text style={styles.hRowSubtitle}>{subtitle}</Text>}
        </View>
        {count && count > 0 ? (
          <Pressable onPress={onSeeAll} style={styles.hRowSeeAll}>
            <Text style={styles.hRowSeeAllText}>Tout voir ({count})</Text>
            <Text style={styles.hRowSeeAllArrow}>→</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRowScroll}>
        {children}
      </ScrollView>
    </View>
  );
}

function EmptyState({ catalogEmpty, filter, onShowAll }: { catalogEmpty: boolean; filter: string; onShowAll: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🍽️</Text>
      <Text style={styles.emptyTitle}>{catalogEmpty ? 'Le catalogue est vide' : 'Aucun établissement trouvé'}</Text>
      <Text style={styles.emptyDesc}>
        {catalogEmpty
          ? "Nous n'avons pas pu charger d'établissements. Vérifiez votre connexion."
          : `Aucun partenaire ne correspond à votre recherche.`}
      </Text>
      {!catalogEmpty && onShowAll && (
        <Pressable onPress={onShowAll} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Voir tous les établissements</Text>
        </Pressable>
      )}
    </View>
  );
}

const AnimatedFlatList = FlatList as unknown as React.ComponentType<any>;

export default function ClientHome() {
  const insets = useSafeAreaInsets();
  const [catalog, setCatalog] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [serviceTab, setServiceTab] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const list = await restaurantsApi.list();
      setCatalog(list);
    } catch {
      setCatalog([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const foodRestaurants = useMemo(() => {
    const nonFood = ['pharmacy', 'parapharmacy', 'supermarket', 'shop', 'dessert', 'patisserie'];
    const seen = new Set<string>();
    return catalog.filter((r) => {
      if (!r || !r.name) return false;
      if (nonFood.includes(r.cuisine || '')) return false;
      const key = r.id || r.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [catalog]);

  const openCount = useMemo(() => foodRestaurants.filter((r) => isRestaurantOpen(r)).length, [foodRestaurants]);

  const featured = useMemo(() => {
    const openList = foodRestaurants.filter((r) => isRestaurantOpen(r));
    return openList.find((r) => r.promo) || openList[0] || foodRestaurants[0] || null;
  }, [foodRestaurants]);

  const promoRestaurants = useMemo(() => foodRestaurants.filter(r => r.promo && isRestaurantOpen(r)), [foodRestaurants]);
  const popularRestaurants = useMemo(() => {
    return [...foodRestaurants].filter(r => isRestaurantOpen(r)).sort((a, b) => ((b as any).rating ?? 4.8) - ((a as any).rating ?? 4.8));
  }, [foodRestaurants]);
  const topRatedList = useMemo(() => foodRestaurants.filter(r => ((r as any).rating ?? 4.8) >= 4.7), [foodRestaurants]);
  const burgerList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'burger'), [foodRestaurants]);
  const pizzaList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'pizza'), [foodRestaurants]);
  const asianList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'sushi' || r.cuisine === 'asian'), [foodRestaurants]);
  const kebabList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'kebab'), [foodRestaurants]);
  const tacosList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'tacos'), [foodRestaurants]);
  const sandwichList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'sandwich'), [foodRestaurants]);
  const healthyList = useMemo(() => foodRestaurants.filter(r => r.cuisine === 'healthy'), [foodRestaurants]);

  const displayList = useMemo(() => {
    let list: Restaurant[] = [];
    if (serviceTab !== 'all') {
      const staticItems = STATIC_SERVICE_STORES[serviceTab] || [];
      const catalogItems = catalog.filter((r) => r.cuisine === serviceTab);
      list = [...staticItems, ...catalogItems];
    } else {
      list = catalog;
    }
    if (cuisineFilter !== 'all') {
      list = list.filter((r) => r.cuisine === cuisineFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.name?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q));
    }
    return list;
  }, [catalog, serviceTab, cuisineFilter, search]);

  const isDefault = serviceTab === 'all' && cuisineFilter === 'all' && !search.trim();
  const subItems = SUB_CATEGORIES[serviceTab] || [];
  const filterActive = cuisineFilter !== 'all' || serviceTab !== 'all';

  const fastDelivery = useMemo(() => foodRestaurants.filter(r => isRestaurantOpen(r)), [foodRestaurants]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AnimatedFlatList
        data={displayList}
        keyExtractor={(r: any) => String(r.slug || r.id || Math.random())}
        numColumns={2}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand[500]} />}
        ListHeaderComponent={
          <>
            {/* ═══ HERO SECTION WITH NATIVE 60FPS REANIMATED AURORA ═══ */}
            <LinearGradient colors={['#fff7ed', '#ffffff', '#fff7ed']} style={styles.heroWrap}>
              <AuroraHero />
              <FloatingOrbs />

              {/* Location + Open Count */}
              <FadeInView delay={50}>
                <View style={styles.heroTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Image source={require('../../assets/images/logo.png')} style={{ width: 34, height: 34, borderRadius: 8 }} contentFit="contain" />
                    <View style={styles.locationPill}>
                      <Text style={styles.locationPin}>📍</Text>
                      <Text style={styles.locationText}>CHU-Tanger</Text>
                    </View>
                  </View>
                  <View style={styles.openBadge}>
                    <View style={styles.openDot} />
                    <Text style={styles.openBadgeText}>{openCount || 4} ouverts</Text>
                  </View>
                </View>
              </FadeInView>

              {/* Greeting */}
              <FadeInView delay={120}>
                <View style={styles.greetingWrap}>
                  <Text style={styles.greetingText}>
                    {timeGreeting()},{' '}
                    <Text style={styles.greetingName}>YoHa Client</Text>
                    <Text style={styles.greetingWave}> 👋</Text>
                  </Text>
                  <Text style={styles.subtitleText}>Livraison · Maintenant · 🏍️ Frais offerts</Text>
                </View>
              </FadeInView>

              {/* Search Bar */}
              <FadeInView delay={180}>
                <SearchBar value={search} onChange={setSearch} />
              </FadeInView>
            </LinearGradient>


            {/* ═══ SMART REORDER BANNER ═══ */}
            {!search && <SmartReorderBanner />}

            {/* ═══ SERVICE TABS ═══ */}
            {!search && (
              <View style={styles.serviceTabsWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceTabsScroll}>
                  {MAIN_SERVICE_TABS.map((tab) => {
                    const active = serviceTab === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        onPress={() => { setServiceTab(tab.id); setCuisineFilter('all'); }}
                        style={styles.serviceTabBtn}
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
            )}

            {/* ═══ SUB-CATEGORY CAROUSEL ═══ */}
            {subItems.length > 0 && !search && (
              <View style={styles.subCatSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCatScroll}>
                  {subItems.map((sub) => (
                    <Pressable key={sub.id} style={styles.subCatBtn}>
                      <View style={styles.subCatImageWrap}>
                        <Image source={{ uri: sub.image }} style={styles.subCatImage} contentFit="cover" />
                      </View>
                      <Text style={styles.subCatLabel}>{sub.emoji} {sub.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ═══ PROMO BANNERS & REORDER & CRAVEROULETTE ═══ */}
            {isDefault && <PromoBannersCarousel onSelectCategory={(cat) => setCuisineFilter(cat)} />}

            {/* ═══ CUISINE CATEGORIES ═══ */}
            {!search && serviceTab === 'all' && (
              <CuisineCategories filter={cuisineFilter} onFilter={setCuisineFilter} />
            )}

            {/* ═══ FEATURED SPOTLIGHT ═══ */}
            {featured && isDefault && (
              <FeaturedSpotlightCard
                restaurant={featured}
                onPress={() => router.push(`/(client)/restaurant/${featured.slug}`)}
              />
            )}

            {/* ═══ DEFAULT HOME SECTIONS ═══ */}
            {isDefault && (
              <>
                <HorizontalRow
                  title="Frais de livraison offerts"
                  subtitle="Livraison 0 MAD sur tout l'Alliance & CHU"
                  count={foodRestaurants.length}
                  onSeeAll={() => {}}
                >
                  {foodRestaurants.slice(0, 8).map((r) => (
                    <RestaurantCardHorizontal
                      key={`free-${r.id}`}
                      restaurant={r}
                      onPress={() => router.push(`/(client)/restaurant/${r.slug}`)}
                      promo
                    />
                  ))}
                </HorizontalRow>

                <HorizontalRow
                  title="À la une"
                  subtitle="Annonces payantes de nos partenaires"
                >
                  {foodRestaurants.slice(0, 6).map((r) => (
                    <RestaurantCardHorizontal
                      key={`featured-${r.id}`}
                      restaurant={r}
                      onPress={() => router.push(`/(client)/restaurant/${r.slug}`)}
                      promo
                    />
                  ))}
                </HorizontalRow>

                <HorizontalRow
                  title="🔥 Populaires dans votre quartier"
                  subtitle="Établissements très prisés au campus & hôpitaux"
                  count={popularRestaurants.length}
                >
                  {popularRestaurants.slice(0, 8).map((r) => (
                    <RestaurantCardHorizontal
                      key={`pop-${r.id}`}
                      restaurant={r}
                      onPress={() => router.push(`/(client)/restaurant/${r.slug}`)}
                    />
                  ))}
                </HorizontalRow>

                <HorizontalRow
                  title="⚡ Frais de livraison tout doux"
                  subtitle="Livraison ultra rapide en moins de 30 min"
                  count={fastDelivery.length}
                >
                  {fastDelivery.slice(0, 8).map((r) => (
                    <RestaurantCardHorizontal
                      key={`fast-${r.id}`}
                      restaurant={r}
                      onPress={() => router.push(`/(client)/restaurant/${r.slug}`)}
                    />
                  ))}
                </HorizontalRow>

                {promoRestaurants.length > 0 && (
                  <HorizontalRow
                    title="🎁 Offres près de chez vous"
                    subtitle="Promotions actives et menus avantageux"
                    count={promoRestaurants.length}
                  >
                    {promoRestaurants.slice(0, 8).map((r) => (
                      <RestaurantCardHorizontal
                        key={`promo-${r.id}`}
                        restaurant={r}
                        onPress={() => router.push(`/(client)/restaurant/${r.slug}`)}
                        promo
                      />
                    ))}
                  </HorizontalRow>
                )}

                <HorizontalRow
                  title="🌟 Mieux notés"
                  subtitle="Les meilleures adresses notées 4.8 et plus"
                  count={topRatedList.length}
                >
                  {topRatedList.slice(0, 8).map((r) => (
                    <RestaurantCardHorizontal
                      key={`top-${r.id}`}
                      restaurant={r}
                      onPress={() => router.push(`/(client)/restaurant/${r.slug}`)}
                    />
                  ))}
                </HorizontalRow>

                {burgerList.length > 0 && (
                  <HorizontalRow title="🍔 Burgers" subtitle="Smash burgers, double cheese et frites dorées" count={burgerList.length}>
                    {burgerList.map((r) => (
                      <RestaurantCardHorizontal key={`burger-${r.id}`} restaurant={r} onPress={() => router.push(`/(client)/restaurant/${r.slug}`)} />
                    ))}
                  </HorizontalRow>
                )}

                {pizzaList.length > 0 && (
                  <HorizontalRow title="🍕 Pizzas" subtitle="Pizzas napolitaines et recettes italiennes" count={pizzaList.length}>
                    {pizzaList.map((r) => (
                      <RestaurantCardHorizontal key={`pizza-${r.id}`} restaurant={r} onPress={() => router.push(`/(client)/restaurant/${r.slug}`)} />
                    ))}
                  </HorizontalRow>
                )}

                {asianList.length > 0 && (
                  <HorizontalRow title="🍣 Asian & Sushi" subtitle="Maki, nigiri, pad thaï et ramen chaud" count={asianList.length}>
                    {asianList.map((r) => (
                      <RestaurantCardHorizontal key={`asian-${r.id}`} restaurant={r} onPress={() => router.push(`/(client)/restaurant/${r.slug}`)} />
                    ))}
                  </HorizontalRow>
                )}

                {kebabList.length > 0 && (
                  <HorizontalRow title="🥙 Shawarma & Kebab" subtitle="Kebab grillé, shawarma libanais & sauces maison" count={kebabList.length}>
                    {kebabList.map((r) => (
                      <RestaurantCardHorizontal key={`kebab-${r.id}`} restaurant={r} onPress={() => router.push(`/(client)/restaurant/${r.slug}`)} />
                    ))}
                  </HorizontalRow>
                )}

                {tacosList.length > 0 && (
                  <HorizontalRow title="🌮 Tacos & Wraps" subtitle="French tacos généreux, gratinés au fromage" count={tacosList.length}>
                    {tacosList.map((r) => (
                      <RestaurantCardHorizontal key={`tacos-${r.id}`} restaurant={r} onPress={() => router.push(`/(client)/restaurant/${r.slug}`)} />
                    ))}
                  </HorizontalRow>
                )}

                {sandwichList.length > 0 && (
                  <HorizontalRow title="🥪 Sandwichs & Snacks" subtitle="Sandwichs chauds, paninis croustillants" count={sandwichList.length}>
                    {sandwichList.map((r) => (
                      <RestaurantCardHorizontal key={`snack-${r.id}`} restaurant={r} onPress={() => router.push(`/(client)/restaurant/${r.slug}`)} />
                    ))}
                  </HorizontalRow>
                )}

                {healthyList.length > 0 && (
                  <HorizontalRow title="🥗 Bowls & Salades Healthy" subtitle="Poke bowls frais, salades composées" count={healthyList.length}>
                    {healthyList.map((r) => (
                      <RestaurantCardHorizontal key={`healthy-${r.id}`} restaurant={r} onPress={() => router.push(`/(client)/restaurant/${r.slug}`)} />
                    ))}
                  </HorizontalRow>
                )}
              </>
            )}

            {/* ═══ SECTION HEADER ═══ */}
            {!isDefault && (
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {search.trim()
                      ? `Résultats pour « ${search} »`
                      : serviceTab !== 'all'
                        ? MAIN_SERVICE_TABS.find((s) => s.id === serviceTab)?.label
                        : cuisineFilter !== 'all'
                          ? `Restos ${CUISINE_CATEGORIES.find((c) => c.id === cuisineFilter)?.label}`
                          : 'Tous les Partenaires'}
                  </Text>
                  <Text style={styles.sectionCount}>{displayList.length} établissement{displayList.length !== 1 ? 's' : ''} disponible{displayList.length !== 1 ? 's' : ''}</Text>
                </View>
                {(cuisineFilter !== 'all' || serviceTab !== 'all' || search.trim()) && (
                  <Pressable onPress={() => { setCuisineFilter('all'); setSearch(''); setServiceTab('all'); }} style={styles.sectionClearBtn}>
                    <Text style={styles.sectionClearText}>Tout voir ✕</Text>
                  </Pressable>
                )}
              </View>
            )}

            {loading && (
              <View style={styles.row}>
                {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </View>
            )}
          </>
        }
        renderItem={({ item: r }: { item: any }) => (
          <RestaurantCard
            restaurant={r}
            onPress={() => router.push(`/(client)/restaurant/${r.slug}`)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              catalogEmpty={catalog.length === 0}
              filter={search || cuisineFilter || serviceTab}
              onShowAll={() => { setCuisineFilter('all'); setSearch(''); setServiceTab('all'); }}
            />
          ) : null
        }
      />
    </View>
  );
}

function SmartReorderBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <View style={styles.reorderWrap}>
      <LinearGradient colors={['#020617', '#0f172a', '#020617']} style={styles.reorderBg} />
      <View style={styles.reorderOrb} />
      <View style={styles.reorderContent}>
        <View style={styles.reorderLeft}>
          <View style={styles.reorderIcon}>
            <Text style={styles.reorderIconText}>⚡</Text>
          </View>
          <View style={styles.reorderTextWrap}>
            <Text style={styles.reorderLabel}>VOTRE DERNIÈRE COMMANDE</Text>
            <Text style={styles.reorderTitle}>
              Recommander chez <Text style={styles.reorderHighlight}>Snack Roma</Text> ?
            </Text>
            <Text style={styles.reorderItems} numberOfLines={1}>Tacos x2, Frites x1</Text>
          </View>
        </View>
        <View style={styles.reorderActions}>
          <Pressable style={styles.reorderBtn}>
            <Text style={styles.reorderBtnText}>⚡ Recommander</Text>
          </Pressable>
          <Pressable style={styles.reorderBtnOutline}>
            <Text style={styles.reorderBtnOutlineText}>🍽️ Nouvelle commande</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={() => setVisible(false)} style={styles.reorderClose}>
        <Text style={styles.reorderCloseText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { paddingHorizontal: 12, paddingTop: 0 },
  row: { gap: 10, justifyContent: 'space-between', paddingHorizontal: 4 },

  /* ═══ HERO ═══ */
  heroWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  heroOrb1: {
    position: 'absolute',
    top: '-20%',
    right: '-20%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(249,115,22,0.06)',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: '-20%',
    left: '-10%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(236,72,153,0.05)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  locationPin: { fontSize: 12, marginRight: 4 },
  locationText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  openBadgeText: { fontSize: 11, fontWeight: '800', color: '#047857' },
  greetingWrap: { marginBottom: 12 },
  greetingText: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  greetingName: { color: brand[500] },
  greetingWave: { fontSize: 20 },
  subtitleText: { fontSize: 12, fontWeight: '600', color: ink[400], marginTop: 2 },

  /* ═══ SEARCH ═══ */
  searchWrap: { position: 'relative', borderRadius: 16 },
  searchWrapFocused: { borderRadius: 16 },
  searchGlow: { borderRadius: 16 },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInnerFocused: { borderColor: brand[500], backgroundColor: '#ffffff' },
  searchIcon: { fontSize: 16, marginRight: 8, color: ink[400] },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  searchClearBtn: { padding: 4 },
  searchClearText: { fontSize: 14, color: ink[400], fontWeight: '800' },

  /* ═══ SERVICE TABS ═══ */
  serviceTabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  serviceTabsScroll: { gap: 16 },
  serviceTabBtn: { paddingVertical: 10, position: 'relative' },
  serviceTabLabel: { fontSize: 13, fontWeight: '700', color: ink[500] },
  serviceTabLabelActive: { color: brand[600], fontWeight: '900' },
  serviceTabIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
    borderRadius: 2, backgroundColor: brand[500],
  },

  /* ═══ SUB CATEGORIES ═══ */
  subCatSection: { paddingHorizontal: 16, marginBottom: 14 },
  subCatScroll: { gap: 10 },
  subCatBtn: { alignItems: 'center', width: 72 },
  subCatImageWrap: {
    width: 60, height: 60, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 4,
  },
  subCatImage: { width: '100%', height: '100%' },
  subCatLabel: { fontSize: 10, fontWeight: '800', color: '#0f172a', textAlign: 'center' },

  /* ═══ PROMO BANNERS ═══ */
  promoScroll: { paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  promoCard: {
    width: 220, height: 80, borderRadius: 18, padding: 14,
    justifyContent: 'center',
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  promoTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  promoSubtitle: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  /* ═══ CUISINE CATEGORIES ═══ */
  cuisineSection: { paddingHorizontal: 16, marginBottom: 16 },
  cuisineScroll: { gap: 12 },
  cuisineBtn: { alignItems: 'center', width: 64 },
  cuisineImageWrap: {
    width: 58, height: 58, borderRadius: 20, overflow: 'hidden',
    borderWidth: 2.5, borderColor: '#e2e8f0', position: 'relative', marginBottom: 6,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  cuisineImageWrapActive: { borderColor: brand[500], borderWidth: 3 },
  cuisineImage: { width: '100%', height: '100%' },
  cuisineOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.1)' },
  cuisineLabel: { fontSize: 11, fontWeight: '800', color: ink[700], textAlign: 'center' },
  cuisineLabelActive: { color: brand[600], fontWeight: '900' },

  /* ═══ FEATURED SPOTLIGHT ═══ */
  featuredWrap: { paddingHorizontal: 16, marginBottom: 16 },
  featuredCard: {
    height: 190, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end',
    shadowColor: brand[500], shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 22, elevation: 12,
  },
  featuredImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  featuredGlowMesh: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(249,115,22,0.08)',
  },
  featuredBody: { padding: 16 },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: brand[500],
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  featuredBadgeText: { fontSize: 10, fontWeight: '900', color: '#ffffff', letterSpacing: 0.8 },
  featuredTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5, marginBottom: 2 },
  featuredTags: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const },
  featuredTag: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  featuredTagText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  featuredTagGreen: {
    backgroundColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  featuredTagGreenText: { fontSize: 11, fontWeight: '800', color: '#a7f3d0' },
  featuredTagDark: {
    backgroundColor: 'rgba(15,23,42,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  featuredTagDarkText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },

  /* ═══ SECTION HEADER ═══ */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, marginBottom: 10, marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.4 },
  sectionCount: { fontSize: 12, fontWeight: '700', color: brand[500], marginTop: 2 },
  sectionClearBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    backgroundColor: ink[100], flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  sectionClearText: { fontSize: 11, fontWeight: '800', color: '#0f172a' },

  /* ═══ HORIZONTAL ROW ═══ */
  hRow: { marginBottom: 20, paddingHorizontal: 16 },
  hRowHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 12,
  },
  hRowTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  hRowSubtitle: { fontSize: 11, fontWeight: '600', color: ink[400], marginTop: 1 },
  hRowSeeAll: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  hRowSeeAllText: { fontSize: 11, fontWeight: '800', color: brand[600] },
  hRowSeeAllArrow: { fontSize: 12, color: brand[600], fontWeight: '800' },
  hRowScroll: { gap: 10, paddingRight: 16 },

  /* ═══ RESTAURANT CARD (Grid) ═══ */
  card: {
    width: CARD_WIDTH, marginBottom: 14, borderRadius: 22,
    backgroundColor: '#ffffff', overflow: 'hidden',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardPromo: { borderWidth: 1.5, borderColor: brand[400] },
  cardImageWrap: { height: 125, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 },
  cardClosed: {
    ...StyleSheet.absoluteFill, backgroundColor: 'rgba(2,6,23,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardClosedText: { fontSize: 12, fontWeight: '900', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  cardCuisineBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(15,23,42,0.75)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  cardCuisineText: { fontSize: 10, fontWeight: '800', color: '#ffffff' },
  ratingBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 3, gap: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  ratingStar: { fontSize: 11, color: '#f59e0b' },
  ratingText: { fontSize: 10, fontWeight: '900', color: '#0f172a' },
  promoBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: brand[500], borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  promoText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
  cardBody: { padding: 12 },
  cardName: { fontSize: 15, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  cardDist: { fontSize: 11, color: ink[500], fontWeight: '700' },
  cardDot: { fontSize: 11, color: ink[300] },
  cardOpen: { fontSize: 11, fontWeight: '800' },
  openText: { color: '#10b981' },
  closedText: { color: ink[400] },
  cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardFeeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardFeeOld: { fontSize: 10, color: ink[400], textDecorationLine: 'line-through' },
  cardFeeFree: { fontSize: 11, color: '#059669', fontWeight: '800' },
  cardTime: { fontSize: 10, color: ink[400], fontWeight: '700' },

  /* ═══ HORIZONTAL CARD ═══ */
  hCard: { width: HORIZONTAL_CARD_W, marginRight: 0 },
  hCardInner: {
    borderRadius: 18, overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  hCardImageWrap: { height: 130, position: 'relative', backgroundColor: '#f1f5f9' },
  hCardImage: { width: '100%', height: '100%' },
  hCardImageClosed: { opacity: 0.5 },
  hCardTimeBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: '#ffffff', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  hCardTimeText: { fontSize: 10, fontWeight: '900', color: '#0f172a' },
  hCardClosedOverlay: {
    ...StyleSheet.absoluteFill, backgroundColor: 'rgba(2,6,23,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  hCardClosedText: {
    fontSize: 11, fontWeight: '900', color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, overflow: 'hidden',
  },
  hCardBody: { padding: 10 },
  hCardName: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  hCardRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  hCardRatingStar: { fontSize: 11, color: '#0d9488', fontWeight: '900' },
  hCardRatingNum: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  hCardDot: { fontSize: 10, color: ink[300] },
  hCardDist: { fontSize: 10, color: ink[500] },
  hCardFast: { fontSize: 10, color: '#0d9488', fontWeight: '700' },
  hCardFeeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  hCardFee: { fontSize: 10, color: '#d97706', fontWeight: '700' },
  hCardFeeOld: { fontSize: 10, color: '#e11d48', textDecorationLine: 'line-through', fontWeight: '600' },
  hCardFeeFree: { fontSize: 10, color: '#059669', fontWeight: '800' },
  hCardTagRow: { flexDirection: 'row', gap: 4 },
  hCardSponsor: {
    fontSize: 9, fontWeight: '800', color: ink[500],
    backgroundColor: ink[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },

  /* ═══ SMART REORDER BANNER ═══ */
  reorderWrap: {
    marginHorizontal: 16, marginBottom: 4, marginTop: 4,
    borderRadius: 18, overflow: 'hidden', position: 'relative',
  },
  reorderBg: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  reorderOrb: {
    position: 'absolute', right: -40, bottom: -40, width: 120,
    height: 120, borderRadius: 60, backgroundColor: 'rgba(249,115,22,0.12)',
  },
  reorderContent: { padding: 14, flexDirection: 'column', gap: 10 },
  reorderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reorderIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: brand[500], alignItems: 'center', justifyContent: 'center',
  },
  reorderIconText: { fontSize: 18 },
  reorderTextWrap: { flex: 1 },
  reorderLabel: { fontSize: 9, fontWeight: '900', color: '#fdba74', letterSpacing: 1, marginBottom: 2 },
  reorderTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  reorderHighlight: { color: '#fcd34d', fontWeight: '900' },
  reorderItems: { fontSize: 10, color: ink[400], marginTop: 1 },
  reorderActions: { flexDirection: 'row', gap: 8 },
  reorderBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: brand[500], alignItems: 'center', justifyContent: 'center',
  },
  reorderBtnText: { fontSize: 11, fontWeight: '900', color: '#ffffff' },
  reorderBtnOutline: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  reorderBtnOutlineText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  reorderClose: {
    position: 'absolute', top: 8, right: 8, width: 22, height: 22,
    borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  reorderCloseText: { fontSize: 10, color: '#ffffff', fontWeight: '800' },

  /* ═══ SKELETONS ═══ */
  skelCard: {
    width: CARD_WIDTH, borderRadius: 22, overflow: 'hidden',
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  skelImage: { height: 125, backgroundColor: ink[100] },
  skelBody: { padding: 12 },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: ink[200] },
  skelHCard: {
    width: HORIZONTAL_CARD_W, borderRadius: 18, overflow: 'hidden',
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  skelHImage: { height: 130, backgroundColor: ink[100] },
  skelHBody: { padding: 10 },

  /* ═══ EMPTY STATE ═══ */
  empty: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  emptyDesc: { fontSize: 13, fontWeight: '600', color: ink[500], textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14,
    backgroundColor: '#0f172a',
  },
  emptyBtnText: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
});
