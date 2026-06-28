import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '../../src/components/animations/FadeInView';
import { PremiumBackground } from '../../src/components/PremiumBackground';
import { CheckoutSteps } from '../../src/components/ui/CheckoutSteps';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { useCart } from '../../src/contexts/CartContext';
import { formatMad, getServiceFeeMad, DELIVERY_FEE_DH } from '../../src/lib/constants';
import { hapticLight, hapticSuccess } from '../../src/lib/haptics';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { brand, gradients, ink, radius, shadows } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';
import { getStoredDeliveryDetails, DeliveryDetails } from '../../src/lib/deliveryDetails';
import { ordersApi, restaurantsApi } from '../../src/lib/api';
import { addGuestOrderId } from '../../src/lib/guestOrders';
import { subscribeOrdersPush } from '../../src/lib/pushRegistration';
import { useToast } from '../../src/contexts/ToastContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { ADDRESS_PRESETS } from '../../src/lib/addresses';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { footerBottomPadding, scrollBottomPadding, tabBarHeight } = useLayoutChrome();
  const { items, subtotal, updateQty, removeItem, count, clear, restaurantId, addItem, replaceItems } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isCustom = items.some(i => (i as any).isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes((i as any).restaurantCuisine));
  const customItems = items.filter(i => (i as any).isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes((i as any).restaurantCuisine));
  const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
  const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;
  const total = subtotal + deliveryFee;
  const isLimitBlocked = !isCustom && subtotal < 70;

  const [storedDetails, setStoredDetails] = useState<DeliveryDetails | null>(null);
  const [expressLoading, setExpressLoading] = useState(false);
  const [expressError, setExpressError] = useState('');
  const [restaurantData, setRestaurantData] = useState<any>(null);

  useEffect(() => {
    async function checkDetails() {
      const details = await getStoredDeliveryDetails();
      if (details && details.name?.trim() && details.address?.trim() && details.phone?.trim()) {
        setStoredDetails(details);
      }
    }
    checkDetails();
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      setRestaurantData(null);
      return;
    }
    (async () => {
      try {
        const data = await restaurantsApi.get(restaurantId);
        setRestaurantData(data);
      } catch (e) {
        console.error('Error fetching restaurant for upsells', e);
      }
    })();
  }, [restaurantId]);

  const recommendations = useMemo(() => {
    if (!restaurantData || !restaurantData.menu) return [];
    const cartItemIds = new Set(items.map((i) => i.id));
    const allItems: any[] = [];
    
    restaurantData.menu.forEach((cat: any) => {
      const catName = cat.name.toLowerCase();
      const isUpsellCat = catName.includes('boisson') ||
                          catName.includes('dessert') ||
                          catName.includes('accompagnement') ||
                          catName.includes('supplément') ||
                          catName.includes('entrée') ||
                          catName.includes('side') ||
                          catName.includes('drink');

      cat.items.forEach((item: any) => {
        if (item.isAvailable !== false) {
          const inCart = cartItemIds.has(item.id);
          if (!inCart) {
            let score = 0;
            if (isUpsellCat) score += 10;
            const nameLower = item.name.toLowerCase();
            if (
              nameLower.includes('boisson') ||
              nameLower.includes('coca') ||
              nameLower.includes('fanta') ||
              nameLower.includes('sprite') ||
              nameLower.includes('eau') ||
              nameLower.includes('jus') ||
              nameLower.includes('dessert') ||
              nameLower.includes('cookie') ||
              nameLower.includes('muffin') ||
              nameLower.includes('tiramisu') ||
              nameLower.includes('frite') ||
              nameLower.includes('sauce') ||
              nameLower.includes('supplément')
            ) {
              score += 5;
            }
            if (Number(item.price) <= 35) {
              score += 5;
            }
            allItems.push({ item, score, restaurant: restaurantData });
          }
        }
      });
    });

    allItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(a.item.price) - Number(b.item.price);
    });

    return allItems.slice(0, 8);
  }, [restaurantData, items]);

  const handleExpressCheckout = async () => {
    if (!storedDetails) return;
    if (isLimitBlocked) {
      setExpressError('Commande minimale de 70 DH requise.');
      return;
    }
    setExpressLoading(true);
    setExpressError('');
    try {
      const fullAddress = storedDetails.floor?.trim()
        ? `${storedDetails.address.trim()} — ${storedDetails.floor.trim()}`
        : storedDetails.address.trim();

      const order = await ordersApi.checkout({
        items: items.map((i) => ({
          menu_item_id: i.id,
          restaurant_slug: i.restaurantId,
          quantity: i.qty,
          item_name: i.name,
          item_price: i.price,
          restaurant_name: i.restaurantName,
        })),
        customer_name: storedDetails.name.trim(),
        customer_email: storedDetails.email?.trim() || undefined,
        customer_address: fullAddress,
        customer_phone: storedDetails.phone.trim(),
        delivery_instructions: storedDetails.notes?.trim() || '',
        payment_method: storedDetails.payment,
        scheduled_delivery_at: storedDetails.scheduledTime || undefined,
      });

      if (!user && order.id) await addGuestOrderId(String(order.id));
      if (order.id) await subscribeOrdersPush([String(order.id)]);

      clear();
      showToast('Commande validée ! 🚀', 'Votre repas arrive bientôt', '🎉');
      router.replace(`/(client)/order/${order.id}?justPlaced=true` as never);
      hapticSuccess();
    } catch (e) {
      setExpressError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setExpressLoading(false);
    }
  };

  if (count === 0) {
    const categories = [
      { id: 'pizza', label: 'Pizza', emoji: '🍕' },
      { id: 'burger', label: 'Burger', emoji: '🍔' },
      { id: 'tacos', label: 'Tacos', emoji: '🌮' },
      { id: 'healthy', label: 'Healthy', emoji: '🥗' },
      { id: 'dessert', label: 'Dessert', emoji: '🍰' },
    ];

    const navigateToCuisine = (id: string) => {
      router.push({ pathname: '/(client)', params: { filterCuisine: id } } as never);
      hapticLight();
    };

    return (
      <PremiumBackground>
        <ScrollView
          contentContainerStyle={[styles.emptyScroll, { paddingTop: insets.top + 60, paddingBottom: tabBarHeight + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.empty}>
            <FadeInView variant="zoom">
              <LinearGradient colors={[...gradients.cta]} style={styles.emptyIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={{ fontSize: 48 }}>🛒</Text>
              </LinearGradient>
              <Text style={styles.emptyTitle}>Votre panier crie famine ! 😢</Text>
              <Text style={styles.emptySub}>Des burgers croustillants, des pizzas au fromage fondant et des tacos de folie n'attendent que vous pour être dégustés.</Text>
            </FadeInView>

            <FadeInView delay={150} style={{ width: '100%', marginTop: 32 }}>
              <Text style={styles.suggestTitle}>Une envie particulière ? 👇</Text>
              <View style={styles.suggestGrid}>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => navigateToCuisine(c.id)}
                    style={[styles.suggestChip, shadows.soft]}
                  >
                    <Text style={styles.suggestEmoji}>{c.emoji}</Text>
                    <Text style={styles.suggestLabel}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </FadeInView>

            <FadeInView delay={250} style={{ alignSelf: 'stretch', marginTop: 28, paddingHorizontal: 8 }}>
              <YohaButton title="Découvrir tout le catalogue →" onPress={() => router.push('/(client)' as never)} />
            </FadeInView>
          </View>
        </ScrollView>
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
                {(line as any).isCustom ? (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: brand[600], textTransform: 'uppercase', marginBottom: 2 }}>
                      Demande sur-mesure
                    </Text>
                    {(line as any).customDetails?.storeAddress && (
                      <Text style={{ fontSize: 11, color: ink[500], fontFamily: fonts.semibold, marginBottom: 4 }} numberOfLines={1}>
                        Établissement : {(line as any).customDetails.storeName}
                      </Text>
                    )}
                    <TextInput
                      value={(line as any).customDetails?.details || ''}
                      onChangeText={(newDetails) => {
                        const updated = items.map((i) => {
                          if (i.id === line.id) {
                            const customDetails = (i as any).customDetails || {};
                            const storeName = customDetails.storeName || i.restaurantName;
                            const name = customDetails.storeAddress 
                              ? `[${storeName}] ${newDetails.trim()}`
                              : `${i.restaurantName} - ${newDetails.trim()}`;
                            return {
                              ...i,
                              name,
                              customDetails: {
                                ...customDetails,
                                details: newDetails
                              }
                            };
                          }
                          return i;
                        });
                        replaceItems(updated);
                      }}
                      placeholder="Modifier les détails de votre demande..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={2}
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.medium,
                        color: ink[900],
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderWidth: 1,
                        borderColor: ink[200],
                        borderRadius: radius.md,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        textAlignVertical: 'top',
                      }}
                    />
                  </View>
                ) : (
                  <Text style={styles.lineName}>{line.name}</Text>
                )}
                <Text style={styles.linePrice}>
                  {line.price > 0 ? formatMad(line.price * line.qty) : <Text style={{ color: brand[600], fontFamily: fonts.bold }}>Sur ticket</Text>}
                </Text>
                <View style={styles.qtyRow}>
                  <Pressable
                    onPress={() => { updateQty(line.id, line.qty - 1); hapticLight(); }}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{line.qty}</Text>
                  <Pressable
                    onPress={() => { updateQty(line.id, line.qty + 1); hapticLight(); }}
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

        {recommendations.length > 0 ? (
          <FadeInView delay={220}>
            <View style={styles.upsellWrap}>
              <Text style={styles.upsellTitle}>😋 Complétez votre commande</Text>
              <Text style={styles.upsellSub}>Ajoutez un petit plaisir de chez {items[0]?.restaurantName}</Text>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.upsellScroll}
              >
                {recommendations.map(({ item, restaurant }) => (
                  <View key={item.id} style={[styles.upsellCard, shadows.soft]}>
                    {item.img ? (
                      <Image source={{ uri: item.img }} style={styles.upsellImg} contentFit="cover" />
                    ) : (
                      <View style={styles.upsellImgPh}>
                        <Text style={{ fontSize: 24 }}>🍰</Text>
                      </View>
                    )}
                    <View style={styles.upsellInfo}>
                      <Text style={styles.upsellName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.upsellPrice}>{formatMad(Number(item.price))}</Text>
                      <Pressable
                        onPress={() => {
                          addItem({
                            id: item.id,
                            name: item.name,
                            price: Number(item.price),
                            img: item.img,
                            restaurantId: restaurant.slug,
                            restaurantName: restaurant.name,
                          }, 1);
                          hapticLight();
                          showToast('Ajouté ! 🥳', `${item.name} a été ajouté au panier.`, '✓');
                        }}
                        style={styles.upsellAddBtn}
                      >
                        <Text style={styles.upsellAddBtnText}>+ Ajouter</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </FadeInView>
        ) : null}

        {storedDetails ? (
          <FadeInView delay={260}>
            <LinearGradient
              colors={['#1e1b4b', '#2a083d']}
              style={[styles.expressCard, shadows.glow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.expressHeader}>
                <Text style={styles.expressTitle}>⚡ Commande Express 1-Clic</Text>
                <Pressable
                  onPress={() => {
                    router.push('/(client)/checkout' as never);
                    hapticLight();
                  }}
                  style={styles.editExpressBtn}
                >
                  <Text style={styles.editExpressText}>Modifier ⚙️</Text>
                </Pressable>
              </View>
              
              <View style={styles.expressDetailsRow}>
                <Text style={styles.expressEmoji}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expressTextBold} numberOfLines={1}>
                    {storedDetails.addressPreset ? ADDRESS_PRESETS.find(p => p.id === storedDetails.addressPreset)?.icon || '📍' : '📍'}{' '}
                    {storedDetails.address}
                  </Text>
                  {storedDetails.floor ? (
                    <Text style={styles.expressTextSub}>{storedDetails.floor}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.expressDetailsRow}>
                <Text style={styles.expressEmoji}>📞</Text>
                <Text style={styles.expressTextSub}>{storedDetails.phone} ({storedDetails.name})</Text>
              </View>

              <View style={styles.expressDetailsRow}>
                <Text style={styles.expressEmoji}>💵</Text>
                <Text style={styles.expressTextSub}>
                  {storedDetails.payment === 'card' ? 'Carte bancaire (TPE)' : 'Espèces à la livraison'}
                </Text>
              </View>

              {expressError ? (
                <Text style={styles.expressError}>{expressError}</Text>
              ) : null}

              <Pressable
                onPress={handleExpressCheckout}
                disabled={isLimitBlocked || expressLoading}
                style={{ marginTop: 16 }}
              >
                <LinearGradient
                  colors={expressLoading ? ['#6b7280', '#4b5563'] : [...gradients.cta]}
                  style={[styles.expressBtn, shadows.glowOrange]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.expressBtnText}>
                    {expressLoading 
                      ? 'Validation en cours... 🔥' 
                      : `🚀 Commande Express (1-Clic) · ${
                          isCustom 
                            ? (subtotal > 0 ? `${formatMad(total)} + achats` : '20 DH + achats')
                            : formatMad(total)
                        }`
                    }
                  </Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </FadeInView>
        ) : null}

        <FadeInView delay={280}>
          <LinearGradient colors={['rgba(255,255,255,0.98)', brand[50]]} style={[styles.summary, shadows.soft]}>
            <Row 
              label="Sous-total" 
              value={isCustom 
                ? (subtotal > 0 ? `${formatMad(subtotal)} + achats` : 'Sur ticket')
                : formatMad(subtotal)
              } 
            />
            <Row 
              label="Frais de livraison" 
              value={deliveryFee > 0 
                ? formatMad(deliveryFee) 
                : 'Offerte ✨'
              } 
            />
            <View style={styles.divider} />
            <Row 
              label="Total" 
              value={isCustom 
                ? (subtotal > 0 ? `${formatMad(total)} + achats` : '20 DH + achats')
                : formatMad(total)
              } 
              bold 
            />
          </LinearGradient>
        </FadeInView>

        <FadeInView delay={300}>
          {isLimitBlocked ? (
            <View style={[styles.progressCard, shadows.card]}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressEmoji}>🎁</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.progressHeader}>Débloquez votre commande !</Text>
                  <Text style={styles.progressSub}>
                    Plus que <Text style={styles.boldText}>{formatMad(70 - subtotal)}</Text> pour commander.
                  </Text>
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#fb7185', '#f43f5e']}
                  style={[styles.progressBarFill, { width: `${Math.min(1, subtotal / 70) * 100}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabelLeft}>{formatMad(subtotal)}</Text>
                <Text style={styles.progressLabelRight}>Objectif : 70 DH</Text>
              </View>
            </View>
          ) : isCustom ? (
            <LinearGradient
              colors={['#fdf4ff', '#fae8ff']}
              style={[styles.unlockCard, shadows.card, { borderColor: 'rgba(217,70,239,0.2)', borderWidth: 1 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.unlockTitle, { color: '#86198f' }]}>📝 Commande sur-mesure active</Text>
              <Text style={[styles.unlockSub, { color: '#a21caf' }]}>
                Frais de livraison fixes de 20 DH. Les achats seront réglés à la livraison selon le ticket de caisse réel.
              </Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#f0fdf4', '#dcfce7']}
              style={[styles.unlockCard, shadows.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.unlockTitle}>🎉 Commande débloquée !</Text>
              <Text style={styles.unlockSub}>
                Félicitations, vous avez dépassé le minimum de 70 DH. Votre repas chaud et isotherme est prêt à partir !
              </Text>
            </LinearGradient>
          )}
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
          title={
            isLimitBlocked 
              ? `Minimum 70 DH requis` 
              : isCustom
                ? `Commander · ${subtotal > 0 ? `${formatMad(total)} + achats` : '20 DH + achats'} →`
                : `Commander · ${formatMad(total)} →`
          }
          onPress={() => router.push('/(client)/checkout' as never)}
          disabled={isLimitBlocked}
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
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },
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
  suggestTitle: { fontFamily: fonts.bold, fontSize: 14, color: ink[600], textAlign: 'center', marginBottom: 16 },
  suggestGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: ink[200],
  },
  suggestEmoji: { fontSize: 16 },
  suggestLabel: { fontFamily: fonts.semibold, fontSize: 13, color: ink[800] },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressEmoji: {
    fontSize: 28,
  },
  progressHeader: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink[800],
  },
  progressSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink[500],
    marginTop: 2,
  },
  boldText: {
    fontFamily: fonts.extrabold,
    color: brand[600],
  },
  progressBarBg: {
    height: 8,
    backgroundColor: ink[100],
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabelLeft: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    color: brand[600],
  },
  progressLabelRight: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: ink[400],
  },
  unlockCard: {
    borderRadius: radius.xl,
    padding: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  unlockTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: '#15803d',
  },
  unlockSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#166534',
    marginTop: 4,
    lineHeight: 16,
  },
  expressCard: {
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  expressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 8,
  },
  expressTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: '#fb923c',
  },
  editExpressBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editExpressText: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  expressDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  expressEmoji: {
    fontSize: 14,
  },
  expressTextBold: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  expressTextSub: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  expressError: {
    color: '#f87171',
    fontFamily: fonts.semibold,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  expressBtn: {
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expressBtnText: {
    color: '#fff',
    fontFamily: fonts.extrabold,
    fontSize: 14,
  },
  upsellWrap: {
    marginTop: 8,
    marginBottom: 20,
  },
  upsellTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: ink[900],
    paddingHorizontal: 4,
  },
  upsellSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink[500],
    marginTop: 2,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  upsellScroll: {
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  upsellCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ink[100],
  },
  upsellImg: {
    width: '100%',
    height: 90,
  },
  upsellImgPh: {
    width: '100%',
    height: 90,
    backgroundColor: brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  upsellInfo: {
    padding: 10,
    alignItems: 'center',
  },
  upsellName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: ink[800],
    textAlign: 'center',
  },
  upsellPrice: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: brand[600],
    marginTop: 3,
  },
  upsellAddBtn: {
    marginTop: 8,
    backgroundColor: brand[50],
    borderWidth: 1,
    borderColor: brand[200],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    width: '100%',
    alignItems: 'center',
  },
  upsellAddBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: brand[700],
  },
});
