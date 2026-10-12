import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
 * The floral/wave backdrop for the empty wishlist — rendered by
 * WishlistScreen as the LAST sibling after its ScrollView (not before it,
 * not overlapping it), inside the screen's own flex column. It is no
 * longer screen-filling or absolutely positioned at the screen level at
 * all — it's a perfectly ordinary block with its own fixed height, placed
 * last in normal top-to-bottom flow. "Last child in a column" is the one
 * positioning rule that cannot come out differently between platforms:
 * there's no ancestor height to measure, no stacking/paint-order to get
 * right, and nothing for it to anchor past — it is wherever the flow
 * naturally puts it, which is the bottom, full stop.
 *
 * This replaces two earlier attempts that both relied on some form of
 * absolute positioning against a screen-level box, and both broke on real
 * native devices even though each checked out in a web build:
 *
 * 1. First it lived inside WishlistEmptyState's own root (a child of the
 *    ScrollView's flexGrow:1 content) with position:absolute, bottom:0.
 *    That root's measured height wasn't stable the instant it mounted —
 *    it settled a frame or two later once the responsive-width hooks
 *    reported their real value — so the backdrop's "bottom" briefly
 *    chased a shorter, stale height and landed high up, mid-content.
 *
 * 2. Next it became a sibling of the ScrollView, absolutely filled
 *    against the screen's SafeAreaView. That box's bounds also covered
 *    the header above it (absolute positioning sizes to the parent
 *    regardless of which normal-flow sibling is drawn where), so on
 *    native the backdrop could end up painted over the header instead of
 *    below it — confirmed broken on a real device even after the web
 *    build looked right, which is why this version avoids screen-level
 *    absolute positioning entirely rather than trying to patch where it's
 *    anchored again.
 *
 * The only position:absolute left is wave-over-corner INSIDE this
 * component's own small, explicitly-sized box below — a self-contained
 * context with nothing ambiguous to measure, unlike the screen-level boxes
 * above.
 */
export function WishlistEmptyDecor() {
  const { isDark } = useTheme();
  const isWide = useIsWideScreen();
  const art = isDark ? ART.dark : ART.light;
  const waveHeight = isWide ? 150 : 100;
  const cornerWidth = isWide ? 200 : 128;
  const cornerHeight = cornerWidth * (324 / 456);
  const boxHeight = Math.max(waveHeight, cornerHeight);

  return (
    <View pointerEvents="none" style={[decorStyles.decor, { height: boxHeight }]}>
      <Image
        source={art.wave}
        style={[decorStyles.wave, { height: waveHeight }]}
        contentFit="cover"
        contentPosition={{ right: 0, bottom: 0 }}
      />
      <Image
        source={art.corner}
        style={[decorStyles.corner, { width: cornerWidth, height: cornerHeight }]}
        contentFit="contain"
        contentPosition={{ left: 0, bottom: 0 }}
      />
    </View>
  );
}

const decorStyles = StyleSheet.create({
  // A normal block — width:100% so the images inside (which are
  // position:absolute against THIS box, not the screen) can still span
  // edge to edge. No flex, no absoluteFillObject: its own `height` above
  // is all that sizes it, nothing about its ancestors matters.
  decor: { width: '100%' },
  wave: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  corner: { position: 'absolute', left: 0, bottom: 0 },
});

/**
 * What the Wishlist tab shows before anything has been saved: a jewellery-box
 * illustration, a short message and a "Browse Products" button. The floral/
 * wave backdrop is the separate WishlistEmptyDecor component above — see
 * WishlistScreen, which renders it pinned to the screen itself rather than
 * inside this scrollable content (see that component's own doc comment for
 * why).
 *
 * It's meant to be rendered directly inside the screen's ScrollView (not
 * inside a max-width Container) so its centred content can use the full
 * width to decide its own comfortable size.
 */
export default function WishlistEmptyState({ onBrowse }: Props) {
  const { colors, isDark } = useTheme();
  const isWide = useIsWideScreen();
  const viewportWidth = useViewportWidth();
  const { styles, palette } = makeStyles(colors, isDark, isWide);
  const art = isDark ? ART.dark : ART.light;

  const heroWidth = isWide ? Math.min(460, viewportWidth * 0.5) : Math.min(360, viewportWidth * 0.92);

  return (
    <View style={styles.root}>
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

function makeStyles(colors: ColorTheme, isDark: boolean, isWide: boolean) {
  // Dark theme uses the gold accent (per the design); light uses the brand
  // blue, which also means a Premium accent skin (ruby, emerald…) tints this
  // screen the same way it tints every other button in light mode.
  const accent = isDark ? colors.gold : colors.primary;
  const accentRule = isDark ? 'rgba(217,169,67,0.55)' : `${colors.primary}55`;
  const taglineColor = isDark ? '#C9D6E8' : colors.primary;
  const taglineRule = isDark ? 'rgba(160,180,210,0.45)' : `${colors.primary}44`;

  const styles = StyleSheet.create({
    // flex:1 + justifyContent:center lets this centre itself in whatever
    // space the ScrollView's flexGrow:1 content container gives it. No
    // minHeight guess needed any more — the only reason one existed before
    // was to push the (now-removed) decor artwork down toward the screen's
    // bottom, which is no longer this component's job at all.
    root: { flex: 1, width: '100%', justifyContent: 'center' },

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
