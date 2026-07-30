import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '../../src/contexts/AuthContext';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { accent, line, radius, surface, text as palette } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label } from '../../src/components/yoha/Type';
import { Glyph, Hairline } from '../../src/components/yoha/Atoms';
import { EmberButton, OutlineButton } from '../../src/components/yoha/EmberButton';

const ROWS = [
  { id: 'addresses', label: 'Mes adresses', sub: 'Malabata, CHU, Médina' },
  { id: 'payment', label: 'Paiement', sub: 'Espèces · carte à la livraison' },
  { id: 'notifications', label: 'Notifications', sub: 'Suivi de commande activé' },
  { id: 'help', label: 'Aide', sub: 'Un problème sur une commande ?' },
];

export default function ClientProfile() {
  const { user, logout } = useAuth();
  const { scrollBottomPadding } = useLayoutChrome();

  const initial = (user?.displayName || user?.email || 'Y').slice(0, 1).toUpperCase();

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      >
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <Label tone="ember">Ton compte</Label>
          <Display size="h1" style={{ marginTop: 5 }}>
            Profil
          </Display>
        </View>

        {/* Identité */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 22,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            borderRadius: radius.xl,
            backgroundColor: surface.ash,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: line.hair,
          }}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: radius.full,
              backgroundColor: accent.ember,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Display size="h2" tone="void">
              {initial}
            </Display>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Display size="h3" numberOfLines={1}>
              {user?.displayName || 'Invité'}
            </Display>
            <Body size="caption" tone="dim" numberOfLines={1} style={{ marginTop: 3 }}>
              {user?.email || 'Commande sans compte'}
            </Body>
          </View>
        </View>

        {/* Fidélité — un objectif visible relance la commande suivante */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 12,
            padding: 16,
            borderRadius: radius.xl,
            backgroundColor: 'rgba(255,90,31,0.07)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: line.ember,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Glyph name="bolt" size={14} color={accent.ember} />
            <Label tone="ember">Carte fidélité</Label>
          </View>
          <Body size="small" tone="fog" style={{ marginTop: 8 }}>
            3 commandes sur 5 — la sixième est offerte.
          </Body>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 5,
                  backgroundColor: i < 3 ? accent.ember : line.soft,
                }}
              />
            ))}
          </View>
        </View>

        {/* Réglages */}
        <View style={{ marginHorizontal: 18, marginTop: 26 }}>
          {ROWS.map((r, i) => (
            <View key={r.id}>
              {i > 0 ? <Hairline /> : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => {}}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 16,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Body size="small" weight="medium">
                    {r.label}
                  </Body>
                  <Body size="caption" tone="dim" style={{ marginTop: 2 }}>
                    {r.sub}
                  </Body>
                </View>
                <Glyph name="chevron" size={18} color={palette.dim} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={{ marginHorizontal: 18, marginTop: 26, gap: 10 }}>
          {user ? (
            <OutlineButton
              label="Se déconnecter"
              onPress={() => {
                void logout();
                router.replace('/landing');
              }}
            />
          ) : (
            <EmberButton label="Créer mon compte" onPress={() => router.push('/auth/register')} />
          )}
        </View>

        <Body
          size="caption"
          tone="dim"
          style={{ textAlign: 'center', marginTop: 26, fontFamily: fonts.mono }}
        >
          YoHa · Tanger · v2.0
        </Body>
      </ScrollView>
    </Screen>
  );
}
