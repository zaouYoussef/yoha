import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'yoha-favorite-restaurants';

export async function getFavoriteIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(slug: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  const next = ids.includes(slug) ? ids.filter((id) => id !== slug) : [...ids, slug];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next.includes(slug);
}

export async function isFavorite(slug: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  return ids.includes(slug);
}
