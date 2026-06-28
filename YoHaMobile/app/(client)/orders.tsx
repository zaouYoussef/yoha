import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '../../src/components/animations/FadeInView';
import { PremiumBackground } from '../../src/components/PremiumBackground';
import { LiveOrderChip } from '../../src/components/LiveOrderChip';
import { OrderCard } from '../../src/components/OrderCard';
import { StickyCartBar } from '../../src/components/StickyCartBar';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/contexts/CartContext';
import { useToast } from '../../src/contexts/ToastContext';
import { useActiveOrder } from '../../src/hooks/useActiveOrder';
import { Order, ordersApi } from '../../src/lib/api';
import { orderToCartItems } from '../../src/lib/reorder';
import { getGuestOrderIds } from '../../src/lib/guestOrders';
import { hapticSuccess } from '../../src/lib/haptics';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { brand, gradients, ink } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

export default function ClientOrders() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { replaceItems } = useCart();
  const { showToast } = useToast();
  const { activeOrder } = useActiveOrder();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { scrollBottomPadding } = useLayoutChrome();

  const load = useCallback(async () => {
    setError('');
    try {
      if (user) {
        const data = await ordersApi.list();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        const ids = await getGuestOrderIds();
        const data = await ordersApi.guestList(ids);
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleReorder = (order: Order) => {
    const lines = orderToCartItems(order);
    if (!lines.length) {
      showToast('Panier vide', 'Cette commande ne contient pas d’articles.');
      return;
    }
    const cartLines = lines.map((l) => {
      const qty = order.items?.find((i) => String(i.id) === l.id)?.qty || 1;
      return { ...l, qty };
    });
    replaceItems(cartLines);
    showToast('Panier rempli !', 'Commandez à nouveau en un clic', '↻');
    router.push('/(client)/cart' as never);
    hapticSuccess();
  };

  if (!user && !loading && orders.length === 0) {
    return (
      <PremiumBackground>
        <View style={[styles.guest, { paddingTop: insets.top + 48, paddingBottom: scrollBottomPadding }]}>
          <FadeInView variant="zoom">
            <LinearGradient colors={[...gradients.primary]} style={styles.guestIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: 40 }}>📦</Text>
            </LinearGradient>
          </FadeInView>
          <FadeInView delay={120}>
            <Text style={styles.guestTitle}>Vos commandes</Text>
            <Text style={styles.guestSub}>
              Commandez en invité — vos commandes apparaîtront ici automatiquement.
            </Text>
          </FadeInView>
          <FadeInView delay={240} style={{ width: '100%', paddingHorizontal: 24, marginTop: 28 }}>
            <YohaButton title="Commander maintenant" onPress={() => router.replace('/(client)' as never)} />
            <YohaButton title="Se connecter" variant="ghost" onPress={() => router.push('/auth/login' as never)} style={{ marginTop: 12 }} />
          </FadeInView>
        </View>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      {activeOrder ? <LiveOrderChip order={activeOrder} /> : null}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (activeOrder ? 72 : 16), paddingBottom: scrollBottomPadding }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={brand[500]} />}
      >
        <FadeInView>
          <Text style={styles.title}>{user ? 'Mes commandes' : 'Commandes invité'}</Text>
        </FadeInView>

        {loading && orders.length === 0 ? <ActivityIndicator color={brand[500]} style={{ marginTop: 40 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && orders.length === 0 && user ? (
          <Text style={styles.empty}>Aucune commande pour le moment</Text>
        ) : null}

        {orders.map((o, i) => (
          <FadeInView key={o.id} delay={i * 80}>
            <Pressable onPress={() => router.push(`/(client)/order/${o.id}` as never)}>
              <OrderCard order={o} onReorder={handleReorder} />
            </Pressable>
          </FadeInView>
        ))}
      </ScrollView>
      <StickyCartBar />
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontFamily: fonts.display, fontSize: 28, color: ink[900], marginBottom: 20 },
  error: { color: '#b91c1c', fontFamily: fonts.medium },
  empty: { color: ink[500], fontFamily: fonts.medium, marginTop: 24, textAlign: 'center' },
  guest: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  guestIcon: { width: 96, height: 96, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  guestTitle: { marginTop: 24, fontFamily: fonts.display, fontSize: 26, color: ink[900] },
  guestSub: { marginTop: 12, fontFamily: fonts.medium, fontSize: 15, color: ink[500], textAlign: 'center', lineHeight: 22 },
});
