import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { GOOGLE_REVIEWS_URL } from '@/config/socialLinks';

const HIGHLIGHTS = ['Honest Reviews Only', '100% Verified Profile', 'Your Voice Counts'];

/**
 * "See what customers say about us" CTA block — same layout the client
 * referenced (copy + trust chips on one side, a Google-branded review card
 * on the other), but with original copy written for Fashionable Flair
 * rather than reusing the reference site's wording. Stacks on phones, sits
 * side-by-side from tablet width up.
 */
export default function GoogleReviewsSection() {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const styles = makeStyles(colors);

  const handlePress = () => Linking.openURL(GOOGLE_REVIEWS_URL);

  return (
    <View style={[styles.wrap, isWide && styles.wrapWide]}>
      <View style={[styles.copyCol, isWide && styles.copyColWide]}>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>CUSTOMER LOVE</Text>
        </View>
        <Text style={styles.title}>Loved by Shoppers Like You</Text>
        <Text style={styles.subtitle}>
          Every review here comes from someone who's actually worn the pieces. Take a look at what they're
          saying, or leave your own on our official Google Business Profile.
        </Text>

        <View style={styles.chipsRow}>
          {HIGHLIGHTS.map((h) => (
            <View key={h} style={styles.chip}>
              <Text style={styles.chipText}>{h}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={handlePress}
        >
          <Text style={styles.ctaText}>Rate Us on Google</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.reviewCard, isWide && styles.reviewCardWide, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <Text style={styles.googleWordmark}>
          <Text style={{ color: '#4285F4' }}>G</Text>
          <Text style={{ color: '#EA4335' }}>o</Text>
          <Text style={{ color: '#FBBC05' }}>o</Text>
          <Text style={{ color: '#4285F4' }}>g</Text>
          <Text style={{ color: '#34A853' }}>l</Text>
          <Text style={{ color: '#EA4335' }}>e</Text>
        </Text>
        <View style={styles.starsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Ionicons key={i} name="star" size={18} color={colors.star} />
          ))}
        </View>
        <Text style={styles.reviewCardTitle}>See Our Reviews</Text>
        <Text style={styles.reviewCardLink}>Read what shoppers say</Text>
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
    reviewCardWide: { width: 220 },
    googleWordmark: { fontSize: 26, fontFamily: fonts.bodyBold },
    starsRow: { flexDirection: 'row', gap: 2, marginTop: spacing.sm },
    reviewCardTitle: { ...typography.body, fontFamily: fonts.bodySemiBold, color: colors.textPrimary, marginTop: spacing.md },
    reviewCardLink: { ...typography.bodySmall, color: colors.primary, marginTop: 2 },
  });
}
