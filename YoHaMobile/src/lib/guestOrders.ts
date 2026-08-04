import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'yoha-guest-order-ids';
const EMAIL_KEY = 'yoha-guest-order-email';
const MAX = 30;

export async function getGuestOrderIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function getGuestOrderEmail(): Promise<string> {
  try {
    return ((await AsyncStorage.getItem(EMAIL_KEY)) || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

export async function addGuestOrderId(publicId: string, email = '') {
  if (!publicId) return;
  const ids = (await getGuestOrderIds()).filter((id) => id !== publicId);
  await AsyncStorage.setItem(KEY, JSON.stringify([publicId, ...ids].slice(0, MAX)));
  if (email) {
    await AsyncStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
  }
}

export async function clearGuestOrderIds() {
  await AsyncStorage.multiRemove([KEY, EMAIL_KEY]);
}
