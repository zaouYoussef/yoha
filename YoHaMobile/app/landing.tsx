import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients, line, radius, surface, text as palette } from '../src/theme';
import { Body, Display, Label } from '../src/components/yoha/Type';
import { EmberField, LivePulse } from '../src/components/yoha/Motion';
import { EmberButton } from '../src/components/yoha/EmberButton';
import { StepBar } from '../src/components/yoha/Atoms';

const { height: SCREEN_H } = Dimensions.get('window');

/**
 * Trois écrans, trois promesses concrètes. Pas de « bienvenue ».
 * Le bouton principal amène directement au catalogue : on ne demande
 * jamais de créer un compte avant d'avoir montré la nourriture.
 */
const SLIDES = [
  {
    kicker: 'Tanger, ce soir',
    title: 'Tout\nest ouvert',
    line: 'Restaurants, pharmacies, pâtisseries. Une seule app, un seul livreur.',
    photo: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80&auto=format&fit=crop',
  },
  {
    kicker: 'Vingt minutes',
    title: 'Chaud\nà l’arrivée',
    line: 'Le livreur part quand la cuisine pose l’assiette. Pas avant, pas après.',
    photo: 'https://images.unsplash.com/photo-1673166516558-3f1b88a22db8?w=1200&q=80&auto=format&fit=crop',
  },
  {
    kicker: 'Sans compte',
    title: 'Commande\nen deux taps',
    line: 'Adresse, téléphone, c’est parti. La livraison est offerte la première fois.',
    photo: 'https://images.unsplash.com/photo-1762631176795-d500f0472051?w=1200&q=80&auto=format&fit=crop',
  },
];

export default function Landing() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  /* Les photos s'enchaînent seules : l'app se présente sans qu'on la touche. */
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), 320);
    }, 4200);
    return () => clearInterval(timer);
  }, [fade]);

  const enter = async (href: '/(client)' | '/auth/login') => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    router.replace(href);
  };

  const slide = SLIDES[index];

  return (
    <View style={{ flex: 1, backgroundColor: surface.void }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Image
          source={{ uri: slide.photo }}
          contentFit="cover"
          transition={400}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={slide.title.replace('\n', ' ')}
        />
      </Animated.View>

      <LinearGradient
        colors={gradients.scrim}
        locations={gradients.scrimLocations}
        style={StyleSheet.absoluteFill}
      />
      <EmberField count={18} height={SCREEN_H * 0.7} />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 16,
          paddingHorizontal: 22,
          paddingBottom: Math.max(insets.bottom, 18) + 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Display size="h2" black>
            YO<Display size="h2" black tone="ember">HA</Display>
          </Display>
          <View style={{ flex: 1 }} />
          <LivePulse />
          <Label tone="fog">En service</Label>
        </View>

        <View style={{ flex: 1 }} />

        <Animated.View style={{ opacity: fade }}>
          <Label tone="ember">{slide.kicker}</Label>
          <Display size="hero" style={{ marginTop: 14 }}>
            {slide.title}
          </Display>
          <Body tone="fog" style={{ marginTop: 16, maxWidth: 320 }}>
            {slide.line}
          </Body>
        </Animated.View>

        <View style={{ marginTop: 28, marginBottom: 22, width: 120 }}>
          <StepBar total={SLIDES.length} current={index} />
        </View>

        <EmberButton label="Voir ce qui est ouvert" onPress={() => void enter('/(client)')} />

        <Body
          size="small"
          tone="fog"
          suppressHighlighting
          onPress={() => void enter('/auth/login')}
          style={{ textAlign: 'center', marginTop: 18, paddingVertical: 6 }}
        >
          J’ai déjà un compte
        </Body>
      </View>
    </View>
  );
}

export const LANDING_BORDER = line.hair;
export const LANDING_RADIUS = radius.lg;
export const LANDING_TEXT = palette.bone;
