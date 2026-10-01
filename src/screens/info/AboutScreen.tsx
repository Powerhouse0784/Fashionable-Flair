import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useScrollVisibilityHandler } from '@/context/ScrollVisibilityContext';
import { goBackOrTo } from '@/utils/navigation';
import Container from '@/components/Container';
import WebPageWrapper from '@/components/WebPageWrapper';
import Footer from '@/components/Footer';

const heroLight = require('@/assets/about/about_hero_light.png');
const heroDark = require('@/assets/about/about_hero_dark.png');
const jewelleryBox = require('@/assets/about/jewellery_box.png');
const accentLight = require('@/assets/about/accent_light.png');
const accentDark = require('@/assets/about/accent_dark.png');
const dividerLight = require('@/assets/about/divider_light.png');
const dividerDark = require('@/assets/about/divider_dark.png');

const FEATURES = [
  { icon: 'diamond-outline', title: 'Curated Collection', body: 'Thoughtfully chosen pieces for every occasion.' },
  { icon: 'shield-checkmark-outline', title: 'Trusted Quality', body: 'Style, comfort and durability in every piece.' },
  { icon: 'heart-outline', title: 'Customer First', body: 'Your happiness is our biggest treasure.' },
] as const;

function cardShadow(colors: ColorTheme) {
  return Platform.OS === 'web'
    ? ({ boxShadow: `0 2px 10px ${colors.shadow}` } as any)
    : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 };
}

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const isWide = useIsWideScreen();
  const handleScroll = useScrollVisibilityHandler();
  const heroSource = isDark ? heroDark : heroLight;
  const accentSource = isDark ? accentDark : accentLight;
  const dividerSource = isDark ? dividerDark : dividerLight;

  return (
    <WebPageWrapper>
      <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {!isWide && (
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => goBackOrTo(navigation, 'Tabs')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Container style={{ paddingTop: isWide ? spacing.xl : spacing.sm, paddingBottom: spacing.xxl }}>
              {/* Hero — soft floral/marble banner with the brand story on
                  one side and the jewellery-box visual on the other; stacks
                  on narrow screens instead of squeezing side by side. */}
              <View style={styles.hero}>
                {isWide ? (
                  <Image source={heroSource} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                ) : (
                  // The banner art is a wide (~2.5:1) strip — stretching it
                  // to `cover` a tall stacked mobile layout would blow it up
                  // and crop away the floral corners, so on narrow screens
                  // it's a fixed-height band up top (close to its native
                  // aspect) instead of a full-bleed background.
                  <Image source={heroSource} style={styles.heroBandNarrow} contentFit="cover" />
                )}
                <View style={[styles.heroInner, isWide && styles.heroInnerWide]}>
                  <View style={[styles.heroText, isWide && styles.heroTextWide]}>
                    <View style={styles.eyebrowRow}>
                      <Text style={styles.eyebrow}>ABOUT US</Text>
                      <View style={styles.eyebrowLine} />
                    </View>
                    <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>Fashionable Flair</Text>
                    <Text style={styles.heroSubtitle}>Jewellery that speaks your style</Text>
                    <Text style={styles.heroBody}>
                      Fashionable Flair started as a small, hand-curated jewellery collection — earrings, pendants,
                      chains, bracelets, and hair accessories chosen for everyday elegance without the everyday price
                      tag. Every piece in this catalog has been personally selected, not mass-imported.
                    </Text>
                  </View>
                  <View style={[styles.heroImageOuter, isWide && styles.heroImageOuterWide]}>
                    <View style={styles.heroImageWrap}>
                      <Image source={jewelleryBox} style={styles.heroImage} contentFit="cover" />
                    </View>
                  </View>
                </View>
              </View>

              {/* Feature bullets */}
              <View style={[styles.featureRow, !isWide && styles.featureRowNarrow]}>
                {FEATURES.map((f) => (
                  <View key={f.title} style={[styles.featureItem, !isWide && styles.featureItemNarrow]}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name={f.icon as any} size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureBody}>{f.body}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Image source={dividerSource} style={styles.divider} contentFit="contain" />

              {/* Info cards */}
              <View style={[styles.infoRow, !isWide && styles.infoRowNarrow]}>
                <View style={[styles.infoCard, !isWide && styles.infoCardNarrow]}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="diamond" size={18} color={colors.textInverse} />
                  </View>
                  <Text style={styles.infoTitle}>How this works</Text>
                  <Text style={styles.infoBody}>
                    This app is a showcase of our full catalog, built for browsing the way we'd want to browse — fast,
                    clear, and without clutter. When you find something you love, "Buy Now" takes you straight to our
                    storefront on Meesho, where your order is placed, paid for, and shipped securely.
                  </Text>
                </View>

                <View style={[styles.infoCard, !isWide && styles.infoCardNarrow]}>
                  <Image source={accentSource} style={styles.infoAccent} contentFit="contain" pointerEvents="none" />
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="storefront" size={18} color={colors.textInverse} />
                  </View>
                  <Text style={styles.infoTitle}>Why Meesho?</Text>
                  <Text style={styles.infoBody}>
                    Meesho handles the logistics — secure payments, order tracking, and delivery across India — so we
                    can focus on what we do best: finding pieces worth wearing.
                  </Text>
                  <Text style={styles.infoTagline}>Same great jewellery.{'\n'}Now just a tap away.</Text>
                </View>
              </View>

              {/* CTA */}
              <View style={styles.ctaCard}>
                <View style={styles.ctaIconWrap}>
                  <Ionicons name="storefront" size={22} color={colors.primary} />
                </View>
                <Text style={styles.ctaText}>All purchases are completed on our official Meesho store.</Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.meesho.com/h6z4l')}>
                  <Text style={styles.ctaLink}>Visit the store →</Text>
                </TouchableOpacity>
              </View>
            </Container>
            {isWide && <Footer />}
          </View>
        </ScrollView>
      </SafeAreaView>
    </WebPageWrapper>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },

    hero: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...cardShadow(colors),
    },
    heroBandNarrow: { width: '100%', height: 120 },
    heroInner: { padding: spacing.lg },
    heroInnerWide: { flexDirection: 'row', alignItems: 'center', padding: spacing.xl, gap: spacing.xl },
    heroText: {},
    heroTextWide: { flex: 6 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    eyebrow: {
      ...typography.caption,
      color: colors.primary,
      fontFamily: fonts.bodySemiBold,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    eyebrowLine: { width: 28, height: 2, borderRadius: 1, backgroundColor: colors.gold },
    heroTitle: { ...typography.h1, fontFamily: fonts.headingBold, color: colors.textPrimary },
    heroTitleWide: { fontSize: 38 },
    heroSubtitle: { ...typography.body, color: colors.primary, fontFamily: fonts.bodySemiBold, marginTop: 2 },
    heroBody: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 21, maxWidth: 480 },
    heroImageOuter: { marginTop: spacing.lg, alignItems: 'flex-start' },
    heroImageOuterWide: { flex: 4, marginTop: 0, alignItems: 'center', justifyContent: 'center' },
    heroImageWrap: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.gold,
      ...cardShadow(colors),
    },
    heroImage: { width: 170, height: 150 },

    featureRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
    featureRowNarrow: { flexDirection: 'column' },
    featureItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      ...cardShadow(colors),
    },
    featureItemNarrow: { flex: undefined },
    featureIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTitle: { ...typography.body, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    featureBody: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },

    divider: { width: 200, height: 34, alignSelf: 'center', marginTop: spacing.xl, marginBottom: spacing.xs },

    infoRow: { flexDirection: 'row', gap: spacing.md },
    infoRowNarrow: { flexDirection: 'column' },
    infoCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      overflow: 'hidden',
      ...cardShadow(colors),
    },
    infoCardNarrow: { flex: undefined },
    infoIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    infoTitle: { ...typography.h3, fontFamily: fonts.heading, color: colors.textPrimary, marginBottom: spacing.xs },
    infoBody: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
    infoAccent: { position: 'absolute', bottom: 0, right: 0, width: 90, height: 90, opacity: 0.55 },
    infoTagline: {
      ...typography.bodySmall,
      fontFamily: fonts.heading,
      fontStyle: 'italic',
      color: colors.gold,
      marginTop: spacing.md,
      lineHeight: 20,
    },

    ctaCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    ctaIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },
    ctaLink: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold },
  });
}
