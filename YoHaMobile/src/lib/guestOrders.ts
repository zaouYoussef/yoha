import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'yoha-guest-order-ids';
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

export async function addGuestOrderId(publicId: string) {
  if (!publicId) return;
  const ids = (await getGuestOrderIds()).filter((id) => id !== publicId);
  await AsyncStorage.setItem(KEY, JSON.stringify([publicId, ...ids].slice(0, MAX)));
}

export async function clearGuestOrderIds() {
  await AsyncStorage.removeItem(KEY);
}
