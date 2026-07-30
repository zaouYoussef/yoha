import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export function AuroraHero() {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    scale1.value = withRepeat(
      withTiming(1.35, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    scale2.value = withRepeat(
      withTiming(1.4, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    translateX.value = withRepeat(
      withTiming(30, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [scale1, scale2, translateX]);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }, { translateX: translateX.value }],
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }, { translateX: -translateX.value }],
  }));

  return (
    <View style={{ ...StyleSheet.absoluteFill }} pointerEvents="none">

      <Animated.View style={[styles.orb1, style1]}>
        <LinearGradient
          colors={['rgba(249, 115, 22, 0.28)', 'rgba(236, 72, 153, 0.18)', 'transparent']}
          style={styles.gradient}
        />
      </Animated.View>

      <Animated.View style={[styles.orb2, style2]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.25)', 'rgba(249, 115, 22, 0.15)', 'transparent']}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  orb1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
  },
  orb2: {
    position: 'absolute',
    top: 40,
    left: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
