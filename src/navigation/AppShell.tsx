import React from 'react';
import { View, StyleSheet } from 'react-native';
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

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {isWide && <TopNav />}
      <BottomTabNavigator hideTabBar={isWide} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
