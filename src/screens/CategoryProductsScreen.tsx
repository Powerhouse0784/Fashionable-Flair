import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { getProductsByCategory } from '@/utils/productHelpers';
import { RootStackParamList } from '@/types/navigation';
import { useColumns } from '@/hooks/useResponsive';
import { GRID_GAP } from '@/constants/layout';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Container from '@/components/Container';
import SortSheet, { SortOption } from '@/components/SortSheet';

type CategoryRoute = RouteProp<RootStackParamList, 'CategoryProducts'>;

export default function CategoryProductsScreen() {
  const navigation = useNavigation();
  const route = useRoute<CategoryRoute>();
  const { category, label } = route.params;
  const { products } = useProducts();
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const columns = useColumns();

  const items = useMemo(() => {
    const filtered = getProductsByCategory(products, category);
    if (sortOption === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [products, category, sortOption]);

  const sortLabel =
    sortOption === 'price-asc' ? 'Price ↑' : sortOption === 'price-desc' ? 'Price ↓' : 'Sort';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Container>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{label}</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortOption !== 'default' && styles.sortButtonActive]}
            onPress={() => setSortSheetVisible(true)}
          >
            <Ionicons
              name="swap-vertical"
              size={14}
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
          key={`category-${columns}`}
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{ gap: GRID_GAP, paddingTop: spacing.md, paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState icon="cube-outline" title="No products in this category yet" />
          }
          renderItem={({ item }) => <ProductCard product={item} columns={columns} />}
        />
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  title: { ...typography.h3, color: colors.textPrimary },
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
  },
  sortButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortButtonText: { ...typography.bodySmall, color: colors.textSecondary },
  sortButtonTextActive: { color: colors.textInverse, fontFamily: fonts.bodySemiBold },
});
