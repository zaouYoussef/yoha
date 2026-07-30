import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { surface } from '../../theme';
import { Display } from './Type';
import { GhostButton } from './Atoms';

/** Fond commun à toute l'app. Charbon chaud, jamais noir pur. */
export function Screen({
  children,
  style,
  edges = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        { flex: 1, backgroundColor: surface.void },
        edges && { paddingTop: insets.top },
        style,
      ]}
    >
      <StatusBar style="light" />
      {children}
    </View>
  );
}

/** En-tête d'écran interne : flèche + titre display. Pas de barre pleine. */
export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 16,
      }}
    >
      <GhostButton glyph="back" label="Retour" onPress={onBack} />
      <Display size="h1" style={{ flex: 1 }}>
        {title}
      </Display>
      {right}
    </View>
  );
}

export const screenStyles = StyleSheet.create({
  gutter: { paddingHorizontal: 18 },
});
