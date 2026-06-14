import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FOOD_ITEMS = ['🍕', '🍔', '🌮', '🍩', '🥑', '🍟', '🥤', '🍣', '🥗'];

function Particle({ index, triggerTime }: { index: number; triggerTime: number }) {
  const progress = useSharedValue(0);
  const startX = SCREEN_WIDTH / 2;
  const startY = SCREEN_HEIGHT * 0.45; // Start in the middle-upper part of the screen
  const targetX = startX + (Math.random() - 0.5) * SCREEN_WIDTH * 0.95;
  const targetY = SCREEN_HEIGHT + 100;
  const peakY = startY - 100 - Math.random() * 120; // Rise up first
  const emoji = FOOD_ITEMS[index % FOOD_ITEMS.length];
  const rotation = (Math.random() - 0.5) * 600;
  const scale = 0.85 + Math.random() * 0.5;

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      index * 20,
      withTiming(1, { duration: 1100, easing: Easing.bezier(0.1, 0.8, 0.3, 1) })
    );
  }, [triggerTime, index, progress]);

  const animStyle = useAnimatedStyle(() => {
    // parabolic arc interpolation
    const currentX = startX + (targetX - startX) * progress.value;
    let currentY;
    if (progress.value < 0.25) {
      // rise phase
      const subProgress = progress.value / 0.25;
      currentY = startY + (peakY - startY) * subProgress;
    } else {
      // fall phase
      const subProgress = (progress.value - 0.25) / 0.75;
      currentY = peakY + (targetY - peakY) * (subProgress * subProgress);
    }

    return {
      opacity: progress.value < 0.85 ? 1 : 1 - (progress.value - 0.85) / 0.15,
      transform: [
        { translateX: currentX },
        { translateY: currentY },
        { rotate: `${progress.value * rotation}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.Text style={[styles.particle, animStyle]}>
      {emoji}
    </Animated.Text>
  );
}

export function FoodExplosion({ triggerTime }: { triggerTime: number }) {
  if (triggerTime === 0) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 14 }).map((_, i) => (
        <Particle key={`${triggerTime}-${i}`} index={i} triggerTime={triggerTime} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    fontSize: 32,
    left: 0,
    top: 0,
    marginLeft: -16,
    marginTop: -16,
    zIndex: 9999,
  },
});
