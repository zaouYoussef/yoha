import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { MenuItem, Restaurant, ordersApi } from '../../lib/api';
import { formatMad } from '../../lib/constants';
import { hapticLight, hapticSuccess } from '../../lib/haptics';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';
import { getStoredDeliveryDetails, DeliveryDetails } from '../../lib/deliveryDetails';
import { addGuestOrderId } from '../../lib/guestOrders';
import { subscribeOrdersPush } from '../../lib/pushRegistration';

type Props = {
  restaurants: Restaurant[];
};

export const CraveRoulette = React.memo(function CraveRoulette({ restaurants }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<{ item: MenuItem; restaurant: Restaurant } | null>(null);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);

  const { addItem, clear } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [storedDetails, setStoredDetails] = useState<DeliveryDetails | null>(null);
  const [expressLoading, setExpressLoading] = useState(false);

  useEffect(() => {
    async function checkDetails() {
      const details = await getStoredDeliveryDetails();
      if (details && details.name?.trim() && details.address?.trim() && details.phone?.trim()) {
        setStoredDetails(details);
      }
    }
    if (modalVisible) {
      checkDetails();
    }
  }, [modalVisible]);

  const handleExpressOrder = async () => {
    if (!winner || !storedDetails) return;
    const price = Number(winner.item.price);

    // Check minimum order rule (70 DH)
    if (price < 70) {
      addItem({
        id: winner.item.id,
        name: winner.item.name,
        price: price,
        img: winner.item.img,
        restaurantId: winner.restaurant.slug,
        restaurantName: winner.restaurant.name,
      }, 1);
      hapticSuccess();
      showToast(
        'Ajouté au panier ! 🛒',
        `Minimum 70 DH requis. Nous avons ajouté ${winner.item.name}. Ajoutez-en plus pour commander !`,
        '⚠️'
      );
      setModalVisible(false);
      return;
    }

    setExpressLoading(true);
    try {
      const fullAddress = storedDetails.floor?.trim()
        ? `${storedDetails.address.trim()} — ${storedDetails.floor.trim()}`
        : storedDetails.address.trim();

      const order = await ordersApi.checkout({
        items: [{
          menu_item_id: winner.item.id,
          restaurant_slug: winner.restaurant.slug,
          quantity: 1,
        }],
        customer_name: storedDetails.name.trim(),
        customer_email: storedDetails.email?.trim() || undefined,
        customer_address: fullAddress,
        customer_phone: storedDetails.phone.trim(),
        delivery_instructions: storedDetails.notes?.trim() || '',
        payment_method: storedDetails.payment,
      });

      if (!user && order.id) await addGuestOrderId(String(order.id));
      if (order.id) await subscribeOrdersPush([String(order.id)]);

      clear();
      hapticSuccess();
      showToast('Commande validée ! 🚀', `${winner.item.name} arrive chaud !`, '🎉');
      setModalVisible(false);
      router.replace(`/(client)/order/${order.id}?justPlaced=true` as never);
    } catch (e) {
      showToast('Erreur Express', e instanceof Error ? e.message : 'Commande impossible', '❌');
    } finally {
      setExpressLoading(false);
    }
  };

  const scale = useSharedValue(1);

  // Extract all available items from open restaurants
  const allAvailableItems = React.useMemo(() => {
    const list: { item: MenuItem; restaurant: Restaurant }[] = [];
    restaurants.forEach((resto) => {
      if (resto.isOpen !== false) {
        resto.menu?.forEach((cat) => {
          cat.items?.forEach((item) => {
            if (item.isAvailable !== false) {
              list.push({ item, restaurant: resto });
            }
          });
        });
      }
    });

    // Fallback if the list API does not return nested menus
    if (list.length === 0 && restaurants.length > 0) {
      const FALLBACK_ITEMS = [
        {
          slug: 'pizza-detroit-tanger',
          item: { id: 'fallback-p1', name: 'Detroit Double Cheese Pizza 🍕', price: 55, desc: 'Pâte croustillante à la Detroit, double mozzarella, sauce tomate maison et basilic frais.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'pizza-detroit-tanger',
          item: { id: 'fallback-p2', name: 'Pizza Pepperoni Miel Épicé 🌶️', price: 65, desc: 'Pepperoni croustillant, mozzarella fondante et filet de miel pimenté maison.', img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'the-burger-boutique',
          item: { id: 'fallback-b1', name: 'Le Classic Smash Burger 🍔', price: 49, desc: 'Deux steaks smashed pur bœuf, cheddar fondant, cornichons, oignons et sauce secrète.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'the-burger-boutique',
          item: { id: 'fallback-b2', name: 'Crispy Chicken Burger 🍗', price: 52, desc: 'Poulet frit ultra croustillant, salade iceberg, cheddar et mayonnaise maison.', img: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'new-school-tacos-tanger',
          item: { id: 'fallback-t1', name: 'Tacos Double Viande 🌮', price: 38, desc: 'Viande hachée & poulet mariné, frites croustillantes, sauce fromagère secrète.', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'new-school-tacos-tanger',
          item: { id: 'fallback-t2', name: 'Tacos Gratiné Mozza 🧀', price: 42, desc: 'Poulet mariné gratiné à la mozzarella dorée au four.', img: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'soju-sushi-tanger',
          item: { id: 'fallback-s1', name: 'Plateau Signature 12 Pcs 🍣', price: 79, desc: '4 Maki Saumon, 4 California Roll Poulet, 4 Spring Salmon-Avocat.', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'soju-sushi-tanger',
          item: { id: 'fallback-s2', name: 'Crispy Salmon Roll 🍣', price: 65, desc: 'Roll croustillant frit avec tartare de saumon frais et sauce Teriyaki.', img: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'healthy-bowl',
          item: { id: 'fallback-h1', name: 'Poké Bowl Poulet Mangue 🥑', price: 58, desc: 'Poulet émincé, mangue fraîche, avocat, riz de sushis et sauce sésame soja.', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'healthy-bowl',
          item: { id: 'fallback-h2', name: 'Salade de Chèvre Chaud 🥗', price: 45, desc: 'Fromage de chèvre rôti au miel, noix croquantes, pommes vertes et pousses d\'épinards.', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'medeat',
          item: { id: 'fallback-m1', name: 'Bowl Protéiné Cardio 🏥', price: 55, desc: 'Steak de dinde grillé, patates douces rôties, brocolis vapeur et quinoa biologique.', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true },
        },
        {
          slug: 'bomos-kebab',
          item: { id: 'fallback-k1', name: 'Kebab Berlin Style 🥙', price: 35, desc: 'Pain pita chaud, fines tranches de döner kebab grillé, sauce blanche à l\'ail et légumes frais.', img: 'https://images.unsplash.com/photo-1561651823-34fed0225408?w=500&auto=format&fit=crop', isAvailable: true },
        },
      ];

      FALLBACK_ITEMS.forEach((fb) => {
        const matchingResto = restaurants.find((r) => r.slug === fb.slug);
        if (matchingResto && matchingResto.isOpen !== false) {
          list.push({ item: fb.item, restaurant: matchingResto });
        }
      });
    }

    return list;
  }, [restaurants]);

  const handleStartSpin = () => {
    if (allAvailableItems.length === 0) {
      showToast('Aucun plat disponible', 'Revenez aux heures d’ouverture des restaurants !', '🔒');
      return;
    }
    hapticSuccess();
    setWinner(null);
    setModalVisible(true);
    spin();
  };

  const spin = () => {
    setSpinning(true);
    setWinner(null);
    let ticks = 0;
    const maxTicks = 20; // Number of cycles
    let delay = 60; // Initial delay in ms

    const runTick = () => {
      ticks++;
      const randomIndex = Math.floor(Math.random() * allAvailableItems.length);
      const chosen = allAvailableItems[randomIndex];
      setActiveItem(chosen.item);
      hapticLight();

      if (ticks < maxTicks) {
        // Slowly increase delay to simulate deceleration
        if (ticks > 12) delay += 40;
        else if (ticks > 6) delay += 15;
        setTimeout(runTick, delay);
      } else {
        // Spin finished
        hapticSuccess();
        setWinner(chosen);
        setSpinning(false);
      }
    };

    setTimeout(runTick, delay);
  };

  const handleAddToCart = () => {
    if (!winner) return;
    addItem({
      id: winner.item.id,
      name: winner.item.name,
      price: Number(winner.item.price),
      img: winner.item.img,
      restaurantId: winner.restaurant.slug,
      restaurantName: winner.restaurant.name,
    }, 1);
    hapticSuccess();
    showToast('Ajouté au panier !', `${winner.item.name} a été ajouté.`, '🎉');
    setModalVisible(false);
  };

  const pressAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <View style={styles.container}>
      <Animated.View style={pressAnim}>
        <Pressable
          onPress={handleStartSpin}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={['#4c1d95', '#7c3aed', '#ec4899']}
            style={[styles.banner, shadows.glow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerEmoji}>🎰</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Roulette Gourmande YoHa</Text>
                <Text style={styles.bannerSub}>Tu ne sais pas quoi choisir ? Laisse le destin décider !</Text>
              </View>
            </View>
            <View style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Lancer 🎡</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !spinning && setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, shadows.float]}>
            <LinearGradient
              colors={['#1e1b4b', '#311042']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            <Text style={styles.modalHeaderTitle}>🎲 DESTIN CULINAIRE</Text>

            <View style={styles.spinnerWrap}>
              {spinning ? (
                <View style={styles.spinCard}>
                  <Text style={styles.spinningEmoji}>🍳</Text>
                  <Text style={styles.spinningText} numberOfLines={1}>
                    {activeItem?.name || 'Recherche...'}
                  </Text>
                  <Text style={styles.spinningSub}>Sélection en cours...</Text>
                </View>
              ) : winner ? (
                <View style={styles.winnerCard}>
                  <View style={styles.winnerImageWrap}>
                    {winner.item.img ? (
                      <Image source={{ uri: winner.item.img }} style={styles.winnerImg} contentFit="cover" />
                    ) : (
                      <View style={styles.winnerImgPlaceholder}>
                        <Text style={{ fontSize: 50 }}>🍕</Text>
                      </View>
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(30,27,75,0.85)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.winnerRestoTag}>
                      <Text style={styles.winnerRestoText} numberOfLines={1}>
                        🏫 {winner.restaurant.name}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.winnerBody}>
                    <Text style={styles.winnerName} numberOfLines={1}>{winner.item.name}</Text>
                    <Text style={styles.winnerPrice}>{formatMad(Number(winner.item.price))}</Text>
                    {winner.item.desc ? (
                      <Text style={styles.winnerDesc} numberOfLines={2}>
                        {winner.item.desc}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.modalFooter}>
              {winner && !spinning ? (
                <View style={{ width: '100%', gap: 10 }}>
                  {storedDetails ? (
                    <Pressable onPress={handleExpressOrder} disabled={expressLoading} style={{ width: '100%' }}>
                      <LinearGradient
                        colors={expressLoading ? ['#6b7280', '#4b5563'] : ['#b91c1c', '#ea580c', '#f97316']}
                        style={[styles.expressBtn, shadows.glowOrange]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.expressBtnText}>
                          {expressLoading ? 'Validation...' : '🚀 Commande Express (1-Clic)'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  ) : null}

                  <View style={styles.actionRow}>
                    <Pressable onPress={handleAddToCart} style={{ flex: 1 }}>
                      <LinearGradient
                        colors={[...gradients.cta]}
                        style={styles.actionBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.actionBtnText}>Ajouter au panier 🛒</Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable onPress={spin} style={styles.retryBtn}>
                      <Text style={styles.retryBtnText}>Rejouer 🔄</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {!spinning ? (
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>Fermer</Text>
                </Pressable>
              ) : (
                <Text style={styles.waitText}>La cuisine chauffe le spinner... 🔥</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: radius.xl + 2,
    gap: 12,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bannerEmoji: { fontSize: 28 },
  bannerTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: '#fff' },
  bannerSub: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.76)', marginTop: 3 },
  bannerBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBtnText: { fontFamily: fonts.bold, fontSize: 12, color: '#6d28d9' },

  // Modal styling
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 32,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalHeaderTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: brand[400],
    letterSpacing: 2,
    marginBottom: 20,
  },
  spinnerWrap: {
    width: '100%',
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinningEmoji: { fontSize: 64, marginBottom: 16 },
  spinningText: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    maxWidth: 240,
  },
  spinningSub: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  winnerCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    paddingBottom: 16,
  },
  winnerImageWrap: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  winnerImg: { width: '100%', height: '100%' },
  winnerImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerRestoTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: brand[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    maxWidth: '90%',
  },
  winnerRestoText: { color: '#fff', fontFamily: fonts.bold, fontSize: 10 },
  winnerBody: {
    paddingTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  winnerName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  winnerPrice: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: brand[400],
    marginTop: 4,
  },
  winnerDesc: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 15,
  },
  modalFooter: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 14 },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 13 },
  closeBtn: {
    paddingVertical: 8,
  },
  closeBtnText: {
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  waitText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  expressBtn: {
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  expressBtnText: {
    color: '#fff',
    fontFamily: fonts.extrabold,
    fontSize: 14,
  },
});
