import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accent, line, radius, surface, text as palette } from '../../theme';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../lib/haptics';
import { useCart } from '../../contexts/CartContext';
import {
  CLIENT_TAB_SCREENS,
  COURIER_TAB_SCREENS,
  RESTAURANT_TAB_SCREENS,
} from '../../lib/layoutChrome';

/**
 * Barre d'onglets.
 *
 * Pas d'icônes colorées : un glyphe fin, et un point braise sous
 * l'onglet actif. Le seul badge est celui du panier — c'est le seul
 * chiffre qui doit attirer l'œil.
 */
const GLYPHS: Record<string, Record<string, string>> = {
  client: { index: '◎', cart: '▣', orders: '≡', profile: '◍' },
  courier: { index: '◎', mine: '▲', history: '≡' },
  restaurant: { index: '▣', stats: '◫', profile: '◍' },
};

const LABELS: Record<string, Record<string, string>> = {
  client: { index: 'Découvrir', cart: 'Panier', orders: 'Commandes', profile: 'Profil' },
  courier: { index: 'Courses', mine: 'En cours', history: 'Historique' },
  restaurant: { index: 'Commandes', stats: 'Chiffres', profile: 'Boutique' },
};

function resolveGroup(segments: string[]): 'client' | 'courier' | 'restaurant' | null {
  if (segments.includes('(courier)')) return 'courier';
  if (segments.includes('(restaurant)')) return 'restaurant';
  if (segments.includes('(client)')) return 'client';
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function YohaTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const group = resolveGroup(segments) ?? 'client';
  const { count } = useCart();

  const visible =
    group === 'courier'
      ? COURIER_TAB_SCREENS
      : group === 'restaurant'
        ? RESTAURANT_TAB_SCREENS
        : CLIENT_TAB_SCREENS;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routes = state.routes.filter((r: any) =>
    (visible as readonly string[]).includes(r.name),
  );

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 12,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(10,8,6,0.94)',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: line.hair,
        flexDirection: 'row',
      }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {routes.map((route: any) => {
        const activeName = state.routes[state.index]?.name;
        const focused = activeName === route.name;
        const badge = group === 'client' && route.name === 'cart' ? count : 0;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[group][route.name]}
            onPress={() => {
              void hapticSelection();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4 }}
          >
            <View>
              <Text
                style={{
                  fontSize: 19,
                  color: focused ? accent.ember : palette.dim,
                }}
              >
                {GLYPHS[group][route.name]}
              </Text>

              {badge > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -12,
                    minWidth: 17,
                    height: 17,
                    paddingHorizontal: 4,
                    borderRadius: radius.full,
                    backgroundColor: accent.ember,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: surface.void,
                  }}
                >
                  <Text
                    style={{ fontFamily: fonts.monoMedium, fontSize: 9, color: palette.onEmber }}
                  >
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.mono,
                fontSize: 9.5,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
                color: focused ? palette.bone : palette.dim,
              }}
            >
              {LABELS[group][route.name]}
            </Text>

            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 4,
                backgroundColor: focused ? accent.ember : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
