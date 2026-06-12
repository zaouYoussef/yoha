import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { brand, ink, radius } from '../../theme';

type Props = TextInputProps & {
  label: string;
};

export function YohaInput({ label, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <TextInput
        placeholderTextColor={ink[400]}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: ink[500],
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: ink[50],
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    color: ink[900],
    borderWidth: 1.5,
    borderColor: ink[200],
  },
});
