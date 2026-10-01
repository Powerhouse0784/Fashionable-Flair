import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image, Platform, ScrollView } from 'react-native';
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

const isWeb = Platform.OS === 'web';

const jewelleryBox = require('@/assets/about/jewellery_box.png');

const FEATURES = [
  { icon: 'diamond-outline', title: 'Curated Collection', body: 'Thoughtfully chosen pieces for every occasion.' },
  { icon: 'shield-checkmark-outline', title: 'Trusted Quality', body: 'Style, comfort and durability in every piece.' },
  { icon: 'heart-outline', title: 'Customer First', body: 'Your happiness is our biggest treasure.' },
] as const;

/**
 * Same hero formula as FAQScreen (eyebrow pill, title, gold rule, body text
 * on the plain page background, with one clean bounded image to the side) —
 * kept deliberately plain rather than a decorative full-bleed background:
 * the only art available for this page was busy enough everywhere that text
 * laid over it stopped being reliably readable in every theme, so plain
 * page-background text plus a single framed photo is what actually holds up.
 */
export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const isWide = useIsWideScreen();
  const handleScroll = useScrollVisibilityHandler();

  return (
    <WebPageWrapper>
      <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
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

          <Container>
            {/* ---------- Hero ---------- */}
            <View style={[styles.hero, isWide && styles.heroWide]}>
              <View style={[styles.heroText, isWide && styles.heroTextWide]}>
                <View style={styles.eyebrowBadge}>
                  <Text style={styles.eyebrowText}>ABOUT US</Text>
                </View>
                <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>Fashionable Flair</Text>
                <View style={styles.heroRule} />
                <Text style={styles.heroSubtitle}>Jewellery that speaks your style</Text>
                <Text style={styles.heroBody}>
                  Fashionable Flair started as a small, hand-curated jewellery collection — earrings, pendants,
                  chains, bracelets, and hair accessories chosen for everyday elegance without the everyday price
                  tag. Every piece in this catalog has been personally selected, not mass-imported.
                </Text>
              </View>

              <View style={[styles.heroArtShadowWrap, isWide && styles.heroArtShadowWrapWide]}>
                <View style={styles.heroArtWrap}>
                  <Image source={jewelleryBox} style={styles.heroArt} resizeMode="cover" />
                </View>
              </View>
            </View>

            {/* ---------- Feature bullets ---------- */}
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

            {/* ---------- Info cards ---------- */}
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
                <View style={styles.infoIconWrap}>
                  <Ionicons name="storefront" size={18} color={colors.textInverse} />
                </View>
                <Text style={styles.infoTitle}>Why Meesho?</Text>
                <Text style={styles.infoBody}>
                  Meesho handles the logistics — secure payments, order tracking, and delivery across India — so we
                  can focus on what we do best: finding pieces worth wearing.
                </Text>
                <Text style={styles.infoTagline}>Same great jewellery. Now just a tap away.</Text>
              </View>
            </View>

            {/* ---------- CTA ---------- */}
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
        </ScrollView>
      </SafeAreaView>
    </WebPageWrapper>
  );
}

function cardShadow(colors: ColorTheme) {
  return isWeb
    ? ({ boxShadow: `0 2px 10px ${colors.shadow}` } as any)
    : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 };
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },

    // ---------- Hero (same formula as FAQScreen) ----------
    hero: { marginTop: spacing.sm },
    heroWide: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
    heroText: {},
    heroTextWide: { flex: 1, paddingRight: spacing.xxl, maxWidth: 620 },
    eyebrowBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      marginBottom: spacing.md,
    },
    eyebrowText: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1, color: colors.primary },
    heroTitle: { fontSize: 30, lineHeight: 36, fontFamily: fonts.headingBold, color: colors.textPrimary },
    heroTitleWide: { fontSize: 40, lineHeight: 46 },
    heroRule: { width: 56, height: 3, borderRadius: 2, backgroundColor: colors.gold, marginVertical: spacing.md },
    heroSubtitle: { ...typography.body, color: colors.primary, fontFamily: fonts.bodySemiBold },
    heroBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.sm },

    heroArtShadowWrap: {
      width: 190,
      height: 132,
      alignSelf: 'center',
      marginTop: spacing.xl,
      borderRadius: radius.lg,
      ...cardShadow(colors),
    },
    heroArtShadowWrapWide: { width: 300, height: 208, marginTop: 0 },
    heroArtWrap: {
      flex: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    heroArt: { width: '100%', height: '100%' },

    // ---------- Feature bullets ----------
    featureRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
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

    // ---------- Info cards ----------
    infoRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    infoRowNarrow: { flexDirection: 'column' },
    infoCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
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
    infoTagline: {
      ...typography.bodySmall,
      fontFamily: fonts.heading,
      fontStyle: 'italic',
      color: colors.gold,
      marginTop: spacing.md,
    },

    // ---------- CTA ----------
    ctaCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xl,
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
