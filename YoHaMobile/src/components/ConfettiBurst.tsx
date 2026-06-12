import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#22c55e', '#0ea5e9', '#eab308'];
const COUNT = 18;

function Particle({ index, active }: { index: number; active: boolean }) {
  const progress = useSharedValue(0);
  const angle = (index / COUNT) * Math.PI * 2;
  const dist = 60 + (index % 5) * 18;
  const color = COLORS[index % COLORS.length];

  useEffect(() => {
    if (active) {
      progress.value = 0;
      progress.value = withDelay(
        index * 30,
        withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [active, index, progress]);

  const anim = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * dist * progress.value },
      { translateY: Math.sin(angle) * dist * progress.value - 20 * progress.value },
      { rotate: `${progress.value * 360}deg` },
      { scale: 1 - progress.value * 0.5 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color, left: '50%', top: '50%' },
        anim,
      ]}
    />
  );
}

export function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      {Array.from({ length: COUNT }).map((_, i) => (
        <Particle key={i} index={i} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 80, height: 120, zIndex: 10 },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    marginLeft: -4,
    marginTop: -4,
  },
});
