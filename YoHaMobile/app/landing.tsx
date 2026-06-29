import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, radius, shadows, gradients } from '../src/theme';
import { fonts } from '../src/theme/fonts';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    emoji: '🍔',
    title: 'Vos restos favoris',
    desc: 'Tous les restaurants préférés du campus de Tanger réunis au même endroit (Burgers, Pizzas, Tacos, Sushi...).',
    colors: ['#fb923c', '#ef4444'] as [string, string],
  },
  {
    key: '2',
    emoji: '🛵',
    title: 'Livraison 0 DH',
    desc: 'Pas de frais cachés. Livraison éclair 100% gratuite en 20 minutes sur tout le campus, les facultés et le CHU.',
    colors: ['#34d399', '#14b8a6'] as [string, string],
  },
  {
    key: '3',
    emoji: '🎰',
    title: 'Roulette & 1-Clic',
    desc: 'Indécis ? Lancez la roulette pour choisir votre plat et commandez instantanément grâce à notre Commande Express.',
    colors: ['#a855f7', '#ec4899'] as [string, string],
  },
];

const BACKGROUND_PARTICLES = [
  { emoji: '🍕', top: '8%', left: '8%', factor: 0.15, rotationDirection: 1 },
  { emoji: '🍔', top: '16%', right: '12%', factor: -0.18, rotationDirection: -1 },
  { emoji: '🌮', top: '48%', left: '10%', factor: 0.22, rotationDirection: 1 },
  { emoji: '🍣', top: '56%', right: '8%', factor: -0.15, rotationDirection: -1 },
  { emoji: '🍩', top: '78%', left: '14%', factor: 0.26, rotationDirection: 1 },
  { emoji: '🥤', top: '82%', right: '14%', factor: -0.22, rotationDirection: -1 },
];

function BackgroundParticle({
  emoji,
  top,
  left,
  right,
  factor,
  rotationDirection,
  scrollX,
}: {
  emoji: string;
  top: string;
  left?: string;
  right?: string;
  factor: number;
  rotationDirection: number;
  scrollX: SharedValue<number>;
}) {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400 + Math.random() * 800 }),
        withTiming(0, { duration: 2400 + Math.random() * 800 })
      ),
      -1,
      true
    );
  }, [floatAnim]);

  const animStyle = useAnimatedStyle(() => {
    const translateY = floatAnim.value * -14;
    const translateX = scrollX.value * factor;
    const rotate = `${scrollX.value * 0.1 * rotationDirection}deg`;

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate },
      ],
    };
  });

  const positionStyle = {
    position: 'absolute' as const,
    top: top as any,
    ...(left ? { left } : {}),
    ...(right ? { right } : {}),
    opacity: 0.15,
    fontSize: 28,
  };

  return (
    <Animated.Text style={[positionStyle as any, animStyle]}>
      {emoji}
    </Animated.Text>
  );
}

function FloatingIcon({
  emoji,
  colors,
  index,
  scrollX,
}: {
  emoji: string;
  colors: [string, string];
  index: number;
  scrollX: SharedValue<number>;
}) {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200 }),
        withTiming(0, { duration: 2200 })
      ),
      -1,
      true
    );
  }, [floatAnim]);

  const animStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatAnim.value, [0, 1], [0, -12]);
    const rotate = `${interpolate(floatAnim.value, [0, 1], [-3, 3])}deg`;

    const input = [(index - 1) * width, index * width, (index + 1) * width];
    const translateX = interpolate(
      scrollX.value,
      input,
      [60, 0, -60],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollX.value,
      input,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.glowRingWrap, animStyle]}>
      <LinearGradient
        colors={colors}
        style={[styles.glowRing, shadows.glow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.emojiText}>{emoji}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function AnimatedText({
  index,
  scrollX,
  title,
  desc,
}: {
  index: number;
  scrollX: SharedValue<number>;
  title: string;
  desc: string;
}) {
  const animStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];

    const translateX = interpolate(
      scrollX.value,
      input,
      [120, 0, -120],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      input,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View style={[styles.textWrap, animStyle]}>
      <Text style={styles.slideTitle}>{title}</Text>
      <Text style={styles.slideDesc}>{desc}</Text>
    </Animated.View>
  );
}

function AnimatedDot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const dotStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    
    const dotWidth = interpolate(
      scrollX.value,
      input,
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      input,
      [0.25, 1, 0.25],
      Extrapolation.CLAMP
    );

    const colors = ['#fb923c', '#34d399', '#a855f7'];

    return {
      width: dotWidth,
      opacity,
      backgroundColor: colors[index],
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const scrollX = useSharedValue(0);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
    } catch (e) {
      console.warn(e);
    }
  };

  const goShop = async () => {
    await completeOnboarding();
    router.replace('/(client)' as never);
  };
  const goLogin = async () => {
    await completeOnboarding();
    router.push('/auth/login' as never);
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      goShop();
    }
  };

  const bgStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [0, width, width * 2], [1, 0, 0], Extrapolation.CLAMP),
  }));
  const bgStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [0, width, width * 2], [0, 1, 0], Extrapolation.CLAMP),
  }));
  const bgStyle3 = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [0, width, width * 2], [0, 0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[StyleSheet.absoluteFill, bgStyle1]}>
        <LinearGradient colors={['#0f172a', '#1e293b', '#450a0a']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle2]}>
        <LinearGradient colors={['#0f172a', '#1e293b', '#022c22']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle3]}>
        <LinearGradient colors={['#0f172a', '#1e293b', '#2e1065']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      </Animated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BACKGROUND_PARTICLES.map((p, idx) => (
          <BackgroundParticle key={idx} {...p} scrollX={scrollX} />
        ))}
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.logoRow}>
          <LinearGradient colors={[...gradients.cta]} style={styles.logoBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.logoText}>Y</Text>
          </LinearGradient>
          <Text style={styles.brandName}>YoHa</Text>
        </View>
        <Pressable onPress={goShop} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer ➔</Text>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => (
          <View style={styles.slide}>
            <View style={styles.iconContainer}>
              <FloatingIcon emoji={item.emoji} colors={item.colors} index={index} scrollX={scrollX} />
            </View>

            <AnimatedText index={index} scrollX={scrollX} title={item.title} desc={item.desc} />
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <AnimatedDot key={idx} index={idx} scrollX={scrollX} />
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handleNext}>
            <LinearGradient
              colors={activeIndex === SLIDES.length - 1 ? [...gradients.cta] : ['#ffffff', '#f1f5f9']}
              style={[styles.btnPrimary, shadows.glowOrange]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.btnPrimaryText, activeIndex < SLIDES.length - 1 && { color: brand[900] }]}>
                {activeIndex === SLIDES.length - 1 ? '🚀 Découvrir le menu' : 'Continuer ➔'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={goLogin} style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}>
            <Text style={styles.btnSecondaryText}>Se connecter à mon compte</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 18, fontFamily: fonts.extrabold },
  brandName: { fontFamily: fonts.display, fontSize: 20, color: '#fff', letterSpacing: -0.4 },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { fontFamily: fonts.bold, color: '#94a3b8', fontSize: 12 },
  slide: { width, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  glowRingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emojiText: { fontSize: 64 },
  textWrap: { alignItems: 'center', paddingHorizontal: 10 },
  slideTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -1,
  },
  slideDesc: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  footer: { paddingHorizontal: 24, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 2 },
  actions: { gap: 12, width: '100%' },
  btnPrimary: {
    paddingVertical: 18,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 16, letterSpacing: 0.2 },
  btnSecondary: {
    paddingVertical: 16,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnSecondaryText: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.bold, fontSize: 14 },
});
