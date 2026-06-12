import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { MenuCategory } from '../../lib/api';
import { hapticSelection } from '../../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  categories: MenuCategory[];
  activeId: string;
  onSelect: (id: string) => void;
  scrollY: SharedValue<number>;
  topInset: number;
  inline?: boolean;
  onBack?: () => void;
};

function CategoryChips({
  categories,
  activeId,
  onSelect,
}: {
  categories: MenuCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((cat) => {
        const active = activeId === cat.id;
        if (active) {
          return (
            <Pressable key={cat.id} onPress={() => { hapticSelection(); onSelect(cat.id); }}>
              <LinearGradient colors={[...gradients.cta]} style={styles.chipActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.chipTextActive}>{cat.name}</Text>
                <Text style={styles.count}>{cat.items?.length ?? 0}</Text>
              </LinearGradient>
            </Pressable>
          );
        }
        return (
          <Pressable key={cat.id} onPress={() => { hapticSelection(); onSelect(cat.id); }} style={styles.chip}>
            <Text style={styles.chipText}>{cat.name}</Text>
            <Text style={styles.countMuted}>{cat.items?.length ?? 0}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function StickyMenuCategories({
  categories,
  activeId,
  onSelect,
  scrollY,
  topInset,
  inline = false,
  onBack,
}: Props) {
  if (categories.length <= 1) return null;

  const stickyAnim = useAnimatedStyle(() => ({
    opacity: inline ? 1 : interpolate(scrollY.value, [220, 280], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: inline ? 0 : interpolate(scrollY.value, [0, 280], [-100, 0], Extrapolation.CLAMP) },
    ],
  }));

  if (inline) {
    return (
      <View style={styles.inlineWrap}>
        <CategoryChips categories={categories} activeId={activeId} onSelect={onSelect} />
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.stickyWrap, { paddingTop: topInset + 8 }, stickyAnim]}
      pointerEvents="box-none"
    >
      <View style={[styles.stickyInner, shadows.soft]}>
        <View style={styles.stickyRow}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <CategoryChips categories={categories} activeId={activeId} onSelect={onSelect} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stickyWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  stickyInner: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: ink[100],
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stickyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: ink[50],
    borderWidth: 1,
    borderColor: ink[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  backText: { fontSize: 20, fontFamily: fonts.bold, color: ink[800] },
  inlineWrap: { marginBottom: 20 },
  row: { gap: 8, paddingHorizontal: 4, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.full,
    backgroundColor: ink[50],
    borderWidth: 1,
    borderColor: ink[200],
  },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.full,
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: ink[700] },
  chipTextActive: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  count: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countMuted: { fontFamily: fonts.bold, fontSize: 10, color: ink[400] },
});
