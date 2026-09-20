import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm (two-button decision). React Native's Alert.alert
 * silently does nothing on web — no dialog, no error, the app just looks
 * like the button isn't wired up at all. This uses the browser's built-in
 * confirm() there instead, and the real native Alert.alert everywhere else.
 */
export function confirmAsync(title: string, message?: string, confirmLabel = 'Confirm'): Promise<boolean> {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

/** Cross-platform single-button info alert — same underlying problem
 * (Alert.alert is a no-op on web), same fix. */
export function alertInfo(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined') window.alert(text);
    return;
  }
  Alert.alert(title, message);
}
