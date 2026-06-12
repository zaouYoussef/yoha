import { Share } from 'react-native';

/** Copie sans importer expo-clipboard au chargement (dev-client ancien). */
export async function copyText(text: string): Promise<'copied' | 'shared' | 'failed'> {
  try {
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return 'copied';
  } catch {
    try {
      await Share.share({ message: text });
      return 'shared';
    } catch {
      return 'failed';
    }
  }
}
