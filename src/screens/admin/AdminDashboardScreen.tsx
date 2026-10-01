import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductsContext';
import { useToast } from '@/context/ToastContext';
import { deleteProduct } from '@/services/productService';
import { hapticSuccess } from '@/utils/haptics';
import { confirmAsync } from '@/utils/confirm';
import { formatPrice } from '@/utils/formatPrice';
import { getPrimaryImage } from '@/utils/productImages';
import { categories } from '@/data/categories';
import { Product, CategoryKey } from '@/types/product';
import ProductPlaceholder from '@/components/ProductPlaceholder';
import OptionSheet, { SheetOption } from '@/components/OptionSheet';
import AdminShell, { useAdminSearch } from './AdminShell';

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'rating';
const SORT_OPTIONS: SheetOption[] = [
  { key: 'default', label: 'Default Order', icon: 'list-outline' },
  { key: 'price-asc', label: 'Price: Low to High', icon: 'arrow-up-outline' },
  { key: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down-outline' },
  { key: 'rating', label: 'Highest Rated', icon: 'star-outline' },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const styles = makeStyles(colors);
  const { session, isAdmin, loading: authLoading, signOut } = useAuth();
  const { products, refreshing, refresh, isLive, applyLocalDelete } = useProducts();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  React.useEffect(() => {
    if (!authLoading && !session) {
      navigation.replace('AdminLogin');
    }
  }, [authLoading, session, navigation]);

  if (authLoading || (!session && !isAdmin)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Logged in, but this account isn't in the `admins` allowlist — a
  // regular customer landing here (e.g. by guessing the /admin URL) sees
  // a clear, dead-end message instead of a login loop or, worse, the
  // dashboard itself.
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerFill}>
          <View style={styles.deniedIconWrap}>
            <Ionicons name="lock-closed" size={28} color={colors.textInverse} />
          </View>
          <Text style={styles.deniedTitle}>Admin Access Only</Text>
          <Text style={styles.deniedSubtitle}>
            This account isn't on the store's admin list. If this is a mistake, double-check the account
            was added correctly in Supabase (see SUPABASE_SETUP.md).
          </Text>
          <View style={styles.deniedActions}>
            <TouchableOpacity
              style={styles.deniedSecondaryButton}
              onPress={() => signOut().then(() => navigation.replace('AdminLogin'))}
            >
              <Text style={styles.deniedSecondaryButtonText}>Try a Different Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deniedButton} onPress={() => navigation.navigate('Tabs')}>
              <Text style={styles.deniedButtonText}>Back to Shop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AdminShell active="AdminDashboard" searchable>
      <ProductsList
        products={products}
        refreshing={refreshing}
        refresh={refresh}
        isLive={isLive}
        applyLocalDelete={applyLocalDelete}
        deletingId={deletingId}
        setDeletingId={setDeletingId}
        showToast={showToast}
        navigation={navigation}
        colors={colors}
        styles={styles}
        isWide={isWide}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortKey={sortKey}
        sortSheetOpen={sortSheetOpen}
        setSortSheetOpen={setSortSheetOpen}
        setSortKey={setSortKey}
      />
    </AdminShell>
  );
}

function ProductsList({
  products,
  refreshing,
  refresh,
  isLive,
  applyLocalDelete,
  deletingId,
  setDeletingId,
  showToast,
  navigation,
  colors,
  styles,
  isWide,
  categoryFilter,
  setCategoryFilter,
  sortKey,
  sortSheetOpen,
  setSortSheetOpen,
  setSortKey,
}: any) {
  const { query } = useAdminSearch();

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirmAsync('Delete product?', `"${title}" will be removed for everyone immediately.`, 'Delete');
    if (!confirmed) return;

    setDeletingId(id);
    applyLocalDelete(id); // optimistic — instant in this admin's list
    try {
      await deleteProduct(id);
      showToast('Product deleted', 'success');
      hapticSuccess();
    } catch (err: any) {
      showToast('Delete failed — restoring item', 'error');
      refresh(); // roll back the optimistic removal by re-syncing from the server
    } finally {
      setDeletingId(null);
    }
  };

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p: Product) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    let list = products as Product[];
    if (categoryFilter !== 'all') list = list.filter((p) => p.category === categoryFilter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));

    if (sortKey === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortKey === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortKey === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, categoryFilter, query, sortKey]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label || 'Sort by';

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={[styles.pageHeaderRow, isWide && styles.pageHeaderRowWide]}>
              <View>
                <Text style={styles.title}>Store Admin</Text>
                <Text style={styles.subtitle}>Manage your products, categories, and inventory</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('AdminProductForm', {})}
              >
                <Ionicons name="add" size={18} color={colors.textInverse} />
                <Text style={styles.addButtonText}>Add New Product</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, categoryFilter === 'all' && styles.chipActive]}
                onPress={() => setCategoryFilter('all')}
              >
                <Text style={[styles.chipText, categoryFilter === 'all' && styles.chipTextActive]}>
                  All ({products.length})
                </Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.chip, categoryFilter === c.key && styles.chipActive]}
                  onPress={() => setCategoryFilter(c.key)}
                >
                  <Text style={[styles.chipText, categoryFilter === c.key && styles.chipTextActive]} numberOfLines={1}>
                    {c.label} ({categoryCounts.get(c.key) || 0})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.toolbarRow}>
              <TouchableOpacity style={styles.sortButton} onPress={() => setSortSheetOpen(true)}>
                <Ionicons name="swap-vertical-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.sortButtonText} numberOfLines={1}>{currentSortLabel}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </TouchableOpacity>
              <Text style={styles.countLabel}>
                {filtered.length} product{filtered.length === 1 ? '' : 's'} \u00b7 {isLive ? 'Live' : 'Local fallback'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }: { item: Product }) => {
          const hasDiscount = !!item.compareAtPrice && item.compareAtPrice > item.price;
          const discountPct = hasDiscount ? Math.round(((item.compareAtPrice! - item.price) / item.compareAtPrice!) * 100) : 0;
          const categoryLabel = categories.find((c) => c.key === item.category)?.label || item.category;
          const outOfStock = item.isAvailable === false;

          return (
            <View style={styles.row}>
              <View style={styles.thumb}>
                {getPrimaryImage(item) ? (
                  <Image source={{ uri: getPrimaryImage(item) }} style={styles.thumbImage} contentFit="cover" transition={150} />
                ) : (
                  <ProductPlaceholder category={item.category} compact />
                )}
              </View>

              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowCategory} numberOfLines={1}>{categoryLabel}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
                  {hasDiscount && (
                    <>
                      <Text style={styles.rowCompareAt}>{formatPrice(item.compareAtPrice!)}</Text>
                      <Text style={styles.discountText}>({discountPct}% OFF)</Text>
                    </>
                  )}
                </View>
              </View>

              {isWide && (
                <View style={[styles.statusBadge, outOfStock ? styles.statusBadgeOff : styles.statusBadgeLive]}>
                  <View style={[styles.statusDot, { backgroundColor: outOfStock ? colors.danger : colors.success }]} />
                  <Text style={[styles.statusText, { color: outOfStock ? colors.danger : colors.success }]}>
                    {outOfStock ? 'Out of Stock' : 'Live'}
                  </Text>
                </View>
              )}

              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('AdminProductForm', { productId: item.id })}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(item.id, item.title)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query ? `No products match "${query}".` : 'No products in this category yet.'}
          </Text>
        }
      />

      <OptionSheet
        visible={sortSheetOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sortKey}
        onSelect={setSortKey}
        onClose={() => setSortSheetOpen(false)}
      />
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    deniedIconWrap: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    deniedTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
    deniedSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
      maxWidth: 340,
    },
    deniedActions: { width: '100%', maxWidth: 320, marginTop: spacing.xl, gap: spacing.sm },
    deniedSecondaryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
    },
    deniedSecondaryButtonText: { ...typography.button, color: colors.textPrimary },
    deniedButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
    },
    deniedButtonText: { ...typography.button, color: colors.textInverse },

    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    listHeader: { paddingBottom: spacing.sm },
    pageHeaderRow: { paddingTop: spacing.lg, gap: spacing.md },
    pageHeaderRowWide: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 3,
      alignSelf: 'flex-start',
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 4px 12px ${colors.primary}40` } as any)
        : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }),
    },
    addButtonText: { ...typography.button, color: colors.textInverse },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 3,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    chipTextActive: { color: colors.textInverse },

    toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 3,
      maxWidth: 220,
    },
    sortButtonText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold, flexShrink: 1 },
    countLabel: { ...typography.caption, color: colors.textMuted },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    thumb: { width: 52, height: 52, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
    thumbImage: { width: '100%', height: '100%' },
    rowInfo: { flex: 1, minWidth: 0 },
    rowTitle: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    rowCategory: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 3, flexWrap: 'wrap' },
    rowPrice: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    rowCompareAt: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'line-through' },
    discountText: { ...typography.caption, color: colors.success, fontFamily: fonts.bodySemiBold },

    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, marginHorizontal: spacing.sm },
    statusBadgeLive: { backgroundColor: `${colors.success}18` },
    statusBadgeOff: { backgroundColor: `${colors.danger}18` },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { ...typography.caption, fontFamily: fonts.bodySemiBold },

    rowActions: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  });
}
