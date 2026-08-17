import { Linking, Alert } from 'react-native';

/**
 * Opens a Meesho product URL. Tries the native Meesho app deep link first
 * (if installed), and falls back to opening it inside the app's own WebView
 * screen (see MeeshoRedirectScreen) which is the default flow used by
 * ProductDetailScreen. This helper is for cases where you want to break out
 * to the system browser/app entirely instead of the in-app WebView.
 */
export async function openExternally(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  } catch (err) {
    console.warn('Failed to open URL', err);
    Alert.alert('Something went wrong', 'Please try again later.');
  }
}
