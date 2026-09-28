import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useWishlist } from '@/context/WishlistContext';
import Logo from '@/components/Logo';

/**
 * Narrow-screen equivalent of TopNav (which only renders on wide/desktop
 * web — see AppShell). Phones already have the bottom tab bar for Home/
 * Search/Wishlist/Profile, so this isn't a full nav duplicate — just the
 * brand mark plus one-tap access to the three things that aren't otherwise
 * a single tap away from a product-browsing screen: Wishlist (with its
 * live count badge), Testimonials, and Profile.
 */
export default function MobileQuickNav() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { wishlistIds } = useWishlist();

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <Logo variant="mark" height={36} />
        <Text style={styles.brandText} numberOfLines={1}>
          Fashionable Flair
        </Text>
      </View>

      <View style={styles.icons}>
        <TouchableOpacity
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => navigation.navigate('Tabs', { screen: 'Wishlist' })}
          accessibilityLabel="Wishlist"
        >
          <Ionicons name="heart-outline" size={21} color={colors.textSecondary} />
          {wishlistIds.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wishlistIds.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => navigation.navigate('Testimonials')}
          accessibilityLabel="Testimonials"
        >
          <Ionicons name="star-outline" size={21} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}
          accessibilityLabel="Profile"
        >
          <Ionicons name="person-outline" size={21} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
    brandText: { ...typography.h3, color: colors.textPrimary, fontFamily: fonts.heading, flexShrink: 1 },
    icons: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    iconButton: { position: 'relative' },
    badge: {
      position: 'absolute',
      top: -5,
      right: -7,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      minWidth: 15,
      height: 15,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { color: colors.textInverse, fontSize: 9, fontFamily: fonts.bodyBold },
  });
}
