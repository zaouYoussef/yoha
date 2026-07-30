import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const PARTICLE_COUNT = 8;

function SingleParticle({ index }: { index: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.2);

  const left = `${(index * 12.5) + 5}%`;
  const size = 4 + (index % 3) * 2;

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-80, {
        duration: 3000 + (index % 4) * 800,
        easing: Easing.out(Easing.quad),
      }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [index, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: left as any, width: size, height: size, borderRadius: size / 2 },
        animStyle,
      ]}
    />
  );
}

export function ParticleField() {
  return (
    <View style={{ ...StyleSheet.absoluteFill }} pointerEvents="none">

      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <SingleParticle key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: '#f97316',
  },
});
