import * as WebBrowser from 'expo-web-browser';
import { sha256 } from 'js-sha256';
import { NativeModules, Platform } from 'react-native';
import { getGoogleClientIds } from './socialAuth';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REDIRECT_URI = 'youha://oauthredirect';

WebBrowser.maybeCompleteAuthSession();

/** Résout le client ID selon la plateforme. */
export function resolveGoogleClientId(): string | undefined {
  const ids = getGoogleClientIds();
  if (Platform.OS === 'ios') return ids.iosClientId ?? ids.webClientId;
  if (Platform.OS === 'android') return ids.androidClientId ?? ids.webClientId;
  return ids.webClientId;
}

/**
 * Vérifie si le SDK natif Google Sign-In est lié dans le binaire.
 * true uniquement sur un dev-client ou APK compilé — jamais sur Expo Go.
 */
function isNativeGoogleAvailable(): boolean {
  return Platform.OS !== 'web' && !!NativeModules.RNGoogleSignin;
}

// ─────────────────────────────────────────────
// Stratégie native (dev-client / APK uniquement)
// ─────────────────────────────────────────────
async function signInNative(): Promise<string> {
  // require() conditionnel — ce code n'est JAMAIS appelé sur Expo Go
  // car isNativeGoogleAvailable() renvoie false avant.
  const {
    GoogleSignin,
    isSuccessResponse,
  } = require('@react-native-google-signin/google-signin');

  const ids = getGoogleClientIds();
  GoogleSignin.configure({
    webClientId: ids.webClientId,
    offlineAccess: false,
  });

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error('Connexion Google annulée.');
  }
  const idToken = response.data?.idToken;
  if (!idToken) throw new Error('Jeton Google manquant.');
  return idToken;
}

// ─────────────────────────────────────────────
// Stratégie navigateur (Expo Go — fallback)
// ─────────────────────────────────────────────
async function signInBrowser(): Promise<string> {
  const clientId = resolveGoogleClientId();
  if (!clientId) {
    throw new Error('Google Sign-In non configuré (EXPO_PUBLIC_GOOGLE_*).');
  }

  const codeVerifier = randomUrlSafe(64);
  const codeChallenge = pkceChallenge(codeVerifier);
  const state = randomUrlSafe(16);

  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    prompt: 'select_account',
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${authParams.toString()}`;
  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Connexion Google annulée.');
  }
  if (result.type !== 'success' || !result.url) {
    throw new Error('Connexion Google impossible.');
  }

  const params = parseParams(result.url);
  if (params.error) throw new Error(params.error_description || params.error);
  if (params.state && params.state !== state) throw new Error('State invalide.');
  if (!params.code) throw new Error('Code Google manquant.');

  return exchangeCode(params.code, clientId, codeVerifier);
}

// ─────────────────────────────────────────────
// Point d'entrée
// ─────────────────────────────────────────────

/**
 * Google Sign-In → retourne un idToken JWT.
 *
 * • Dev-client / APK  → SDK natif (Google Play Services)
 * • Expo Go           → message explicite (non supporté)
 * • Web               → flow navigateur PKCE
 */
export async function signInWithGoogleIdToken(): Promise<string> {
  // Dev-client / APK : SDK natif ✅
  if (isNativeGoogleAvailable()) {
    return signInNative();
  }

  // Expo Go sur mobile : pas de SDK natif, le flow navigateur
  // ne marchera pas non plus (redirect_uri_mismatch).
  // → message clair pour l'utilisateur.
  if (Platform.OS !== 'web') {
    throw new Error(
      'Google Sign-In nécessite la version APK.\n' +
      'Exécutez : npm run build:apk && npm run install:apk\n' +
      'puis relancez avec : npm run phone'
    );
  }

  // Web : flow navigateur PKCE
  return signInBrowser();
}

// ─────────────────────────────────────────────
// Utilitaires (zéro dépendance native)
// ─────────────────────────────────────────────

function randomUrlSafe(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function base64UrlEncode(bytes: number[]): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i] ?? 0;
    const b2 = bytes[i + 1] ?? 0;
    const b3 = bytes[i + 2] ?? 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    output += alphabet[(triplet >> 18) & 0x3f];
    output += alphabet[(triplet >> 12) & 0x3f];
    output += i + 1 < bytes.length ? alphabet[(triplet >> 6) & 0x3f] : '=';
    output += i + 2 < bytes.length ? alphabet[triplet & 0x3f] : '=';
  }
  return output.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** PKCE S256 challenge via js-sha256 (pure JS, pas de module natif). */
function pkceChallenge(verifier: string): string {
  return base64UrlEncode(sha256.array(verifier));
}

function parseParams(url: string): Record<string, string> {
  const fragment = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
  const raw = fragment || query;
  const params: Record<string, string> = {};
  for (const part of raw.split('&')) {
    if (!part) continue;
    const [key, ...rest] = part.split('=');
    if (!key) continue;
    params[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
  }
  return params;
}

async function exchangeCode(
  code: string,
  clientId: string,
  codeVerifier: string,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = (await res.json()) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Échange Google impossible.');
  }
  if (!data.id_token) {
    throw new Error('Jeton Google manquant après échange.');
  }
  return data.id_token;
}
