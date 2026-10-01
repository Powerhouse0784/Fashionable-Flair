import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, LayoutAnimation, ScrollView, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const bgLight = require('@/assets/faq/faq-background-light.png');
const bgDark = require('@/assets/faq/faq-background-dark.png');
const heroPhotoLight = require('@/assets/faq/faq-hero-light.jpg');
const heroPhotoDark = require('@/assets/faq/faq-hero-dark.jpg');
const dividerLight = require('@/assets/faq/faq-divider-light.png');
const dividerDark = require('@/assets/faq/faq-divider-dark.png');

// How tall a slice of the decorative background art to show behind the top
// of the page before it fades into the flat page color — comfortably
// shorter than the page's real content height (hero + search + categories)
// so it never forces extra empty scroll space, on any screen size.
const BG_HEIGHT = 900;

interface FaqItem {
  question: string;
  answer: string;
}
interface FaqCategory {
  title: string;
  icon: string;
  items: FaqItem[];
}

const CATEGORIES: FaqCategory[] = [
  {
    title: 'Ordering & Payment',
    icon: 'cart-outline',
    items: [
      {
        question: 'Is this app affiliated with Meesho?',
        answer:
          'We showcase our own product catalog here, but every purchase is completed on our official Meesho storefront — Meesho handles payment, shipping, and order tracking.',
      },
      {
        question: 'How do I place an order?',
        answer:
          'Tap any product to see details, then tap "Buy Now on Meesho." You\'ll be taken straight to that product on Meesho to complete your purchase.',
      },
      {
        question: 'What payment methods are accepted?',
        answer:
          'All payments are processed by Meesho, so whatever methods Meesho supports for you — UPI, cards, net banking, wallets, or Cash on Delivery where available — work here too.',
      },
    ],
  },
  {
    title: 'Shipping & Returns',
    icon: 'cube-outline',
    items: [
      {
        question: 'How do I track my order?',
        answer:
          'Since your order is placed on Meesho, tracking and delivery updates happen there — check the Orders section of the Meesho app or website.',
      },
      {
        question: 'Can I return or exchange a product?',
        answer:
          "Returns and exchanges follow Meesho's return policy, since that's where the purchase and shipment are handled.",
      },
      {
        question: 'Do you deliver across India?',
        answer: 'Delivery coverage follows Meesho\u2019s own shipping network, which reaches most pin codes across India.',
      },
    ],
  },
  {
    title: 'Using the App',
    icon: 'phone-portrait-outline',
    items: [
      {
        question: 'How do I save items for later?',
        answer:
          'Tap the heart icon on any product to add it to your Wishlist — it\'s saved on your device and stays there even if you close the app.',
      },
      {
        question: "What if a product I want shows 'Out of Stock'?",
        answer:
          "We mark items out of stock as soon as we know, rather than removing them entirely — check back, or reach out via Contact Us if you'd like to be notified.",
      },
      {
        question: 'Do I need to create an account?',
        answer: 'No — browsing, wishlisting, and buying all work without any account. Sign-in only exists for store staff managing the catalog.',
      },
    ],
  },
  {
    title: 'Contact & Support',
    icon: 'help-buoy-outline',
    items: [
      {
        question: 'How can I reach you directly?',
        answer:
          'For questions about the app or website itself, call/WhatsApp 8448822940, email fashionableflair786@gmail.com, or use the Contact page form. For anything about a specific order, payment, or product, please contact Meesho directly — they handle every purchase.',
      },
      {
        question: 'How long until I get a response?',
        answer: 'We aim to respond within 24 hours for email and contact-form messages.',
      },
    ],
  },
];

export default function FAQScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation<any>();
  const isWide = useIsWideScreen();
  const handleScroll = useScrollVisibilityHandler();
  const [query, setQuery] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(CATEGORIES[0].title);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return CATEGORIES;
    const q = query.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const isSearching = query.trim().length > 0;

  const toggleCategory = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenCategory((prev) => (prev === title ? null : title));
  };

  const toggleItem = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <WebPageWrapper>
      <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        >
          <View style={styles.bgWrap} pointerEvents="none">
            <Image source={isDark ? bgDark : bgLight} style={styles.bgImage} resizeMode="cover" />
            <LinearGradient colors={['transparent', colors.background]} locations={[0.72, 1]} style={styles.bgFade} />
          </View>

          {!isWide && (
            <View style={styles.header}>
              <TouchableOpacity onPress={() => goBackOrTo(navigation, 'Tabs')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}

          <Container>
            {/* ---------- Hero ---------- */}
            <View style={[styles.hero, isWide && styles.heroWide]}>
              <View style={[styles.heroText, isWide && styles.heroTextWide]}>
                <View style={styles.eyebrowBadge}>
                  <Text style={styles.eyebrowText}>HELP & SUPPORT</Text>
                </View>
                <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>Frequently Asked Questions</Text>
                <View style={styles.heroRule} />
                <Text style={styles.heroSubtitle}>
                  Quick answers, grouped by topic.{'\n'}Can't find it? Contact us directly.
                </Text>
              </View>

              <View style={[styles.heroArtShadowWrap, isWide && styles.heroArtShadowWrapWide]}>
                <View style={styles.heroArtWrap}>
                  <Image
                    source={isDark ? heroPhotoDark : heroPhotoLight}
                    style={styles.heroArt}
                    resizeMode="cover"
                    accessibilityLabel="A jewellery necklace, earrings, bracelet and ring displayed on velvet stands"
                  />
                </View>
              </View>
            </View>

            {/* ---------- Search ---------- */}
            <View style={[styles.searchBar, isWide && styles.searchBarWide]}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search questions..."
                placeholderTextColor={colors.textMuted}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* ---------- Categories ---------- */}
            {filteredCategories.length === 0 ? (
              <View style={styles.noResultsWrap}>
                <Ionicons name="search-outline" size={28} color={colors.textMuted} />
                <Text style={styles.noResults}>No matching questions — try a different search, or Contact Us directly.</Text>
              </View>
            ) : (
              <View style={styles.categoryList}>
                {filteredCategories.map((cat) => {
                  const expanded = isSearching || openCategory === cat.title;
                  return (
                    <View key={cat.title} style={styles.categoryCard}>
                      <TouchableOpacity
                        style={styles.categoryHeader}
                        activeOpacity={0.75}
                        onPress={() => toggleCategory(cat.title)}
                        disabled={isSearching}
                      >
                        <View style={styles.categoryIconCircle}>
                          <Ionicons name={cat.icon as any} size={17} color={isDark ? '#1A1300' : colors.textInverse} />
                        </View>
                        <Text style={styles.categoryTitle}>{cat.title}</Text>
                        {!isSearching && (
                          <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={colors.textSecondary}
                          />
                        )}
                      </TouchableOpacity>

                      {expanded && (
                        <View style={styles.itemList}>
                          {cat.items.map((item) => {
                            const key = `${cat.title}-${item.question}`;
                            const isOpen = openKey === key;
                            return (
                              <TouchableOpacity
                                key={key}
                                style={styles.item}
                                activeOpacity={0.8}
                                onPress={() => toggleItem(key)}
                              >
                                <View style={styles.itemHeader}>
                                  <View style={styles.questionIconCircle}>
                                    <Ionicons name="help-outline" size={13} color={isDark ? colors.gold : colors.primary} />
                                  </View>
                                  <Text style={styles.question}>{item.question}</Text>
                                  <Ionicons
                                    name={isOpen ? 'remove-circle-outline' : 'add-circle-outline'}
                                    size={21}
                                    color={isDark ? colors.gold : colors.primary}
                                  />
                                </View>
                                {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ---------- Still have questions? ---------- */}
            <View style={styles.stillHave}>
              <Text style={styles.stillHaveScript}>Still have questions?</Text>
              <Text style={styles.stillHaveSubtext}>Our support team is here to help</Text>
              <Image
                source={isDark ? dividerDark : dividerLight}
                style={styles.dividerImage}
                resizeMode="contain"
              />
              <TouchableOpacity style={styles.contactCta} onPress={() => navigation.navigate('Contact')} activeOpacity={0.85}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.textInverse} />
                <Text style={styles.contactCtaText}>Contact Us</Text>
              </TouchableOpacity>
            </View>
          </Container>
          {isWide && <Footer />}
        </ScrollView>
      </SafeAreaView>
    </WebPageWrapper>
  );
}

function makeStyles(colors: ColorTheme, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },

    // ---------- Decorative background ----------
    bgWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: BG_HEIGHT },
    bgImage: { width: '100%', height: '100%' },
    bgFade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 },

    // ---------- Hero ----------
    hero: {
      marginTop: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: isDark ? colors.surface : colors.surfaceAlt,
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'transparent',
      padding: spacing.xl,
      overflow: 'hidden',
      ...(isWeb
        ? ({ boxShadow: `0 8px 24px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 2 }),
    },
    heroWide: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xl,
      padding: spacing.xxl,
    },
    heroText: {},
    heroTextWide: { flex: 1, paddingRight: spacing.xxl, maxWidth: 620 },
    eyebrowBadge: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? 'rgba(147, 197, 253, 0.16)' : '#E3F0FD',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      marginBottom: spacing.md,
    },
    eyebrowText: {
      fontSize: 11,
      fontFamily: fonts.bodyBold,
      letterSpacing: 1,
      color: isDark ? '#8FC1FA' : '#1B4F91',
    },
    heroTitle: {
      fontSize: 30,
      lineHeight: 36,
      fontFamily: fonts.headingBold,
      color: colors.textPrimary,
    },
    heroTitleWide: { fontSize: 40, lineHeight: 46 },
    heroRule: {
      width: 56,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.gold,
      marginVertical: spacing.md,
    },
    heroSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    heroArtShadowWrap: {
      width: 150,
      height: 168,
      alignSelf: 'center',
      marginTop: spacing.xl,
      borderRadius: radius.lg,
      ...(isWeb
        ? ({ boxShadow: `0 10px 26px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 3 }),
    },
    heroArtShadowWrapWide: { width: 240, height: 268, marginTop: 0 },
    heroArtWrap: {
      flex: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'transparent',
    },
    heroArt: { width: '100%', height: '100%' },

    // ---------- Search ----------
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      height: 50,
      marginTop: spacing.xl,
      ...(isWeb
        ? ({ boxShadow: `0 2px 10px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 1 }),
    },
    searchBarWide: { maxWidth: 480, alignSelf: 'center', width: '100%' },
    searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },

    // ---------- Categories ----------
    categoryList: { marginTop: spacing.xl, gap: spacing.md },
    categoryCard: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    categoryIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.gold : colors.primary,
    },
    categoryTitle: { ...typography.h3, fontFamily: fonts.heading, color: colors.textPrimary, flex: 1 },
    itemList: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
    item: {
      backgroundColor: isDark ? colors.background : colors.surfaceAlt,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    questionIconCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(217, 169, 67, 0.16)' : colors.primaryLight,
    },
    question: { ...typography.body, color: colors.textPrimary, flex: 1 },
    answer: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20, marginLeft: 24 + spacing.sm },
    noResultsWrap: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl, paddingVertical: spacing.xl },
    noResults: { ...typography.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 320 },

    // ---------- Still have questions ----------
    stillHave: { alignItems: 'center', marginTop: spacing.xxl, paddingVertical: spacing.lg },
    stillHaveScript: {
      fontFamily: fonts.script,
      fontSize: 30,
      color: isDark ? colors.gold : colors.primary,
    },
    stillHaveSubtext: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    dividerImage: { width: 220, height: 20, marginTop: spacing.lg, marginBottom: spacing.lg },
    contactCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: isDark ? colors.gold : colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm + 3,
      borderRadius: radius.pill,
    },
    contactCtaText: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: isDark ? '#1A1300' : colors.textInverse },
  });
}
