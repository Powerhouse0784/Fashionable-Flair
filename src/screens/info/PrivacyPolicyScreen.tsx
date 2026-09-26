import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { fonts } from '@/hooks/useAppFonts';
import { goBackOrTo } from '@/utils/navigation';
import Container from '@/components/Container';
import WebPageWrapper from '@/components/WebPageWrapper';
import Footer from '@/components/Footer';
import { PRIVACY_SECTIONS, PRIVACY_LAST_UPDATED } from '@/data/privacyPolicy';

const isWeb = Platform.OS === 'web';

// How far above a section's true top the "activate" line sits, and how much
// breathing room to leave above it when scrolling there from a tap — both
// tuned so a section feels "current" a little before it's flush with the
// top of the screen, not only once it's already scrolled past.
const ACTIVATE_LOOKAHEAD = 160;
const SCROLL_TOP_OFFSET = 96;
// TopNav is ~59px tall (34px logo + 24px vertical padding + 1px border) —
// used to pin the sidebar just below it instead of under it.
const NAV_HEIGHT = 59;

const heroLockLight = require('@/assets/privacy/privacy-hero-lock-light.png');
const heroLockDark = require('@/assets/privacy/privacy-hero-lock-dark.png');
const leafLight = require('@/assets/privacy/privacy-leaf-light.png');
const leafDark = require('@/assets/privacy/privacy-leaf-dark.png');

export default function PrivacyPolicyScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation<any>();
  const isWide = useIsWideScreen();

  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Three layers of "where am I within the scroll content" — see the layout
  // note above sectionsColumn below for why this combination is enough to
  // locate every section regardless of whether the sidebar sits beside the
  // content (wide) or above it (narrow).
  const bodyWrapY = useRef(0);
  const sectionsColumnY = useRef(0);
  const sectionYs = useRef<number[]>(PRIVACY_SECTIONS.map(() => 0));

  const absoluteY = (i: number) => bodyWrapY.current + sectionsColumnY.current + sectionYs.current[i];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const line = scrollY + ACTIVATE_LOOKAHEAD;
    let next = 0;
    for (let i = 0; i < PRIVACY_SECTIONS.length; i++) {
      if (absoluteY(i) <= line) next = i;
      else break;
    }
    setActiveIndex((prev) => (prev === next ? prev : next));
  };

  const scrollToSection = (i: number) => {
    const y = Math.max(0, absoluteY(i) - SCROLL_TOP_OFFSET);
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  return (
    <WebPageWrapper>
      <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
        {!isWide && (
          <View style={styles.mobileHeader}>
            <TouchableOpacity
              onPress={() => goBackOrTo(navigation, 'Tabs')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.mobileHeaderTitle}>Privacy Policy</Text>
            <View style={{ width: 22 }} />
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        >
          {/* ---------- Hero ---------- */}
          <Container>
            <View style={[styles.hero, isWide && styles.heroWide]}>
              <View style={[styles.heroText, isWide && styles.heroTextWide]}>
                <Text style={styles.eyebrow}>OUR COMMITMENT</Text>
                <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>Privacy Policy</Text>
                <Text style={styles.heroSubtitle}>Your trust matters to us</Text>
                <View style={styles.heroRule} />
                <Text style={styles.heroBody}>
                  We value your privacy and are committed to protecting your personal information. This
                  policy explains how we collect, use, and safeguard your data when you use our app and
                  website.
                </Text>
                <Text style={styles.lastUpdated}>Last updated {PRIVACY_LAST_UPDATED}</Text>
              </View>

              <View style={[styles.heroImageWrap, isWide && styles.heroImageWrapWide]}>
                {/* Soft glow so the art reads as part of the scene rather
                    than a photo dropped on top of it — sized bigger than
                    the image itself and blurred well past its edges. */}
                <View style={styles.heroGlow} pointerEvents="none" />
                <Image
                  source={isDark ? heroLockDark : heroLockLight}
                  style={[styles.heroImage, isWide && styles.heroImageWide]}
                  resizeMode="contain"
                  accessibilityLabel="A padlock with the Fashionable Flair lotus shield, representing data protection"
                />
              </View>
            </View>
          </Container>

          {/* ---------- Body: Contents (sidebar on wide / chips+callout on narrow) + Sections ---------- */}
          <Container>
            <View
              style={[styles.bodyWrap, isWide && styles.bodyWrapWide]}
              onLayout={(e: LayoutChangeEvent) => {
                bodyWrapY.current = e.nativeEvent.layout.y;
              }}
            >
              {isWide ? (
                <View style={styles.sidebar}>
                  <View style={styles.tocCard}>
                    <View style={styles.tocHeader}>
                      <Ionicons name="reader-outline" size={18} color={colors.primary} />
                      <Text style={styles.tocHeaderText}>Contents</Text>
                    </View>

                    {/* Only this list scrolls internally, and only on a
                        short window where it genuinely can't all fit — the
                        callout and leaf below are never pushed into that
                        scroll area, so they stay visible without scrolling. */}
                    <ScrollView
                      style={styles.tocList}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {PRIVACY_SECTIONS.map((s, i) => {
                        const active = i === activeIndex;
                        return (
                          <TouchableOpacity
                            key={s.id}
                            style={[styles.tocItem, active && styles.tocItemActive]}
                            onPress={() => scrollToSection(i)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.tocNumber, active && styles.tocNumberActive]}>
                              <Text style={[styles.tocNumberText, active && styles.tocNumberTextActive]}>
                                {s.number}
                              </Text>
                            </View>
                            <Text
                              style={[styles.tocLabel, active && styles.tocLabelActive]}
                              numberOfLines={2}
                            >
                              {s.title}
                            </Text>
                            <Ionicons
                              name="arrow-forward"
                              size={14}
                              color={active ? colors.textInverse : colors.textMuted}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <PriorityCallout colors={colors} isDark={isDark} style={styles.calloutSpacing} />

                  <View style={styles.leafWrap} pointerEvents="none">
                    <Image
                      source={isDark ? leafDark : leafLight}
                      style={styles.leafImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipRow}
                    contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.sm }}
                  >
                    {PRIVACY_SECTIONS.map((s, i) => {
                      const active = i === activeIndex;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => scrollToSection(i)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.chipNumber, active && styles.chipNumberActive]}>
                            <Text style={[styles.chipNumberText, active && styles.chipNumberTextActive]}>
                              {s.number}
                            </Text>
                          </View>
                          <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
                            {s.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <PriorityCallout colors={colors} isDark={isDark} style={styles.calloutSpacingNarrow} />
                </>
              )}

              <View
                style={[styles.sectionsColumn, isWide && styles.sectionsColumnWide]}
                onLayout={(e: LayoutChangeEvent) => {
                  sectionsColumnY.current = e.nativeEvent.layout.y;
                }}
              >
                {/* Continuous connector line, painted first so every card
                    (opaque background) sits on top of it except in the gaps
                    between cards — that's what makes it read as a timeline
                    threading circle-to-circle instead of one long line
                    overlapping the text. */}
                <View style={styles.timelineTrack} pointerEvents="none" />

                {PRIVACY_SECTIONS.map((s, i) => (
                  <View
                    key={s.id}
                    style={styles.sectionRow}
                    onLayout={(e: LayoutChangeEvent) => {
                      sectionYs.current[i] = e.nativeEvent.layout.y;
                    }}
                  >
                    <View style={styles.numberCircle}>
                      <Text style={styles.numberCircleText}>{s.number}</Text>
                    </View>

                    <View style={styles.card}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{s.title}</Text>
                        <View style={styles.cardIconBadge}>
                          <Ionicons name={s.icon as any} size={16} color={colors.primary} />
                        </View>
                      </View>

                      <Text style={styles.cardBody}>{s.body}</Text>

                      {s.subsections && (
                        <View style={styles.subsectionList}>
                          {s.subsections.map((sub) => (
                            <View key={sub.title} style={styles.subsectionItem}>
                              <Text style={styles.subsectionTitle}>{sub.title}</Text>
                              <Text style={styles.subsectionBody}>{sub.body}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Container>

          {isWide && <Footer />}
        </ScrollView>
      </SafeAreaView>
    </WebPageWrapper>
  );
}

/** "Your privacy is our priority" reassurance card — shown in the sidebar on
 * wide screens, and inline (full width) on narrow ones. */
function PriorityCallout({
  colors,
  isDark,
  style,
}: {
  colors: ColorTheme;
  isDark: boolean;
  style?: any;
}) {
  const styles = makeStyles(colors, isDark);
  return (
    <View style={[styles.callout, style]}>
      <View style={styles.calloutIcon}>
        <Ionicons name="shield-checkmark" size={18} color={isDark ? colors.gold : colors.primary} />
      </View>
      <Text style={styles.calloutTitle}>Your privacy{'\n'}is our priority</Text>
      <Text style={styles.calloutBody}>
        We never sell or share your personal data with third parties for marketing purposes.
      </Text>
    </View>
  );
}

function makeStyles(colors: ColorTheme, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    mobileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    mobileHeaderTitle: {
      fontSize: 16,
      fontFamily: fonts.headingMedium,
      color: colors.textPrimary,
    },

    // ---------- Hero ----------
    hero: {
      marginTop: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: isDark ? colors.surface : colors.surfaceAlt,
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'transparent',
      padding: spacing.xl,
      overflow: 'hidden',
    },
    heroWide: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xxl,
      padding: spacing.xxl,
    },
    heroText: {},
    heroTextWide: { flex: 1, paddingRight: spacing.xxl, maxWidth: 560 },
    eyebrow: {
      fontSize: 12,
      fontFamily: fonts.bodySemiBold,
      letterSpacing: 1.2,
      color: isDark ? colors.gold : colors.primary,
      marginBottom: spacing.sm,
    },
    heroTitle: {
      fontSize: 32,
      fontFamily: fonts.headingBold,
      color: colors.textPrimary,
    },
    heroTitleWide: { fontSize: 44 },
    heroSubtitle: {
      fontSize: 16,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    heroRule: {
      width: 56,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.gold,
      marginVertical: spacing.md,
    },
    heroBody: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
      maxWidth: 520,
    },
    lastUpdated: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.md,
    },
    heroImageWrap: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    heroImageWrapWide: {
      width: 300,
      height: 260,
      marginTop: 0,
    },
    heroGlow: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 140,
      backgroundColor: isDark ? colors.gold : colors.primary,
      opacity: isDark ? 0.16 : 0.1,
      ...(isWeb ? ({ filter: 'blur(50px)' } as any) : {}),
    },
    heroImage: {
      width: '100%',
      height: 180,
    },
    heroImageWide: {
      width: 300,
      height: 240,
    },

    // ---------- Body wrap ----------
    // NOTE on scrollspy math: bodyWrap is a direct child of the (single)
    // Container/ScrollView content, so its onLayout.y IS the section's
    // absolute offset within the scroll. sectionsColumn's onLayout.y is
    // relative to bodyWrap — 0 on wide (it sits beside the sidebar), or
    // "however tall the chips row + callout are" on narrow, because Yoga
    // already accounts for the siblings before it in the column. Adding
    // those two plus each section's own onLayout.y (relative to
    // sectionsColumn) locates every section without hard-coded constants.
    bodyWrap: { marginTop: spacing.xl },
    bodyWrapWide: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl },

    sectionsColumn: { position: 'relative' },
    sectionsColumnWide: { flex: 1 },

    // ---------- Sidebar (wide) ----------
    // Pinned while the (much taller) sections column scrolls past it — this
    // is the fix for the sidebar disappearing off the top of the page after
    // a few sections' worth of scrolling, which is what made the active-item
    // highlight look like it "stopped working" past section 4: the sidebar
    // itself had already scrolled out of view, not the highlight logic.
    // NAV_HEIGHT below is TopNav's own height (see TopNav.tsx: ~34px logo +
    // 24px vertical padding + 1px border) plus a little breathing room.
    sidebar: {
      width: 300,
      ...(isWeb ? ({ position: 'sticky', top: NAV_HEIGHT + spacing.lg } as any) : {}),
    },
    tocCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...(isWeb
        ? ({ boxShadow: `0 8px 24px ${colors.shadow}` } as any)
        : { shadowColor: '#0B1A2E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 2 }),
    },
    tocHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    tocHeaderText: {
      fontSize: 15,
      fontFamily: fonts.headingMedium,
      color: colors.textPrimary,
    },
    // Fixed-height overhead above (tocCard header) and below (gap, the
    // callout, gap, the leaf) this list adds up to roughly 500px once the
    // sidebar is pinned — so on any normal window the list needs no
    // scrolling at all, and on a short one only the numbers scroll while
    // the callout and leaf stay put and fully visible.
    tocList: {
      ...(isWeb
        ? ({ maxHeight: 'calc(100vh - 500px)', overflowY: 'auto' } as any)
        : {}),
      minHeight: 160,
    },
    tocItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 9,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      marginBottom: 4,
    },
    tocItemActive: {
      backgroundColor: isDark ? colors.gold : colors.primary,
    },
    tocNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.surfaceAlt : colors.primaryLight,
    },
    tocNumberActive: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    tocNumberText: {
      fontSize: 11,
      fontFamily: fonts.bodySemiBold,
      color: isDark ? colors.gold : colors.primary,
    },
    tocNumberTextActive: {
      color: isDark ? '#1A1300' : colors.textInverse,
    },
    tocLabel: {
      flex: 1,
      fontSize: 13,
      fontFamily: fonts.bodyMedium,
      color: colors.textSecondary,
      lineHeight: 17,
    },
    tocLabelActive: {
      color: isDark ? '#1A1300' : colors.textInverse,
      fontFamily: fonts.bodySemiBold,
    },

    calloutSpacing: { marginTop: spacing.lg },
    calloutSpacingNarrow: { marginTop: spacing.lg, marginBottom: spacing.xl },

    callout: {
      backgroundColor: isDark ? colors.surface : colors.primaryLight,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'transparent',
      padding: spacing.lg,
    },
    calloutIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.goldLight : colors.surface,
      marginBottom: spacing.sm,
    },
    calloutTitle: {
      fontSize: 15,
      fontFamily: fonts.headingMedium,
      color: isDark ? colors.gold : colors.textPrimary,
      lineHeight: 19,
      marginBottom: 6,
    },
    calloutBody: {
      fontSize: 12.5,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    leafWrap: {
      height: 130,
      marginTop: spacing.lg,
      justifyContent: 'flex-end',
    },
    leafImage: { width: 170, height: 120, opacity: isDark ? 0.9 : 0.85 },

    // ---------- Mobile Contents chips ----------
    chipRow: { marginBottom: 0 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: 190,
    },
    chipActive: {
      backgroundColor: isDark ? colors.gold : colors.primary,
      borderColor: 'transparent',
    },
    chipNumber: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.surfaceAlt : colors.primaryLight,
    },
    chipNumberActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    chipNumberText: {
      fontSize: 10,
      fontFamily: fonts.bodySemiBold,
      color: isDark ? colors.gold : colors.primary,
    },
    chipNumberTextActive: { color: isDark ? '#1A1300' : colors.textInverse },
    chipLabel: {
      fontSize: 12.5,
      fontFamily: fonts.bodyMedium,
      color: colors.textSecondary,
    },
    chipLabelActive: {
      color: isDark ? '#1A1300' : colors.textInverse,
      fontFamily: fonts.bodySemiBold,
    },

    // ---------- Section timeline + cards ----------
    timelineTrack: {
      position: 'absolute',
      left: 17,
      top: 18,
      bottom: 18,
      width: 2,
      backgroundColor: isDark ? colors.border : colors.divider,
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    numberCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.gold : colors.primary,
    },
    numberCircleText: {
      fontSize: 14,
      fontFamily: fonts.headingBold,
      color: isDark ? '#1A1300' : colors.textInverse,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...(isWeb
        ? ({ boxShadow: `0 6px 20px ${colors.shadow}` } as any)
        : { shadowColor: '#0B1A2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 1 }),
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    cardTitle: {
      flex: 1,
      fontSize: 17,
      fontFamily: fonts.headingMedium,
      color: colors.textPrimary,
      paddingRight: spacing.sm,
    },
    cardIconBadge: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.surfaceAlt : colors.primaryLight,
    },
    cardBody: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    subsectionList: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    subsectionItem: {
      backgroundColor: isDark ? colors.surfaceAlt : colors.background,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    subsectionTitle: {
      fontSize: 13.5,
      fontFamily: fonts.bodySemiBold,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subsectionBody: {
      fontSize: 13,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      lineHeight: 19,
    },
  });
}
