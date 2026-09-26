import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { useWishlist } from '@/context/WishlistContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { GRID_GAP } from '@/constants/layout';
import { categories } from '@/data/categories';
import { RootStackParamList } from '@/types/navigation';
import WishlistItemCard from '@/components/WishlistItemCard';
import OptionSheet, { SheetOption } from '@/components/OptionSheet';
import EmptyState from '@/components/EmptyState';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import Container from '@/components/Container';
import Logo from '@/components/Logo';
import { useScrollVisibilityHandler } from '@/context/ScrollVisibilityContext';
import { confirmAsync } from '@/utils/confirm';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'rating';

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(categories.map((c) => [c.key, c.label]));

const SORT_OPTIONS: SheetOption[] = [
  { key: 'recent', label: 'Recently Added', icon: 'time-outline' },
  { key: 'price-asc', label: 'Price: Low to High', icon: 'arrow-up-outline' },
  { key: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down-outline' },
  { key: 'rating', label: 'Highest Rated', icon: 'star-outline' },
];

/** Split a flat list into fixed-size rows so the grid renders reliably at
 * any width — see HomeScreen.tsx for why this beats a flexWrap grid. */
function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export default function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const { width } = useWindowDimensions();
  const styles = makeStyles(colors);
  const { products, loading, refreshing, refresh } = useProducts();
  const { wishlistIds, clearWishlist } = useWishlist();
  const handleScroll = useScrollVisibilityHandler();

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const wishlistedProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const categoryOptions: SheetOption[] = useMemo(() => {
    const present = Array.from(new Set(wishlistedProducts.map((p) => p.category)));
    return [
      { key: 'all', label: 'All Items', icon: 'grid-outline' },
      ...present.map((key) => ({ key, label: CATEGORY_LABELS[key] || key, icon: 'pricetag-outline' })),
    ];
  }, [wishlistedProducts]);

  const visibleProducts = useMemo(() => {
    let list =
      categoryFilter === 'all' ? wishlistedProducts : wishlistedProducts.filter((p) => p.category === categoryFilter);

    if (sortKey === 'recent') {
      const order = [...wishlistIds].reverse(); // most recently added first
      list = [...list].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    } else if (sortKey === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortKey === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortKey === 'rating') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [wishlistedProducts, categoryFilter, sortKey, wishlistIds]);

  const handleClearAll = async () => {
    const confirmed = await confirmAsync(
      'Clear your wishlist?',
      `This removes all ${wishlistedProducts.length} saved items. This can't be undone.`,
      'Clear All'
    );
    if (confirmed) clearWishlist();
  };

  const columns = width >= 760 ? 2 : 1;
  const rows = useMemo(() => chunk(visibleProducts, columns), [visibleProducts, columns]);
  const currentCategoryLabel = categoryOptions.find((o) => o.key === categoryFilter)?.label || 'All Items';
  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label || 'Sort by';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.xxl }}
      >
        <Container>
          {!isWide && (
            <View style={styles.brandHeader}>
              <Logo variant="mark" height={40} />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.brand}>Fashionable Flair</Text>
                <Text style={styles.brandTagline}>Jewellery that speaks your style</Text>
              </View>
            </View>
          )}

          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <View style={styles.titleIconWrap}>
                <Ionicons name="heart" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>My Wishlist</Text>
                <Text style={styles.subtitle}>Your favourite pieces, always within reach.</Text>
              </View>
            </View>
            {wishlistedProducts.length > 0 && (
              <View style={styles.countPill}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={styles.countPillText}>
                  {wishlistedProducts.length} item{wishlistedProducts.length === 1 ? '' : 's'}
                </Text>
              </View>
            )}
          </View>

          {wishlistedProducts.length > 0 && (
            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.filterChip} activeOpacity={0.8} onPress={() => setCategorySheetOpen(true)}>
                <Ionicons name="grid-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.filterChipText} numberOfLines={1}>{currentCategoryLabel}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterChip} activeOpacity={0.8} onPress={() => setSortSheetOpen(true)}>
                <Ionicons name="swap-vertical-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.filterChipText} numberOfLines={1}>{currentSortLabel}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={{ flex: 1 }} />

              <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.clear}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}
        </Container>

        <Container style={{ flex: 1 }}>
          {loading && products.length === 0 ? (
            <ProductGridSkeleton count={4} columns={columns} />
          ) : wishlistedProducts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="heart-outline"
                title="Your wishlist is empty"
                subtitle="Tap the heart on any product to save it here"
              />
              <TouchableOpacity
                style={styles.browseButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Tabs')}
              >
                <Text style={styles.browseButtonText}>Browse Products</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          ) : visibleProducts.length === 0 ? (
            <EmptyState
              icon="filter-outline"
              title="No items in this filter"
              subtitle="Try a different category from the filter above"
            />
          ) : (
            <View style={{ gap: GRID_GAP }}>
              {rows.map((row, i) => (
                <View key={i} style={styles.gridRow}>
                  {row.map((item) => (
                    <WishlistItemCard key={item.id} product={item} style={columns > 1 ? { flex: 1 } : undefined} />
                  ))}
                  {columns > 1 &&
                    row.length < columns &&
                    Array.from({ length: columns - row.length }).map((_, i2) => (
                      <View key={`pad-${i2}`} style={{ flex: 1 }} />
                    ))}
                </View>
              ))}
            </View>
          )}
        </Container>
      </ScrollView>

      <OptionSheet
        visible={categorySheetOpen}
        title="Filter by Category"
        options={categoryOptions}
        value={categoryFilter}
        onSelect={setCategoryFilter}
        onClose={() => setCategorySheetOpen(false)}
      />
      <OptionSheet
        visible={sortSheetOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sortKey}
        onSelect={(k) => setSortKey(k as SortKey)}
        onClose={() => setSortSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    brandHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.sm },
    brand: { ...typography.h3, color: colors.textPrimary, fontFamily: fonts.heading },
    brandTagline: { ...typography.caption, color: colors.textMuted, marginTop: 1 },

    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
    titleLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: spacing.sm },
    titleIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: `${colors.primary}18`,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    countPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: `${colors.gold}22`,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
    },
    countPillText: { ...typography.caption, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },

    filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 3,
      maxWidth: 180,
    },
    filterChipText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold, flexShrink: 1 },
    clear: { ...typography.bodySmall, color: colors.danger, fontFamily: fonts.bodySemiBold },

    gridRow: { flexDirection: 'row', gap: GRID_GAP, alignItems: 'stretch' },
    emptyWrap: { flex: 1, alignItems: 'center' },
    browseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      marginTop: spacing.lg,
    },
    browseButtonText: { ...typography.button, color: colors.textInverse },
  });
}
