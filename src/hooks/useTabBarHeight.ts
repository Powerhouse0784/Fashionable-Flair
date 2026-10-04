import { Platform } from 'react-native';
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';

// No real device's gesture bar / home indicator needs more than this — a
// reading above it is a bad measurement, not a bigger phone.
const MAX_SANE_BOTTOM_INSET = 48;

// A phone's bottom safe-area inset (gesture bar / home indicator) is fixed
// for the life of the app — it doesn't need to be read live. Reading it
// live via useSafeAreaInsets() was exactly the bug: that value also reacts
// to every screen transition, and popping a screen that had been covering
// the tab bar (ProductDetail, or any of Terms/About/FAQ/Privacy/
// Testimonials from Profile's menu) could catch it mid-transition and
// freeze on a much-too-large number — the reported "tab bar floats up
// with a gap under it" bug.
//
// initialWindowMetrics (captured by the library before this app's first
// render) is the first choice, but it's well documented to come back null
// on a meaningful slice of Android devices/OS versions — and on exactly
// those devices, falling back to the live hook put the bug right back:
// still reactive, still corruptible by the next screen transition. This
// module-level cache is the actual fix for that gap: the first time any
// component on this screen successfully reads a real insets.bottom value,
// it's latched here for the rest of the app's lifetime, so even a device
// where initialWindowMetrics is null only ever has ONE chance to be wrong
// (briefly, on the very first render) rather than every single time a
// screen is popped.
let cachedBottomInset: number | null = null;

function getStableBottomInset(liveValue: number): number {
  if (cachedBottomInset === null) {
    const first = initialWindowMetrics?.insets.bottom ?? liveValue;
    cachedBottomInset = Math.min(first, MAX_SANE_BOTTOM_INSET);
  }
  return cachedBottomInset;
}

/** Everything about the tab bar's bottom padding — exported so
 * BottomTabNavigator and this hook can't independently compute slightly
 * different numbers for what's supposed to be the exact same bar. */
export function useTabBarMetrics(): { height: number; bottomPadding: number } {
  const insets = useSafeAreaInsets();
  const safeBottomInset = getStableBottomInset(insets.bottom);
  // Web has no notch/gesture-bar equivalent, so insets.bottom is always 0
  // there — giving it the same minimum as native left too little vertical
  // room for the label text in a fixed-height flex row, and the label got
  // clipped at the bottom edge on narrower web windows. Web gets a bigger
  // floor.
  const bottomPadding = Math.max(safeBottomInset, Platform.OS === 'web' ? 14 : 10);
  const height = (Platform.OS === 'web' ? 66 : 60) + bottomPadding;
  return { height, bottomPadding };
}

/** Just the height, for callers (the chat FAB) that only need to sit above
 * the bar and don't care about its internal padding breakdown. */
export function useTabBarHeight(): number {
  return useTabBarMetrics().height;
}
