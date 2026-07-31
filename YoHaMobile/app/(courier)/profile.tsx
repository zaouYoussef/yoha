import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { line, radius, surface } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label, Money } from '../../src/components/yoha/Type';
import { Hairline } from '../../src/components/yoha/Atoms';
import { OutlineButton } from '../../src/components/yoha/EmberButton';
import { OpsAction, OpsCard, OpsField, OpsHeader } from '../../src/components/yoha/Ops';

export default function CourierProfile() {
  const { user, logout } = useAuth();
  const { scrollBottomPadding } = useLayoutChrome();

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      >
        <OpsHeader kicker="Compte" title="Profil" tone="violet" />

        <View style={{ paddingHorizontal: 18, marginTop: 20, gap: 12 }}>
          <OpsCard accented tone="violet">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: radius.md,
                  backgroundColor: surface.smoke,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Display size="h2">🛵</Display>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Display size="h3" numberOfLines={1}>
                  {user?.displayName ?? 'Livreur'}
                </Display>
                <Body size="caption" tone="dim" numberOfLines={1} style={{ marginTop: 3 }}>
                  {user?.email ?? '—'}
                </Body>
              </View>
            </View>
          </OpsCard>

          <OpsCard>
            <Label tone="dim">Dashboard livreur</Label>
            <Body size="small" tone="fog" style={{ marginTop: 8 }}>
              Confirme les courses, récupère les commandes, livre. Ton historique et tes gains sont
              visibles dans l'onglet précédent.
            </Body>
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
              Un problème avec une course, un client injoignable, une urgence : appelle le support.
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
            tone="violet"
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
