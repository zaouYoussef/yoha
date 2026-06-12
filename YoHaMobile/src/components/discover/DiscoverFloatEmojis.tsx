import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const EMOJIS = [
  { emoji: '🍕', top: '14%', right: '8%', delay: 0 },
  { emoji: '🌮', top: '48%', left: '6%', delay: 300 },
  { emoji: '🍣', top: '72%', right: '12%', delay: 600 },
];

function Float({ emoji, top, left, right, delay }: (typeof EMOJIS)[0]) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2400 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(10, { duration: 2400 + delay, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [delay, y]);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  const pos = {
    top: top as `${number}%`,
    ...(left ? { left: left as `${number}%` } : {}),
    ...(right ? { right: right as `${number}%` } : {}),
  };

  return (
    <Animated.Text style={[styles.emoji, anim, pos]}>
      {emoji}
    </Animated.Text>
  );
}

export function DiscoverFloatEmojis() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {EMOJIS.map((e) => (
        <Float key={e.emoji} {...e} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { position: 'absolute', fontSize: 26, opacity: 0.28 },
});
