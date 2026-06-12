import { Platform } from 'react-native';

export function getGoogleClientIds() {
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  };
}

export function isGoogleConfigured(): boolean {
  const { webClientId, iosClientId, androidClientId } = getGoogleClientIds();
  return !!(webClientId || iosClientId || androidClientId);
}

export type AppleSignInResult = {
  identityToken: string;
  fullName: {
    givenName: string | null;
    familyName: string | null;
    middleName?: string | null;
    namePrefix?: string | null;
    nameSuffix?: string | null;
    nickname?: string | null;
  } | null;
};

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('Connexion Apple disponible uniquement sur iOS.');
  }
  const AppleAuthentication = await import('expo-apple-authentication');
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Connexion Apple indisponible sur cet appareil.');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Jeton Apple manquant.');
  }

  return {
    identityToken: credential.identityToken,
    fullName: credential.fullName,
  };
}

export function mapAppleFullName(
  fullName: AppleSignInResult['fullName'],
): { givenName: string; familyName: string } | undefined {
  if (!fullName) return undefined;
  return {
    givenName: fullName.givenName ?? '',
    familyName: fullName.familyName ?? '',
  };
}
