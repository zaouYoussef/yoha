import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { hapticLight } from '../../lib/haptics';
import { signInWithGoogleIdToken } from '../../lib/googleOAuth';
import { isGoogleConfigured } from '../../lib/socialAuth';
import { ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  disabled?: boolean;
  onGoogleToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
};

function GoogleMark() {
  return (
    <View style={styles.googleMark}>
      <Text style={styles.googleG}>G</Text>
    </View>
  );
}

export function GoogleSignInSection({ disabled, onGoogleToken, onError }: Props) {
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    if (disabled || busy) return;
    if (!isGoogleConfigured()) {
      onError('Google Sign-In non configuré (EXPO_PUBLIC_GOOGLE_* et backend).');
      return;
    }
    hapticLight();
    setBusy(true);
    try {
      const idToken = await signInWithGoogleIdToken();
      await onGoogleToken(idToken);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Connexion Google impossible';
      if (!msg.toLowerCase().includes('annulée')) {
        onError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={handleGoogle}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.btn,
        styles.googleBtn,
        (disabled || busy) && styles.btnDisabled,
        pressed && !disabled && !busy && { opacity: 0.92 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={ink[700]} />
      ) : (
        <>
          <GoogleMark />
          <Text style={styles.googleLabel}>Continuer avec Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
  },
  btnDisabled: { opacity: 0.55 },
  googleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: ink[200],
    ...shadows.soft,
  },
  googleMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ink[100],
  },
  googleG: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#4285F4',
  },
  googleLabel: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: ink[800],
  },
});
