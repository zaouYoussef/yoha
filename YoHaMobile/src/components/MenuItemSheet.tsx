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
  const translateY = useSharedValue(500);

  useEffect(() => {
    if (visible) {
      setQty(1);
      translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
    } else {
      translateY.value = 500;
    }
  }, [visible, translateY]);

  const sheetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
          <View style={styles.heroWrap}>
            {item.img ? (
              <Image source={{ uri: item.img }} style={styles.hero} contentFit="cover" />
            ) : (
              <LinearGradient colors={[brand[100], brand[50]]} style={[styles.hero, styles.heroPh]}>
                <Text style={{ fontSize: 56 }}>🍽️</Text>
              </LinearGradient>
            )}
            <LinearGradient colors={['transparent', 'rgba(15,23,42,0.5)']} style={styles.heroGrad} />
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
                <Text style={styles.availText}>✓ Dispo</Text>
              </View>
            )}
          </View>

          {item.desc ? <Text style={styles.desc}>{item.desc}</Text> : null}

          {item.ingredients ? (
            <View style={styles.ingredientsBox}>
              <Text style={styles.ingredientsTitle}>Ingrédients</Text>
              <Text style={styles.ingredients}>{item.ingredients}</Text>
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
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(2,6,23,0.62)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
  heroWrap: { borderRadius: radius.xl + 4, overflow: 'hidden', marginBottom: 18 },
  hero: { width: '100%', height: 220 },
  heroPh: { alignItems: 'center', justifyContent: 'center' },
  heroGrad: { ...StyleSheet.absoluteFill },
  name: { fontFamily: fonts.display, fontSize: 28, color: ink[900], letterSpacing: -0.8 },
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
  ingredientsBox: {
    marginTop: 18,
    padding: 16,
    backgroundColor: ink[50],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: ink[100],
  },
  ingredientsTitle: { fontFamily: fonts.bold, fontSize: 13, color: ink[700], marginBottom: 6 },
  ingredients: { fontFamily: fonts.medium, fontSize: 14, color: ink[500], lineHeight: 21 },
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
