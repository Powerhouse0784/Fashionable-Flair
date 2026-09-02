import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { TabParamList } from '@/types/navigation';
import { useWishlist } from '@/context/WishlistContext';

import HomeScreen from '@/screens/HomeScreen';
import SearchScreen from '@/screens/SearchScreen';
import WishlistScreen from '@/screens/WishlistScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

// Icon sits inside a soft pill that fills in with the brand color when the
// tab is active — a much more "considered" feel than a bare color change,
// and the pattern most modern shopping apps use (Amazon, Myntra, etc).
function TabIcon({
  name,
  focused,
  badge,
  colors,
}: {
  name: any;
  focused: boolean;
  badge?: number;
  colors: ColorTheme;
}) {
  const styles = makeStyles(colors);
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons name={name} size={20} color={focused ? colors.textInverse : colors.textMuted} />
      {!!badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

function WishlistTabIcon({ focused, colors }: { focused: boolean; colors: ColorTheme }) {
  const { wishlistIds } = useWishlist();
  return (
    <TabIcon name={focused ? 'heart' : 'heart-outline'} focused={focused} badge={wishlistIds.length} colors={colors} />
  );
}

export default function BottomTabNavigator({ hideTabBar }: { hideTabBar?: boolean }) {
  const { colors } = useTheme();
  // A hardcoded height/paddingBottom doesn't leave room for the phone's own
  // system navigation bar (Android's 3-button bar or gesture pill), so the
  // tab bar would render partly underneath it and those taps get eaten by
  // system gestures instead of reaching the app. Fix: add the device's
  // actual bottom safe-area inset on top of our base padding.
  const insets = useSafeAreaInsets();
  // Web has no notch/gesture-bar equivalent, so insets.bottom is always 0
  // there — giving it the same minimum as native left too little vertical
  // room for the label text in a fixed-height flex row, and the label got
  // clipped at the bottom edge on narrower web windows. Web gets a bigger
  // floor. (Shared with ChatWidget via useTabBarHeight so the two can't
  // drift out of sync again.)
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'web' ? 14 : 10);
  const tabBarHeight = useTabBarHeight();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: hideTabBar
          ? { display: 'none' }
          : {
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
              height: tabBarHeight,
              paddingBottom: bottomPadding,
              paddingTop: 10,
              ...(Platform.OS === 'web'
                ? ({ boxShadow: `0 -2px 12px ${colors.shadow}` } as any)
                : {
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    elevation: 8,
                  }),
            },
        // Explicit lineHeight (rather than relying on the platform default
        // plus a marginTop) is what actually stops the clipping — browsers
        // and native compute a Text node's box height from font metrics
        // slightly differently, and the old marginTop-based spacing left
        // just enough of a gap on web to cut off the bottom of the label.
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontFamily: fonts.bodySemiBold },
        tabBarItemStyle: { paddingTop: 4, paddingBottom: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarIcon: ({ focused }) => <WishlistTabIcon focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} colors={colors} />,
        }}
      />
    </Tab.Navigator>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    iconPill: {
      width: 42,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconPillActive: { backgroundColor: colors.primary },
    badge: {
      position: 'absolute',
      top: -4,
      right: 2,
      backgroundColor: colors.danger,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    badgeText: { color: colors.textInverse, fontSize: 9, fontFamily: fonts.bodyBold },
  });
}
