import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { accent, gradients, line, radius, shadows, text as palette } from '../../theme';
import { hapticLight } from '../../lib/haptics';
import { Sweep } from './Motion';
import { Display, Money } from './Type';

/**
 * L'action principale. Un seul par écran — c'est la règle qui fait
 * que l'œil sait toujours où aller, et donc que le client commande.
 *
 * Le halo orange (`shadows.emberGlow`) et le balayage de lumière sont
 * réservés à ce bouton : rien d'autre dans l'app ne brille.
 */
export function EmberButton({
  label,
  price,
  leading,
  onPress,
  disabled,
  loading,
  style,
  sweep = true,
}: {
  label: string;
  price?: number;
  leading?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  sweep?: boolean;
}) {
  const s = useRef(new Animated.Value(1)).current;

  const press = (to: number) =>
    Animated.spring(s, { toValue: to, friction: 6, tension: 220, useNativeDriver: true }).start();

  const inert = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale: s }] }, !inert && shadows.emberGlow, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!inert }}
        disabled={inert}
        onPressIn={() => press(0.975)}
        onPressOut={() => press(1)}
        onPress={() => {
          void hapticLight();
          onPress();
        }}
        style={{ borderRadius: radius.lg, overflow: 'hidden', opacity: disabled ? 0.4 : 1 }}
      >
        <LinearGradient
          colors={gradients.cta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            paddingHorizontal: 22,
            paddingVertical: 17,
          }}
        >
          {sweep && !inert ? <Sweep /> : null}

          {loading ? (
            <ActivityIndicator color={palette.onEmber} />
          ) : (
            <>
              {leading}
              <Display size="h3" tone="void">
                {label}
              </Display>
              {price != null ? (
                <View style={{ marginLeft: 'auto' }}>
                  <Money value={price} size={14} tone="void" />
                </View>
              ) : null}
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/** Action secondaire : contour seulement, aucune lumière. */
export function OutlineButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: pressed ? accent.ember : line.soft,
          paddingVertical: 16,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Display size="h3" tone="fog">
        {label}
      </Display>
    </Pressable>
  );
}
