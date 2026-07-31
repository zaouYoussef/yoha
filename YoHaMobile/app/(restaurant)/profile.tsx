import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { restaurantsApi } from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRestaurantMe } from '../../src/hooks/useRestaurantMe';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { resolveImageUrl } from '../../src/lib/resolveImageUrl';
import { normalizeOpeningHours, type OpeningHoursMap } from '../../src/lib/openingHours';
import { accent, line, radius, surface, text as palette } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label } from '../../src/components/yoha/Type';
import { Hairline, Pill } from '../../src/components/yoha/Atoms';
import { LivePulse } from '../../src/components/yoha/Motion';
import { EmberButton, OutlineButton } from '../../src/components/yoha/EmberButton';
import { OpsAction, OpsCard, OpsField, OpsHeader } from '../../src/components/yoha/Ops';
import { Sheet } from '../../src/components/yoha/Sheet';
import { RestoOpeningHoursEditor } from '../../src/components/restaurant-dash/RestoOpeningHoursEditor';

export default function RestaurantProfile() {
  const { logout } = useAuth();
  const { restaurant, loading, error, refresh } = useRestaurantMe();
  const { scrollBottomPadding } = useLayoutChrome();

  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showHours, setShowHours] = useState(false);
  const [hours, setHours] = useState<OpeningHoursMap | null>(null);
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    if (restaurant) setOpen(restaurant.isOpen !== false);
  }, [restaurant]);

  useEffect(() => {
    if (restaurant?.openingHours) {
      setHours(normalizeOpeningHours(restaurant.openingHours));
    }
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

  const saveHours = useCallback(async () => {
    if (!hours) return;
    setSavingHours(true);
    try {
      await restaurantsApi.updateMe({ opening_hours: hours });
      setShowHours(false);
      await refresh();
    } catch {
    } finally {
      setSavingHours(false);
    }
  }, [hours, refresh]);

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
            <Label tone="dim">Horaires d'ouverture</Label>
            <Body size="small" tone="fog" style={{ marginTop: 8 }}>
              Définis les plages horaires pour chaque jour de la semaine.
            </Body>
            <View style={{ marginTop: 14 }}>
              <OpsAction label="Modifier les horaires" glyph="clock" onPress={() => setShowHours(true)} />
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

      <Sheet visible={showHours} onClose={() => setShowHours(false)} maxHeightRatio={0.95}>
        <View style={{ paddingHorizontal: 18, gap: 14 }}>
          <Display size="h2">Horaires</Display>
          <Body size="small" tone="fog">
            Modifie les plages horaires pour chaque jour. Les clients ne peuvent commander que
            pendant ces créneaux.
          </Body>
          {hours ? (
            <RestoOpeningHoursEditor
              value={hours}
              onChange={setHours}
              disabled={savingHours}
            />
          ) : null}
          <View style={{ marginTop: 10 }}>
            <EmberButton
              label={savingHours ? 'Enregistrement…' : 'Enregistrer'}
              loading={savingHours}
              disabled={savingHours}
              onPress={() => void saveHours()}
            />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
