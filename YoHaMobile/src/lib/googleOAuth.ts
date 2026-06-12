import * as WebBrowser from 'expo-web-browser';
import { sha256 } from 'js-sha256';
import { Platform } from 'react-native';
import { getGoogleClientIds } from './socialAuth';

const REDIRECT_URI = 'youha://oauthredirect';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

WebBrowser.maybeCompleteAuthSession();

export function resolveGoogleClientId(): string | undefined {
  const ids = getGoogleClientIds();
  if (Platform.OS === 'ios') return ids.iosClientId ?? ids.webClientId;
  if (Platform.OS === 'android') return ids.androidClientId ?? ids.webClientId;
  return ids.webClientId;
}

function randomUrlSafeString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function base64UrlEncodeBytes(bytes: number[]): string {
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

function pkceChallenge(verifier: string): string {
  return base64UrlEncodeBytes(sha256.array(verifier));
}

function parseAuthParams(url: string): Record<string, string> {
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

async function exchangeCodeForIdToken(
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

/** OAuth Google via navigateur — sans expo-auth-session / expo-crypto natifs. */
export async function signInWithGoogleIdToken(): Promise<string> {
  const clientId = resolveGoogleClientId();
  if (!clientId) {
    throw new Error('Google Sign-In non configuré (EXPO_PUBLIC_GOOGLE_*).');
  }

  const codeVerifier = randomUrlSafeString(64);
  const codeChallenge = pkceChallenge(codeVerifier);
  const state = randomUrlSafeString(16);

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

  const params = parseAuthParams(result.url);
  if (params.error) {
    throw new Error(params.error_description || params.error);
  }
  if (params.state && params.state !== state) {
    throw new Error('Réponse Google invalide (state).');
  }
  if (!params.code) {
    throw new Error('Code Google manquant.');
  }

  return exchangeCodeForIdToken(params.code, clientId, codeVerifier);
}
