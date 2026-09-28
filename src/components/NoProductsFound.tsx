import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Linking,
  StyleSheet,
  Platform,
  useWindowDimensions,
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

interface Props {
  /** True when a search term or any filter is set — only then is "Clear Filters" meaningful. */
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExploreCategories: () => void;
}

/**
 * Empty state for the Search screen. Illustration, message, two clear next
 * steps, and (on wide screens) a "Need help?" contact strip.
 */
export default function NoProductsFound({ hasActiveFilters, onClearFilters, onExploreCategories }: Props) {
  const { colors, isDark } = useTheme();
  const isWide = useIsWideScreen();
  const styles = makeStyles(colors, isDark);

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

  return (
    <View style={styles.wrap}>
      <View style={styles.main}>
        <Image
          source={isDark ? heroDark : heroLight}
          style={[styles.hero, isWide && styles.heroWide]}
          resizeMode="contain"
          accessibilityLabel="A jewellery box and magnifying glass, illustrating that no matching products were found"
        />

        <Text style={[styles.title, isWide && styles.titleWide]}>No products found</Text>
        <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
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
      </View>

      {isWide && (
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
                  <Ionicons name={c.icon as any} size={18} color={colors.primary} />
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
  );
}

/**
 * Corner artwork for the empty state (florals bottom-left on large screens,
 * a wave bottom-right everywhere). Render it as an absolutely-positioned
 * sibling behind the screen content — it never captures touches.
 */
export function NoProductsDecor() {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const showFloral = width >= 1200;
  const waveWidth = width >= 1024 ? 340 : 200;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {showFloral && (
        <Image
          source={isDark ? floralDark : floralLight}
          style={{ position: 'absolute', left: 0, bottom: 0, width: 260, height: 260 }}
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
          opacity: isDark ? 0.85 : 1,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

function makeStyles(colors: ColorTheme, isDark: boolean) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.xl },
    main: { width: '100%', alignItems: 'center' },

    hero: { width: '100%', maxWidth: 340, aspectRatio: 992 / 659 },
    heroWide: { maxWidth: 560 },

    title: {
      ...typography.h1,
      fontSize: 30,
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: -spacing.md,
    },
    titleWide: { fontSize: 40, marginTop: -spacing.lg },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 23,
      maxWidth: 360,
      marginTop: spacing.sm,
    },
    subtitleWide: { fontSize: 17, lineHeight: 26, maxWidth: 560, marginTop: spacing.md },

    actions: { width: '100%', gap: spacing.md, marginTop: spacing.xl, paddingHorizontal: spacing.xs },
    actionsWide: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: 'auto',
      paddingHorizontal: 0,
      marginTop: spacing.xl + spacing.xs,
    },
    btnFull: { width: '100%' },
    pressed: { opacity: 0.85 },

    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      height: 52,
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
      height: 52,
      paddingHorizontal: spacing.xl + spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : `${colors.primary}40`,
      backgroundColor: 'transparent',
      ...(isWeb ? ({ cursor: 'pointer' } as any) : {}),
    },
    ghostBtnText: { ...typography.button, color: colors.primary },

    // ---- "Need help?" strip (wide only) ----
    help: {
      width: '100%',
      maxWidth: 760,
      alignItems: 'center',
      marginTop: 'auto',
      paddingTop: spacing.xxl,
    },
    helpTitle: { fontSize: 17, fontFamily: fonts.headingMedium, color: colors.textPrimary },
    helpSub: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg },
    helpRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.xl },
    helpItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      ...(isWeb ? ({ cursor: 'pointer' } as any) : {}),
    },
    helpIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.surfaceAlt : colors.primaryLight,
    },
    helpLabel: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    helpValue: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 1 },
  });
}
