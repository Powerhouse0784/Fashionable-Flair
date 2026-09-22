import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';

// Each feature has its own badge artwork (rounded-square scenes in
// src/assets/features, with a gold rim baked in). They're detailed little
// illustrations rather than flat icons, so they're shown a bit larger than a
// plain icon would be — see `icon` in makeStyles.
const FEATURES: { image: any; alt: string; title: string; body: string }[] = [
  {
    image: require('@/assets/features/feature-crafted.png'),
    alt: 'Jeweller inspecting a diamond ring with a loupe next to a quality checklist',
    title: 'Crafted to Shine',
    body: 'Every piece is hand-checked before it ships, so what lands on your doorstep looks every bit as brilliant as what caught your eye online.',
  },
  {
    image: require('@/assets/features/feature-style.png'),
    alt: '"Beautiful Jewellery for Less" price tag with a necklace box and rupee coins',
    title: 'Style Without the Splurge',
    body: 'Gorgeous designs at prices that let you treat yourself a little more often — beautiful jewellery was never meant to be out of reach.',
  },
  {
    image: require('@/assets/features/feature-delivery.png'),
    alt: 'Delivery rider with a gift box and a phone showing order tracking across an India map',
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
          <Image
            source={f.image}
            style={styles.icon}
            resizeMode="contain"
            accessibilityLabel={f.alt}
            accessibilityIgnoresInvertColors
          />
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
    // Badge artwork: a small illustrated scene, not a flat icon, so it needs
    // a bit more room than a simple glyph to actually read — 72px keeps it
    // clearly a supporting accent above the title rather than the focus of
    // the card.
    icon: {
      width: 72,
      height: 72,
      borderRadius: 18,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h3,
      fontFamily: fonts.headingMedium,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    body: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 19 },
  });
}
