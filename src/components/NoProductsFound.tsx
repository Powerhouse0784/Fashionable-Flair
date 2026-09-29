import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Linking,
  StyleSheet,
  Platform,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { fonts } from '@/hooks/useAppFonts';
import {
  SUPPORT_PHONE,
  SUPPORT_EMAIL,
  WHATSAPP_NUMBER,
  WHATSAPP_DEFAULT_MESSAGE,
} from '@/config/socialLinks';

const isWeb = Platform.OS === 'web';

const heroLight = require('@/assets/no-products/no-products-hero-light.png');
const heroDark = require('@/assets/no-products/no-products-hero-dark.png');
const floralLight = require('@/assets/no-products/no-products-floral-light.png');
const floralDark = require('@/assets/no-products/no-products-floral-dark.png');
const waveLight = require('@/assets/no-products/no-products-wave-light.png');
const waveDark = require('@/assets/no-products/no-products-wave-dark.png');

/** width / height of the hero PNG. */
const HERO_ASPECT = 984 / 651;

interface Props {
  /** True when a search term or any filter is set — only then is "Clear Filters" meaningful. */
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExploreCategories: () => void;
}

/**
 * Empty state for the Search screen. It lives in the space left under the
 * search bar / chips / toolbar and is sized from that space, not from the
 * window:
 *
 *   1. The wrapper fills the remaining height and reports it (onLayout).
 *   2. The text, buttons and (on roomy desktop screens) the "Need help?"
 *      strip have known heights, so we add those up.
 *   3. Whatever height is left over becomes the illustration's height, with
 *      its width following the picture's aspect ratio. Too little room →
 *      the "Need help?" strip goes first, then the picture shrinks or
 *      disappears. The heading, message and buttons are never dropped.
 *
 * Everything is placed by explicit numbers, so nothing overlaps and the
 * screen never needs to scroll, on any phone, laptop or monitor.
 */
export default function NoProductsFound({ hasActiveFilters, onClearFilters, onExploreCategories }: Props) {
  const { colors, isDark, isCustomAppearance } = useTheme();
  const isWide = useIsWideScreen();
  const { width: winW } = useWindowDimensions();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((prev) =>
      prev && Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1 ? prev : { w: width, h: height }
    );
  };

  const availH = box?.h ?? 0;
  const availW = box?.w ?? winW;
  const compact = availH > 0 && availH < 520;

  // ---- Known heights of everything that isn't the illustration ----
  const titleSize = isWide ? (compact ? 28 : 36) : compact ? 22 : 26;
  const titleH = Math.round(titleSize * 1.25);
  const subLH = isWide ? (compact ? 22 : 26) : 21;
  const subH = subLH * (isWide ? 2 : 3);
  const btnH = compact ? 44 : 50;
  const stackedBtns = !isWide && hasActiveFilters;
  const actionsH = stackedBtns ? btnH * 2 + 10 : btnH;
  const titleMT = 4;
  const subMT = 6;
  const actionsMT = compact ? 14 : 20;
  const helpH = 92;
  const helpMT = 16;
  const vPad = 12;
  const safety = 8; // covers a text line wrapping differently than estimated

  const textStack = titleMT + titleH + subMT + subH + actionsMT + actionsH + vPad + safety;
  const heroMaxH = isWide ? 400 : 290;

  let showHelp = isWide && availH >= 640;
  let artH = availH - textStack - (showHelp ? helpH + helpMT : 0);
  if (showHelp && artH < 150) {
    showHelp = false;
    artH = availH - textStack;
  }
  artH = Math.min(artH, heroMaxH);
  let artW = artH * HERO_ASPECT;
  if (artW > availW - 16) {
    artW = availW - 16;
    artH = artW / HERO_ASPECT;
  }
  const showArt = artH >= 90;

  const styles = makeStyles(colors, isDark, {
    titleSize,
    subSize: isWide ? (compact ? 15 : 17) : 14.5,
    subLH,
    btnH,
    titleMT,
    subMT,
    actionsMT,
    helpMT,
  });

  const contacts = [
    {
      key: 'call',
      icon: 'call-outline',
      label: 'Call Us',
      value: `+91 ${SUPPORT_PHONE}`,
      onPress: () => Linking.openURL(`tel:+91${SUPPORT_PHONE}`),
    },
    {
      key: 'whatsapp',
      icon: 'logo-whatsapp',
      label: 'WhatsApp',
      value: 'Chat with us directly',
      onPress: () =>
        Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`),
    },
    {
      key: 'email',
      icon: 'mail-outline',
      label: 'Email Us',
      value: SUPPORT_EMAIL,
      onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
    },
  ];

  const emblem = Math.min(artH, 170);

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {box && (
        <View style={styles.content}>
          {showArt &&
            (isCustomAppearance ? (
              // The illustration is painted for the classic blue palette, so
              // Premium appearances get a simple themed emblem instead.
              <View style={[styles.emblem, { width: emblem, height: emblem, borderRadius: emblem / 2 }]}>
                <Ionicons name="search" size={emblem * 0.42} color={colors.primary} />
                <Ionicons name="sparkles" size={emblem * 0.2} color={colors.gold} style={styles.emblemSparkle} />
              </View>
            ) : (
              <Image
                source={isDark ? heroDark : heroLight}
                style={{ width: artW, height: artH }}
                resizeMode="contain"
                accessibilityLabel="A jewellery box and magnifying glass, illustrating that no matching products were found"
              />
            ))}

          <Text style={styles.title}>No products found</Text>
          <Text style={styles.subtitle}>
            We couldn't find any products matching your search. Try adjusting your filters or explore our
            categories.
          </Text>

          <View style={[styles.actions, isWide && styles.actionsWide]}>
            <Pressable
              onPress={onExploreCategories}
              accessibilityRole="button"
              accessibilityLabel="Explore categories"
              style={({ pressed }) => [styles.primaryBtn, !isWide && styles.btnFull, pressed && styles.pressed]}
            >
              <Ionicons name="grid-outline" size={18} color={colors.textInverse} />
              <Text style={styles.primaryBtnText}>Explore Categories</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textInverse} />
            </Pressable>

            {hasActiveFilters && (
              <Pressable
                onPress={onClearFilters}
                accessibilityRole="button"
                accessibilityLabel="Clear filters"
                style={({ pressed }) => [styles.ghostBtn, !isWide && styles.btnFull, pressed && styles.pressed]}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                <Text style={styles.ghostBtnText}>Clear Filters</Text>
              </Pressable>
            )}
          </View>

          {showHelp && (
            <View style={styles.help}>
              <Text style={styles.helpTitle}>Need help?</Text>
              <Text style={styles.helpSub}>Our team is here for you</Text>
              <View style={styles.helpRow}>
                {contacts.map((c) => (
                  <Pressable
                    key={c.key}
                    onPress={c.onPress}
                    accessibilityRole="link"
                    accessibilityLabel={`${c.label}: ${c.value}`}
                    style={({ pressed }) => [styles.helpItem, pressed && styles.pressed]}
                  >
                    <View style={styles.helpIcon}>
                      <Ionicons name={c.icon as any} size={17} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.helpLabel}>{c.label}</Text>
                      <Text style={styles.helpValue}>{c.value}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Corner artwork for the empty state (florals bottom-left on large screens,
 * a wave bottom-right). Render it as an absolutely-positioned sibling
 * behind the screen content — it never captures touches. Skipped under
 * Premium appearances, since it's painted for the classic blue palette.
 */
export function NoProductsDecor() {
  const { isDark, isCustomAppearance } = useTheme();
  const { width, height } = useWindowDimensions();
  if (isCustomAppearance) return null;

  const showFloral = width >= 1200 && height >= 640;
  const waveWidth = width >= 1024 ? 300 : 170;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {showFloral && (
        <Image
          source={isDark ? floralDark : floralLight}
          style={{ position: 'absolute', left: 0, bottom: 0, width: 220, height: 220 }}
          resizeMode="contain"
        />
      )}
      <Image
        source={isDark ? waveDark : waveLight}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: waveWidth,
          height: waveWidth * 0.4,
          opacity: isDark ? 0.8 : 0.9,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

interface Metrics {
  titleSize: number;
  subSize: number;
  subLH: number;
  btnH: number;
  titleMT: number;
  subMT: number;
  actionsMT: number;
  helpMT: number;
}

function makeStyles(colors: ColorTheme, isDark: boolean, m: Metrics) {
  return StyleSheet.create({
    // Fills the space under the toolbar. minHeight:0 lets it shrink inside
    // a flex column instead of pushing the page taller; overflow hidden is a
    // last-resort guard so nothing can ever create a scrollbar.
    wrap: { flex: 1, minHeight: 0, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    content: { width: '100%', alignItems: 'center', justifyContent: 'center' },

    emblem: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    emblemSparkle: { position: 'absolute', top: '16%', right: '16%' },

    title: {
      ...typography.h1,
      fontSize: m.titleSize,
      lineHeight: Math.round(m.titleSize * 1.25),
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: m.titleMT,
    },
    subtitle: {
      ...typography.body,
      fontSize: m.subSize,
      lineHeight: m.subLH,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 540,
      marginTop: m.subMT,
      paddingHorizontal: spacing.md,
    },

    actions: { width: '100%', gap: 10, marginTop: m.actionsMT, paddingHorizontal: spacing.xs },
    actionsWide: { flexDirection: 'row', justifyContent: 'center', width: 'auto', paddingHorizontal: 0, gap: spacing.md },
    btnFull: { width: '100%' },
    pressed: { opacity: 0.85 },

    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      height: m.btnH,
      paddingHorizontal: spacing.xl + spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      ...(isWeb
        ? ({ boxShadow: `0 8px 20px ${colors.primary}40`, cursor: 'pointer' } as any)
        : {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 4,
          }),
    },
    primaryBtnText: { ...typography.button, color: colors.textInverse },

    ghostBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      height: m.btnH,
      paddingHorizontal: spacing.xl + spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : `${colors.primary}55`,
      backgroundColor: isDark ? 'transparent' : colors.surface,
      ...(isWeb ? ({ cursor: 'pointer' } as any) : {}),
    },
    ghostBtnText: { ...typography.button, color: colors.primary },

    // ---- "Need help?" strip (wide + tall enough only) ----
    help: { width: '100%', maxWidth: 760, alignItems: 'center', marginTop: m.helpMT },
    helpTitle: { fontSize: 16, lineHeight: 20, fontFamily: fonts.headingMedium, color: colors.textPrimary },
    helpSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
    helpRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.xl },
    helpItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      ...(isWeb ? ({ cursor: 'pointer' } as any) : {}),
    },
    helpIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.surfaceAlt : colors.primaryLight,
    },
    helpLabel: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    helpValue: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 1 },
  });
}
