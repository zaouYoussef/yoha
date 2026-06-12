import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '../../src/components/animations/FadeInView';
import { PremiumBackground } from '../../src/components/PremiumBackground';
import { CheckoutSteps } from '../../src/components/ui/CheckoutSteps';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { useCart } from '../../src/contexts/CartContext';
import { formatMad, getServiceFeeMad } from '../../src/lib/constants';
import { hapticLight } from '../../src/lib/haptics';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { brand, gradients, ink, radius, shadows } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { footerBottomPadding, scrollBottomPadding, tabBarHeight } = useLayoutChrome();
  const { items, subtotal, updateQty, removeItem, count } = useCart();
  const serviceFee = getServiceFeeMad(subtotal);
  const total = subtotal + serviceFee;

  if (count === 0) {
    return (
      <PremiumBackground>
        <View style={[styles.empty, { paddingTop: insets.top + 80, paddingBottom: tabBarHeight + 24 }]}>
          <FadeInView variant="zoom">
            <LinearGradient colors={[...gradients.cta]} style={styles.emptyIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: 48 }}>🛒</Text>
            </LinearGradient>
            <Text style={styles.emptyTitle}>Ton panier t'attend</Text>
            <Text style={styles.emptySub}>Des plats incroyables à quelques taps — livraison offerte ✨</Text>
          </FadeInView>
          <FadeInView delay={200} style={{ alignSelf: 'stretch', marginTop: 32, paddingHorizontal: 8 }}>
            <YohaButton title="Découvrir les restos →" onPress={() => router.push('/(client)' as never)} />
          </FadeInView>
        </View>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: scrollBottomPadding + 72 }]}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <Text style={styles.title}>Mon panier</Text>
          <Text style={styles.sub}>🍽️ {items[0]?.restaurantName}</Text>
        </FadeInView>

        <FadeInView delay={60}>
          <CheckoutSteps current={1} />
        </FadeInView>

        {items.map((line, i) => (
          <FadeInView key={line.id} delay={100 + i * 50} variant="left">
            <View style={[styles.line, shadows.float]}>
              {line.img ? (
                <Image source={{ uri: line.img }} style={styles.thumb} contentFit="cover" />
              ) : (
                <LinearGradient colors={[brand[100], brand[50]]} style={[styles.thumb, styles.thumbPh]}>
                  <Text style={{ fontSize: 26 }}>🍽️</Text>
                </LinearGradient>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName}>{line.name}</Text>
                <Text style={styles.linePrice}>{formatMad(line.price * line.qty)}</Text>
                <View style={styles.qtyRow}>
                  <Pressable
                    onPress={() => { hapticLight(); updateQty(line.id, line.qty - 1); }}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{line.qty}</Text>
                  <Pressable
                    onPress={() => { hapticLight(); updateQty(line.id, line.qty + 1); }}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                  <Pressable onPress={() => removeItem(line.id)} style={{ marginLeft: 'auto' }}>
                    <Text style={styles.remove}>Retirer</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </FadeInView>
        ))}

        <FadeInView delay={280}>
          <LinearGradient colors={['rgba(255,255,255,0.98)', brand[50]]} style={[styles.summary, shadows.soft]}>
            <Row label="Sous-total" value={formatMad(subtotal)} />
            <Row label="Frais de service" value={formatMad(serviceFee)} />
            <Row label="Livraison" value="Offerte ✨" />
            <View style={styles.divider} />
            <Row label="Total" value={formatMad(total)} bold />
          </LinearGradient>
        </FadeInView>

        <FadeInView delay={340}>
          <View style={styles.trust}>
            <Text style={styles.trustItem}>🔒 Paiement sécurisé</Text>
            <Text style={styles.trustItem}>🛵 {formatMad(total)} à la livraison</Text>
          </View>
        </FadeInView>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
        <YohaButton
          title={`Commander · ${formatMad(total)} →`}
          onPress={() => router.push('/(client)/checkout' as never)}
        />
      </View>
    </PremiumBackground>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontFamily: fonts.display, fontSize: 30, color: ink[900], letterSpacing: -0.8 },
  sub: { fontFamily: fonts.medium, color: ink[500], marginBottom: 8, marginTop: 4, fontSize: 15 },
  line: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  thumb: { width: 88, height: 88, borderRadius: radius.lg },
  thumbPh: { alignItems: 'center', justifyContent: 'center' },
  lineName: { fontSize: 17, fontFamily: fonts.bold, color: ink[900] },
  linePrice: { marginTop: 4, fontSize: 16, fontFamily: fonts.extrabold, color: brand[600] },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontFamily: fonts.bold, color: ink[700] },
  qty: { fontSize: 18, fontFamily: fonts.extrabold, minWidth: 28, textAlign: 'center' },
  remove: { color: '#ef4444', fontFamily: fonts.semibold, fontSize: 13 },
  summary: {
    borderRadius: radius.xl,
    padding: 22,
    marginTop: 8,
    borderWidth: 1,
    borderColor: brand[100],
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rowLabel: { color: ink[500], fontSize: 14, fontFamily: fonts.medium },
  rowValue: { color: ink[800], fontSize: 14, fontFamily: fonts.semibold },
  bold: { fontFamily: fonts.extrabold, color: ink[900], fontSize: 20 },
  divider: { height: 1, backgroundColor: ink[100], marginVertical: 10 },
  trust: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingVertical: 12 },
  trustItem: { fontFamily: fonts.semibold, fontSize: 12, color: ink[500] },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  empty: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },
  emptyIcon: {
    width: 110,
    height: 110,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  emptyTitle: { marginTop: 24, fontSize: 28, fontFamily: fonts.display, color: ink[900], textAlign: 'center' },
  emptySub: { marginTop: 12, color: ink[500], textAlign: 'center', fontFamily: fonts.medium, lineHeight: 22, fontSize: 15 },
});
