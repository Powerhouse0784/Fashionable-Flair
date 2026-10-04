import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useViewportWidth } from '@/hooks/useViewportWidth';

interface Props {
  onBrowse: () => void;
}

// Artwork for the empty wishlist. Light is "Ocean Blue + White", dark is
// "Deep Blue + Gold". Each image already fades to transparent at its own
// edges, so it dissolves into the page instead of sitting in a box.
const ART = {
  light: {
    hero: require('@/assets/wishlist/empty-hero-light.png'),
    heroRatio: 740 / 334,
    corner: require('@/assets/wishlist/empty-corner-light.png'),
    wave: require('@/assets/wishlist/empty-wave-light.png'),
  },
  dark: {
    hero: require('@/assets/wishlist/empty-hero-dark.png'),
    heroRatio: 756 / 334,
    corner: require('@/assets/wishlist/empty-corner-dark.png'),
    wave: require('@/assets/wishlist/empty-wave-dark.png'),
  },
};

/**
 * What the Wishlist tab shows before anything has been saved: a jewellery-box
 * illustration, a short message, a "Browse Products" button and a soft floral
 * and wave backdrop pinned to the bottom of the screen.
 *
 * It's meant to be rendered directly inside the screen's ScrollView (not
 * inside a max-width Container) so the backdrop can run edge to edge; the
 * message itself is centred and kept to a comfortable width.
 */
export default function WishlistEmptyState({ onBrowse }: Props) {
  const { colors, isDark } = useTheme();
  const isWide = useIsWideScreen();
  const viewportWidth = useViewportWidth();
  const { height: windowHeight } = useWindowDimensions();
  // `root` needs a real, concrete height for the absolutely-positioned
  // wave/corner backdrop (pinned to its bottom edge) to land in the right
  // place. It used to rely on `flex: 1` to stretch to fill whatever space
  // was left in the parent ScrollView — that's exactly what react-native-
  // web's ScrollView does (a plain CSS flexbox there, so flex:1 fills the
  // viewport correctly), but RN's own ScrollView on native doesn't resolve
  // a lone flex:1 child the same way: Yoga has nothing to flex *against*
  // inside a scrollable content container, so it collapsed to `minHeight`
  // instead of the screen's real height. The backdrop then ended up
  // bunched up near the top of that short box instead of forming a bottom
  // "shoreline" under the whole screen, with a big blank gap below it —
  // exactly the "fine on web, broken on the app" bug reported. Deriving a
  // concrete pixel height from the window itself sidesteps that platform
  // difference entirely instead of depending on flex resolution.
  const minHeight = isWide ? 560 : 470;
  const rootHeight = Math.max(minHeight, Math.round(windowHeight * (isWide ? 0.7 : 0.62)));
  const { styles, palette } = makeStyles(colors, isDark, isWide, rootHeight);
  const art = isDark ? ART.dark : ART.light;

  const heroWidth = isWide ? Math.min(460, viewportWidth * 0.5) : Math.min(360, viewportWidth * 0.92);
  const waveHeight = isWide ? 150 : 100;
  const cornerWidth = isWide ? 200 : 128;

  return (
    <View style={styles.root}>
      {/* Backdrop — behind everything, never intercepts touches. */}
      <View pointerEvents="none" style={styles.decor}>
        <Image
          source={art.wave}
          style={[styles.wave, { height: waveHeight }]}
          contentFit="cover"
          contentPosition={{ right: 0, bottom: 0 }}
        />
        <Image
          source={art.corner}
          style={[styles.corner, { width: cornerWidth, height: cornerWidth * (324 / 456) }]}
          contentFit="contain"
          contentPosition={{ left: 0, bottom: 0 }}
        />
      </View>

      <View style={styles.content}>
        <Image
          source={art.hero}
          style={{ width: heroWidth, aspectRatio: art.heroRatio }}
          contentFit="contain"
          transition={200}
          accessibilityLabel="An open jewellery box with a heart necklace, surrounded by flowers"
        />

        <Text style={styles.title}>Your wishlist is empty</Text>
        <Text style={styles.subtitle}>Tap the heart on any product to save it here</Text>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onBrowse}
          accessibilityRole="button"
          accessibilityLabel="Browse products"
          style={styles.buttonShadow}
        >
          {isDark ? (
            <LinearGradient
              colors={['#F1CD82', colors.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonTextDark}>Browse Products</Text>
              <Ionicons name="arrow-forward" size={16} color="#1B1406" />
            </LinearGradient>
          ) : (
            <View style={[styles.button, { backgroundColor: colors.primary }]}>
              <Text style={styles.buttonTextLight}>Browse Products</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: palette.accentRule }]} />
          <Ionicons name="heart-outline" size={15} color={palette.accent} />
          <View style={[styles.dividerLine, { backgroundColor: palette.accentRule }]} />
        </View>
      </View>

      {/* The sign-off line has room to breathe on a laptop; on a phone the
          bottom of the screen is already busy with the tab bar and chat
          button, so it's left out there. */}
      {isWide && (
        <View style={styles.tagline}>
          <View style={[styles.taglineRule, { backgroundColor: palette.taglineRule }]} />
          <Text style={styles.taglineText}>Little things make big happiness</Text>
          <Ionicons name="heart-outline" size={17} color={palette.taglineText} />
          <View style={[styles.taglineRule, { backgroundColor: palette.taglineRule }]} />
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ColorTheme, isDark: boolean, isWide: boolean, rootHeight: number) {
  // Dark theme uses the gold accent (per the design); light uses the brand
  // blue, which also means a Premium accent skin (ruby, emerald…) tints this
  // screen the same way it tints every other button in light mode.
  const accent = isDark ? colors.gold : colors.primary;
  const accentRule = isDark ? 'rgba(217,169,67,0.55)' : `${colors.primary}55`;
  const taglineColor = isDark ? '#C9D6E8' : colors.primary;
  const taglineRule = isDark ? 'rgba(160,180,210,0.45)' : `${colors.primary}44`;

  const styles = StyleSheet.create({
    // Centers `content` within an explicit height (see the comment above
    // this function's call site for why that's computed from the window
    // instead of `flex: 1` + `minHeight`) — not `space-between`, which
    // only looks centered once the wide-only tagline below is also
    // present to balance it; on mobile, with content as the sole child,
    // `space-between` just pins it to the top.
    root: {
      width: '100%',
      height: rootHeight,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    decor: { ...StyleSheet.absoluteFillObject },
    wave: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    corner: { position: 'absolute', left: 0, bottom: 0 },

    content: { alignItems: 'center', paddingTop: isWide ? spacing.md : spacing.sm, paddingHorizontal: spacing.lg },

    title: {
      fontFamily: fonts.heading,
      fontSize: isWide ? 24 : 20,
      lineHeight: isWide ? 30 : 26,
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: isWide ? spacing.lg : spacing.md,
    },
    subtitle: {
      ...typography.body,
      fontSize: isWide ? 15 : 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },

    buttonShadow: {
      marginTop: spacing.lg,
      borderRadius: radius.pill,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 8px 22px ${accent}40` } as any)
        : { shadowColor: accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 5 }),
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.xl + 4,
      paddingVertical: 13,
      minWidth: 200,
    },
    buttonTextLight: { ...typography.button, color: colors.textInverse },
    buttonTextDark: { ...typography.button, color: '#1B1406' },

    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      width: 190,
      marginTop: spacing.lg,
    },
    dividerLine: { flex: 1, height: 1 },

    tagline: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    taglineRule: { width: 130, height: 1 },
    taglineText: { fontFamily: fonts.script, fontSize: 26, lineHeight: 34, color: taglineColor },
  });

  // Resolved colours the JSX needs directly (icon colours, rule fills).
  return { styles, palette: { accent, accentRule, taglineText: taglineColor, taglineRule } };
}
