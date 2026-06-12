import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { ink, shadows } from '../../theme';
import { SearchBarWow } from './SearchBarWow';

type Props = {
  scrollY: SharedValue<number>;
  query: string;
  onChange: (q: string) => void;
  topInset: number;
};

export function DiscoverStickySearch({ scrollY, query, onChange, topInset }: Props) {
  const anim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [150, 210], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 210], [-110, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View style={[styles.wrap, { paddingTop: topInset + 6 }, anim]} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(255,247,237,0.98)', 'rgba(255,255,255,0.96)']}
        style={styles.bg}
      >
        <SearchBarWow value={query} onChange={onChange} compact placeholder="Craving ? Pizza, tacos, sushi…" />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: ink[100],
    ...shadows.soft,
  },
  bg: { borderRadius: 20, paddingHorizontal: 4, paddingVertical: 4 },
});
