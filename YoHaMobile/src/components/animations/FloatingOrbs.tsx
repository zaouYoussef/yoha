import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function FloatingOrbs() {
  const floatY1 = useSharedValue(0);
  const floatY2 = useSharedValue(0);

  useEffect(() => {
    floatY1.value = withRepeat(
      withTiming(-20, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    floatY2.value = withRepeat(
      withTiming(25, { duration: 5500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [floatY1, floatY2]);

  const orbStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY1.value }],
  }));

  const orbStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY2.value }],
  }));

  return (
    <View style={{ ...StyleSheet.absoluteFill }} pointerEvents="none">

      <Animated.View style={[styles.orb, styles.orbRight, orbStyle1]} />
      <Animated.View style={[styles.orb, styles.orbLeft, orbStyle2]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.35,
  },
  orbRight: {
    top: 30,
    right: 20,
    width: 90,
    height: 90,
    backgroundColor: '#f97316',
  },
  orbLeft: {
    bottom: 40,
    left: 15,
    width: 110,
    height: 110,
    backgroundColor: '#ec4899',
  },
});
