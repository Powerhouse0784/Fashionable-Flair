import React, { createContext, useContext, useRef } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';

const MIN_DELTA = 6; // ignore tiny jitter/rubber-band scroll noise
const TOP_THRESHOLD = 24; // always show near the very top of a page
// React Native Web has no native animation thread — this value is combined
// with other Animated values in QuickActionsSidebar, so it needs to match
// whichever driver those use on a given platform, or driving it with the
// native driver here while a consumer runs on the JS driver would still
// print the same "not supported on web" warning this exists to avoid.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface ScrollVisibilityContextValue {
  /** 1 = fully shown, 0 = hidden. Mutated directly (no re-renders) so this
   * is safe to drive from a scroll handler firing on every frame. */
  visibility: Animated.Value;
  /** Attach directly to any screen's ScrollView/FlatList onScroll prop
   * (pair with scrollEventThrottle={16}) to have that screen's scrolling
   * drive the shared visibility value. */
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const ScrollVisibilityContext = createContext<ScrollVisibilityContextValue | null>(null);

/**
 * Wrap the app once with this so any screen can report its scroll
 * position and have floating chrome (right now: QuickActionsSidebar)
 * hide while the person is actively scrolling down to read, then reappear
 * the moment they scroll back up or land near the top — the pattern most
 * shopping apps use so a floating button doesn't sit over content while
 * you're reading it, without needing to route scroll state through props
 * or duplicate this logic on every screen.
 */
export function ScrollVisibilityProvider({ children }: { children: React.ReactNode }) {
  const visibility = useRef(new Animated.Value(1)).current;
  const lastY = useRef(0);
  const lastDirection = useRef<'up' | 'down' | null>(null);

  const show = () => {
    if (lastDirection.current !== 'up') {
      lastDirection.current = 'up';
      Animated.timing(visibility, { toValue: 1, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }).start();
    }
  };
  const hide = () => {
    if (lastDirection.current !== 'down') {
      lastDirection.current = 'down';
      Animated.timing(visibility, { toValue: 0, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }).start();
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastY.current;
    lastY.current = y;

    if (y <= TOP_THRESHOLD) {
      show();
      return;
    }
    if (delta > MIN_DELTA) hide();
    else if (delta < -MIN_DELTA) show();
  };

  return (
    <ScrollVisibilityContext.Provider value={{ visibility, handleScroll }}>{children}</ScrollVisibilityContext.Provider>
  );
}

/** For screens: wire this straight into onScroll (+ scrollEventThrottle={16}). */
export function useScrollVisibilityHandler() {
  const ctx = useContext(ScrollVisibilityContext);
  // Falls back to a no-op outside the provider so a screen never crashes
  // if it's ever rendered standalone (e.g. in a test) — it just won't
  // participate in the hide-on-scroll behavior.
  return ctx?.handleScroll ?? (() => {});
}

/** For the sidebar: the shared Animated.Value (1 = shown, 0 = hidden). */
export function useScrollVisibility(): Animated.Value {
  const ctx = useContext(ScrollVisibilityContext);
  const fallback = useRef(new Animated.Value(1)).current;
  return ctx?.visibility ?? fallback;
}
