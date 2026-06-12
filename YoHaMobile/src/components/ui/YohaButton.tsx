import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { hapticLight } from '../../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

type Variant = 'primary' | 'ghost' | 'dark' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'md' | 'lg';
};

export function YohaButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
  textStyle,
  size = 'lg',
}: Props) {
  const busy = disabled || loading;
  const height = size === 'lg' ? 58 : 48;

  const handlePress = () => {
    if (busy) return;
    hapticLight();
    onPress();
  };

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={busy}
        style={({ pressed }) => [
          styles.ghost,
          { height },
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={brand[600]} />
        ) : (
          <Text style={[styles.ghostText, textStyle]}>{title}</Text>
        )}
      </Pressable>
    );
  }

  if (variant === 'dark') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={busy}
        style={({ pressed }) => [
          styles.dark,
          { height },
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.primaryText, textStyle]}>{title}</Text>
        )}
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={busy}
        style={({ pressed }) => [
          styles.danger,
          { height },
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.primaryText, textStyle]}>{title}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={busy}
      style={({ pressed }) => [busy && styles.disabled, pressed && !busy && styles.pressed, style]}
    >
      <LinearGradient
        colors={[...gradients.cta]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.primary, { height }, shadows.glow]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.primaryText, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    borderRadius: radius.lg,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.extrabold,
    letterSpacing: 0.3,
  },
  ghost: {
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1.5,
    borderColor: ink[200],
  },
  ghostText: { color: ink[700], fontSize: 15, fontFamily: fonts.bold },
  dark: {
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ink[900],
  },
  danger: {
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.92 },
});
