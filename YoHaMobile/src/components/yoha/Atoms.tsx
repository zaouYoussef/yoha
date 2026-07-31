import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { accent, line, radius, surface, text as palette, typography } from '../../theme';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../lib/haptics';
import { Body, Label } from './Type';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Jeu de glyphes unicode plutôt qu'une librairie d'icônes.
 * Zéro dépendance, et le trait fin colle au registre éditorial.
 */
const GLYPHS: Record<string, string> = {
  back: '←',
  forward: '→',
  close: '✕',
  check: '✓',
  plus: '+',
  minus: '−',
  star: '★',
  pin: '◉',
  clock: '◴',
  bolt: '⚡',
  dice: '⚅',
  search: '⌕',
  chevron: '›',
  phone: '✆',
  chat: '✉',
  copy: '⧉',
  route: '⤳',
  flame: '◆',
};

export function Glyph({
  name,
  size = 16,
  color = palette.bone,
}: {
  name: keyof typeof GLYPHS | string;
  size?: number;
  color?: string;
}) {
  return (
    <Text style={{ fontSize: size, lineHeight: size * 1.25, color }}>
      {GLYPHS[name] ?? name}
    </Text>
  );
}

/** Bouton rond en verre sombre : retour, fermeture, actions secondaires. */
export function GhostButton({
  glyph,
  onPress,
  size = 42,
  label,
  tone = 'ember',
  style,
}: {
  glyph: string;
  onPress: () => void;
  size?: number;
  label?: string;
  tone?: 'ember' | 'violet';
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? glyph}
      onPress={() => {
        void hapticSelection();
        onPress();
      }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(10,8,6,0.55)',
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: pressed ? accent[tone] : line.soft,
        },
        style,
      ]}
    >
      <Glyph name={glyph} size={size * 0.42} />
    </Pressable>
  );
}

/** Étiquette compacte posée sur une photo ou en tête de carte. */
export function Pill({
  children,
  tone = 'dark',
}: {
  children: React.ReactNode;
  tone?: 'dark' | 'ember' | 'mint' | 'violet';
}) {
  const bg =
    tone === 'ember'
      ? accent.ember
      : tone === 'mint'
        ? 'rgba(74,222,155,0.14)'
        : tone === 'violet'
          ? 'rgba(139,92,246,0.16)'
          : 'rgba(10,8,6,0.78)';
  const fg =
    tone === 'ember'
      ? palette.onEmber
      : tone === 'mint'
        ? accent.mint
        : tone === 'violet'
          ? accent.violet
          : palette.bone;

  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: bg,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={[typography.label, { fontFamily: fonts.mono, color: fg }]}>{children}</Text>
    </View>
  );
}

/** Filtre sélectionnable (envies, catégories). */
export function Chip({
  label,
  emoji,
  active,
  onPress,
  tone = 'ember',
}: {
  label: string;
  emoji?: string;
  active?: boolean;
  onPress: () => void;
  tone?: 'ember' | 'violet';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={() => {
        void hapticSelection();
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: radius.full,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: active ? accent[tone] : line.soft,
        backgroundColor: active ? accent[tone] : surface.ash,
      }}
    >
      {emoji ? <Text style={{ fontSize: 14 }}>{emoji}</Text> : null}
      <Body size="small" weight="medium" tone={active ? 'void' : 'bone'}>
        {label}
      </Body>
    </Pressable>
  );
}

export function Stars({ value, reviews }: { value: number; reviews?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Text style={{ color: accent.saffron, fontSize: 11 }}>{GLYPHS.star}</Text>
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 12, color: accent.saffron }}>
        {value.toFixed(1)}
      </Text>
      {reviews != null ? (
        <Body size="caption" tone="dim">
          ({reviews})
        </Body>
      ) : null}
    </View>
  );
}

export function Hairline({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: line.hair }, style]} />;
}

/** En-tête de section : kicker en mono, titre display, filet qui file à droite. */
export function SectionHeader({
  kicker,
  title,
  tone = 'ember',
}: {
  kicker: string;
  title: string;
  tone?: 'ember' | 'violet';
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 14,
        paddingHorizontal: 18,
        marginTop: 34,
        marginBottom: 14,
      }}
    >
      <View>
        <Label tone={tone}>{kicker}</Label>
        <Text
          style={[
            typography.h2,
            { fontFamily: fonts.display, color: palette.bone, marginTop: 5 },
          ]}
        >
          {title}
        </Text>
      </View>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: line.soft, marginBottom: 8 }} />
    </View>
  );
}

/**
 * Bandeau défilant de preuve sociale.
 * On duplique la liste pour que la boucle soit invisible.
 */
export function Ticker({ items }: { items: string[] }) {
  const t = useRef(new Animated.Value(0)).current;
  const width = useRef(0);

  useEffect(() => {
    if (!width.current) return;
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: Math.max(18000, width.current * 22),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, items.length]);

  const doubled = [...items, ...items];

  return (
    <View
      style={{
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: line.hair,
        backgroundColor: 'rgba(20,16,16,0.6)',
        paddingVertical: 9,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        onLayout={(e) => {
          width.current = e.nativeEvent.layout.width / 2;
        }}
        style={{
          flexDirection: 'row',
          gap: 28,
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, -width.current] }) },
          ],
        }}
      >
        {doubled.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View
              style={{ width: 4, height: 4, borderRadius: 4, backgroundColor: accent.mint }}
            />
            <Label tone="fog">{item}</Label>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

/** Bloc de chargement qui respire — évite le spinner générique. */
export function Skeleton({
  height = 140,
  style,
}: {
  height?: number;
  style?: ViewStyle;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius: radius.lg,
          backgroundColor: surface.ash,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] }),
        },
        style,
      ]}
    />
  );
}

/** Compteur segmenté : étapes d'une commande, progression d'un formulaire. */
export function StepBar({
  total,
  current,
  tone = 'ember',
}: {
  total: number;
  current: number;
  tone?: 'ember' | 'violet';
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, width: '100%' }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 3,
            backgroundColor: i <= current ? accent[tone] : line.soft,
          }}
        />
      ))}
    </View>
  );
}

export const SCREEN_WIDTH = SCREEN_W;
