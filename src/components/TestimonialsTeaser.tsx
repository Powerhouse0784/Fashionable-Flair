import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { testimonialsSeed } from '@/data/testimonialsSeed';
import { getAvatarByIndex } from '@/data/avatars';

const HIGHLIGHTS = ['Written by Real Shoppers', 'No Login Needed to Share', 'Every Review Verified by Us'];

/**
 * "See what customers say about us" CTA block. There's no Google Business
 * Profile to link out to, so instead of borrowing Google's branding this
 * shows real numbers pulled from the app's own testimonials and links to
 * the in-app Testimonials screen, where anyone can also add their own.
 */
export default function TestimonialsTeaser() {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();

  const stats = useMemo(() => {
    const total = testimonialsSeed.length;
    const avg = testimonialsSeed.reduce((sum, t) => sum + t.rating, 0) / (total || 1);
    const previewAvatars = testimonialsSeed.slice(0, 4).map((t) => t.avatarIndex);
    return { total, avg, previewAvatars };
  }, []);

  const handlePress = () => navigation.navigate('Testimonials');

  return (
    <View style={[styles.wrap, isWide && styles.wrapWide]}>
      <View style={[styles.copyCol, isWide && styles.copyColWide]}>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>CUSTOMER LOVE</Text>
        </View>
        <Text style={styles.title}>Loved by Shoppers Like You</Text>
        <Text style={styles.subtitle}>
          Every review here comes from someone who's actually worn the pieces. Read what they're saying,
          or share your own experience — no account needed.
        </Text>

        <View style={styles.chipsRow}>
          {HIGHLIGHTS.map((h) => (
            <View key={h} style={styles.chip}>
              <Text style={styles.chipText}>{h}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={handlePress}>
          <Text style={styles.ctaText}>Read All Testimonials</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.reviewCard, isWide && styles.reviewCardWide, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <Text style={styles.statsNumber}>{stats.avg.toFixed(1)}</Text>
        <View style={styles.starsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Ionicons key={i} name={i < Math.round(stats.avg) ? 'star' : 'star-outline'} size={16} color={colors.star} />
          ))}
        </View>
        <Text style={styles.reviewCardTitle}>{stats.total}+ Verified Reviews</Text>

        <View style={styles.avatarStack}>
          {stats.previewAvatars.map((idx, i) => (
            <Image
              key={i}
              source={getAvatarByIndex(idx)}
              style={[styles.stackAvatar, { marginLeft: i === 0 ? 0 : -12, zIndex: stats.previewAvatars.length - i }]}
              contentFit="cover"
            />
          ))}
        </View>

        <Text style={styles.reviewCardLink}>See what they say →</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.xl,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    wrapWide: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.xxl,
      gap: spacing.xxl,
    },
    copyCol: { width: '100%' },
    copyColWide: { flex: 1.4 },
    eyebrow: {
      alignSelf: 'flex-start',
      backgroundColor: `${colors.primary}22`,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    eyebrowText: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodyBold },
    title: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
    },
    chipText: { ...typography.caption, color: colors.textPrimary, textTransform: 'none' },
    cta: {
      alignSelf: 'flex-start',
      backgroundColor: colors.textPrimary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      marginTop: spacing.lg,
    },
    ctaText: { ...typography.button, color: colors.background },
    reviewCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      alignItems: 'center',
    },
    reviewCardWide: { width: 240 },
    statsNumber: { fontSize: 40, fontFamily: fonts.heading, color: colors.textPrimary, lineHeight: 44 },
    starsRow: { flexDirection: 'row', gap: 2, marginTop: spacing.xs },
    reviewCardTitle: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary, marginTop: spacing.sm },
    avatarStack: { flexDirection: 'row', marginTop: spacing.md },
    stackAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.surface, backgroundColor: colors.surfaceAlt },
    reviewCardLink: { ...typography.bodySmall, color: colors.primary, marginTop: spacing.sm, fontFamily: fonts.bodySemiBold },
  });
}
