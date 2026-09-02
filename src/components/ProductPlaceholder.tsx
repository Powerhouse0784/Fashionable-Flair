import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { CategoryKey } from '@/types/product';

const CATEGORY_ICON: Record<CategoryKey, string> = {
  earrings: 'diamond-outline',
  necklaces: 'ellipse-outline',
  pendants: 'heart-outline',
  'jewellery-sets': 'sparkles-outline',
  bracelets: 'infinite-outline',
  'hair-accessories': 'flower-outline',
};

interface Props {
  category: CategoryKey;
  compact?: boolean; // hides the caption on small carousel cards where it'd feel cramped
}

/**
 * Honest, deliberately-designed stand-in for a missing product photo —
 * a soft tinted card with a category icon, not a placeholder-generator
 * text box. Swap it out automatically the moment `product.image` points
 * to a real photo instead of the placehold.co URLs seeded in data/products.ts
 * (see ProductCard / ProductDetailScreen — they check for that already).
 */
export default function ProductPlaceholder({ category, compact }: Props) {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const categoryTint: Record<CategoryKey, string> = {
    earrings: colors.primaryLight,
    necklaces: colors.goldLight,
    pendants: colors.primaryLight,
    'jewellery-sets': colors.goldLight,
    bracelets: colors.primaryLight,
    'hair-accessories': colors.goldLight,
  };
  const icon = CATEGORY_ICON[category] ?? 'sparkles-outline';
  const tint = categoryTint[category] ?? colors.surfaceAlt;
  // The rings need to recede into the tint, not fight it — a bright white
  // overlay worked in light mode but washed out against dark mode's darker,
  // more saturated tint colors, and left the icon low-contrast on top of it.
  // A dark overlay on dark mode keeps the same "soft ring" effect while
  // staying visually correct against a dark tint.
  const ringOuterColor = isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.4)';
  const ringInnerColor = isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.6)';

  return (
    <View style={[styles.wrap, { backgroundColor: tint }]}>
      <View style={[styles.ringOuter, { backgroundColor: ringOuterColor }]}>
        <View style={[styles.ringInner, { backgroundColor: ringInnerColor }]}>
          <Ionicons name={icon as any} size={compact ? 26 : 36} color={colors.primaryDark} />
        </View>
      </View>
      {!compact && <Text style={styles.caption}>Photo coming soon</Text>}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    ringOuter: {
      width: '44%',
      aspectRatio: 1,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringInner: {
      width: '68%',
      aspectRatio: 1,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    caption: { ...typography.caption, color: colors.primaryDark, opacity: 0.65, marginTop: 8 },
  });
}
