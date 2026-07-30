import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { text as palette, typography } from '../../theme';
import { fonts } from '../../theme/fonts';

type Tone = 'bone' | 'fog' | 'dim' | 'ember' | 'mint' | 'saffron' | 'void';

const TONES: Record<Tone, string> = {
  bone: palette.bone,
  fog: palette.fog,
  dim: palette.dim,
  ember: '#ff5a1f',
  mint: '#4ade9b',
  saffron: '#f5c451',
  void: palette.onEmber,
};

type BaseProps = TextProps & { tone?: Tone; style?: TextStyle | TextStyle[] };

/** Titre de marque. Condensé, capitales, interlignage serré. */
export function Display({
  size = 'h1',
  tone = 'bone',
  black,
  style,
  ...rest
}: BaseProps & { size?: 'hero' | 'h1' | 'h2' | 'h3'; black?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        typography[size],
        { fontFamily: black ? fonts.displayBlack : fonts.display, color: TONES[tone] },
        style,
      ]}
    />
  );
}

export function Body({
  size = 'body',
  tone = 'bone',
  weight = 'body',
  style,
  ...rest
}: BaseProps & {
  size?: 'body' | 'small' | 'caption';
  weight?: 'body' | 'medium' | 'semibold' | 'bold';
}) {
  return (
    <Text
      {...rest}
      style={[typography[size], { fontFamily: fonts[weight], color: TONES[tone] }, style]}
    />
  );
}

/** Micro-libellé en mono espacé : catégories, statuts, kickers de section. */
export function Label({ tone = 'fog', style, ...rest }: BaseProps) {
  return (
    <Text
      {...rest}
      style={[typography.label, { fontFamily: fonts.mono, color: TONES[tone] }, style]}
    />
  );
}

/**
 * Prix. Le montant en mono, la devise plus petite et atténuée —
 * l'œil lit le chiffre, pas l'unité.
 */
export function Money({
  value,
  size = 15,
  tone = 'bone',
  style,
}: {
  value: number | string;
  size?: number;
  tone?: Tone;
  style?: TextStyle | TextStyle[];
}) {
  const n = typeof value === 'number' ? Math.round(value * 100) / 100 : value;
  return (
    <Text style={[{ fontFamily: fonts.monoMedium, fontSize: size, color: TONES[tone] }, style]}>
      {n}
      <Text style={{ fontSize: size * 0.68, color: palette.fog }}> DH</Text>
    </Text>
  );
}

export const typeStyles = StyleSheet.create({
  center: { textAlign: 'center' },
});
