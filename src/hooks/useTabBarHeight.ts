import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// No real device's gesture bar / home indicator needs more than this — a
// reading above it is a bad measurement, not a bigger phone, and letting
// it through verbatim is exactly what turned a momentary bad reading
// (reported bug: returning from a stacked screen like ProductDetail or
// one of Profile's menu destinations) into a visible band of dead space
// under the tab bar. Clamping is a cheap backstop on top of the real fix
// (AppShell remounts the tab bar on refocus) — belt and suspenders.
const MAX_SANE_BOTTOM_INSET = 48;

/**
 * Single source of truth for the bottom tab bar's actual rendered height,
 * so anything that needs to sit just above it (right now: the chat FAB)
 * can't drift out of sync with BottomTabNavigator's own sizing — that
 * mismatch was exactly what caused the FAB to sit at the wrong height
 * after the tab bar was made taller for web.
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const safeBottomInset = Math.min(insets.bottom, MAX_SANE_BOTTOM_INSET);
  const bottomPadding = Math.max(safeBottomInset, Platform.OS === 'web' ? 14 : 10);
  return (Platform.OS === 'web' ? 66 : 60) + bottomPadding;
}
