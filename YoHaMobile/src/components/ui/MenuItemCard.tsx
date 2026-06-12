import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { AddBurst } from '../animations/AddBurst';
import { MenuItem } from '../../lib/api';
import { formatMad } from '../../lib/constants';
import { hapticLight } from '../../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MenuItemCard({
  item,
  onAdd,
  onPress,
  orderingDisabled = false,
}: {
  item: MenuItem;
  onAdd: () => void;
  onPress?: () => void;
  orderingDisabled?: boolean;
}) {
  const [burst, setBurst] = useState(0);
  const bump = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const unavailable = item.isAvailable === false || orderingDisabled;

  const handleAdd = () => {
    if (unavailable) return;
    bump.value = withSequence(withSpring(1.28, { damping: 6 }), withSpring(1));
    setBurst((b) => b + 1);
    onAdd();
  };

  return (
    <AnimatedPressable
      onPress={() => { hapticLight(); onPress?.(); }}
      style={[styles.card, shadows.soft, unavailable && styles.cardOff]}
    >
      <View style={styles.imgWrap}>
        {item.img ? (
          <Image source={{ uri: item.img }} style={styles.img} contentFit="cover" transition={280} />
        ) : (
          <LinearGradient colors={[brand[100], brand[50]]} style={[styles.img, styles.imgPh]}>
            <Text style={{ fontSize: 28 }}>🍽️</Text>
          </LinearGradient>
        )}
        {unavailable ? (
          <View style={styles.unavail}>
            <Text style={styles.unavailText}>
              {orderingDisabled && item.isAvailable !== false ? 'Fermé' : 'Épuisé'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.desc ? (
          <Text style={styles.desc} numberOfLines={2}>{item.desc}</Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.price}>{formatMad(Number(item.price))}</Text>
          {!unavailable ? (
            <View style={styles.addWrap}>
              <AddBurst trigger={burst} />
              <Animated.View style={btnStyle}>
                <Pressable onPress={handleAdd} hitSlop={6}>
                  <LinearGradient colors={[...gradients.cta]} style={styles.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.addText}>+</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ink[100],
  },
  cardOff: { opacity: 0.65 },
  imgWrap: { position: 'relative' },
  img: { width: 118, height: 118 },
  imgPh: { alignItems: 'center', justifyContent: 'center' },
  unavail: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailText: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },
  body: { flex: 1, padding: 14, justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 16, color: ink[900], letterSpacing: -0.3, lineHeight: 20 },
  desc: { marginTop: 4, fontFamily: fonts.medium, fontSize: 12, color: ink[500], lineHeight: 17 },
  footer: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontFamily: fonts.extrabold, fontSize: 17, color: brand[600] },
  addWrap: { position: 'relative' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowOrange,
  },
  addText: { color: '#fff', fontSize: 24, fontFamily: fonts.bold, marginTop: -2 },
});
