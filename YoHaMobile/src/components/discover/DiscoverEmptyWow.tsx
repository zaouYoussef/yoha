import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { brand, gradients, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

export function DiscoverEmptyWow({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🔮</Text>
      <Text style={styles.title}>Aucun resto ici</Text>
      <Text style={styles.sub}>Essaie une autre catégorie — le campus regorge de bonnes adresses</Text>
      <Pressable onPress={onReset}>
        <LinearGradient colors={[...gradients.cta]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.btnText}>Voir tout le catalogue</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emoji: { fontSize: 56 },
  title: { marginTop: 16, fontFamily: fonts.display, fontSize: 24, color: ink[900] },
  sub: { marginTop: 8, fontFamily: fonts.medium, fontSize: 14, color: ink[500], textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 22, paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.full },
  btnText: { fontFamily: fonts.extrabold, fontSize: 14, color: '#fff' },
});
