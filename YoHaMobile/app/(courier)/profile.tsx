import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { PremiumBackground } from '../../src/components/PremiumBackground';
import { useAuth } from '../../src/contexts/AuthContext';
import { brand, ink, radius, shadows } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

/** Écran profil livreur (hors tab bar, comme sur le web). */
export default function CourierProfile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <PremiumBackground variant="cream">
      <View style={[styles.wrap, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🛵</Text>
        </View>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Dashboard livreur YouHa</Text>
          <Text style={styles.cardLine}>Confirmez les courses, récupérez, livrez.</Text>
        </View>

        <PrimaryButton
          title="Se déconnecter"
          onPress={async () => {
            await logout();
            router.replace('/auth/login' as never);
          }}
          variant="ghost"
          style={{ marginTop: 24, alignSelf: 'stretch' }}
        />
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 40 },
  name: { marginTop: 16, fontSize: 24, fontFamily: fonts.extrabold, color: ink[900] },
  email: { marginTop: 4, fontSize: 15, fontFamily: fonts.medium, color: ink[500] },
  card: {
    marginTop: 32,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  cardTitle: { fontSize: 16, fontFamily: fonts.extrabold, color: ink[900], marginBottom: 8 },
  cardLine: { fontSize: 14, fontFamily: fonts.medium, color: ink[600] },
});
