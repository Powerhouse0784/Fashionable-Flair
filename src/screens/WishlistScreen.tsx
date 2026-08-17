import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { useWishlist } from '@/context/WishlistContext';
import { useColumns } from '@/hooks/useResponsive';
import { GRID_GAP } from '@/constants/layout';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Container from '@/components/Container';

export default function WishlistScreen() {
  const { products } = useProducts();
  const { wishlistIds, clearWishlist } = useWishlist();
  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
  const columns = useColumns();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Container>
        <View style={styles.header}>
          <Text style={styles.title}>My Wishlist</Text>
          {wishlistedProducts.length > 0 && (
            <TouchableOpacity onPress={clearWishlist}>
              <Text style={styles.clear}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </Container>

      <Container style={{ flex: 1 }}>
        <FlatList
          key={`wishlist-${columns}`}
          data={wishlistedProducts}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{ gap: GRID_GAP, paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="Your wishlist is empty"
              subtitle="Tap the heart on any product to save it here"
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  clear: { ...typography.bodySmall, color: colors.danger, fontFamily: fonts.bodySemiBold },
});
