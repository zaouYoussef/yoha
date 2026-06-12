import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { CATEGORIES_BANNERS } from '../../data/cuisines';
import { hapticSelection } from '../../lib/haptics';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryBannerScroll({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.title}>Catégories</Text>
        {active !== 'all' && active !== '' ? (
          <Pressable onPress={() => onSelect('all')}>
            <Text style={styles.seeAll}>Tout voir</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CATEGORIES_BANNERS.map((c) => (
          <BannerCard
            key={c.id}
            emoji={c.emoji}
            label={c.label}
            colors={c.colors}
            active={active === c.id}
            onPress={() => {
              hapticSelection();
              onSelect(active === c.id ? 'all' : c.id);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function BannerCard({
  emoji,
  label,
  colors,
  active,
  onPress,
}: {
  emoji: string;
  label: string;
  colors: [string, string];
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 14 }); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[anim, styles.bannerWrap, active && styles.bannerActive]}
    >
      <LinearGradient colors={colors} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.bannerEmoji}>{emoji}</Text>
        <Text style={styles.bannerLabel}>{label}</Text>
        {active ? <View style={styles.activeDot} /> : null}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 20, color: ink[900] },
  seeAll: { fontFamily: fonts.bold, fontSize: 14, color: brand[600] },
  row: { gap: 12, paddingBottom: 8 },
  bannerWrap: { borderRadius: radius.xl, ...shadows.soft },
  bannerActive: { borderWidth: 2.5, borderColor: '#fff', ...shadows.glow },
  banner: {
    width: 128,
    height: 132,
    borderRadius: radius.xl + 2,
    padding: 16,
    justifyContent: 'flex-end',
  },
  bannerEmoji: { fontSize: 36, position: 'absolute', top: 16, left: 16 },
  bannerLabel: { fontFamily: fonts.extrabold, fontSize: 16, color: '#fff', letterSpacing: -0.3 },
  activeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
