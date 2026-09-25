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
import RatingStars from './RatingStars';

interface Props {
  testimonial: Testimonial;
  /** True when this device submitted it — shows Edit/Delete instead of nothing. */
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: any;
}

export default function TestimonialCard({ testimonial, isOwn, onEdit, onDelete, style }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.card, style]}>
      {isOwn && (
        <View style={styles.ownBadge}>
          <Ionicons name="person" size={10} color={colors.primary} />
          <Text style={styles.ownBadgeText}>Your review</Text>
        </View>
      )}

      <View style={styles.header}>
        <Image source={getAvatarByIndex(testimonial.avatarIndex)} style={styles.avatar} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{testimonial.name}</Text>
          {!!testimonial.city && (
            <Text style={styles.city} numberOfLines={1}>{testimonial.city}</Text>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        <RatingStars rating={testimonial.rating} size={13} showLabel={false} />
        <Text style={styles.date}>{formatReviewDate(testimonial.createdAt)}</Text>
      </View>

      {!!testimonial.product && (
        <View style={styles.productTag}>
          <Text style={styles.productTagText}>{testimonial.product}</Text>
        </View>
      )}

      <Text style={styles.body}>{testimonial.body}</Text>

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
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
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
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    date: { ...typography.caption, color: colors.textMuted },
    productTag: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      marginBottom: spacing.sm,
    },
    productTagText: { ...typography.caption, color: colors.primaryDark, fontFamily: fonts.bodySemiBold, fontSize: 11 },
    body: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
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
