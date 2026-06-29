import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HERO_SLOGANS } from '../../data/landing';
import { brand } from '../../theme';
import { fonts } from '../../theme/fonts';

export function TypewriterHeadline() {
  return (
    <View>
      <Text style={styles.brand}>YoHa.</Text>
      <Text style={styles.typed}>{HERO_SLOGANS[0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontFamily: fonts.display,
    fontSize: 52,
    color: '#fff',
    letterSpacing: -2,
  },
  typed: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: brand[300],
    marginTop: 4,
    letterSpacing: -0.5,
  },
});
