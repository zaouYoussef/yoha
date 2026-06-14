import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CUISINES } from '../../data/cuisines';
import { brand, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

export function DiscoverSectionHeader({
  cuisine,
  count,
  loading,
  onClearFilter,
}: {
  cuisine: string;
  count: number;
  loading: boolean;
  onClearFilter: () => void;
}) {
  const label =
    cuisine === '' || cuisine === 'all'
      ? 'Tous les restaurants'
      : cuisine === 'promos'
      ? '🔥 Offres Flash Tanger'
      : CUISINES.find((c) => c.id === cuisine)?.label ?? 'Résultats';

  const subText = loading
    ? 'Chargement du catalogue…'
    : cuisine === 'promos'
    ? `${count} restaurant${count > 1 ? 's' : ''} avec réductions exclusives · livraison gratuite`
    : `${count} adresse${count > 1 ? 's' : ''} près de vous · livraison offerte`;

  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>{cuisine === 'promos' ? 'Bons Plans' : 'À dévorer'}</Text>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.sub}>{subText}</Text>
      </View>
      {cuisine ? (
        <Pressable onPress={onClearFilter}>
          <Text style={styles.clear}>Tout voir</Text>
        </Pressable>
      ) : (
        <LinearGradient colors={[brand[400], '#ec4899']} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.badgeText}>{count}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 18, marginTop: 6 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 11, color: brand[600], textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { fontFamily: fonts.display, fontSize: 28, color: ink[900], letterSpacing: -0.8, marginTop: 4 },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: ink[500], marginTop: 4 },
  clear: { fontFamily: fonts.bold, fontSize: 14, color: brand[600], paddingBottom: 4 },
  badge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, marginBottom: 4 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 14, color: '#fff' },
});
