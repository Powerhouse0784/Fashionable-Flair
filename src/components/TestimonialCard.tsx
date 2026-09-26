import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { Testimonial } from '@/types/testimonial';
import { getAvatarByIndex } from '@/data/avatars';
import { formatReviewDate } from '@/utils/date';
import { categories } from '@/data/categories';
import RatingStars from './RatingStars';

interface Props {
  testimonial: Testimonial;
  /** True when this device submitted it — shows Edit/Delete instead of nothing. */
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: any;
}

// A short, varied second line under each product thumbnail. Reviews only
// record the category the person bought ("Pendants & Chains"), not a
// specific collection name, so this is a presentation-only flourish keyed
// off that category — it's what gives the grid the same "Diamond Pendant
// Set — Premium Collection" two-line feel as the reference design without
// inventing a fact about any one review.
const COLLECTION_TAG: Record<string, string> = {
  'Earrings & Studs': 'Everyday Elegance',
  'Pendants & Chains': 'Premium Collection',
  'Jewellery Sets': 'Signature Picks',
  'Bracelets & Bangles': 'Timeless Collection',
  'Hair Accessories': 'Festive Edit',
};

export default function TestimonialCard({ testimonial, isOwn, onEdit, onDelete, style }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const category = testimonial.product ? categories.find((c) => c.label === testimonial.product) : undefined;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Image source={getAvatarByIndex(testimonial.avatarIndex)} style={styles.avatar} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{testimonial.name}</Text>
          {!!testimonial.city && (
            <Text style={styles.city} numberOfLines={1}>{testimonial.city}</Text>
          )}
        </View>
        <Text style={styles.quoteMark} accessibilityElementsHidden importantForAccessibility="no">
          &ldquo;
        </Text>
      </View>

      {isOwn && (
        <View style={styles.ownBadge}>
          <Ionicons name="person" size={10} color={colors.primary} />
          <Text style={styles.ownBadgeText}>Your review</Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <RatingStars rating={testimonial.rating} size={13} showLabel={false} />
        <Text style={styles.date}>{formatReviewDate(testimonial.createdAt)}</Text>
      </View>

      <Text style={styles.body}>{testimonial.body}</Text>

      {!!category && (
        <View style={styles.productRow}>
          <Image source={category.image} style={styles.productThumb} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.productName} numberOfLines={1}>{testimonial.product}</Text>
            <Text style={styles.productCollection} numberOfLines={1}>
              {COLLECTION_TAG[testimonial.product!] ?? 'Customer Favourite'}
            </Text>
          </View>
        </View>
      )}

      {isOwn && (onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={14} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,

      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 10px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }),
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1.5,
      borderColor: colors.gold,
      backgroundColor: colors.surfaceAlt,
    },
    name: { ...typography.body, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    city: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
    // A large, low-opacity serif quote mark in the top-right corner — the
    // same decorative touch the reference cards use — rendered as text so
    // it needs no extra icon asset.
    quoteMark: {
      fontFamily: fonts.heading,
      fontSize: 34,
      lineHeight: 34,
      color: colors.primary,
      opacity: 0.18,
    },
    ownBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      backgroundColor: `${colors.primary}18`,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      marginBottom: spacing.sm,
    },
    ownBadgeText: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 10.5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    date: { ...typography.caption, color: colors.textMuted },
    body: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    productThumb: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
    },
    productName: { ...typography.caption, color: colors.primaryDark, fontFamily: fonts.bodySemiBold, fontSize: 12.5 },
    productCollection: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: 1 },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodySemiBold },
  });
}
