import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { accent } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Braises qui montent lentement depuis le bas.
 *
 * C'est la seule animation d'ambiance de l'app : discrète, jamais
 * au-dessus du contenu lisible. `pointerEvents="none"` pour ne pas
 * voler les taps.
 */
export function EmberField({
  count = 14,
  height = 420,
  color = accent.emberHot,
}: {
  count?: number;
  height?: number;
  color?: string;
}) {
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: ((i * 37) % 100) / 100,
        delay: ((i * 1370) % 9000),
        duration: 7000 + ((i * 900) % 5000),
        size: 1.6 + ((i * 7) % 3) * 0.6,
      })),
    [count],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {seeds.map((s, i) => (
        <Ember key={i} {...s} height={height} color={color} />
      ))}
    </View>
  );
}

function Ember({
  left,
  delay,
  duration,
  size,
  height,
  color,
}: {
  left: number;
  delay: number;
  duration: number;
  size: number;
  height: number;
  color: string;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: left * SCREEN_W,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: color,
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 6,
        opacity: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.65, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -height] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) },
        ],
      }}
    />
  );
}

/** Apparition en fondu + montée. À poser sur chaque bloc d'une liste, décalé. */
export function Rise({
  children,
  delay = 0,
  distance = 18,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 620,
      delay,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [t, delay]);

  return (
    <Animated.View
      style={{
        opacity: t,
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Compteur qui monte jusqu'à `to`. Utilisé pour l'ETA : un nombre qui
 * s'anime se lit comme une donnée live, un nombre figé comme une étiquette.
 */
export function LiveCount({
  to,
  duration = 700,
  render,
}: {
  to: number;
  duration?: number;
  render: (n: number) => React.ReactNode;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [to, duration]);

  return <>{render(n)}</>;
}

/** Point vert qui respire : « c'est en direct ». */
export function LivePulse({ color = accent.mint, size = 6 }: { color?: string; size?: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          opacity: t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
        }}
      />
      <View
        style={{ width: size, height: size, borderRadius: size, backgroundColor: color }}
      />
    </View>
  );
}

/** Balayage de lumière sur le CTA principal. Un seul par écran. */
export function Sweep({ width = 90 }: { width?: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -20,
        bottom: -20,
        width,
        backgroundColor: 'rgba(255,255,255,0.22)',
        transform: [
          { skewX: '-18deg' },
          {
            translateX: t.interpolate({
              inputRange: [0, 1],
              outputRange: [-width * 2, SCREEN_W],
            }),
          },
        ],
      }}
    />
  );
}

/** Petit rebond appliqué à la barre panier quand un article est ajouté. */
export function Pop({ trigger, children }: { trigger: number; children: React.ReactNode }) {
  const s = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!trigger) return;
    Animated.sequence([
      Animated.timing(s, { toValue: 1.06, duration: 140, useNativeDriver: true }),
      Animated.spring(s, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
    ]).start();
  }, [trigger, s]);

  return <Animated.View style={{ transform: [{ scale: s }] }}>{children}</Animated.View>;
}
