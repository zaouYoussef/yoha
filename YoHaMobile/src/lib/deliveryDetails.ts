import AsyncStorage from '@react-native-async-storage/async-storage';

export type DeliveryDetails = {
  name: string;
  email: string;
  address: string;
  floor: string;
  phone: string;
  notes: string;
  addressPreset: string;
  payment: 'cash' | 'card';
  scheduledTime?: string;
};

const KEY = '@yoha_delivery_details';

export async function getStoredDeliveryDetails(): Promise<DeliveryDetails | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DeliveryDetails;
  } catch {
    return null;
  }
}

export async function saveDeliveryDetails(details: DeliveryDetails): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(details));
  } catch (e) {
    console.error('Error saving delivery details', e);
  }
}

export async function hasStoredDeliveryDetails(): Promise<boolean> {
  try {
    const details = await getStoredDeliveryDetails();
    if (!details) return false;
    return !!(details.name?.trim() && details.address?.trim() && details.phone?.trim());
  } catch {
    return false;
  }
}
