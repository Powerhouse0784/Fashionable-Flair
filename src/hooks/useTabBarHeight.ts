import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Single source of truth for the bottom tab bar's actual rendered height,
 * so anything that needs to sit just above it (right now: the chat FAB)
 * can't drift out of sync with BottomTabNavigator's own sizing — that
 * mismatch was exactly what caused the FAB to sit at the wrong height
 * after the tab bar was made taller for web.
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'web' ? 14 : 10);
  return (Platform.OS === 'web' ? 66 : 60) + bottomPadding;
}
