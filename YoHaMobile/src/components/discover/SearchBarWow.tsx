import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { brand, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

const PLACEHOLDERS = [
  'Rechercher une Pizza Regina... 🍕',
  'Envie d\'un Double Burger XL ? 🍔',
  'Un Tacos Maxi sauce fromagère ? 🌮',
  'Des sushis frais pour ce soir ? 🍣',
  'Un Poké bowl healthy & protéiné... 🥗',
];

export function SearchBarWow({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [phIdx, setPhIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.bar, compact && styles.barCompact, focused && styles.barFocused, shadows.soft]}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={PLACEHOLDERS[phIdx]}
          placeholderTextColor={ink[400]}
          style={[styles.input, compact && styles.inputCompact]}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18, zIndex: 2 },
  wrapCompact: { marginTop: 0 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  barCompact: { paddingVertical: 11 },
  barFocused: {
    borderColor: brand[400],
    shadowColor: brand[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: { fontSize: 18 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: ink[900],
    padding: 0,
  },
  inputCompact: { fontSize: 15 },
});
