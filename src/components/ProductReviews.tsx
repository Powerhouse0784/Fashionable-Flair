import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { ProductReview } from '@/types/product';
import RatingStars from './RatingStars';

interface Props {
  reviews: ProductReview[];
  loading?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Read-only review list for a product's detail page. Reviews are
 * admin-curated (see AdminReviewsScreen) rather than collected from
 * verified in-app purchases, since checkout happens on Meesho — but they
 * still read as genuine customer feedback rather than a bare star number
 * with nothing behind it.
 */
export default function ProductReviews({ reviews, loading }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  if (loading) return null;
  if (reviews.length === 0) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryAverage}>{average.toFixed(1)}</Text>
        <View>
          <RatingStars rating={average} size={16} showLabel={false} />
          <Text style={styles.summaryCount}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
      </View>

      {reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.authorName}>{review.authorName}</Text>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
          <RatingStars rating={review.rating} size={13} showLabel={false} />
          <Text style={styles.body}>{review.body}</Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: { marginTop: spacing.xl },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    summaryAverage: { ...typography.h1, color: colors.textPrimary, fontFamily: fonts.headingBold },
    summaryCount: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    reviewCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    authorName: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    date: { ...typography.caption, color: colors.textMuted },
    body: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 19 },
  });
}
