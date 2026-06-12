import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export type LocalNotificationsModule = {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner: boolean;
      shouldShowList: boolean;
    }>;
  }) => void;
  setNotificationChannelAsync: (
    channelId: string,
    channel: Record<string, unknown>,
  ) => Promise<unknown>;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: (opts?: Record<string, unknown>) => Promise<{ status: string }>;
  scheduleNotificationAsync: (request: Record<string, unknown>) => Promise<string>;
  AndroidImportance: { HIGH: number };
};

let localCached: LocalNotificationsModule | null | undefined;

/** Push serveur (ExponentPushToken) — absent dans Expo Go SDK 56+. */
export function isPushTokenNativeAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  return requireOptionalNativeModule('ExpoPushTokenManager') != null;
}

/** Notifications locales (alertes commande in-app). */
export function isLocalNotificationsNativeAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  return (
    requireOptionalNativeModule('ExpoNotificationScheduler') != null &&
    requireOptionalNativeModule('ExpoNotificationsHandlerModule') != null &&
    requireOptionalNativeModule('ExpoNotificationPermissionsModule') != null
  );
}

/**
 * Charge les API de notifications locales sans importer le barrel expo-notifications
 * (qui tire ExpoPushTokenManager et crash si le module natif manque).
 */
export async function loadNotifications(): Promise<LocalNotificationsModule | null> {
  if (localCached !== undefined) return localCached;

  if (!isLocalNotificationsNativeAvailable()) {
    localCached = null;
    return null;
  }

  try {
    const [handlerMod, permMod, schedMod, channelMod, typesMod] = await Promise.all([
      import('expo-notifications/build/NotificationsHandler'),
      import('expo-notifications/build/NotificationPermissions'),
      import('expo-notifications/build/scheduleNotificationAsync'),
      import('expo-notifications/build/setNotificationChannelAsync'),
      import('expo-notifications/build/NotificationChannelManager.types'),
    ]);

    if (typeof handlerMod.setNotificationHandler !== 'function') {
      throw new Error('expo-notifications: setNotificationHandler indisponible');
    }

    localCached = {
      setNotificationHandler: handlerMod.setNotificationHandler,
      getPermissionsAsync: permMod.getPermissionsAsync,
      requestPermissionsAsync: permMod.requestPermissionsAsync,
      scheduleNotificationAsync: schedMod.scheduleNotificationAsync,
      setNotificationChannelAsync: channelMod.setNotificationChannelAsync,
      AndroidImportance: typesMod.AndroidImportance,
    };
    return localCached;
  } catch (e) {
    console.warn('[notifications] Chargement impossible — dev build requis pour les alertes', e);
    localCached = null;
    return null;
  }
}

/** Token Expo Push — uniquement si ExpoPushTokenManager est présent (dev build). */
export async function getExpoPushToken(projectId: string): Promise<string | null> {
  if (!isPushTokenNativeAvailable()) return null;

  try {
    const { getExpoPushTokenAsync } = await import(
      'expo-notifications/build/getExpoPushTokenAsync'
    );
    const tokenData = await getExpoPushTokenAsync({ projectId });
    return tokenData.data || null;
  } catch (e) {
    console.warn('[push] token indisponible', e);
    return null;
  }
}
