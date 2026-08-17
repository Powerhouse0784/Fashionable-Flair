import React, { useMemo, useState } from 'react';
import { View, TextInput, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { categories } from '@/data/categories';
import { useColumns } from '@/hooks/useResponsive';
import { GRID_GAP } from '@/constants/layout';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Container from '@/components/Container';
import SortSheet, { SortOption } from '@/components/SortSheet';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const columns = useColumns();
  const { products } = useProducts();

  const results = useMemo(() => {
    const filtered = products.filter((p) => {
      const matchesQuery =
        query.trim().length === 0 ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.material?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !activeCategory || p.category === activeCategory;
      return matchesQuery && matchesCategory;
    });

    if (sortOption === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered; // 'default' — already newest-first from the sync query
  }, [query, activeCategory, sortOption, products]);

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
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRowWrap}>
          <FlatList
            horizontal
            style={{ flex: 1 }}
            data={[{ key: null, label: 'All' }, ...categories.map((c) => ({ key: c.key, label: c.label }))]}
            keyExtractor={(item) => item.key ?? 'all'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            renderItem={({ item }) => {
              const active = activeCategory === item.key;
              return (
                <TouchableOpacity
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setActiveCategory(item.key)}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            style={[styles.sortButton, sortOption !== 'default' && styles.sortButtonActive]}
            onPress={() => setSortSheetVisible(true)}
          >
            <Ionicons
              name="swap-vertical"
              size={15}
              color={sortOption !== 'default' ? colors.textInverse : colors.textSecondary}
            />
            <Text style={[styles.sortButtonText, sortOption !== 'default' && styles.sortButtonTextActive]}>
              {sortLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </Container>

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
          contentContainerStyle={{ gap: GRID_GAP, paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No products found"
              subtitle="Try a different keyword or category"
            />
          }
          renderItem={({ item }) => <ProductCard product={item} columns={columns} />}
        />
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  filterRowWrap: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.md },
  filterRow: { flexGrow: 1 },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginLeft: spacing.sm,
  },
  sortButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortButtonText: { ...typography.bodySmall, color: colors.textSecondary },
  sortButtonTextActive: { color: colors.textInverse, fontFamily: fonts.bodySemiBold },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.bodySmall, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse, fontFamily: fonts.bodySemiBold },
});
