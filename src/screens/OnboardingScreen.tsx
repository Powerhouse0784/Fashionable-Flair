import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import Logo from '@/components/Logo';

interface Slide {
  title: string;
  description: string;
  /** Two or three short supporting chips shown under the description — fills
   * the plain part of the background with a bit more brand-relevant content
   * instead of leaving it empty. */
  highlights: string[];
  /** Wide (landscape) background — used on desktop, laptop and any wider-than-tall screen. */
  image: any;
  /** Tall version for tablets / squarish windows (keeps the full-width photo). */
  imageTablet: any;
  /** Tall version for phones and narrow windows (photo re-composed to fit a tall screen). */
  imagePortrait: any;
}

const SLIDES: Slide[] = [
  {
    title: '✨ Welcome to\nFashionable Flair',
    description:
      'Discover jewellery that speaks your style — explore our handpicked collection.',
    highlights: ['New arrivals weekly', 'Handpicked designs'],
    image: require('@/assets/onboarding/slide-1.jpg'),
    imageTablet: require('@/assets/onboarding/slide-1-tablet.jpg'),
    imagePortrait: require('@/assets/onboarding/slide-1-portrait.jpg'),
  },
  {
    title: '❤️ Save What You Love',
    description:
      'Tap the heart on any product to add it to your Wishlist — saved right on your device.',
    highlights: ['One-tap wishlist', 'Synced to your device'],
    image: require('@/assets/onboarding/slide-2.jpg'),
    imageTablet: require('@/assets/onboarding/slide-2-tablet.jpg'),
    imagePortrait: require('@/assets/onboarding/slide-2-portrait.jpg'),
  },
  {
    title: '🛡️ Secure Checkout',
    description:
      'Ready to buy? "Buy Now" takes you to our Meesho store for secure purchase.',
    highlights: ['Verified Meesho store', 'Buyer protection'],
    image: require('@/assets/onboarding/slide-3.jpg'),
    imageTablet: require('@/assets/onboarding/slide-3-tablet.jpg'),
    imagePortrait: require('@/assets/onboarding/slide-3-portrait.jpg'),
  },
  {
    title: '💬 Have Questions?',
    description:
      'Our AI assistant can answer anything about products, orders, or our app.',
    highlights: ['Always available', 'Instant answers'],
    image: require('@/assets/onboarding/slide-4.jpg'),
    imageTablet: require('@/assets/onboarding/slide-4-tablet.jpg'),
    imagePortrait: require('@/assets/onboarding/slide-4-portrait.jpg'),
  },
];

interface Props {
  onDone: () => void;
}

const isWeb = Platform.OS === 'web';
const HEADER_HEIGHT = isWeb ? 58 : 66; // row that holds the Skip button
// Footer (dots + button) height before it has been measured: 8 top padding +
// 7 dots + 12 gap + 48 button + bottom padding. Replaced by the real
// measurement on first layout.
const FOOTER_ESTIMATE = isWeb ? 99 : 91;

export default function OnboardingScreen({ onDone }: Props) {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  // Real height of the footer, so the logo / title / description can be
  // centred in exactly the space that is left between the Skip row and the
  // footer (the same place they sat before the backgrounds were added).
  const [footerHeight, setFooterHeight] = useState(FOOTER_ESTIMATE + insets.bottom);

  const isLast = index === SLIDES.length - 1;
  const logoSize = isWeb ? 140 : 116;

  // The photos are wide, so on a tall screen "cover" would crop them down to
  // the empty middle and lose all the flowers and jewellery. Tall screens get
  // a purpose-made portrait version of each photo instead.
  //   • phone-shaped (narrower than ~0.62 : 1)  -> portrait art
  //   • tablet / squarish tall (0.62 – 1 : 1)   -> tablet art
  //   • wider than tall (desktop, laptop)       -> original wide photo
  const aspect = width / height;
  const shape: 'phone' | 'tablet' | 'wide' = aspect < 0.62 ? 'phone' : aspect < 1 ? 'tablet' : 'wide';
  const pickImage = (item: Slide) =>
    shape === 'phone' ? item.imagePortrait : shape === 'tablet' ? item.imageTablet : item.image;

  // Keep the current slide snapped when the window is resized / rotated.
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: index * width, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);

    if (newIndex !== index && newIndex >= 0 && newIndex < SLIDES.length) {
      setIndex(newIndex);
    }
  };

  const goNext = () => {
    if (isLast) {
      onDone();
      return;
    }

    listRef.current?.scrollToOffset({
      offset: (index + 1) * width,
      animated: true,
    });
  };

  const goBack = () => {
    if (index === 0) return;

    listRef.current?.scrollToOffset({
      offset: (index - 1) * width,
      animated: true,
    });
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    // Every slide is exactly one full screen (width x height). The photo is
    // stretched over ALL of it — behind the Skip row and the footer too — so
    // the background reaches every edge of the page with no bands of plain
    // colour above or below it.
    <View style={{ width, height }}>
      <Image
        source={pickImage(item)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        // Tall art has its jewellery at the bottom, so anchor it there when the
        // screen is not exactly the artwork's shape.
        contentPosition={shape === 'wide' ? 'center' : 'bottom'}
        transition={200}
      />

      {/* Dark mode only: the photos are bright, so dim them slightly to keep
          the light-coloured text readable. Invisible in light mode. */}
      {isDark && <View style={styles.darkScrim} />}

      {/* Content: identical to the original layout — logo circle, title,
          description — centred in the space between the Skip row and footer. */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + HEADER_HEIGHT,
            paddingBottom: footerHeight,
          },
        ]}
      >
        <View style={styles.contentInner}>
          {/* Frosted glass panel: gives the plain part of the photo a designed
              surface to sit on (instead of bare gradient), and holds the
              highlight chips that add a bit more context per slide. */}
          <View style={styles.glassCard}>
            <View
              style={[
                styles.logoCircle,
                { width: logoSize, height: logoSize, borderRadius: logoSize / 2 },
              ]}
            >
              <Logo variant="mark" height={isWeb ? 84 : 70} />
            </View>

            <Text style={[styles.title, isWeb && styles.titleWeb]}>{item.title}</Text>

            <Text style={[styles.description, isWeb && styles.descriptionWeb]}>
              {item.description}
            </Text>

            <View style={styles.highlightRow}>
              {item.highlights.map((h) => (
                <View key={h} style={styles.highlightChip}>
                  <Ionicons name="sparkles" size={11} color={colors.primary} />
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { minHeight: height }]}>
      {/* Full-screen swipeable backgrounds + content */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={renderSlide}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        // Only 4 slides — render them all up front so the next background is
        // already loaded when the user swipes to it (no blank flash).
        initialNumToRender={SLIDES.length}
        windowSize={SLIDES.length + 1}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip button — floats on top of the background, top-right */}
      <View style={[styles.topHeader, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onDone}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Footer — progress dots + Back / Next, floats on top of the background */}
      <View
        style={[styles.footer, { paddingBottom: (isWeb ? spacing.xl : spacing.lg) + insets.bottom }]}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.progressContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i === index && styles.progressDotActive]}
            />
          ))}
        </View>

        <View style={styles.actionsRow}>
          {index > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, index > 0 && styles.nextButtonWithBack]}
            onPress={goNext}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
          >
            <Text style={styles.nextButtonText}>{isLast ? 'Get Started' : 'Next'}</Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.textInverse}
              style={{ marginLeft: 7 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorTheme, isDark: boolean) {
  // Soft light halo behind the text so it stays crisp on the photo's
  // light-rays / leaf shadows without adding any visible box or card.
  const textHalo = isDark
    ? {}
    : isWeb
    ? ({ textShadow: '0 1px 10px rgba(248,250,255,0.9)' } as any)
    : {
        textShadowColor: 'rgba(248,250,255,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
      };

  return StyleSheet.create({
    root: {
      flex: 1,
      overflow: 'hidden',
      // Only visible for an instant before the photo loads.
      backgroundColor: colors.background,
    },

    darkScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(7,17,31,0.62)',
      pointerEvents: 'none',
    },

    /* Skip row — sits above the slides, transparent so the photo shows through */
    topHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      minHeight: HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: isWeb ? 28 : 18,
      pointerEvents: 'box-none', // let swipes pass through the empty part of the row
    },

    skipButton: {
      backgroundColor: '#111827',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.pill,
      minHeight: 34,
      alignItems: 'center',
      justifyContent: 'center',

      ...(isWeb
        ? ({ boxShadow: '0 2px 4px rgba(0,0,0,0.12)' } as any)
        : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 }),
    },

    skipText: {
      color: '#FFFFFF',
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
    },

    /* Centre block: fills the whole slide, then centres its child in the
       space that's left after the Skip row (paddingTop) and footer
       (paddingBottom) are subtracted. */
    content: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none', // text is not interactive; swipes go straight to the list
    },

    contentInner: {
      alignItems: 'center',
      width: '100%',
      maxWidth: isWeb ? 600 : '100%',
      paddingHorizontal: isWeb ? spacing.xxl : spacing.xl,
    },

    // Frosted-glass surface behind the logo/title/description. Translucent
    // rather than solid so the photo still reads through it — it just gives
    // the plain part of the background a deliberate, designed surface
    // instead of leaving it bare.
    glassCard: {
      alignItems: 'center',
      width: '100%',
      borderRadius: 28,
      paddingVertical: isWeb ? 32 : 26,
      paddingHorizontal: isWeb ? 36 : 22,
      backgroundColor: isDark ? 'rgba(15,26,43,0.55)' : 'rgba(255,255,255,0.38)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)',

      ...(isWeb
        ? ({
            boxShadow: isDark
              ? '0 12px 32px rgba(0,0,0,0.35)'
              : '0 12px 32px rgba(40,108,176,0.14)',
            backdropFilter: 'blur(18px)',
          } as any)
        : {
            shadowColor: '#0B1A2E',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 24,
            elevation: 5,
          }),
    },

    highlightRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },

    highlightChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(40,108,176,0.09)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(40,108,176,0.18)',
      borderRadius: radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },

    highlightText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? colors.textSecondary : '#2E3E56',
    },

    logoCircle: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isWeb ? 14 : 12,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : '#C9DDF0',

      ...(isWeb
        ? ({ boxShadow: '0 6px 18px rgba(40,108,176,0.16)' } as any)
        : { shadowColor: '#286CB0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 4 }),
    },

    title: {
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
      lineHeight: 28,
      fontWeight: '700',
      fontSize: 21,
      paddingHorizontal: spacing.sm,
      ...textHalo,
    },

    titleWeb: {
      fontSize: 24,
      lineHeight: 34,
    },

    description: {
      // A shade darker than the theme's grey in light mode so it stays
      // readable over the photo's shadows (slide 3 especially).
      color: isDark ? colors.textSecondary : '#4F5F77',
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: isWeb ? 450 : 340,
      fontSize: 14,
      paddingHorizontal: spacing.sm,
      ...textHalo,
    },

    descriptionWeb: {
      fontSize: 15,
      lineHeight: 24,
    },

    /* Footer — transparent, pinned to the bottom over the photo */
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: isWeb ? spacing.xxl : spacing.xl,
      paddingTop: spacing.sm,
      gap: spacing.md,
      pointerEvents: 'box-none', // only the buttons catch touches; the rest passes through
    },

    progressContainer: {
      pointerEvents: 'none',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },

    progressDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.primary,
      opacity: 0.25,
    },

    progressDotActive: {
      width: 20,
      backgroundColor: colors.primary,
      opacity: 1,
    },

    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      width: '100%',
    },

    backButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },

    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: 48,
      width: '100%',
      maxWidth: isWeb ? 240 : '100%',
      alignSelf: 'center',

      ...(isWeb
        ? ({ boxShadow: `0 4px 8px ${colors.primary}40` } as any)
        : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 }),
    },

    // With a Back button alongside it, Next fills whatever space is left in the row.
    nextButtonWithBack: {
      flex: 1,
      width: undefined,
      maxWidth: isWeb ? 240 : undefined,
    },

    nextButtonText: {
      color: colors.textInverse,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  });
}
