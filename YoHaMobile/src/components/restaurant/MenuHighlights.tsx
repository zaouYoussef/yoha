import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MenuItem } from '../../lib/api';
import { formatMad } from '../../lib/constants';
import { hapticLight } from '../../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export function MenuHighlights({
  items,
  onPress,
  onAdd,
  orderingDisabled = false,
}: {
  items: MenuItem[];
  onPress: (item: MenuItem) => void;
  onAdd: (item: MenuItem) => void;
  orderingDisabled?: boolean;
}) {
  if (items.length < 2) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>🔥 Les plus commandés</Text>
        <LinearGradient colors={[brand[400], '#ec4899']} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.badgeText}>TOP</Text>
        </LinearGradient>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => { onPress(item); hapticLight(); }} style={[styles.card, shadows.float]}>
            {item.img ? (
              <Image source={{ uri: item.img }} style={styles.img} contentFit="cover" />
            ) : (
              <LinearGradient colors={[brand[100], brand[50]]} style={[styles.img, styles.imgPh]}>
                <Text style={{ fontSize: 28 }}>🍽️</Text>
              </LinearGradient>
            )}
            <LinearGradient colors={['transparent', 'rgba(15,23,42,0.85)']} style={styles.imgGrad} />
            <View style={styles.cardBody}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <View style={styles.footer}>
                <Text style={styles.price}>{formatMad(Number(item.price))}</Text>
                <Pressable
                  onPress={() => { if (!orderingDisabled) onAdd(item); }}
                  hitSlop={8}
                  disabled={orderingDisabled}
                >
                  <LinearGradient
                    colors={orderingDisabled ? [ink[300], ink[400]] : [...gradients.cta]}
                    style={[styles.addBtn, orderingDisabled && styles.addBtnOff]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.addText}>{orderingDisabled ? '—' : '+'}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 22, color: ink[900], letterSpacing: -0.5 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 10, color: '#fff', letterSpacing: 0.8 },
  row: { gap: 12, paddingRight: 4 },
  card: {
    width: 160,
    height: 200,
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  img: { width: '100%', height: '100%', position: 'absolute' },
  imgPh: { alignItems: 'center', justifyContent: 'center' },
  imgGrad: { ...StyleSheet.absoluteFill },
  cardBody: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: '#fff', lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { fontFamily: fonts.extrabold, fontSize: 14, color: '#fdba74' },
  addBtn: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addBtnOff: { opacity: 0.55 },
  addText: { color: '#fff', fontSize: 20, fontFamily: fonts.bold, marginTop: -2 },
});
