import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const EMOJIS = [
  { emoji: '🍕', top: '10%', right: '6%', scale: 1.1, rotation: '15deg', delay: 0 },
  { emoji: '🍔', top: '32%', left: '4%', scale: 0.9, rotation: '-18deg', delay: 300 },
  { emoji: '🌮', top: '55%', right: '8%', scale: 1.0, rotation: '12deg', delay: 600 },
  { emoji: '🥗', top: '75%', left: '5%', scale: 0.85, rotation: '-25deg', delay: 900 },
];

function Float({ emoji, top, left, right, scale, rotation, delay }: (typeof EMOJIS)[0]) {
  const y = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2500 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(12, { duration: 2500 + delay, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    rot.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3200 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 3200 + delay, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [delay, y, rot]);

  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { rotate: `${rot.value}deg` },
      { scale },
    ],
  }));

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
      {EMOJIS.map((e, i) => (
        <Float key={i} {...e} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { position: 'absolute', fontSize: 24, opacity: 0.18 },
});
