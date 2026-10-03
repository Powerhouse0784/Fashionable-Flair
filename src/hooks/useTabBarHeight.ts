import { Platform } from 'react-native';
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';

// No real device's gesture bar / home indicator needs more than this — a
// reading above it is a bad measurement, not a bigger phone. Kept as a
// backstop even now that the value below is read once at launch rather
// than live (see getStableBottomInset).
const MAX_SANE_BOTTOM_INSET = 48;

/**
 * A phone's bottom safe-area inset (gesture bar / home indicator) is fixed
 * for the life of the app — it doesn't need to be read live. Reading it
 * live via useSafeAreaInsets() was exactly the bug: that value is also
 * what reacts to every screen transition, keyboard show/hide, etc., and
 * popping a screen that had been covering the tab bar (ProductDetail, or
 * any of Terms/About/FAQ/Privacy/Testimonials from Profile's menu) could
 * catch it mid-transition and freeze on a much-too-large number — the
 * reported "tab bar floats up with a gap under it" bug. Reading it once
 * from initialWindowMetrics, captured by the library before this app's
 * first render and never touched again, can't be affected by any of that
 * — not a timing fix, there's no longer anything timing-sensitive to fix.
 */
function getStableBottomInset(liveFallback: number): number {
  const raw = initialWindowMetrics?.insets.bottom ?? liveFallback;
  return Math.min(raw, MAX_SANE_BOTTOM_INSET);
}

/**
 * Single source of truth for the bottom tab bar's actual rendered height,
 * so anything that needs to sit just above it (right now: the chat FAB)
 * can't drift out of sync with BottomTabNavigator's own sizing — that
 * mismatch was exactly what caused the FAB to sit at the wrong height
 * after the tab bar was made taller for web.
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const safeBottomInset = getStableBottomInset(insets.bottom);
  const bottomPadding = Math.max(safeBottomInset, Platform.OS === 'web' ? 14 : 10);
  return (Platform.OS === 'web' ? 66 : 60) + bottomPadding;
}
