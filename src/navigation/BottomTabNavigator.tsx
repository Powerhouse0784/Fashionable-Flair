import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';
import { TabParamList } from '@/types/navigation';
import { useWishlist } from '@/context/WishlistContext';

import HomeScreen from '@/screens/HomeScreen';
import SearchScreen from '@/screens/SearchScreen';
import WishlistScreen from '@/screens/WishlistScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

function WishlistIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const { wishlistIds } = useWishlist();
  return (
    <View>
      <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
      {wishlistIds.length > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{wishlistIds.length > 9 ? '9+' : wishlistIds.length}</Text>
        </View>
      )}
    </View>
  );
}

export default function BottomTabNavigator({ hideTabBar }: { hideTabBar?: boolean }) {
  // The bug: a hardcoded height/paddingBottom doesn't leave room for the
  // phone's own system navigation bar (Android's 3-button bar or gesture
  // pill), so the tab bar rendered partly underneath it — Android then
  // intercepts those taps for system gestures instead of passing them to
  // the app, which is why the tabs were unclickable. Fix: add the device's
  // actual bottom safe-area inset on top of our base padding.
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: hideTabBar
          ? { display: 'none' }
          : {
              borderTopColor: colors.border,
              height: 50 + bottomPadding,
              paddingBottom: bottomPadding,
              paddingTop: 6,
            },
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.bodySemiBold },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => <WishlistIcon color={color} size={size} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { color: colors.textInverse, fontSize: 9, fontFamily: fonts.bodyBold },
});
