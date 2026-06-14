import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuItem } from '../lib/api';
import { formatMad } from '../lib/constants';
import { hapticLight, hapticSuccess } from '../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

const INGREDIENT_EMOJIS: Record<string, string> = {
  mozzarella: '🧀', fromage: '🧀', cheese: '🧀', cheddar: '🧀', parmesan: '🧀',
  tomate: '🍅', tomato: '🍅', sauce: '🥫',
  viande: '🥩', beef: '🥩', boeuf: '🥩', steak: '🥩', pepperoni: '🍕',
  poulet: '🍗', chicken: '🍗', nugget: '🍗',
  oignon: '🧅', onion: '🧅', ail: '🧄', garlic: '🧄',
  olive: '🫒', olives: '🫒',
  champignon: '🍄', champignons: '🍄', mushroom: '🍄', mushrooms: '🍄',
  ananas: '🍍', pineapple: '🍍',
  poivron: '🫑', pepper: '🫑', peppers: '🫑', piment: '🌶️', chili: '🌶️',
  frite: '🍟', frites: '🍟', potato: '🥔', pommes: '🥔',
  oeuf: '🍳', egg: '🍳', eggs: '🍳',
  salade: '🥬', salad: '🥬', lettuce: '🥬', avocat: '🥑', avocado: '🥑',
  saumon: '🐟', salmon: '🐟', thon: '🐟', tuna: '🐟', crevette: '🍤', shrimp: '🍤', sushi: '🍣',
  riz: '🍚', rice: '🍚', nouilles: '🍜', noodles: '🍜',
  chocolat: '🍫', chocolate: '🍫', caramel: '🍯', honey: '🍯',
  fraise: '🍓', strawberry: '🍓', banane: '🍌', banana: '🍌', pomme: '🍎', apple: '🍎',
  citron: '🍋', lemon: '🍋', orange: '🍊',
  menthe: '🌱', mint: '🌱', basilic: '🌿', basil: '🌿', persil: '🌿',
  lait: '🥛', milk: '🥛', creme: '🥛', cream: '🥛',
  pain: '🍞', bread: '🍞', bun: '🍞', tortilla: '🫓', wrap: '🫓', pita: '🫓',
};

function getIngredientEmoji(name: string): string {
  const clean = name.toLowerCase().trim();
  for (const [key, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
    if (clean.includes(key)) return emoji;
  }
  return '✨';
}

export function MenuItemSheet({
  item,
  visible,
  onClose,
  onAdd,
  orderingDisabled = false,
}: {
  item: MenuItem | null;
  visible: boolean;
  onClose: () => void;
  onAdd: (qty: number) => void;
  orderingDisabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [qty, setQty] = React.useState(1);
  const translateY = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      setQty(1);
      translateY.value = withSpring(0, { damping: 24, stiffness: 240 });
    } else {
      translateY.value = 600;
    }
  }, [visible, translateY]);

  const sheetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const parsedIngredients = React.useMemo(() => {
    if (!item?.ingredients) return [];
    return item.ingredients
      .split(/[,;•\n]+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }, [item?.ingredients]);

  if (!item) return null;

  const unavailable = item.isAvailable === false || orderingDisabled;
  const total = Number(item.price) * qty;

  const handleAdd = () => {
    if (unavailable) return;
    hapticSuccess();
    onAdd(qty);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }, sheetAnim]}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.heroOuter}>
            <LinearGradient
              colors={['rgba(249,115,22,0.22)', 'rgba(236,72,153,0.12)', 'transparent']}
              style={styles.ambientGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={[styles.heroWrap, shadows.glowOrange]}>
              {item.img ? (
                <Image source={{ uri: item.img }} style={styles.hero} contentFit="cover" />
              ) : (
                <LinearGradient colors={[brand[100], brand[50]]} style={[styles.hero, styles.heroPh]}>
                  <Text style={{ fontSize: 56 }}>🍽️</Text>
                </LinearGradient>
              )}
              <LinearGradient colors={['transparent', 'rgba(15,23,42,0.6)']} style={styles.heroGrad} />
            </View>
          </View>

          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMad(Number(item.price))}</Text>
            {unavailable ? (
              <View style={styles.offBadge}>
                <Text style={styles.offText}>Indisponible</Text>
              </View>
            ) : (
              <View style={styles.availBadge}>
                <Text style={styles.availText}>✓ En stock</Text>
              </View>
            )}
          </View>

          {item.desc ? <Text style={styles.desc}>{item.desc}</Text> : null}

          {/* Section Réassurance & Garantie */}
          <LinearGradient
            colors={['rgba(251,146,60,0.08)', 'rgba(236,72,153,0.06)']}
            style={[styles.guaranteeBox, shadows.soft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.guaranteeHeader}>
              <Text style={{ fontSize: 18 }}>🛡️</Text>
              <Text style={styles.guaranteeTitle}>Garantie YoHa Chaud & Croustillant</Text>
            </View>
            <Text style={styles.guaranteeSub}>
              Préparé à la commande par le chef et livré dans un sac isotherme scellé. Si votre repas n'est pas chaud, nous vous le remplaçons gratuitement !
            </Text>
            <View style={styles.badgesRow}>
              <View style={styles.badgeItem}>
                <Text style={styles.badgeEmoji}>🔥</Text>
                <Text style={styles.badgeLabel}>Fumant</Text>
              </View>
              <View style={styles.badgeItem}>
                <Text style={styles.badgeEmoji}>🥩</Text>
                <Text style={styles.badgeLabel}>Frais & Local</Text>
              </View>
              <View style={styles.badgeItem}>
                <Text style={styles.badgeEmoji}>👨‍🍳</Text>
                <Text style={styles.badgeLabel}>Fait minute</Text>
              </View>
            </View>
          </LinearGradient>

          {parsedIngredients.length > 0 ? (
            <View style={styles.ingredientsBox}>
              <Text style={styles.ingredientsTitle}>Ingrédients & Préparation</Text>
              <View style={styles.ingredientsGrid}>
                {parsedIngredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingredientChip}>
                    <Text style={styles.ingredientEmoji}>{getIngredientEmoji(ing)}</Text>
                    <Text style={styles.ingredientText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.qtyRow}>
            <Pressable
              onPress={() => { hapticLight(); setQty((q) => Math.max(1, q - 1)); }}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyVal}>{qty}</Text>
            <Pressable
              onPress={() => { hapticLight(); setQty((q) => Math.min(50, q + 1)); }}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
          <Pressable onPress={handleAdd} style={{ flex: 1 }} disabled={unavailable}>
            <LinearGradient
              colors={unavailable ? [ink[300], ink[400]] : [...gradients.cta]}
              style={[styles.addBtn, unavailable && { opacity: 0.7 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.addText}>
                {unavailable
                  ? orderingDisabled && item.isAvailable !== false
                    ? 'Restaurant fermé'
                    : 'Non disponible'
                  : `Ajouter · ${formatMad(total)}`}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(2,6,23,0.65)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '92%',
    backgroundColor: '#fffcf9',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...shadows.float,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: ink[200],
    marginBottom: 16,
  },
  heroOuter: {
    position: 'relative',
    marginBottom: 18,
  },
  ambientGlow: {
    position: 'absolute',
    top: -16,
    left: -16,
    right: -16,
    bottom: -8,
    borderRadius: radius.xl + 20,
    opacity: 0.8,
  },
  heroWrap: { borderRadius: radius.xl + 4, overflow: 'hidden' },
  hero: { width: '100%', height: 220 },
  heroPh: { alignItems: 'center', justifyContent: 'center' },
  heroGrad: { ...StyleSheet.absoluteFill },
  name: { fontFamily: fonts.display, fontSize: 26, color: ink[900], letterSpacing: -0.6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  price: { fontFamily: fonts.extrabold, fontSize: 22, color: brand[600] },
  availBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  availText: { fontFamily: fonts.bold, fontSize: 11, color: '#059669' },
  offBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: ink[100],
  },
  offText: { fontFamily: fonts.bold, fontSize: 11, color: ink[500] },
  desc: { marginTop: 14, fontFamily: fonts.medium, fontSize: 15, color: ink[600], lineHeight: 22 },
  guaranteeBox: {
    marginTop: 18,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.25)',
  },
  guaranteeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  guaranteeTitle: { fontFamily: fonts.bold, fontSize: 14, color: brand[800] },
  guaranteeSub: { fontFamily: fonts.medium, fontSize: 12, color: ink[600], lineHeight: 18 },
  badgesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: ink[200],
  },
  badgeEmoji: { fontSize: 13 },
  badgeLabel: { fontFamily: fonts.bold, fontSize: 11, color: ink[700] },
  ingredientsBox: {
    marginTop: 18,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: ink[200],
  },
  ingredientsTitle: { fontFamily: fonts.bold, fontSize: 13, color: ink[700], marginBottom: 8 },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: ink[200],
    gap: 6,
    shadowColor: ink[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  ingredientEmoji: {
    fontSize: 14,
  },
  ingredientText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: ink[700],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: ink[100],
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 22, fontFamily: fonts.bold, color: ink[700] },
  qtyVal: { fontFamily: fonts.extrabold, fontSize: 18, color: ink[900], minWidth: 28, textAlign: 'center' },
  addBtn: { paddingVertical: 17, borderRadius: radius.xl, alignItems: 'center', ...shadows.glowOrange },
  addText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 16 },
});
