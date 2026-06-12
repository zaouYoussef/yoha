import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ink } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  label?: string;
};

export function AuthDivider({ label = 'ou avec votre e-mail' }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.line} />
        <Text style={styles.label}>{label}</Text>
        <View style={styles.line} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ink[200],
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: ink[400],
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
