import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, LayoutAnimation, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { goBackOrTo } from '@/utils/navigation';
import Container from '@/components/Container';
import WebPageWrapper from '@/components/WebPageWrapper';
import Footer from '@/components/Footer';

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
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const isWide = useIsWideScreen();
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return CATEGORIES;
    const q = query.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey(openKey === key ? null : key);
  };

  return (
    <WebPageWrapper>
      <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          {!isWide && (
            <View style={styles.header}>
              <TouchableOpacity onPress={() => goBackOrTo(navigation, 'Tabs')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
          <Container>
            <View style={[styles.hero, isWide && styles.heroWide]}>
              <View style={styles.heroIcon}>
                <Ionicons name="help-circle" size={22} color={colors.textInverse} />
              </View>
              <Text style={[styles.title, isWide && styles.titleWide]}>Frequently Asked Questions</Text>
              <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
                Quick answers, grouped by topic. Can't find it? Contact us directly.
              </Text>
            </View>

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
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {filteredCategories.length === 0 ? (
              <Text style={styles.noResults}>No matching questions — try a different search, or Contact Us directly.</Text>
            ) : (
              filteredCategories.map((cat) => (
                <View key={cat.title} style={styles.categoryBlock}>
                  <View style={styles.categoryHeader}>
                    <Ionicons name={cat.icon as any} size={18} color={colors.primary} />
                    <Text style={styles.categoryTitle}>{cat.title}</Text>
                  </View>
                  {cat.items.map((item) => {
                    const key = `${cat.title}-${item.question}`;
                    const isOpen = openKey === key;
                    return (
                      <TouchableOpacity key={key} style={styles.item} activeOpacity={0.8} onPress={() => toggle(key)}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.question}>{item.question}</Text>
                          <Ionicons
                            name={isOpen ? 'remove-circle-outline' : 'add-circle-outline'}
                            size={20}
                            color={colors.primary}
                          />
                        </View>
                        {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </Container>
          {isWide && <Footer />}
        </ScrollView>
      </SafeAreaView>
    </WebPageWrapper>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    hero: { marginTop: spacing.sm },
    heroWide: { marginTop: spacing.xxl, alignItems: 'center' },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { ...typography.h1, color: colors.textPrimary },
    titleWide: { fontSize: 36, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    subtitleWide: { textAlign: 'center' },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 46,
      marginTop: spacing.xl,
    },
    searchBarWide: { maxWidth: 480, alignSelf: 'center', width: '100%' },
    searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
    noResults: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
    categoryBlock: { marginTop: spacing.xl },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
    categoryTitle: { ...typography.h3, fontFamily: fonts.heading, color: colors.textPrimary },
    item: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    question: { ...typography.body, color: colors.textPrimary, flex: 1 },
    answer: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  });
}
