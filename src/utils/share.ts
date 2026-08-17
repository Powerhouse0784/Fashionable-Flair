import { Platform, Share, Alert } from 'react-native';

/**
 * Cross-platform share. Native (iOS/Android) uses the system share sheet.
 * Web uses the browser's native Web Share API when available (mobile
 * Chrome/Safari), and falls back to copying the link to the clipboard on
 * desktop browsers that don't support it.
 */
export async function shareProduct(title: string, url: string) {
  const message = `Check out ${title} on Fashionable Flair — ${url}`;

  if (Platform.OS === 'web') {
    const nav = (globalThis as any).navigator;
    if (nav?.share) {
      try {
        await nav.share({ title, text: title, url });
      } catch {
        // user cancelled the native web share sheet — no-op
      }
      return;
    }
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(url);
      Alert.alert('Link copied', 'Product link copied to clipboard.');
      return;
    }
    return;
  }

  try {
    await Share.share({ message });
  } catch (err) {
    console.warn('Share failed', err);
  }
}
