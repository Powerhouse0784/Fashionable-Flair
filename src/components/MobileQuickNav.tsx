import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useWishlist } from '@/context/WishlistContext';
import MobileTopBar from '@/components/MobileTopBar';

/**
 * Search screen's narrow-screen header — the same shared MobileTopBar every
 * tab screen uses (see that component for why), plus one-tap access to the
 * three things that aren't otherwise a single tap away from a product-
 * browsing screen: Wishlist (with its live count badge), Testimonials, and
 * Profile. Phones already have the bottom tab bar for Home/Search/Wishlist/
 * Profile, so this isn't a full nav duplicate, just a few quick shortcuts.
 */
export default function MobileQuickNav() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { wishlistIds } = useWishlist();

  return (
    <MobileTopBar
      right={
        <View style={styles.icons}>
          <TouchableOpacity
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => navigation.navigate('Tabs', { screen: 'Wishlist' })}
            accessibilityLabel="Wishlist"
          >
            <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
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
            <Ionicons name="star-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}
            accessibilityLabel="Profile"
          >
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      }
    />
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    icons: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
