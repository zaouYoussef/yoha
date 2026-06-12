import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { CUISINES } from '../../data/cuisines';
import { hapticSelection } from '../../lib/haptics';
import { brand, gradients, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Chip({
  emoji,
  label,
  active,
  onPress,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (active) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.94); }}
        onPressOut={() => { scale.value = withSpring(1.05); }}
        style={anim}
      >
        <LinearGradient colors={[...gradients.cta]} style={styles.chipActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.labelActive}>{label}</Text>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[anim, styles.chip]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

export function CuisineFilterRow({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CUISINES.map((c) => {
        const isActive = active === c.id || (active === '' && c.id === 'all');
        return (
          <Chip
            key={c.id}
            emoji={c.emoji}
            label={c.label}
            active={isActive}
            onPress={() => {
              hapticSelection();
              onSelect(c.id === 'all' ? '' : c.id);
            }}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
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
  emoji: { fontSize: 15 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: ink[700] },
  labelActive: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
});
