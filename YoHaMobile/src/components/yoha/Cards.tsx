import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { accent, gradients, line, radius, surface, text as palette } from '../../theme';
import { resolveImageUrl } from '../../lib/resolveImageUrl';
import type { MenuItem, Restaurant } from '../../lib/api';
import { Body, Display, Label, Money } from './Type';
import { Glyph, Hairline, Pill, Stars } from './Atoms';

const BLUR = 'L03[?d~q00_3~qxu%MRj00M{-;xu';

function num(v: unknown, fallback = 0) {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Carte enseigne.
 *
 * La photo occupe toute la largeur et se fond dans le noir par le bas :
 * le nom est écrit *dans* l'image, pas sous elle. Ça supprime la
 * séparation photo/étiquette qui fait « catalogue ».
 */
export function VendorCard({
  restaurant,
  eta,
  hook,
  onPress,
}: {
  restaurant: Restaurant;
  eta?: number;
  hook?: string;
  onPress: () => void;
}) {
  const closed = restaurant.isOpen === false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, ${restaurant.cuisine ?? ''}`}
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radius.xl,
        overflow: 'hidden',
        backgroundColor: surface.ash,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: pressed ? accent.ember : line.hair,
        opacity: closed ? 0.55 : 1,
      })}
    >
      <View style={{ height: 172, backgroundColor: surface.smoke }}>
        <Image
          source={{ uri: resolveImageUrl(restaurant.cover) }}
          placeholder={BLUR}
          contentFit="cover"
          transition={320}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={`Photo de ${restaurant.name}`}
        />
        <LinearGradient
          colors={gradients.cardScrim}
          locations={[0.25, 0.62, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <Pill>{closed ? 'Fermé' : `${eta ?? 25} min`}</Pill>
        </View>

        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
          <Display size="h2" numberOfLines={1}>
            {restaurant.name}
          </Display>
          <Body size="caption" tone="fog" style={{ marginTop: 4 }} numberOfLines={1}>
            {restaurant.cuisine ?? 'Cuisine'}
          </Body>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Stars value={4.8} />
        {restaurant.distance ? (
          <Body size="caption" tone="dim">
            · {restaurant.distance}
          </Body>
        ) : null}
        <View style={{ flex: 1 }} />
        {hook || restaurant.promo ? (
          <Label tone="ember" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
            {hook ?? restaurant.promo}
          </Label>
        ) : (
          <Glyph name="chevron" size={18} color={palette.dim} />
        )}
      </View>
    </Pressable>
  );
}

/**
 * Ligne de menu.
 *
 * Texte à gauche, photo à droite avec un « + » qui déborde du coin :
 * la cible d'ajout est visible sans ouvrir la fiche, mais toute la
 * ligne reste tappable.
 */
export function DishRow({
  item,
  tag,
  onPress,
}: {
  item: MenuItem;
  tag?: string;
  onPress: () => void;
}) {
  const unavailable = item.isAvailable === false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.name}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 14,
        padding: 12,
        borderRadius: radius.lg,
        backgroundColor: surface.soot,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: pressed ? accent.ember : line.hair,
        opacity: unavailable ? 0.4 : 1,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        {tag ? <Label tone="ember">{tag}</Label> : null}
        <Display size="h3" numberOfLines={2} style={{ marginTop: tag ? 4 : 0 }}>
          {item.name}
        </Display>
        {item.desc ? (
          <Body size="caption" tone="fog" numberOfLines={2} style={{ marginTop: 6 }}>
            {item.desc}
          </Body>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 9 }}>
          <Money value={num(item.price)} size={14} />
          {unavailable ? <Label tone="dim">Épuisé</Label> : null}
        </View>
      </View>

      <View style={{ width: 92, height: 92 }}>
        <Image
          source={{ uri: resolveImageUrl(item.img) }}
          placeholder={BLUR}
          contentFit="cover"
          transition={260}
          style={{ width: 92, height: 92, borderRadius: radius.md, backgroundColor: surface.smoke }}
        />
        {!unavailable ? (
          <View
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 32,
              height: 32,
              borderRadius: radius.full,
              backgroundColor: accent.ember,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: surface.soot,
            }}
          >
            <Glyph name="plus" size={16} color={palette.onEmber} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Vignette compacte pour les carrousels horizontaux. */
export function DishTile({
  item,
  subtitle,
  badge,
  width = 168,
  onPress,
}: {
  item: MenuItem;
  subtitle?: string;
  badge?: string;
  width?: number;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ width }}>
      <View
        style={{
          height: 126,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: surface.smoke,
        }}
      >
        <Image
          source={{ uri: resolveImageUrl(item.img) }}
          placeholder={BLUR}
          contentFit="cover"
          transition={260}
          style={StyleSheet.absoluteFill}
        />
        {badge ? (
          <View style={{ position: 'absolute', top: 8, left: 8 }}>
            <Pill tone="mint">{badge}</Pill>
          </View>
        ) : null}
      </View>
      <Body size="small" weight="semibold" numberOfLines={1} style={{ marginTop: 8 }}>
        {item.name}
      </Body>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
        {subtitle ? (
          <Body size="caption" tone="dim" numberOfLines={1} style={{ flexShrink: 1 }}>
            {subtitle}
          </Body>
        ) : null}
        <Money value={num(item.price)} size={12} />
      </View>
    </Pressable>
  );
}

/** Ligne de panier avec le pas de quantité intégré. */
export function CartRow({
  name,
  vendor,
  price,
  qty,
  img,
  onInc,
  onDec,
}: {
  name: string;
  vendor?: string;
  price: number;
  qty: number;
  img?: string;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: radius.lg,
        backgroundColor: surface.soot,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: line.hair,
      }}
    >
      <Image
        source={{ uri: resolveImageUrl(img) }}
        placeholder={BLUR}
        contentFit="cover"
        style={{ width: 62, height: 62, borderRadius: radius.md, backgroundColor: surface.smoke }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Body size="small" weight="semibold" numberOfLines={1}>
          {name}
        </Body>
        {vendor ? (
          <Body size="caption" tone="dim" numberOfLines={1}>
            {vendor}
          </Body>
        ) : null}
        <Money value={price * qty} size={14} style={{ marginTop: 5 }} />
      </View>
      <Stepper qty={qty} onInc={onInc} onDec={onDec} />
    </View>
  );
}

export function Stepper({
  qty,
  onInc,
  onDec,
  size = 34,
}: {
  qty: number;
  onInc: () => void;
  onDec: () => void;
  size?: number;
}) {
  const btn = (glyph: string, onPress: () => void, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radius.sm,
        backgroundColor: surface.smoke,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Glyph name={glyph} size={size * 0.45} color={palette.bone} />
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center' }}>
      {btn('minus', onDec, 'Retirer un')}
      <Body size="small" style={{ width: 26, textAlign: 'center' }}>
        {qty}
      </Body>
      {btn('plus', onInc, 'Ajouter un')}
    </View>
  );
}

/** Ligne de total. `accent` la passe en vert pour les remises. */
export function TotalRow({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'discount' | 'total';
}) {
  if (tone === 'total') {
    return (
      <View>
        <Hairline style={{ marginVertical: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Display size="h3">Total</Display>
          <View style={{ flex: 1 }} />
          <Money value={value} size={24} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Body size="small" tone={tone === 'discount' ? 'mint' : 'fog'}>
        {label}
      </Body>
      <Money value={tone === 'discount' ? -Math.abs(value) : value} size={13} tone={tone === 'discount' ? 'mint' : 'bone'} />
    </View>
  );
}
