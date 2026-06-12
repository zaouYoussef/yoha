import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function AddBurst({ trigger }: { trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const y = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = 0;
    opacity.value = 1;
    y.value = 0;
    scale.value = withSequence(withSpring(1.2, { damping: 8 }), withTiming(0.8, { duration: 200 }));
    y.value = withTiming(-36, { duration: 600 });
    opacity.value = withTiming(0, { duration: 600 });
  }, [trigger, opacity, scale, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: y.value }],
  }));

  if (trigger === 0) return null;

  return (
    <Animated.View style={[styles.burst, style]} pointerEvents="none">
      <Text style={styles.text}>+1 ✨</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  burst: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    backgroundColor: 'rgba(249,115,22,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
