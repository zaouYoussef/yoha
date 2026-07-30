import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { restaurantsApi } from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRestaurantMe } from '../../src/hooks/useRestaurantMe';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { resolveImageUrl } from '../../src/lib/resolveImageUrl';
import { accent, line, radius, surface, text as palette } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label } from '../../src/components/yoha/Type';
import { Hairline, Pill } from '../../src/components/yoha/Atoms';
import { LivePulse } from '../../src/components/yoha/Motion';
import { OutlineButton } from '../../src/components/yoha/EmberButton';
import { OpsAction, OpsCard, OpsField, OpsHeader } from '../../src/components/yoha/Ops';

export default function RestaurantProfile() {
  const { logout } = useAuth();
  const { restaurant, loading, error, refresh } = useRestaurantMe();
  const { scrollBottomPadding } = useLayoutChrome();

  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) setOpen(restaurant.isOpen !== false);
  }, [restaurant]);

  /* Le seul réglage vraiment urgent en cuisine : couper les commandes. */
  const toggleOpen = useCallback(
    async (next: boolean) => {
      setOpen(next);
      setSaving(true);
      setSaveError(null);
      try {
        await restaurantsApi.updateMe({ is_open: next });
        await refresh();
      } catch (e) {
        setOpen(!next);
        setSaveError(e instanceof Error ? e.message : 'Changement impossible.');
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      >
        <OpsHeader kicker="Établissement" title="Profil" />

        {error ? (
          <Body size="small" tone="ember" style={{ paddingHorizontal: 18, marginTop: 16 }}>
            {error}
          </Body>
        ) : null}

        <View style={{ paddingHorizontal: 18, marginTop: 20, gap: 12 }}>
          <OpsCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Image
                source={{ uri: resolveImageUrl(restaurant?.logo || restaurant?.cover) }}
                contentFit="cover"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: radius.md,
                  backgroundColor: surface.smoke,
                }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Display size="h3" numberOfLines={1}>
                  {restaurant?.name ?? (loading ? 'Chargement…' : 'Restaurant')}
                </Display>
                <Body size="caption" tone="dim" numberOfLines={1} style={{ marginTop: 3 }}>
                  {restaurant?.cuisine ?? '—'}
                </Body>
              </View>
              {open ? <LivePulse /> : null}
              <Pill tone={open ? 'mint' : 'dark'}>{open ? 'Ouvert' : 'Fermé'}</Pill>
            </View>

            <OpsField label="Adresse" value={restaurant?.address} />
            <OpsField label="Tél" value={restaurant?.phone} />
            <OpsField label="Zone" value={restaurant?.distance} />
          </OpsCard>

          {/* Interrupteur maître */}
          <OpsCard accented={!open}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Label tone={open ? 'mint' : 'ember'}>Réception des commandes</Label>
                <Body size="caption" tone="dim" style={{ marginTop: 6 }}>
                  {open
                    ? 'Ta carte est visible et commandable en ce moment.'
                    : 'Le restaurant est masqué du catalogue. Personne ne peut commander.'}
                </Body>
              </View>
              <Switch
                value={open}
                disabled={saving || !restaurant}
                onValueChange={(v) => void toggleOpen(v)}
                trackColor={{ false: line.soft, true: accent.ember }}
                thumbColor={palette.bone}
              />
            </View>
            {saveError ? (
              <Body size="caption" tone="ember" style={{ marginTop: 10 }}>
                {saveError}
              </Body>
            ) : null}
          </OpsCard>

          <OpsCard>
            <Label tone="dim">Gestion de la carte</Label>
            <Body size="small" tone="fog" style={{ marginTop: 8 }}>
              Les plats, les photos et les prix se modifient depuis le dashboard web — l'écran y est
              plus large et les images se téléversent mieux.
            </Body>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <OpsAction
                label="Ouvrir le dashboard"
                glyph="forward"
                tone="ember"
                onPress={() => void Linking.openURL('https://yoha-ten.vercel.app/dashboard')}
              />
            </View>
          </OpsCard>

          <View
            style={{
              padding: 14,
              borderRadius: radius.xl,
              backgroundColor: surface.soot,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: line.hair,
            }}
          >
            <Label tone="dim">Support YoHa</Label>
            <Hairline style={{ marginVertical: 12 }} />
            <Body size="small" tone="fog">
              Un litige, un livreur absent, une commande bloquée : appelle, on décroche pendant le
              service.
            </Body>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <OpsAction
                label="Appeler le support"
                glyph="phone"
                onPress={() => void Linking.openURL('tel:+212600000000')}
              />
            </View>
          </View>

          <OutlineButton
            label="Se déconnecter"
            onPress={() => {
              void logout();
              router.replace('/landing');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
