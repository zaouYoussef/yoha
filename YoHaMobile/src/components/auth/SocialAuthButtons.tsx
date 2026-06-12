import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { hapticLight } from '../../lib/haptics';
import { mapAppleFullName, signInWithApple } from '../../lib/socialAuth';
import { ink, radius } from '../../theme';
import { GoogleSignInSection } from './GoogleSignInSection';

type Props = {
  disabled?: boolean;
  onGoogleToken: (idToken: string) => Promise<void>;
  onAppleSignIn: (
    identityToken: string,
    fullName?: { givenName: string; familyName: string },
  ) => Promise<void>;
  onError: (message: string) => void;
};

type AppleModule = typeof import('expo-apple-authentication');

export function SocialAuthButtons({ disabled, onGoogleToken, onAppleSignIn, onError }: Props) {
  const [appleModule, setAppleModule] = useState<AppleModule | null>(null);
  const [appleBusy, setAppleBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    import('expo-apple-authentication')
      .then((mod) => setAppleModule(mod))
      .catch(() => setAppleModule(null));
  }, []);

  const handleApple = async () => {
    if (disabled || appleBusy) return;
    hapticLight();
    setAppleBusy(true);
    try {
      const result = await signInWithApple();
      await onAppleSignIn(result.identityToken, mapAppleFullName(result.fullName));
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === 'ERR_REQUEST_CANCELED') return;
      onError(e instanceof Error ? e.message : 'Connexion Apple impossible');
    } finally {
      setAppleBusy(false);
    }
  };

  const AppleAuthButton = appleModule?.AppleAuthenticationButton;

  return (
    <View style={styles.wrap}>
      <GoogleSignInSection
        disabled={disabled}
        onGoogleToken={onGoogleToken}
        onError={onError}
      />

      {Platform.OS === 'ios' && AppleAuthButton && appleModule ? (
        appleBusy ? (
          <View style={[styles.appleFallback, styles.btnDisabled]}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <AppleAuthButton
            buttonType={appleModule.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={appleModule.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.lg}
            style={styles.appleNative}
            onPress={handleApple}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  btnDisabled: { opacity: 0.55 },
  appleNative: {
    width: '100%',
    height: 52,
  },
  appleFallback: {
    backgroundColor: '#000',
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
