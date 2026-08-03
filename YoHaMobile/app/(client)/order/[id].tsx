import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';

import { ordersApi, reviewsApi, type Order } from '../../../src/lib/api';
import { resolveImageUrl } from '../../../src/lib/resolveImageUrl';
import { useLayoutChrome } from '../../../src/lib/layoutChrome';
import { accent, line, radius, surface, text as palette } from '../../../src/theme';
import { fonts } from '../../../src/theme/fonts';
import { Screen } from '../../../src/components/yoha/Screen';
import { Body, Display, Label, Money } from '../../../src/components/yoha/Type';
import { Chip, GhostButton, Glyph, Hairline, Skeleton, StepBar } from '../../../src/components/yoha/Atoms';
import { EmberField, LiveCount, LivePulse } from '../../../src/components/yoha/Motion';
import { EmberButton, OutlineButton } from '../../../src/components/yoha/EmberButton';
import { Sheet } from '../../../src/components/yoha/Sheet';

/**
 * Les statuts backend, traduits en langage client.
 * On raconte ce qui se passe en cuisine, pas un code d'état.
 */
const PHASES = [
  { key: 'pending', title: 'Commande reçue', line: 'On prévient la cuisine.', glyph: '🧾', eta: 55 },
  { key: 'accepted', title: 'Acceptée', line: 'La cuisine a pris ta commande.', glyph: '👍', eta: 50 },
  { key: 'preparing', title: 'En cuisine', line: 'Ça chauffe. Ça sent déjà bon.', glyph: '🔥', eta: 40 },
  { key: 'ready', title: 'Prête', line: 'Un livreur récupère ton sac.', glyph: '🛍️', eta: 25 },
  { key: 'delivering', title: 'En route', line: 'Le livreur file vers toi.', glyph: '🛵', eta: 12 },
  { key: 'delivered', title: 'Livré', line: 'Bon appétit.', glyph: '🎉', eta: 0 },
] as const;

function phaseIndex(status?: string) {
  const i = PHASES.findIndex((p) => p.key === status);
  return i < 0 ? 0 : i;
}

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { footerBottomPadding } = useLayoutChrome();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ordersApi.get(String(id));
      setOrder(data);
    } catch {
      /* on garde le dernier état connu plutôt que d'afficher une erreur */
    } finally {
      setLoading(false);
    }
  }, [id]);

  const doCancel = useCallback(async () => {
    if (!cancelReason.trim()) { Alert.alert('Indique une raison'); return; }
    setBusy(true);
    try {
      await ordersApi.cancelOrder(String(id), cancelReason.trim());
      setCancelling(false);
      await load();
    } finally {
      setBusy(false);
    }
  }, [id, cancelReason, load]);

  const doRate = useCallback(async (stars: number) => {
    if (rated) return;
    setRating(stars);
    setRated(true);
    try {
      await reviewsApi.create({ order_id: String(id), rating: stars });
    } catch {
      setRated(false);
    }
  }, [id, rated]);

  /* Rafraîchissement léger : suffisant sans WebSocket, invisible pour le client. */
  useEffect(() => {
    void load();
    const timer = setInterval(load, 12000);
    return () => clearInterval(timer);
  }, [load]);

  const cancelled = order?.status === 'cancelled';
  const idx = phaseIndex(order?.status);
  const phase = PHASES[idx];
  const done = phase.key === 'delivered';

  const items = order?.items ?? [];
  const total = Number(order?.totalDh ?? 0);

  if (loading && !order) {
    return (
      <Screen>
        <View style={{ padding: 18, gap: 12 }}>
          <Skeleton height={220} />
          <Skeleton height={90} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 18,
          paddingBottom: 6,
        }}
      >
        <GhostButton glyph="back" label="Retour" onPress={() => router.replace('/(client)')} />
        <View style={{ flex: 1 }}>
          <Label tone="dim">Commande</Label>
          <Body size="small" style={{ fontFamily: fonts.monoMedium }}>
            #{String(id).slice(0, 8).toUpperCase()}
          </Body>
        </View>
        {!done && !cancelled ? <LivePulse /> : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ── Le compte à rebours occupe l'écran : c'est la seule info qui compte ── */}
        <View style={{ height: 380, justifyContent: 'center', alignItems: 'center' }}>
          {!done && !cancelled ? <EmberField count={18} height={340} /> : null}

          <PhaseHalo glyph={cancelled ? '✕' : phase.glyph} active={!done && !cancelled} />

          <Label tone={cancelled ? 'ember' : 'ember'} style={{ marginTop: 26 }}>
            {cancelled ? 'Commande annulée' : phase.title}
          </Label>

          {cancelled ? (
            <Display size="h1" style={{ marginTop: 10 }}>
              Annulée
            </Display>
          ) : done ? (
            <Display size="hero" style={{ marginTop: 10 }}>
              Livré
            </Display>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10 }}>
              <LiveCount
                to={phase.eta}
                render={(n) => (
                  <Display size="hero" black>
                    {String(n)}
                  </Display>
                )}
              />
              <Display size="h2" tone="fog" style={{ marginLeft: 8 }}>
                min
              </Display>
            </View>
          )}

          <Body
            size="small"
            tone="fog"
            style={{ marginTop: 12, textAlign: 'center', maxWidth: 280 }}
          >
            {cancelled
              ? order?.cancellationReason || 'La cuisine n’a pas pu honorer cette commande.'
              : `${phase.line}${order?.restaurantName ? ` · ${order.restaurantName}` : ''}`}
          </Body>

          {!cancelled ? (
            <View style={{ width: 240, marginTop: 26 }}>
              <StepBar total={PHASES.length} current={idx} />
            </View>
          ) : null}
        </View>

        {/* ── Livreur ─────────────────────────────────────────────── */}
        {order?.courierName && !done && !cancelled ? (
          <View
            style={{
              marginHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: radius.lg,
              backgroundColor: surface.soot,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: line.hair,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.full,
                backgroundColor: surface.smoke,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Body size="small" weight="bold">
                {order.courierName.slice(0, 1).toUpperCase()}
              </Body>
            </View>
            <View style={{ flex: 1 }}>
              <Label tone="dim">Ton livreur</Label>
              <Body size="small" weight="semibold">
                {order.courierName}
              </Body>
            </View>
            <Glyph name="chevron" size={18} color={palette.dim} />
          </View>
        ) : null}

        {/* ── Récapitulatif ───────────────────────────────────────── */}
        <View style={{ marginHorizontal: 18, marginTop: 16 }}>
          <Label tone="dim">Ta commande</Label>
          <View style={{ gap: 10, marginTop: 12 }}>
            {items.map((it) => (
              <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image
                  source={{ uri: resolveImageUrl(it.img) }}
                  contentFit="cover"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: surface.smoke,
                  }}
                />
                <Body size="small" style={{ flex: 1 }} numberOfLines={1}>
                  {it.name}
                </Body>
                <Body size="caption" tone="dim" style={{ fontFamily: fonts.mono }}>
                  ×{it.qty}
                </Body>
                <Money value={Number(it.price) * it.qty} size={13} />
              </View>
            ))}
          </View>

          <Hairline style={{ marginVertical: 16 }} />

          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Display size="h3">Total</Display>
            <View style={{ flex: 1 }} />
            <Money value={total} size={22} />
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: footerBottomPadding,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: line.hair,
          backgroundColor: surface.soot,
          gap: 10,
        }}
      >
        {done ? (
          <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Chip
                key={star}
                label={rated && rating >= star ? '★' : '☆'}
                active={rated && rating >= star}
                onPress={() => void doRate(star)}
              />
            ))}
          </View>
          {rated ? (
            <Body size="caption" tone="mint" style={{ textAlign: 'center' }}>
              Merci pour ta note !
            </Body>
          ) : null}
          <EmberButton label="Re-commander" onPress={() => router.replace('/(client)')} />
          </>
        ) : cancelled ? (
          <EmberButton label="Re-commander" onPress={() => router.replace('/(client)')} />
        ) : (
          <>
          <OutlineButton label="Continuer à explorer" onPress={() => router.replace('/(client)')} />
          <OutlineButton label="Annuler la commande" onPress={() => setCancelling(true)} />
          </>
        )}
      </View>

      {/* Annulation */}
      <Sheet visible={cancelling} onClose={() => { setCancelling(false); setCancelReason(''); }}>
        <View style={{ paddingHorizontal: 18, gap: 14 }}>
          <Display size="h2">Annuler la commande ?</Display>
          <Body size="small" tone="fog">
            Explique pourquoi pour aider la cuisine à s'améliorer.
          </Body>
          <TextInput
            value={cancelReason}
            onChangeText={setCancelReason}
            placeholder="Ex: changement de plan, délai trop long…"
            placeholderTextColor={line.strong}
            multiline
            numberOfLines={3}
            style={{
              padding: 14, borderRadius: radius.lg, backgroundColor: surface.ash,
              color: '#fff', fontSize: 16, borderWidth: 1, borderColor: line.soft,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <EmberButton
                label={busy ? 'Annulation…' : "Confirmer l'annulation"}
                loading={busy}
                disabled={busy || !cancelReason.trim()}
                onPress={() => void doCancel()}
              />
            </View>
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

/** Anneaux concentriques qui pulsent autour de l'emoji d'étape. */
function PhaseHalo({ glyph, active }: { glyph: string; active: boolean }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 2600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, active]);

  return (
    <View style={{ width: 156, height: 156, alignItems: 'center', justifyContent: 'center' }}>
      {active ? (
        <Animated.View
          style={{
            position: 'absolute',
            width: 156,
            height: 156,
            borderRadius: 156,
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: accent.ember,
            opacity: t.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0.5, 0, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }],
          }}
        />
      ) : null}
      <View
        style={{
          position: 'absolute',
          width: 110,
          height: 110,
          borderRadius: 110,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: line.soft,
        }}
      />
      <Animated.Text style={{ fontSize: 46 }}>{glyph}</Animated.Text>
    </View>
  );
}
