import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { ProductReview } from '@/types/product';
import { fetchAllReviews, deleteReview } from '@/services/reviewService';
import { formatReviewDate } from '@/utils/date';
import { confirmAsync, alertInfo } from '@/utils/confirm';
import { useToast } from '@/context/ToastContext';
import RatingStars from '@/components/RatingStars';
import AdminShell from './AdminShell';

export default function AdminAllReviewsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const styles = makeStyles(colors);
  const { products } = useProducts();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchAllReviews().then((data) => {
      setReviews(data);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const productTitle = (id: string) => products.find((p) => p.id === id)?.title || 'Unknown product';

  const handleDelete = async (r: ProductReview) => {
    const confirmed = await confirmAsync('Delete this review?', `From ${r.authorName}. This can\u2019t be undone.`, 'Delete');
    if (!confirmed) return;
    try {
      await deleteReview(r.id);
      showToast('Review deleted', 'success');
      load();
    } catch (e: any) {
      alertInfo('Couldn\u2019t delete', e?.message || 'Something went wrong.');
    }
  };

  return (
    <AdminShell active="AdminAllReviews">
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={styles.title}>Reviews</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading\u2026' : `${reviews.length} review${reviews.length === 1 ? '' : 's'} across all products`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.author} numberOfLines={1}>{item.authorName}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AdminProductForm', { productId: item.productId })}>
                  <Text style={styles.productLink} numberOfLines={1}>{productTitle(item.productId)}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
            <RatingStars rating={item.rating} size={13} showLabel={false} />
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.date}>{formatReviewDate(item.createdAt)}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No reviews yet. Add genuine reviews from a product's Meesho listing via its edit page.</Text>
          ) : (
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )
        }
      />
    </AdminShell>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    list: { padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 720 },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
    author: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    productLink: { ...typography.caption, color: colors.primary, marginTop: 1 },
    body: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 19 },
    date: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  });
}
