import { Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { hapticImpact } from '@/utils/haptics';

/**
 * Native app: push the in-app WebView modal (MeeshoRedirectScreen) so the
 * purchase happens without leaving the app.
 * Web app: open Meesho in a new browser tab. Meesho's site sends
 * X-Frame-Options headers that block iframes/WebViews on desktop browsers,
 * so a new tab is both the safer and the more familiar pattern for web
 * shoppers anyway.
 */
export function goToMeesho(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  url: string,
  productTitle: string
) {
  hapticImpact();
  if (Platform.OS === 'web') {
    const win = (globalThis as any).window;
    win?.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  navigation.navigate('MeeshoRedirect', { url, productTitle });
}
