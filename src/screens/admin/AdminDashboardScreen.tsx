import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductsContext';
import { useToast } from '@/context/ToastContext';
import { deleteProduct } from '@/services/productService';
import { hapticSuccess } from '@/utils/haptics';
import { formatPrice } from '@/utils/formatPrice';
import Container from '@/components/Container';
import ProductPlaceholder from '@/components/ProductPlaceholder';

const hasRealPhoto = (url?: string) => !!url && !url.includes('placehold.co');

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { session, isAdmin, loading: authLoading, signOut } = useAuth();
  const { products, refreshing, refresh, isLive, applyLocalDelete } = useProducts();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
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

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete product?', `"${title}" will be removed for everyone immediately.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
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
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut().then(() => navigation.replace('AdminLogin')) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Container>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Store Admin</Text>
            <Text style={styles.subtitle}>
              {products.length} product{products.length === 1 ? '' : 's'} · {isLive ? 'live' : 'local fallback'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AdminProductForm', {})}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={styles.addButtonText}>Add New Product</Text>
        </TouchableOpacity>
      </Container>

      <Container style={{ flex: 1 }}>
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingBottom: spacing.xxl, paddingTop: spacing.sm }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.thumb}>
                {hasRealPhoto(item.image) ? (
                  <Image source={{ uri: item.image }} style={styles.thumbImage} contentFit="cover" transition={150} />
                ) : (
                  <ProductPlaceholder category={item.category} compact />
                )}
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta}>
                  {formatPrice(item.price)} · {item.category}
                  {item.isAvailable === false ? ' · Out of stock' : ''}
                </Text>
              </View>
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
          )}
        />
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  addButtonText: { ...typography.button, color: colors.textInverse },
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
  thumb: { width: 48, height: 48, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  thumbImage: { width: '100%', height: '100%' },
  rowInfo: { flex: 1 },
  rowTitle: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
});
