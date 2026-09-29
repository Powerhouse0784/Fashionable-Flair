import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { Product } from '@/types/product';
import { RootStackParamList } from '@/types/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useModalBackClose } from '@/hooks/useModalBackClose';
import { getPrimaryImage } from '@/utils/productImages';
import { goToMeesho } from '@/utils/buyNow';
import { shareProduct } from '@/utils/share';
import { categories } from '@/data/categories';
import ProductPlaceholder from './ProductPlaceholder';
import PriceTag from './PriceTag';
import RatingStars from './RatingStars';
import Badge from './Badge';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  product: Product;
  style?: any;
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(categories.map((c) => [c.key, c.label]));

export default function WishlistItemCard({ product, style }: Props) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { toggleWishlist } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  // So a back-press (Android hardware button, or the browser's back/edge-
  // swipe on web) closes just this menu instead of skipping straight
  // through to whatever screen opened it — see useModalBackClose.
  useModalBackClose(menuOpen, () => setMenuOpen(false));
  const primaryImage = getPrimaryImage(product);
  const outOfStock = product.isAvailable === false;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: Platform.OS !== 'web', speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 20 }).start();

  const openDetail = () => navigation.navigate('ProductDetail', { productId: product.id });
  const handleBuyNow = () => goToMeesho(navigation, product.meeshoUrl, product.title);
  const handleShare = () => {
    setMenuOpen(false);
    shareProduct(product.title, product.meeshoUrl);
  };
  const handleRemove = () => {
    setMenuOpen(false);
    toggleWishlist(product.id);
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <View style={[styles.card, Platform.OS === 'web' && styles.webHover]}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.mainRow}
        onPress={openDetail}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.imageWrap}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage }} style={styles.image} contentFit="contain" transition={200} />
          ) : (
            <ProductPlaceholder category={product.category} />
          )}

          {(product.isNewArrival || product.isBestSeller || (product.compareAtPrice && product.compareAtPrice > product.price)) && (
            <View style={styles.badgeWrap}>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <Badge
                  label={`${Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF`}
                  variant="success"
                />
              )}
              {(product.isNewArrival || product.isBestSeller) && (
                <Badge label={product.isNewArrival ? 'New' : 'Bestseller'} variant={product.isNewArrival ? 'success' : 'gold'} />
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.heartButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => toggleWishlist(product.id)}
          >
            <Ionicons name="heart" size={16} color={colors.primary} />
          </TouchableOpacity>

          {outOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.topRow}>
            <Text style={styles.category} numberOfLines={1}>
              {CATEGORY_LABELS[product.category] || product.category}
            </Text>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setMenuOpen(true)}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
          {!!product.subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>{product.subtitle}</Text>
          )}

          <View style={styles.priceRow}>
            <PriceTag amount={product.price} compareAtAmount={product.compareAtPrice} hideBadge />
          </View>
          <RatingStars rating={product.rating} size={12} />

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.detailsButton} activeOpacity={0.85} onPress={openDetail}>
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buyButton, outOfStock && styles.buyButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleBuyNow}
              disabled={outOfStock}
            >
              <Ionicons name="flash" size={14} color={colors.textInverse} />
              <Text style={styles.buyButtonText}>{outOfStock ? 'Sold Out' : 'Buy Now'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>Share this piece</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleRemove}>
              <Ionicons name="heart-dislike-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuItemText, { color: colors.danger }]}>Remove from Wishlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      </View>
    </Animated.View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 10px ${colors.shadow}`, transitionProperty: 'box-shadow, border-color', transitionDuration: '150ms' } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 8, elevation: 2 }),
    },
    webHover: { cursor: 'pointer' } as any,
    mainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    // Fixed square, contentFit="contain" below — a real photo's own aspect
    // ratio (a close-up lifestyle shot, a wide flat-lay, whatever a seller
    // uploaded) used to get forced to cover a tall narrow strip here and
    // crop into a random zoomed-in sliver of the image. A fixed square with
    // "contain" instead always shows the whole photo, letterboxed on the
    // neutral backdrop if its shape doesn't fill the square exactly —
    // never cropped.
    imageWrap: {
      width: 108,
      height: 108,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
      position: 'relative',
    },
    image: { width: '100%', height: '100%' },
    badgeWrap: { position: 'absolute', top: spacing.xs, left: spacing.xs, gap: 4 },
    heartButton: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      backgroundColor: colors.surface,
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 1px 4px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 }),
    },
    outOfStockOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.72)',
      paddingVertical: 4,
      alignItems: 'center',
    },
    outOfStockText: { ...typography.caption, color: colors.textInverse, fontFamily: fonts.bodyBold, fontSize: 10 },
    details: { flex: 1, justifyContent: 'flex-start', minWidth: 0 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    category: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodySemiBold, flex: 1, marginRight: spacing.sm },
    title: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary, marginTop: 2, lineHeight: 18 },
    subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
    priceRow: { marginTop: spacing.xs },
    buttonsRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
    detailsButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailsButtonText: { ...typography.caption, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
    buyButton: {
      flex: 1,
      flexDirection: 'row',
      gap: 4,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buyButtonDisabled: { backgroundColor: colors.textMuted },
    buyButtonText: { ...typography.caption, color: colors.textInverse, fontFamily: fonts.bodySemiBold },

    menuBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    menuSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      maxWidth: 420,
      width: '100%',
      alignSelf: 'center',
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    menuItemText: { ...typography.body, color: colors.textPrimary },
    menuCancel: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
    menuCancelText: { ...typography.body, color: colors.textMuted, fontFamily: fonts.bodySemiBold },
  });
}
