import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useWishlist } from '@/context/WishlistContext';
import { useContentMetrics } from '@/hooks/useResponsive';

const NAV_ITEMS: { label: string; tab: 'Home' | 'Search' | 'Wishlist' | 'Profile'; icon: string }[] = [
  { label: 'Home', tab: 'Home', icon: 'home-outline' },
  { label: 'Shop', tab: 'Search', icon: 'search-outline' },
  { label: 'Wishlist', tab: 'Wishlist', icon: 'heart-outline' },
  { label: 'Account', tab: 'Profile', icon: 'person-outline' },
];

/**
 * Desktop-web-only top navigation bar. Replaces the bottom tab strip
 * (a mobile pattern that looks broken stretched across a browser window)
 * with a normal site header: logo left, nav links right, sticky on scroll.
 */
export default function TopNav() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { wishlistIds } = useWishlist();
  const { sidePadding } = useContentMetrics();

  // Read the currently active bottom-tab route name (if any) so we can
  // highlight the matching nav link.
  const activeTab = useNavigationState((state) => {
    const tabsRoute = state.routes.find((r) => r.name === 'Tabs');
    // @ts-ignore - nested navigator state
    return tabsRoute?.state?.routes?.[tabsRoute.state.index ?? 0]?.name;
  });

  const goToTab = (tab: string) => navigation.navigate('Tabs', { screen: tab });

  return (
    <View style={styles.wrap}>
      <View style={[styles.inner, { paddingHorizontal: sidePadding }]}>
        <TouchableOpacity style={styles.brandRow} onPress={() => goToTab('Home')}>
          <View style={styles.logoDot}>
            <Ionicons name="diamond" size={16} color={colors.textInverse} />
          </View>
          <Text style={styles.brand}>Fashionable Flair</Text>
        </TouchableOpacity>

        <View style={styles.links}>
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.tab;
            return (
              <TouchableOpacity key={item.tab} style={styles.link} onPress={() => goToTab(item.tab)}>
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.linkText, active && styles.linkTextActive]}>{item.label}</Text>
                {item.tab === 'Wishlist' && wishlistIds.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{wishlistIds.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: {
      width: '100%',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      ...(Platform.OS === 'web'
        ? ({ position: 'sticky', top: 0, zIndex: 20, boxShadow: `0 2px 12px ${colors.shadow}` } as any)
        : {}),
    },
    inner: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    logoDot: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: { ...typography.h3, color: colors.textPrimary },
    links: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
    link: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, position: 'relative' },
    linkText: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    linkTextActive: { color: colors.primary },
    badge: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      marginLeft: 2,
    },
    badgeText: { color: colors.textInverse, fontSize: 9, fontFamily: fonts.bodyBold },
  });
}
