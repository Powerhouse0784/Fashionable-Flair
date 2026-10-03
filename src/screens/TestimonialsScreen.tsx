import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useScrollVisibilityHandler } from '@/context/ScrollVisibilityContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { goBackOrTo } from '@/utils/navigation';
import Container from '@/components/Container';
import WebPageWrapper from '@/components/WebPageWrapper';
import Footer from '@/components/Footer';
import TestimonialCard from '@/components/TestimonialCard';
import TestimonialFormModal from '@/components/TestimonialFormModal';
import { Testimonial, TestimonialInput } from '@/types/testimonial';
import { testimonialsSeed } from '@/data/testimonialsSeed';
import {
  fetchTestimonials,
  createTestimonial,
  updateOwnTestimonial,
  deleteOwnTestimonial,
} from '@/services/testimonialService';
import { getTestimonialLimit } from '@/utils/testimonialOwnership';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { usePremium } from '@/context/PremiumContext';
import CustomerAuthModal from '@/components/CustomerAuthModal';
import { confirmAsync, alertInfo } from '@/utils/confirm';
import { hapticSuccess } from '@/utils/haptics';

type RatingFilter = 'all' | 5 | 4 | 3;

const HERO_BG = {
  light: require('@/assets/testimonials/hero-bg-light.jpg'),
  dark: require('@/assets/testimonials/hero-bg-dark.jpg'),
};
const HERO_SCENE = {
  light: require('@/assets/testimonials/hero-scene-light.png'),
  dark: require('@/assets/testimonials/hero-scene-dark.png'),
};

const TRUST_ITEMS: { icon: string; label: string }[] = [
  { icon: 'shield-checkmark-outline', label: 'Trusted by\nThousands' },
  { icon: 'ribbon-outline', label: 'Verified\nReviews' },
  { icon: 'people-outline', label: 'Real People\nReal Stories' },
];

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export default function TestimonialsScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const handleScroll = useScrollVisibilityHandler();
  const { width } = useWindowDimensions();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const isWide = useIsWideScreen();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { isPremium } = usePremium();
  const userId = session?.user?.id ?? null;

  const columns = width >= 1100 ? 3 : width >= 700 ? 2 : 1;

  const [remote, setRemote] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RatingFilter>('all');

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const remoteData = await fetchTestimonials();
    setRemote(remoteData);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const all = useMemo(
    () =>
      [...testimonialsSeed, ...remote].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [remote]
  );

  const stats = useMemo(() => {
    const total = all.length || 1;
    const sum = all.reduce((acc, t) => acc + t.rating, 0);
    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const count = all.filter((t) => Math.round(t.rating) === star).length;
      return { star, count, pct: Math.round((count / total) * 100) };
    });
    return { average: all.length ? sum / all.length : 0, total: all.length, breakdown };
  }, [all]);

  const filtered = useMemo(() => {
    if (filter === 'all') return all;
    if (filter === 3) return all.filter((t) => Math.round(t.rating) <= 3);
    return all.filter((t) => Math.round(t.rating) === filter);
  }, [all, filter]);

  const rows = useMemo(() => chunk(filtered, columns), [filtered, columns]);

  // Writing a review needs an account (see AuthContext / CustomerAuthModal)
  // — this is what actually opens the review form once that's settled,
  // shared by both the guest-just-logged-in path and the already-logged-in
  // path below.
  const proceedToAdd = async () => {
    if (!userId) return;
    const myCount = remote.filter((t) => t.user_id === userId).length;
    const limit = getTestimonialLimit(isPremium);
    if (myCount >= limit) {
      alertInfo(
        'You\u2019ve reached the limit',
        `Up to ${limit} reviews per account \u2014 edit or delete one of yours below to post a different one.` +
          (isPremium ? '' : ' Premium members get more.')
      );
      return;
    }
    setEditing(null);
    setFormVisible(true);
  };

  const handleAddPress = () => {
    if (!userId) {
      setAuthModalVisible(true);
      return;
    }
    proceedToAdd();
  };

  const handleEditPress = (t: Testimonial) => {
    setEditing(t);
    setFormVisible(true);
  };

  const handleDeletePress = async (t: Testimonial) => {
    const confirmed = await confirmAsync('Delete your review?', 'This can\u2019t be undone.', 'Delete');
    if (!confirmed) return;
    try {
      await deleteOwnTestimonial(t.id);
      showToast('Review deleted', 'success');
      load();
    } catch (e: any) {
      alertInfo('Couldn\u2019t delete', e?.message || 'Something went wrong.');
    }
  };

  const handleSubmit = async (input: TestimonialInput) => {
    if (!userId) {
      // Shouldn't happen — the form only opens once logged in — but if a
      // session ever expires mid-form, fail safely instead of posting an
      // ownerless review.
      alertInfo('Please log in', 'Your session expired \u2014 please log in again to post your review.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateOwnTestimonial(editing.id, input);
        showToast('Review updated', 'success');
      } else {
        await createTestimonial(input, userId);
        showToast('Thanks for sharing your experience!', 'success');
      }
      hapticSuccess();
      setFormVisible(false);
      setEditing(null);
      load();
    } catch (e: any) {
      alertInfo('Couldn\u2019t save your review', e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const FILTERS: { key: RatingFilter; label: string }[] = [
    { key: 'all', label: 'All Reviews' },
    { key: 5, label: '5 Star' },
    { key: 4, label: '4 Star' },
    { key: 3, label: '3 & Below' },
  ];

  const heroBg = isDark ? HERO_BG.dark : HERO_BG.light;
  const heroScene = isDark ? HERO_SCENE.dark : HERO_SCENE.light;
  // A brighter, more saturated blue than the theme's own `primary` for just
  // this one accent word — the reference design's heading blue reads as
  // noticeably more vivid than our button/link blue, especially in dark
  // mode where `colors.primary` is close in tone to the hero photo itself.
  const heroAccent = isDark ? '#6FB8FF' : colors.primary;

  return (
    <WebPageWrapper>
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={!isWide && { paddingBottom: STICKY_BAR_SPACE }}
          >
            {/* Hero */}
            <View style={[styles.hero, { paddingTop: isWide ? spacing.xl : insets.top + 64 }]}>
              <Image source={heroBg} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              {/* Guarantees the headline stays readable no matter where the
                  photo's own flowers/highlights happen to fall behind it —
                  a horizontal tint on the text side only, fully transparent
                  by the time it reaches the jewellery image on the right. */}
              <LinearGradient
                colors={[isDark ? 'rgba(7,14,24,0.55)' : 'rgba(244,248,252,0.6)', 'rgba(0,0,0,0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0.65, y: 0.5 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {/* Fades the photo into the flat page background at the bottom
                  edge, so the stats card below sits on a clean seam instead
                  of a hard cut line between photo and solid color. */}
              <LinearGradient
                colors={['rgba(0,0,0,0)', colors.background]}
                style={styles.heroFade}
                pointerEvents="none"
              />

              {/* Floats directly on the photo, the same way the onboarding
                  screens float their "Skip" button, so the background runs
                  edge-to-edge behind the status bar instead of leaving a
                  blank strip of flat colour above the hero. */}
              {!isWide && (
                <View style={[styles.mobileTopBar, { paddingTop: insets.top + spacing.sm }]}>
                  <TouchableOpacity
                    style={styles.mobileBackButton}
                    onPress={() => goBackOrTo(navigation, 'Tabs')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              )}


              <Container>
                <View style={[styles.heroInner, isWide && styles.heroInnerWide]}>
                  <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
                    <View style={[styles.eyebrow, isWide && styles.eyebrowWide]}>
                      <Text style={styles.eyebrowText}>REAL STORIES. REAL PEOPLE.</Text>
                    </View>

                    <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
                      Customer{'\n'}
                      <Text style={{ color: heroAccent }}>Testimonials</Text>
                    </Text>

                    <Text style={[styles.heroSubtitle, isWide && styles.heroSubtitleWide]}>
                      Real experiences from our valued customers — quick to join and share yours.
                    </Text>

                    <View style={[styles.trustRow, isWide && styles.trustRowWide]}>
                      {TRUST_ITEMS.map((item) => (
                        <View key={item.label} style={styles.trustItem}>
                          <View style={styles.trustIcon}>
                            <Ionicons name={item.icon as any} size={16} color={colors.textPrimary} />
                          </View>
                          <Text style={styles.trustLabel}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.heroSceneWrap, isWide && styles.heroSceneWrapWide]}>
                    {isWide && (
                      <View style={[styles.scriptTagWrap, isDark && styles.scriptTagScrimBg]}>
                        <Text style={styles.scriptTag}>
                          More Than{'\n'}Just Jewellery{' '}
                          <Ionicons name="heart-outline" size={14} color={heroAccent} />
                        </Text>
                      </View>
                    )}
                    <Image
                      source={heroScene}
                      style={styles.heroScene}
                      contentFit="contain"
                      transition={200}
                    />
                  </View>
                </View>
              </Container>
            </View>

            <Container>
              {/* Stats dashboard */}
              <View style={styles.statsCard}>
                <View style={[styles.statsTop, isWide && styles.statsTopWide]}>
                  <View style={[styles.statsMainCol, isWide && styles.statsMainColWide]}>
                    <View style={styles.statsMain}>
                      <Text style={styles.statsNumber}>{stats.average.toFixed(1)}</Text>
                      <View>
                        <View style={styles.statsStars}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Ionicons
                              key={n}
                              name={n <= Math.round(stats.average) ? 'star' : 'star-outline'}
                              size={16}
                              color={colors.star}
                              style={{ marginRight: 2 }}
                            />
                          ))}
                        </View>
                        <Text style={styles.statsCaption}>
                          Based on {stats.total} verified review{stats.total === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.breakdown}>
                      {stats.breakdown.map((row) => (
                        <View key={row.star} style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>{row.star}★</Text>
                          <View style={styles.breakdownTrack}>
                            <View style={[styles.breakdownFill, { width: `${row.pct}%` }]} />
                          </View>
                          <Text style={styles.breakdownPct}>{row.pct}%</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.statsCtaCol, isWide && styles.statsCtaColWide]}>
                    <TouchableOpacity style={styles.ctaButton} activeOpacity={0.88} onPress={handleAddPress}>
                      <Ionicons name="create-outline" size={18} color={colors.textInverse} />
                      <Text style={styles.ctaButtonText}>Share Your Experience</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.genuineRow}>
                      <Ionicons name="shield-checkmark" size={13} color={colors.textMuted} />
                      <Text style={styles.genuineText}>100% Genuine Reviews</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Filter chips */}
              <View style={styles.filterRow}>
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilter(f.key)}
                      activeOpacity={0.85}
                    >
                      {f.key === 'all' && (
                        <Ionicons
                          name="sparkles"
                          size={12}
                          color={active ? colors.textInverse : colors.textMuted}
                        />
                      )}
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Grid */}
              {loading && remote.length === 0 ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : filtered.length === 0 ? (
                <Text style={styles.emptyText}>No reviews in this range yet.</Text>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {rows.map((row, i) => (
                    <View key={i} style={styles.gridRow}>
                      {row.map((t) => (
                        <TestimonialCard
                          key={t.id}
                          testimonial={t}
                          isOwn={!!userId && t.user_id === userId}
                          onEdit={() => handleEditPress(t)}
                          onDelete={() => handleDeletePress(t)}
                          style={{ flex: 1 }}
                        />
                      ))}
                      {/* pad the last row so cards don't stretch to fill a partial row */}
                      {row.length < columns &&
                        Array.from({ length: columns - row.length }).map((_, i2) => (
                          <View key={`pad-${i2}`} style={{ flex: 1 }} />
                        ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Closing flourish */}
              <View style={styles.closing}>
                <View style={styles.closingLine} />
                <Text style={styles.closingText}>Your Trust Inspires Us</Text>
                <Ionicons name="heart" size={13} color={colors.primary} style={{ marginLeft: spacing.xs }} />
                <View style={styles.closingLine} />
              </View>
            </Container>

            {isWide && <Footer />}
          </ScrollView>

          {/* Sticky mobile CTA — the desktop stats card above is right at the
              top of the page and hard to miss, but on a phone this screen
              can run to many stacked review cards; pinning the same action
              here means it's never more than a thumb's reach away, however
              far down someone has scrolled. */}
          {!isWide && (
            <SafeAreaView edges={['bottom']} style={styles.stickyBar}>
              <TouchableOpacity style={styles.stickyButton} activeOpacity={0.88} onPress={handleAddPress}>
                <Ionicons name="create-outline" size={18} color={colors.textInverse} />
                <Text style={styles.ctaButtonText}>Share Your Experience</Text>
              </TouchableOpacity>
            </SafeAreaView>
          )}
        </View>

        <TestimonialFormModal
          visible={formVisible}
          initial={editing}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={() => {
            setFormVisible(false);
            setEditing(null);
          }}
        />

        <CustomerAuthModal
          visible={authModalVisible}
          reason="Log in or create a free account to share a review — it keeps the review limit fair and lets your reviews follow you anywhere."
          onClose={() => setAuthModalVisible(false)}
          onAuthenticated={() => {
            setAuthModalVisible(false);
            proceedToAdd();
          }}
        />
      </SafeAreaView>
    </WebPageWrapper>
  );
}

// Reserve room at the bottom of the scrollable content, on narrow screens
// only, so the last review card is never hidden behind the sticky bar.
const STICKY_BAR_SPACE = 96;

function makeStyles(colors: ColorTheme, isDark: boolean) {
  const glass = isDark ? 'rgba(13,28,46,0.82)' : 'rgba(255,255,255,0.88)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.9)';
  const pillBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.16)' : colors.border;

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    // ---- Hero ------------------------------------------------------------
    // No paddingTop here on purpose — the mobile back button used to sit in
    // its own row above the hero, on the flat page background, which left a
    // blank strip before the photo started. It's now painted as an overlay
    // on top of the photo itself (see mobileTopBar below), the same way the
    // onboarding screens float their "Skip" button over their background,
    // so the photo runs edge-to-edge behind the status bar too.
    hero: { position: 'relative', overflow: 'hidden', paddingBottom: spacing.xxl },
    heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
    mobileTopBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg, zIndex: 2 },
    mobileBackButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pillBg,
      borderWidth: 1,
      borderColor: pillBorder,
    },
    heroInner: { flexDirection: 'column-reverse', alignItems: 'center' },
    heroInnerWide: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xl },
    heroCopy: { width: '100%', marginTop: spacing.xl },
    heroCopyWide: { flex: 1.15, marginTop: 0, paddingRight: spacing.xxl },

    eyebrow: {
      alignSelf: 'center',
      backgroundColor: pillBg,
      borderWidth: 1,
      borderColor: pillBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      borderRadius: radius.pill,
      marginBottom: spacing.md,
    },
    // On a laptop the heading below is left-aligned, so a centred pill
    // above it used to float looking disconnected from anything — pinning
    // it to the same left edge ties the two together the way the reference
    // design has it.
    eyebrowWide: { alignSelf: 'flex-start' },
    eyebrowText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontFamily: fonts.bodyBold,
      fontSize: 10.5,
      letterSpacing: 1,
    },

    heroTitle: {
      fontSize: 34,
      lineHeight: 40,
      fontFamily: fonts.headingBold,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    heroTitleWide: { fontSize: 52, lineHeight: 58, textAlign: 'left' },

    heroSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    heroSubtitleWide: { textAlign: 'left', fontSize: 16, maxWidth: 440 },

    trustRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: spacing.lg,
      marginTop: spacing.xl,
    },
    trustRowWide: { justifyContent: 'flex-start', marginTop: spacing.xxl },
    trustItem: { alignItems: 'center', width: 92 },
    trustIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: pillBg,
      borderWidth: 1,
      borderColor: pillBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    trustLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: fonts.bodySemiBold,
      lineHeight: 15,
    },

    // The image itself already fades to transparent at its own edges (baked
    // into the PNG), so it dissolves straight into the hero photo behind it
    // instead of sitting on top of it inside a hard-edged card — no
    // border-radius, overflow-clip or drop shadow here to undo that.
    heroSceneWrap: {
      width: '92%',
      maxWidth: 380,
    },
    heroSceneWrapWide: { flex: 1, width: undefined, maxWidth: 480, alignSelf: 'stretch', justifyContent: 'center' },
    heroScene: { width: '100%', aspectRatio: 0.92 },
    scriptTagWrap: {
      position: 'absolute',
      top: 4,
      right: 8,
      zIndex: 1,
    },
    // Dark theme only: the light-coloured flowers baked into the photo can
    // land directly behind this text, and a text-shadow alone wasn't always
    // enough to separate the two. A soft, low-opacity plate behind the
    // words guarantees they read clearly regardless of what's in the photo
    // at that exact spot — light theme didn't have this problem, so it
    // keeps the plain, unboxed look.
    scriptTagScrimBg: {
      backgroundColor: 'rgba(4,9,18,0.5)',
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      top: -6,
      right: -8,
    },
    scriptTag: {
      fontFamily: fonts.headingMedium,
      fontStyle: 'italic',
      fontSize: 17,
      lineHeight: 22,
      textAlign: 'right',
      // Brighter than the theme's usual secondary-text grey in dark mode —
      // paired with the scrim above, this is what actually fixed the
      // legibility complaint; the previous attempt only changed the shadow
      // and kept the same mid-grey tone, which was still too close to the
      // photo's own highlights.
      color: isDark ? '#FFFFFF' : colors.textSecondary,
      ...(Platform.OS === 'web'
        ? ({
            textShadow: isDark
              ? '0 1px 3px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.7)'
              : '0 1px 6px rgba(255,255,255,0.85)',
          } as any)
        : {
            textShadowColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.85)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: isDark ? 8 : 6,
          }),
    },
    // ---- Stats card --------------------------------------------------------
    statsCard: {
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: glassBorder,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,

      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 12px 32px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 20, elevation: 4 }),
    },
    statsTop: { gap: spacing.lg },
    statsTopWide: { flexDirection: 'row', alignItems: 'stretch' },
    statsMainCol: { gap: spacing.lg },
    statsMainColWide: { flex: 1.6, paddingRight: spacing.xl, borderRightWidth: 1, borderRightColor: colors.border },
    statsMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    statsNumber: { fontSize: 44, fontFamily: fonts.heading, color: colors.textPrimary, lineHeight: 48 },
    statsStars: { flexDirection: 'row', marginBottom: 4 },
    statsCaption: { ...typography.caption, color: colors.textMuted },
    breakdown: { gap: spacing.xs },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    breakdownLabel: { ...typography.caption, color: colors.textSecondary, width: 24 },
    breakdownTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
    breakdownFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
    breakdownPct: { ...typography.caption, color: colors.textMuted, width: 34, textAlign: 'right' },

    statsCtaCol: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center' },
    statsCtaColWide: { flex: 1, paddingLeft: spacing.xl },

    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      width: '100%',

      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 4px 12px ${colors.primary}40` } as any)
        : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }),
    },
    ctaButtonText: { ...typography.button, color: colors.textInverse },
    genuineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    genuineText: { ...typography.caption, color: colors.textMuted },

    // ---- Filters / grid -----------------------------------------------------
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    filterChipTextActive: { color: colors.textInverse },

    gridRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
    loadingRow: { paddingVertical: spacing.xxl, alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

    // ---- Closing flourish -----------------------------------------------
    closing: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xxl,
      marginBottom: spacing.xl,
      gap: spacing.sm,
    },
    closingLine: { width: 32, height: 1, backgroundColor: colors.border },
    closingText: {
      fontFamily: fonts.headingMedium,
      fontStyle: 'italic',
      fontSize: 16,
      color: colors.primary,
    },

    // ---- Sticky mobile CTA -------------------------------------------------
    stickyBar: {
      position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,

      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 -4px 16px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 1, shadowRadius: 12, elevation: 8 }),
    },
    stickyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
  });
}
