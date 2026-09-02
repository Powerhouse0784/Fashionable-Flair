import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { getProductsByCategory } from '@/utils/productHelpers';
import { RootStackParamList } from '@/types/navigation';
import { useColumns, useIsWideScreen } from '@/hooks/useResponsive';
import { GRID_GAP } from '@/constants/layout';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Container from '@/components/Container';
import SortSheet, { SortOption } from '@/components/SortSheet';
import FilterSheet, { FilterState, DEFAULT_FILTERS, countActiveFilters } from '@/components/FilterSheet';
import WebPageWrapper from '@/components/WebPageWrapper';
import Footer from '@/components/Footer';
import { goBackOrTo } from '@/utils/navigation';

type CategoryRoute = RouteProp<RootStackParamList, 'CategoryProducts'>;

function matchesPriceRange(price: number, range: FilterState['priceRange']): boolean {
  if (range === 'under-200') return price < 200;
  if (range === '200-400') return price >= 200 && price <= 400;
  if (range === 'above-400') return price > 400;
  return true;
}

export default function CategoryProductsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const route = useRoute<CategoryRoute>();
  const { category, label } = route.params;
  const { products, refreshing, refresh } = useProducts();
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const columns = useColumns();
  const isWide = useIsWideScreen();

  const items = useMemo(() => {
    const inCategory = getProductsByCategory(products, category);
    const filtered = inCategory.filter((p) => {
      const matchesPrice = matchesPriceRange(p.price, filters.priceRange);
      const matchesStock = !filters.inStockOnly || p.isAvailable !== false;
      return matchesPrice && matchesStock;
    });
    if (sortOption === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [products, category, filters, sortOption]);

  const activeFilterCount = countActiveFilters(filters);
  const sortLabel =
    sortOption === 'price-asc' ? 'Price ↑' : sortOption === 'price-desc' ? 'Price ↓' : 'Sort';

  const Toolbar = (
    <View style={styles.toolbar}>
      <TouchableOpacity
        style={[styles.toolbarButton, activeFilterCount > 0 && styles.toolbarButtonActive]}
        onPress={() => setFilterSheetVisible(true)}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={activeFilterCount > 0 ? colors.textInverse : colors.textSecondary}
        />
        <Text style={[styles.toolbarText, activeFilterCount > 0 && styles.toolbarTextActive]}>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Text>
      </TouchableOpacity>

      <View style={styles.toolbarDivider} />

      <TouchableOpacity
        style={[styles.toolbarButton, sortOption !== 'default' && styles.toolbarButtonActive]}
        onPress={() => setSortSheetVisible(true)}
      >
        <Ionicons
          name="swap-vertical"
          size={16}
          color={sortOption !== 'default' ? colors.textInverse : colors.textSecondary}
        />
        <Text style={[styles.toolbarText, sortOption !== 'default' && styles.toolbarTextActive]}>
          {sortLabel}
        </Text>
      </TouchableOpacity>

      <Text style={styles.resultCount}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </Text>
    </View>
  );

  const sheets = (
    <>
      <FilterSheet
        visible={filterSheetVisible}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterSheetVisible(false)}
        hideCategory
      />
      <SortSheet
        visible={sortSheetVisible}
        value={sortOption}
        onSelect={setSortOption}
        onClose={() => setSortSheetVisible(false)}
      />
    </>
  );

  // Wide/web: a normal scrolling page — grid wraps instead of paging, and
  // the footer sits at the true end of the content, reachable by scrolling,
  // matching Home and every info page instead of floating fixed on screen.
  // Putting Footer inside a FlatList's ListFooterComponent instead would
  // have inherited the Container's horizontal padding and broken its
  // full-bleed background band, so this uses a plain wrapping grid instead
  // of numColumns paging here, same as Home's wide-screen grid.
  if (isWide) {
    return (
      <WebPageWrapper>
        <SafeAreaView style={styles.safe}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          >
            <Container>
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>{label}</Text>
              </View>
              {Toolbar}
              {items.length > 0 ? (
                <View style={[styles.grid, { gap: GRID_GAP }]}>
                  {items.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </View>
              ) : (
                <EmptyState icon="cube-outline" title="No products match these filters" />
              )}
            </Container>
            <Footer />
          </ScrollView>
        </SafeAreaView>
        {sheets}
      </WebPageWrapper>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Container>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBackOrTo(navigation, 'Tabs')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{label}</Text>
          <View style={{ width: 22 }} />
        </View>
        {Toolbar}
      </Container>

      {sheets}

      <Container style={{ flex: 1 }}>
        <FlatList
          key={`category-${columns}`}
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{ gap: GRID_GAP, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="cube-outline" title="No products match these filters" />
          }
          renderItem={({ item }) => <ProductCard product={item} columns={columns} />}
        />
      </Container>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    title: { ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    toolbarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    toolbarButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    toolbarText: { ...typography.bodySmall, color: colors.textSecondary },
    toolbarTextActive: { color: colors.textInverse, fontFamily: fonts.bodySemiBold },
    toolbarDivider: { width: 1, height: 20, backgroundColor: colors.border },
    resultCount: { ...typography.caption, color: colors.textMuted, marginLeft: 'auto' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
  });
}
