import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useContentMetrics } from '@/hooks/useResponsive';
import { CategoryKey } from '@/types/product';

const PHONE = '8448822940';
const EMAIL = 'fashionableflair786@gmail.com';
const ADDRESS = 'R-3/A-2, 5 Mohan Garden, Uttam Nagar, New Delhi - 110059';

const SHOP_LINKS: { label: string; category: CategoryKey }[] = [
  { label: 'Earrings & Studs', category: 'earrings' },
  { label: 'Necklaces & Chains', category: 'necklaces' },
  { label: 'Jewellery Sets', category: 'jewellery-sets' },
  { label: 'Bracelets & Bangles', category: 'bracelets' },
];

/**
 * Desktop-web-only footer (only ever rendered once the layout is already
 * "wide" — see the isWide checks at each call site). Structured as two
 * stacked rows — brand block, then a 3-column link row — rather than one
 * wide flex-wrap row, so it holds together cleanly across the whole wide
 * range (roughly 900px up to a large monitor) instead of only looking
 * right at the very widest sizes.
 */
export default function Footer() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { sidePadding } = useContentMetrics();
  const navigation = useNavigation<any>();

  const FooterLink = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.link, Platform.OS === 'web' && styles.linkWeb]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.inner, { paddingHorizontal: sidePadding }]}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>Fashionable Flair</Text>
          <Text style={styles.tagline}>Jewellery that speaks your style.</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.meesho.com/h6z4l')}>
            <Text style={styles.storeLink}>Visit our Meesho store →</Text>
          </TouchableOpacity>

          <View style={styles.contactBlock}>
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${PHONE}`)}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.contactText}>{PHONE}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${EMAIL}`)}>
              <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.contactText}>{EMAIL}</Text>
            </TouchableOpacity>
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.contactText}>{ADDRESS}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.linksRow}>
          <View style={styles.linkCol}>
            <Text style={styles.colTitle}>Shop</Text>
            {SHOP_LINKS.map((item) => (
              <FooterLink
                key={item.category}
                label={item.label}
                onPress={() => navigation.navigate('CategoryProducts', { category: item.category, label: item.label })}
              />
            ))}
          </View>

          <View style={styles.linkCol}>
            <Text style={styles.colTitle}>Company</Text>
            <FooterLink label="About Us" onPress={() => navigation.navigate('About')} />
            <FooterLink label="Contact" onPress={() => navigation.navigate('Contact')} />
            <FooterLink label="FAQs" onPress={() => navigation.navigate('FAQ')} />
          </View>

          <View style={styles.linkCol}>
            <Text style={styles.colTitle}>Legal</Text>
            <FooterLink label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
            <FooterLink label="Terms of Service" onPress={() => navigation.navigate('Terms')} />
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Fashionable Flair. Products are sold and fulfilled by Meesho.
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: { width: '100%', backgroundColor: colors.surfaceAlt, marginTop: spacing.xxl },
    inner: {
      width: '100%',
      paddingVertical: spacing.xxl,
    },
    brandBlock: { maxWidth: 420 },
    brand: { ...typography.h3, color: colors.textPrimary },
    tagline: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    storeLink: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold, marginTop: spacing.md },
    contactBlock: { marginTop: spacing.lg, gap: spacing.xs },
    contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
    contactText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    linksRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xl,
    },
    linkCol: { flexGrow: 1, flexBasis: 140, minWidth: 120 },
    colTitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.sm },
    link: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
    linkWeb: {
      // @ts-ignore - web-only, no-op on native
      cursor: 'pointer',
    },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
    copyright: { ...typography.caption, color: colors.textMuted },
  });
}
