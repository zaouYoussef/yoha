import { Platform } from 'react-native';
import { hapticSuccess } from './haptics';
import { loadNotifications } from './notificationsLoader';

type InitState = 'pending' | 'ready' | 'unavailable';

let initState: InitState = 'pending';

export async function initOrderNotifications(): Promise<boolean> {
  if (initState === 'ready') return true;
  if (initState === 'unavailable') return false;

  try {
    const Notifications = await loadNotifications();
    if (!Notifications) {
      initState = 'unavailable';
      return false;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Commandes YouHa',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 200, 120, 200],
        enableVibrate: true,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      });
      finalStatus = status;
    }

    initState = finalStatus === 'granted' ? 'ready' : 'unavailable';
    return initState === 'ready';
  } catch {
    initState = 'unavailable';
    return false;
  }
}

export async function notifyOrderEvent(title: string, body: string, orderId?: string) {
  try {
    const ok = await initOrderNotifications();
    if (!ok) return;
    const Notifications = await loadNotifications();
    if (!Notifications) return;

    await hapticSuccess();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: orderId ? { orderId } : {},
        ...(Platform.OS === 'android' ? { channelId: 'orders' } : {}),
      },
      trigger: null,
    });
  } catch {
    // Permissions refusées ou module indisponible
  }
}
