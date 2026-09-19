import React from 'react';
import { View, Text, TextStyle, StyleSheet } from 'react-native';
import { typography, spacing, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { formatPrice } from '@/utils/formatPrice';

interface Props {
  amount: number;
  /** Optional "was" price — shown struck through with a discount % badge
   * when it's genuinely higher than `amount`. */
  compareAtAmount?: number | null;
  style?: TextStyle;
  /** Hide the discount % pill (e.g. in tight layouts) while still showing
   * the struck-through price. */
  hideBadge?: boolean;
}

export default function PriceTag({ amount, compareAtAmount, style, hideBadge }: Props) {
  const { colors } = useTheme();
  const hasDiscount = !!compareAtAmount && compareAtAmount > amount;
  const percentOff = hasDiscount ? Math.round(((compareAtAmount - amount) / compareAtAmount) * 100) : 0;

  if (!hasDiscount) {
    return <Text style={[{ ...typography.price, color: colors.textPrimary }, style]}>{formatPrice(amount)}</Text>;
  }

  return (
    <View style={styles.row}>
      <Text style={[{ ...typography.price, color: colors.textPrimary }, style]}>{formatPrice(amount)}</Text>
      <Text style={[styles.compareAt, { color: colors.textMuted }]}>{formatPrice(compareAtAmount)}</Text>
      {!hideBadge && (
        <View style={[styles.badge, { backgroundColor: colors.success }]}>
          <Text style={styles.badgeText}>{percentOff}% OFF</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  compareAt: { ...typography.bodySmall, textDecorationLine: 'line-through' },
  badge: { paddingHorizontal: spacing.xs + 2, paddingVertical: 1, borderRadius: radius.sm },
  badgeText: { ...typography.caption, color: '#FFFFFF', fontWeight: '700' },
});
