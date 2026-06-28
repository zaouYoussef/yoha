import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 50 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 16, stiffness: 240 });
  };

  const btnStyle = [busy && styles.disabled, animStyle, style] as any;
  const txtStyle = variant === 'ghost' ? styles.ghostText : styles.primaryText;

  const content = loading ? (
    <ActivityIndicator color={variant === 'ghost' ? brand[600] : '#fff'} />
  ) : (
    <Text style={[txtStyle, textStyle]}>{title}</Text>
  );

  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={busy}
        style={[styles.ghost, { height }, btnStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  if (variant === 'dark') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={busy}
        style={[styles.dark, { height }, btnStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  if (variant === 'danger') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={busy}
        style={[styles.danger, { height }, btnStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={busy}
      style={[btnStyle]}
    >
      <LinearGradient
        colors={[...gradients.cta]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.primary, { height }, shadows.glow]}
      >
        {content}
      </LinearGradient>
    </AnimatedPressable>
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
});
