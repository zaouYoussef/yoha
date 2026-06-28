import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, glass, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../lib/haptics';
import {
  CLIENT_TAB_SCREENS,
  COURIER_TAB_SCREENS,
  RESTAURANT_TAB_SCREENS,
} from '../../lib/layoutChrome';

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_PAD = 20;
const BAR_INNER = 8;

const ICONS: Record<string, Record<string, string>> = {
  client: {
    index: '🏠',
    cart: '🛒',
    orders: '📦',
    profile: '👤',
  },
  courier: {
    index: '🔔',
    mine: '🛵',
    history: '🕐',
  },
  restaurant: {
    index: '📥',
    stats: '📊',
    profile: '🏪',
  },
};

function TabBarItem({
  focused,
  icon,
  label,
  onPress,
}: {
  focused: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function resolveTabGroup(segments: string[]): 'client' | 'courier' | 'restaurant' | null {
  if (segments.includes('(courier)')) return 'courier';
  if (segments.includes('(restaurant)')) return 'restaurant';
  if (segments.includes('(client)')) return 'client';
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function YohaTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const group = resolveTabGroup(segments);

  const visibleScreens =
    group === 'courier'
      ? COURIER_TAB_SCREENS
      : group === 'restaurant'
        ? RESTAURANT_TAB_SCREENS
        : group === 'client'
          ? CLIENT_TAB_SCREENS
          : [];

  const visibleRoutes = state.routes.filter((route: { name: string }) =>
    (visibleScreens as readonly string[]).includes(route.name),
  );
  const tabCount = Math.max(visibleRoutes.length, 1);
  const barWidth = SCREEN_W - BAR_PAD * 2 - BAR_INNER * 2;
  const tabWidth = barWidth / tabCount;

  const focusedRoute = state.routes[state.index];
  const showBar = (visibleScreens as readonly string[]).includes(focusedRoute?.name);
  const focusedVisibleIndex = visibleRoutes.findIndex(
    (r: { key: string }) => r.key === focusedRoute?.key,
  );

  if (!showBar || !group) return null;

  const indicatorLeft = (focusedVisibleIndex >= 0 ? focusedVisibleIndex : 0) * tabWidth + 4;
  const iconSet = ICONS[group];

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={[styles.bar, shadows.float]}>
        <View
          style={[
            styles.indicatorWrap,
            { transform: [{ translateX: indicatorLeft }], width: Math.max(tabWidth - 8, 0) },
          ]}
        >
          <LinearGradient
            colors={
              group === 'courier'
                ? ['#8b5cf6', '#d946ef']
                : group === 'restaurant'
                  ? ['#f59e0b', '#ec4899']
                  : [...gradients.cta]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.indicator}
          />
        </View>
        {visibleRoutes.map((route: { key: string; name: string }) => {
          const routeIndex = state.routes.findIndex((r: { key: string }) => r.key === route.key);
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;
          const focused = state.index === routeIndex;
          const icon = iconSet[route.name] ?? '✨';

          return (
            <TabBarItem
              key={route.key}
              focused={focused}
              icon={icon}
              label={label}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                hapticSelection();
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: BAR_PAD,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: glass.bg,
    borderRadius: radius.xl + 4,
    borderWidth: 1.5,
    borderColor: glass.border,
    paddingVertical: 10,
    paddingHorizontal: BAR_INNER,
    position: 'relative',
    overflow: 'hidden',
  },
  indicatorWrap: {
    position: 'absolute',
    top: 8,
    left: 4,
    height: 52,
    borderRadius: 20,
    overflow: 'hidden',
  },
  indicator: {
    flex: 1,
    borderRadius: 20,
    opacity: 0.18,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, zIndex: 2, paddingVertical: 4 },
  icon: { fontSize: 24, opacity: 0.38 },
  iconActive: { opacity: 1, fontSize: 26 },
  label: { fontSize: 10, fontFamily: fonts.bold, color: ink[400], letterSpacing: 0.2 },
  labelActive: { color: brand[700], fontSize: 10.5 },
});
