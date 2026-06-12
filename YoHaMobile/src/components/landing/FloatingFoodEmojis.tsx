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
import { FLOATING_FOOD } from '../../data/landing';

const POSITIONS = [
  { top: '12%', left: '6%', delay: 0 },
  { top: '28%', left: '4%', delay: 400 },
  { top: '55%', left: '10%', delay: 800 },
  { top: '18%', right: '6%', delay: 200 },
  { top: '42%', right: '4%', delay: 600 },
  { top: '68%', right: '8%', delay: 1000 },
];

function FloatEmoji({ emoji, top, left, right, delay }: { emoji: string; top: string; left?: string; right?: string; delay: number }) {
  const y = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2200 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(12, { duration: 2200 + delay, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    rot.value = withRepeat(
      withSequence(withTiming(8, { duration: 3000 }), withTiming(-8, { duration: 3000 })),
      -1,
      true,
    );
  }, [delay, rot, y]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.Text
      style={[
        styles.emoji,
        anim,
        { top: top as `${number}%`, left: left as `${number}%` | undefined, right: right as `${number}%` | undefined },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export function FloatingFoodEmojis() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {FLOATING_FOOD.map((e, i) => (
        <FloatEmoji key={e} emoji={e} {...POSITIONS[i]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { position: 'absolute', fontSize: 28, opacity: 0.35 },
});
