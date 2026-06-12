import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authApi, ordersApi } from './api';
import { getGuestOrderIds } from './guestOrders';
import { initOrderNotifications } from './orderNotifications';
import { getExpoPushToken, isPushTokenNativeAvailable } from './notificationsLoader';

function resolveProjectId(): string | undefined {
  const expoConfig = Constants.expoConfig as { extra?: { eas?: { projectId?: string } } } | null;
  return (
    expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

let lastRegisteredToken: string | null = null;

async function obtainPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !isPushTokenNativeAvailable()) return null;

  const granted = await initOrderNotifications();
  if (!granted) return null;

  const projectId = resolveProjectId();
  if (!projectId) {
    console.warn('[push] projectId manquant — lancez: npx eas init');
    return null;
  }

  return getExpoPushToken(projectId);
}

/** Abonne l'appareil aux push d'une ou plusieurs commandes (invité ou connecté). */
export async function subscribeOrdersPush(publicIds: string[]): Promise<void> {
  const ids = publicIds.filter(Boolean);
  if (!ids.length) return;

  const token = await obtainPushToken();
  if (!token) return;

  try {
    await ordersApi.subscribePush(token, ids, Platform.OS);
    lastRegisteredToken = token;
  } catch (e) {
    console.warn('[push] subscribe échoué', e);
  }
}

/** Compte connecté — token global + abonnement aux commandes locales. */
export async function registerPushTokenForUser(): Promise<void> {
  const token = await obtainPushToken();
  if (!token) return;

  if (token !== lastRegisteredToken) {
    try {
      await authApi.registerPushToken(token, Platform.OS);
      lastRegisteredToken = token;
    } catch (e) {
      console.warn('[push] enregistrement échoué', e);
    }
  }

  const guestIds = await getGuestOrderIds();
  if (guestIds.length) await subscribeOrdersPush(guestIds);
}

/** Invité — abonne le token aux commandes stockées sur l'appareil. */
export async function registerGuestOrderPush(): Promise<void> {
  const guestIds = await getGuestOrderIds();
  if (!guestIds.length) return;
  await subscribeOrdersPush(guestIds);
}

export async function unregisterPushToken(): Promise<void> {
  if (!lastRegisteredToken) return;
  try {
    await authApi.unregisterPushToken(lastRegisteredToken);
  } catch {
    // ignore
  }
  lastRegisteredToken = null;
}
