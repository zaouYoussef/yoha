import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CAMPUS_ZONES } from '../../data/landing';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

export function PartnersMarquee() {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>Zones couvertes</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CAMPUS_ZONES.map((zone) => (
          <View key={zone.name} style={[styles.card, shadows.soft]}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{zone.emoji}</Text>
            </View>
            <Text style={styles.name} numberOfLines={2}>{zone.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>{zone.subtitle}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: ink[100],
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: brand[600],
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  row: { gap: 12, paddingRight: 8 },
  card: {
    width: 148,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: ink[50],
    borderWidth: 1,
    borderColor: ink[100],
  },
  emojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ink[100],
  },
  emoji: { fontSize: 20 },
  name: { fontFamily: fonts.bold, fontSize: 13, color: ink[900], lineHeight: 17 },
  sub: { fontFamily: fonts.medium, fontSize: 11, color: ink[500], marginTop: 4 },
});
