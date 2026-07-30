import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { accent, line, radius, surface } from '../../theme';
import { Body, Display, Label, Money } from './Type';
import { Glyph, Hairline, Pill } from './Atoms';
import { LivePulse } from './Motion';

/**
 * Les écrans métier (livreur, restaurant) ne sont pas des vitrines :
 * ils sont lus debout, une main sur le guidon ou dans le bruit d'une cuisine.
 * D'où des blocs plus denses, des chiffres en mono et une seule couleur d'action.
 */

export function OpsHeader({
  kicker,
  title,
  live,
}: {
  kicker: string;
  title: string;
  live?: string;
}) {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Label tone="ember">{kicker}</Label>
        {live ? (
          <>
            <View style={{ flex: 1 }} />
            <LivePulse />
            <Label tone="fog">{live}</Label>
          </>
        ) : null}
      </View>
      <Display size="h1" style={{ marginTop: 5 }}>
        {title}
      </Display>
    </View>
  );
}

/** Deux ou trois chiffres qui résument la journée, sans graphique. */
export function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: string; money?: number; tone?: 'ember' | 'mint' }>;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, marginTop: 18 }}>
      {items.map((it) => (
        <View
          key={it.label}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: radius.lg,
            backgroundColor: surface.ash,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: it.tone === 'ember' ? line.ember : line.hair,
          }}
        >
          {typeof it.money === 'number' ? (
            <Money value={it.money} size={22} tone={it.tone ?? 'bone'} />
          ) : (
            <Display size="h2" tone={it.tone ?? 'bone'}>
              {it.value}
            </Display>
          )}
          <Label tone="dim" style={{ marginTop: 6 }}>
            {it.label}
          </Label>
        </View>
      ))}
    </View>
  );
}

export function OpsCard({
  children,
  accented,
  style,
}: {
  children: React.ReactNode;
  accented?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          padding: 14,
          borderRadius: radius.xl,
          backgroundColor: surface.soot,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: accented ? line.ember : line.hair,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Ligne « clé : valeur » pour une adresse, un téléphone, une note. */
export function OpsField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
      <Label tone="dim" style={{ width: 66, paddingTop: 2 }}>
        {label}
      </Label>
      <Body size="small" style={{ flex: 1 }}>
        {value}
      </Body>
    </View>
  );
}

/** Action secondaire compacte : appeler, WhatsApp, copier. */
export function OpsAction({
  label,
  glyph,
  onPress,
  tone = 'neutral',
  disabled,
}: {
  label: string;
  glyph?: React.ComponentProps<typeof Glyph>['name'];
  onPress: () => void;
  tone?: 'neutral' | 'ember' | 'mint';
  disabled?: boolean;
}) {
  const color = tone === 'ember' ? accent.ember : tone === 'mint' ? accent.mint : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingVertical: 11,
        borderRadius: radius.full,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: color ?? line.soft,
        opacity: disabled ? 0.4 : pressed ? 0.65 : 1,
      })}
    >
      {glyph ? <Glyph name={glyph} size={13} color={color} /> : null}
      <Body
        size="caption"
        weight="semibold"
        tone={tone === 'ember' ? 'ember' : tone === 'mint' ? 'mint' : 'bone'}
      >
        {label}
      </Body>
    </Pressable>
  );
}

export function OpsEmpty({ title, line: sub }: { title: string; line: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 34, gap: 10 }}>
      <Display size="h1" tone="fog">
        {title}
      </Display>
      <Body size="small" tone="dim" style={{ textAlign: 'center' }}>
        {sub}
      </Body>
    </View>
  );
}

export function OpsItems({
  items,
}: {
  items?: Array<{ id: string; name: string; qty: number; price: number | string }>;
}) {
  if (!items?.length) return null;
  return (
    <View style={{ marginTop: 12 }}>
      <Hairline />
      {items.map((it) => (
        <View
          key={it.id}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 }}
        >
          <Pill>{`${it.qty}×`}</Pill>
          <Body size="small" style={{ flex: 1 }} numberOfLines={1}>
            {it.name}
          </Body>
          <Money value={(Number(it.price) || 0) * (Number(it.qty) || 0)} size={13} tone="fog" />
        </View>
      ))}
    </View>
  );
}
