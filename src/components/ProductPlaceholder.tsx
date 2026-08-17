import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme';
import { CategoryKey } from '@/types/product';

const CATEGORY_ICON: Record<CategoryKey, string> = {
  earrings: 'diamond-outline',
  necklaces: 'ellipse-outline',
  pendants: 'heart-outline',
  'jewellery-sets': 'sparkles-outline',
  bracelets: 'infinite-outline',
  'hair-accessories': 'flower-outline',
};

const CATEGORY_TINT: Record<CategoryKey, string> = {
  earrings: colors.primaryLight,
  necklaces: colors.goldLight,
  pendants: colors.primaryLight,
  'jewellery-sets': colors.goldLight,
  bracelets: colors.primaryLight,
  'hair-accessories': colors.goldLight,
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
  const icon = CATEGORY_ICON[category] ?? 'sparkles-outline';
  const tint = CATEGORY_TINT[category] ?? colors.surfaceAlt;

  return (
    <View style={[styles.wrap, { backgroundColor: tint }]}>
      <View style={styles.ringOuter}>
        <View style={styles.ringInner}>
          <Ionicons name={icon as any} size={compact ? 26 : 36} color={colors.primaryDark} />
        </View>
      </View>
      {!compact && <Text style={styles.caption}>Photo coming soon</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    width: '44%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: '68%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { ...typography.caption, color: colors.primaryDark, opacity: 0.65, marginTop: 8 },
});
