import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import Logo from '@/components/Logo';

interface Props {
  /** Optional content (e.g. quick-access icons) shown on the right side. */
  right?: ReactNode;
}

/**
 * The one narrow-screen ("mobile") top bar used across every tab screen —
 * Search, Wishlist, and Profile all render this exact same component so
 * their headers match in height, logo size, and typography instead of each
 * screen having its own slightly-different brand header. Sits outside
 * Container/ScrollView so it spans the full width edge-to-edge like a real
 * navbar, with its divider line reaching both sides. Only renders on narrow
 * layouts — wide/web screens get the full desktop TopNav instead (see
 * AppShell), so this never needs to carry nav links itself.
 */
export default function MobileTopBar({ right }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.bar}>
      <View style={styles.logoChip}>
        <Logo variant="mark" height={20} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1}>Fashionable Flair</Text>
        <Text style={styles.subtitle} numberOfLines={1}>Jewellery That Speaks Your Style</Text>
      </View>
      {right}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logoChip: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.gold,
    },
    textCol: { flex: 1, minWidth: 0 },
    title: { ...typography.body, fontFamily: fonts.headingMedium, color: colors.textPrimary },
    subtitle: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 9.5,
      marginTop: 1,
    },
  });
}
