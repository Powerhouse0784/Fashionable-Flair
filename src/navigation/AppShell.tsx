import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import TopNav from '@/components/TopNav';
import BottomTabNavigator from './BottomTabNavigator';

/**
 * Renders the app's tab content plus the *correct* navigation chrome for
 * the current viewport:
 *  - Phone (native app, or a narrow browser tab): bottom tab bar, as before.
 *  - Desktop web: a sticky top nav bar instead, and the bottom tab bar is
 *    hidden — a bottom strip stretched across a 1900px browser window
 *    looks broken, a top nav is the pattern people actually expect on a site.
 */
export default function AppShell() {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const isFocused = useIsFocused();

  // This "Tabs" screen stays mounted (just covered) the whole time a
  // stacked screen sits on top of it — ProductDetail, About, Contact,
  // Testimonials, any of the Profile menu's destinations. Reported bug:
  // coming back from one of those left the bottom tab bar's own bottom
  // inset measured from whatever moment it happened to last re-render
  // while covered (e.g. mid keyboard-resize on a screen with a text
  // field), showing up as a band of dead space between the bar and the
  // real bottom of the screen until something else happened to force a
  // fresh layout. Rather than chase that exact timing, force a full
  // remount of the tab bar the instant this screen is focused again —
  // that's a guaranteed clean layout pass every time, regardless of
  // whatever the covering screen was doing.
  const [remountKey, setRemountKey] = useState(0);
  useEffect(() => {
    if (isFocused) setRemountKey((k) => k + 1);
  }, [isFocused]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {isWide && <TopNav />}
      <BottomTabNavigator key={remountKey} hideTabBar={isWide} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
