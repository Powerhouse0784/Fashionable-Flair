import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { getProductById } from '@/utils/productHelpers';
import { RootStackParamList } from '@/types/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { shareProduct } from '@/utils/share';
import { goToMeesho } from '@/utils/buyNow';
import PriceTag from '@/components/PriceTag';
import RatingStars from '@/components/RatingStars';
import Badge from '@/components/Badge';
import ProductCard from '@/components/ProductCard';
import ProductPlaceholder from '@/components/ProductPlaceholder';
import SectionHeader from '@/components/SectionHeader';
import Container from '@/components/Container';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'ProductDetail'>;

const hasRealPhoto = (url?: string) => !!url && !url.includes('placehold.co');

export default function ProductDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const { productId } = route.params;
  const { products } = useProducts();
  const product = getProductById(products, productId);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { trackView } = useRecentlyViewed();
  const isWide = useIsWideScreen();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (product) trackView(product.id);
  }, [product?.id]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Product not found.</Text>
      </SafeAreaView>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6);

  const handleShare = () => shareProduct(product.title, product.meeshoUrl);
  const handleBuyNow = () => goToMeesho(navigation, product.meeshoUrl, product.title);

  const imageSize = isWide ? Math.min(460, width * 0.4) : width;

  const ActionRow = (
    <View style={isWide ? styles.actionRowWide : undefined}>
      <View style={styles.badgeRow}>
        {product.isNewArrival && <Badge label="New Arrival" variant="success" />}
        {product.isBestSeller && <Badge label="Bestseller" variant="gold" />}
      </View>

      <Text style={styles.title}>{product.title}</Text>
      {product.subtitle ? <Text style={styles.subtitle}>{product.subtitle}</Text> : null}

      <View style={styles.priceRow}>
        <PriceTag amount={product.price} style={{ fontSize: 24 }} />
        <RatingStars rating={product.rating} size={15} />
      </View>
      {product.ratingLabel && <Text style={styles.ratingLabel}>{product.ratingLabel}</Text>}
      {product.isAvailable === false && (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockBadgeText}>Currently Out of Stock</Text>
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Details</Text>
      {product.material && (
        <View style={styles.detailRow}>
          <Text style={styles.detailKey}>Material</Text>
          <Text style={styles.detailValue}>{product.material}</Text>
        </View>
      )}
      <View style={styles.detailRow}>
        <Text style={styles.detailKey}>Category</Text>
        <Text style={styles.detailValue}>
          {product.category.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoNote}>
        <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.infoNoteText}>
          This product is fulfilled and shipped by Meesho. Tap "Buy Now" to complete your purchase
          securely on Meesho{isWide ? ' (opens in a new tab)' : ''}.
        </Text>
      </View>

      {/* Inline CTA — shown here on wide/web layouts. On phones this is
          replaced by the sticky bottom bar so it's always reachable with a thumb. */}
      {isWide && (
        <TouchableOpacity
          style={[styles.ctaButtonInline, product.isAvailable === false && styles.ctaButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleBuyNow}
          disabled={product.isAvailable === false}
        >
          <Text style={styles.ctaButtonText}>
            {product.isAvailable === false ? 'Out of Stock' : 'Buy Now on Meesho'}
          </Text>
          {product.isAvailable !== false && <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isWide ? spacing.xxl : 100 }}>
        {isWide ? (
          <Container>
            <View style={styles.rowLayout}>
              <View style={[styles.imageWrap, { width: imageSize, aspectRatio: 1, borderRadius: radius.lg }]}>
                {hasRealPhoto(product.image) ? (
                  <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={200} />
                ) : (
                  <ProductPlaceholder category={product.category} />
                )}
                <View style={styles.imageOverlay}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                      <Ionicons name="share-social-outline" size={19} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => toggleWishlist(product.id)}>
                      <Ionicons
                        name={wishlisted ? 'heart' : 'heart-outline'}
                        size={19}
                        color={wishlisted ? colors.primary : colors.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.contentWide}>{ActionRow}</View>
            </View>

            {related.length > 0 && (
              <>
                <SectionHeader title="You May Also Like" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {related.map((item) => (
                    <View key={item.id} style={{ marginRight: spacing.sm }}>
                      <ProductCard product={item} compact />
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </Container>
        ) : (
          <>
            {/* Full-bleed hero image on phones — deliberately NOT inside
                Container, which would otherwise inset it with the page gutter. */}
            <View style={styles.imageWrap}>
              {hasRealPhoto(product.image) ? (
                <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={200} />
              ) : (
                <ProductPlaceholder category={product.category} />
              )}
              <SafeAreaView edges={['top']} style={styles.imageOverlay}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={19} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={() => toggleWishlist(product.id)}>
                    <Ionicons
                      name={wishlisted ? 'heart' : 'heart-outline'}
                      size={19}
                      color={wishlisted ? colors.primary : colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>

            <Container>
              <View style={styles.content}>{ActionRow}</View>

              {related.length > 0 && (
                <>
                  <SectionHeader title="You May Also Like" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {related.map((item) => (
                      <View key={item.id} style={{ marginRight: spacing.sm }}>
                        <ProductCard product={item} compact />
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}
            </Container>
          </>
        )}
      </ScrollView>

      {/* Sticky CTA — phones and native app only; desktop web uses the inline button above */}
      {!isWide && (
        <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
          <View style={styles.ctaPriceWrap}>
            <Text style={styles.ctaPriceLabel}>Price</Text>
            <PriceTag amount={product.price} style={{ fontSize: 18 }} />
          </View>
          <TouchableOpacity
            style={[styles.ctaButton, product.isAvailable === false && styles.ctaButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleBuyNow}
            disabled={product.isAvailable === false}
          >
            <Text style={styles.ctaButtonText}>
              {product.isAvailable === false ? 'Out of Stock' : 'Buy Now on Meesho'}
            </Text>
            {product.isAvailable !== false && <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  notFound: { ...typography.body, textAlign: 'center', marginTop: spacing.xxl },
  rowLayout: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: spacing.lg, gap: spacing.xl },
  imageWrap: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingVertical: spacing.lg },
  contentWide: { flex: 1, paddingTop: 0 },
  actionRowWide: {},
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  ratingLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  outOfStockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  outOfStockBadgeText: { ...typography.caption, color: colors.textInverse, fontFamily: fonts.bodyBold },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg },
  sectionLabel: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  detailKey: { ...typography.body, color: colors.textSecondary },
  detailValue: { ...typography.body, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoNoteText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  ctaButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    gap: spacing.xs,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaPriceWrap: { marginRight: spacing.md },
  ctaPriceLabel: { ...typography.caption, color: colors.textMuted },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  ctaButtonText: { ...typography.button, color: colors.textInverse },
  ctaButtonDisabled: { backgroundColor: colors.textMuted },
});
