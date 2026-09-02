import React, { useMemo, useState } from 'react';
import { View, TextInput, FlatList, StyleSheet, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { useColumns } from '@/hooks/useResponsive';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { GRID_GAP } from '@/constants/layout';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Container from '@/components/Container';
import SortSheet, { SortOption } from '@/components/SortSheet';
import FilterSheet, { FilterState, DEFAULT_FILTERS, countActiveFilters } from '@/components/FilterSheet';

function matchesPriceRange(price: number, range: FilterState['priceRange']): boolean {
  if (range === 'under-200') return price < 200;
  if (range === '200-400') return price >= 200 && price <= 400;
  if (range === 'above-400') return price > 400;
  return true;
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const columns = useColumns();
  const { products, refreshing, refresh } = useProducts();
  const { history, addSearch, clearHistory } = useSearchHistory();

  const results = useMemo(() => {
    const filtered = products.filter((p) => {
      const matchesQuery =
        query.trim().length === 0 ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.material?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !filters.category || p.category === filters.category;
      const matchesPrice = matchesPriceRange(p.price, filters.priceRange);
      const matchesStock = !filters.inStockOnly || p.isAvailable !== false;
      return matchesQuery && matchesCategory && matchesPrice && matchesStock;
    });

    if (sortOption === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered; // 'default' — already newest-first from the sync query
  }, [query, filters, sortOption, products]);

  const activeFilterCount = countActiveFilters(filters);
  const sortLabel =
    sortOption === 'price-asc' ? 'Price ↑' : sortOption === 'price-desc' ? 'Price ↓' : 'Sort';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Container>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search earrings, necklaces, sets..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCorrect={false}
            onSubmitEditing={() => addSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {query.length === 0 && history.length > 0 && (
          <View style={styles.historyRow}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.historyClear}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.historyChips}>
              {history.map((term) => (
                <TouchableOpacity key={term} style={styles.historyChip} onPress={() => setQuery(term)}>
                  <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.historyChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </Text>
        </View>
      </Container>

      <FilterSheet
        visible={filterSheetVisible}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterSheetVisible(false)}
      />
      <SortSheet
        visible={sortSheetVisible}
        value={sortOption}
        onSelect={setSortOption}
        onClose={() => setSortSheetVisible(false)}
      />

      <Container style={{ flex: 1 }}>
        <FlatList
          key={`search-${columns}`}
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{ gap: GRID_GAP, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No products found"
              subtitle="Try different filters or a broader search term"
            />
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
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      height: 46,
    },
    input: { flex: 1, marginLeft: spacing.sm, ...typography.body, color: colors.textPrimary },
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
    historyRow: { marginBottom: spacing.md },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    historyTitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase' },
    historyClear: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodySemiBold },
    historyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    historyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    historyChipText: { ...typography.bodySmall, color: colors.textSecondary },
  });
}
