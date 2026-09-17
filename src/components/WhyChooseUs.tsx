import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';

const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'sparkles-outline',
    title: 'Crafted to Shine',
    body: 'Every piece is hand-checked before it ships, so what lands on your doorstep looks every bit as brilliant as what caught your eye online.',
  },
  {
    icon: 'pricetag-outline',
    title: 'Style Without the Splurge',
    body: 'Gorgeous designs at prices that let you treat yourself a little more often — beautiful jewellery was never meant to be out of reach.',
  },
  {
    icon: 'rocket-outline',
    title: 'Doorstep, Guaranteed',
    body: "From our hands to yours — every order is packed with care and tracked all the way, wherever you are in India.",
  },
];

/**
 * "Why choose us" trust-feature row. Same 3-column layout the client
 * referenced, but with original copy written for Fashionable Flair rather
 * than reusing the reference site's wording. Wraps to a single column on
 * phones, sits as 3 even columns from tablet width up.
 */
export default function WhyChooseUs() {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const styles = makeStyles(colors);

  return (
    <View style={styles.wrap}>
      {FEATURES.map((f) => (
        <View key={f.title} style={[styles.card, isWide && styles.cardWide]}>
          <View style={styles.iconWrap}>
            <Ionicons name={f.icon as any} size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>{f.title}</Text>
          <Text style={styles.body}>{f.body}</Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    card: {
      flexGrow: 1,
      flexBasis: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    cardWide: {
      flexBasis: '31%',
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h3,
      fontFamily: fonts.headingMedium,
      color: colors.primaryDark,
      marginBottom: spacing.xs,
    },
    body: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 19 },
  });
}
