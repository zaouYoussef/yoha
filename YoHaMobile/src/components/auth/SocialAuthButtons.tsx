import React from 'react';
import { View } from 'react-native';
import { GoogleSignInSection } from './GoogleSignInSection';

type Props = {
  disabled?: boolean;
  onGoogleToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
};

export function SocialAuthButtons({ disabled, onGoogleToken, onError }: Props) {
  return (
    <View style={{ gap: 12 }}>
      <GoogleSignInSection
        disabled={disabled}
        onGoogleToken={onGoogleToken}
        onError={onError}
      />
    </View>
  );
}
