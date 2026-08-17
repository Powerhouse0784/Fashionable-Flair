import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';
import { useContentMetrics } from '@/hooks/useResponsive';

const COLUMNS = [
  {
    title: 'Shop',
    links: ['Earrings & Studs', 'Necklaces & Chains', 'Jewellery Sets', 'Bracelets & Bangles'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Contact', 'FAQs'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service'],
  },
];

/** Desktop-web-only footer, gives the site a finished, professional edge. */
export default function Footer() {
  const { sidePadding } = useContentMetrics();

  return (
    <View style={styles.wrap}>
      <View style={[styles.inner, { paddingHorizontal: sidePadding }]}>
        <View style={styles.row}>
          <View style={styles.brandCol}>
            <Text style={styles.brand}>Fashionable Flair</Text>
            <Text style={styles.tagline}>Jewellery that speaks your style.</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.meesho.com/h6z4l')}>
              <Text style={styles.storeLink}>Visit our Meesho store →</Text>
            </TouchableOpacity>
          </View>

          {COLUMNS.map((col) => (
            <View key={col.title} style={styles.col}>
              <Text style={styles.colTitle}>{col.title}</Text>
              {col.links.map((link) => (
                <Text key={link} style={styles.link}>
                  {link}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.divider} />
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Fashionable Flair. Products are sold and fulfilled by Meesho.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: colors.surfaceAlt, marginTop: spacing.xxl },
  inner: {
    width: '100%',
    paddingVertical: spacing.xxl,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxl },
  brandCol: { flex: 1.4, minWidth: 200 },
  brand: { ...typography.h3, color: colors.textPrimary },
  tagline: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  storeLink: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold, marginTop: spacing.md },
  col: { minWidth: 140 },
  colTitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.sm },
  link: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.xl, marginBottom: spacing.lg },
  copyright: { ...typography.caption, color: colors.textMuted },
});
