import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { brand, ink } from '../../theme';
import { fonts } from '../../theme/fonts';
import { PremiumBackground } from '../PremiumBackground';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
};

export function RestoDashShell({ title, subtitle, children, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login' as never);
  };

  return (
    <PremiumBackground variant="cream">
      <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 96 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>🍽️ Dashboard restaurant</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sortir</Text>
          </Pressable>
        </View>
        <View style={[styles.body, contentStyle]}>{children}</View>
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  kicker: { fontSize: 11, fontFamily: fonts.bold, color: brand[600], letterSpacing: 0.3 },
  title: {
    marginTop: 4,
    fontSize: 26,
    fontFamily: fonts.extrabold,
    color: ink[900],
    letterSpacing: -0.6,
  },
  sub: { marginTop: 4, fontSize: 14, fontFamily: fonts.medium, color: ink[500] },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: ink[100],
  },
  logoutText: { fontSize: 12, fontFamily: fonts.bold, color: ink[700] },
  body: { flex: 1 },
});
