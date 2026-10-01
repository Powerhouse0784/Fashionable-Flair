import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useProducts } from '@/context/ProductsContext';
import { categories } from '@/data/categories';
import { formatPrice } from '@/utils/formatPrice';
import AdminShell from './AdminShell';

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(categories.map((c) => [c.key, c.label]));

export default function AdminHomeScreen() {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const navigation = useNavigation<any>();
  const styles = makeStyles(colors);
  const { products, isLive } = useProducts();

  const stats = useMemo(() => {
    const total = products.length;
    const live = products.filter((p) => p.isAvailable !== false).length;
    const outOfStock = total - live;
    const onSale = products.filter((p) => !!p.compareAtPrice && p.compareAtPrice > p.price).length;
    const avgPrice = total ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / total) : 0;
    const byCategory = categories.map((c) => ({
      key: c.key,
      label: c.label,
      count: products.filter((p) => p.category === c.key).length,
    }));
    return { total, live, outOfStock, onSale, avgPrice, byCategory };
  }, [products]);

  const cards = [
    { label: 'Total Products', value: stats.total, icon: 'cube-outline', tint: colors.primary },
    { label: 'Live Now', value: stats.live, icon: 'checkmark-circle-outline', tint: colors.success },
    { label: 'Out of Stock', value: stats.outOfStock, icon: 'alert-circle-outline', tint: colors.danger },
    { label: 'On Sale', value: stats.onSale, icon: 'pricetag-outline', tint: colors.gold },
  ];

  return (
    <AdminShell active="AdminHome">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          A quick look at the catalog \u2014 {isLive ? 'live from Supabase' : 'showing the bundled local fallback'}.
        </Text>

        <View style={[styles.statsGrid, isWide && styles.statsGridWide]}>
          {cards.map((c) => (
            <View key={c.label} style={[styles.statCard, isWide && styles.statCardWide]}>
              <View style={[styles.statIconWrap, { backgroundColor: `${c.tint}18` }]}>
                <Ionicons name={c.icon as any} size={18} color={c.tint} />
              </View>
              <Text style={styles.statValue}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Average Price</Text>
          <Text style={styles.avgPrice}>{formatPrice(stats.avgPrice)}</Text>
          <Text style={styles.sectionCaption}>Across all {stats.total} listed products</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Products by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminCategories')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {stats.byCategory.map((c) => {
            const pct = stats.total ? Math.round((c.count / stats.total) * 100) : 0;
            return (
              <View key={c.key} style={styles.categoryRow}>
                <Text style={styles.categoryLabel} numberOfLines={1}>{c.label}</Text>
                <View style={styles.categoryTrack}>
                  <View style={[styles.categoryFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.categoryCount}>{c.count}</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('AdminProductForm', {})}
        >
          <Ionicons name="add" size={18} color={colors.textInverse} />
          <Text style={styles.ctaButtonText}>Add New Product</Text>
        </TouchableOpacity>
      </ScrollView>
    </AdminShell>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 900 },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },

    statsGrid: { gap: spacing.sm },
    statsGridWide: { flexDirection: 'row' },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    statCardWide: { marginBottom: 0 },
    statIconWrap: { width: 34, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    statValue: { ...typography.h2, color: colors.textPrimary },
    statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

    section: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginTop: spacing.lg,
    },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { ...typography.body, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    sectionLink: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodySemiBold },
    sectionCaption: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    avgPrice: { fontSize: 32, fontFamily: fonts.heading, color: colors.textPrimary, marginTop: spacing.xs },

    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
    categoryLabel: { ...typography.caption, color: colors.textSecondary, width: 130 },
    categoryTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
    categoryFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
    categoryCount: { ...typography.caption, color: colors.textMuted, width: 20, textAlign: 'right' },

    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      marginTop: spacing.xl,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 4px 12px ${colors.primary}40` } as any)
        : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }),
    },
    ctaButtonText: { ...typography.button, color: colors.textInverse },
  });
}
