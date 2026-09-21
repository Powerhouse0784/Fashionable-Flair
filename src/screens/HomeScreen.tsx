import React, { useRef } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { categories } from '@/data/categories';
import { useProducts } from '@/context/ProductsContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { getFeaturedProducts, getNewArrivals, getBestSellers } from '@/utils/productHelpers';
import { Product } from '@/types/product';
import { RootStackParamList } from '@/types/navigation';
import { useIsWideScreen, useColumns } from '@/hooks/useResponsive';
import { GRID_GAP } from '@/constants/layout';
import ProductCard from '@/components/ProductCard';
import CategoryPill from '@/components/CategoryPill';
import SectionHeader from '@/components/SectionHeader';
import Container from '@/components/Container';
import Footer from '@/components/Footer';
import TrustBar from '@/components/TrustBar';
import EmptyState from '@/components/EmptyState';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import BannerCarousel from '@/components/BannerCarousel';
import WhyChooseUs from '@/components/WhyChooseUs';
import GoogleReviewsSection from '@/components/GoogleReviewsSection';
import Logo from '@/components/Logo';
import { useScrollVisibilityHandler } from '@/context/ScrollVisibilityContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Split a flat list into fixed-size rows. Used to render the "All Products"
 * grid as deterministic rows of exactly `size` cards instead of relying on
 * CSS flexWrap to break the line — flexWrap-based wrapping was found to
 * collapse to a single column on some mobile browsers, since it depends on
 * every card's computed pixel width lining up exactly with the row's
 * available width. Chunking into rows up front guarantees the right number
 * of cards per row on every device, matching how FlatList's numColumns
 * already works elsewhere in the app (e.g. CategoryProductsScreen). */
function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function ProductRow({ items, isWide }: { items: Product[]; isWide: boolean }) {
  if (isWide) {
    return (
      <View style={[{ flexDirection: 'row', flexWrap: 'wrap' }, { gap: GRID_GAP }]}>
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
      renderItem={({ item }) => <ProductCard product={item} compact />}
    />
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const { products, loading, refreshing, refresh } = useProducts();
  const { recentlyViewedIds } = useRecentlyViewed();
  const featured = getFeaturedProducts(products);
  const newArrivals = getNewArrivals(products);
  const bestSellers = getBestSellers(products);
  const recentlyViewed = recentlyViewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);
  const isWide = useIsWideScreen();
  const columns = useColumns();
  const handleScroll = useScrollVisibilityHandler();
  useDocumentMeta({
    title: 'Fashionable Flair',
    description: 'Trendy, affordable jewellery for women — earrings, pendants, chains, bracelets, and jewellery sets, delivered across India.',
  });
  
  // Create refs
  const scrollViewRef = useRef<ScrollView>(null);
  const allProductsRef = useRef<View>(null);

  // Function to scroll to the "All Products" section
  const scrollToAllProducts = () => {
    // Measure the position of the All Products section and scroll to it
    allProductsRef.current?.measureLayout(
      scrollViewRef.current as any,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
      },
      () => {
        // Fallback: scroll to the bottom if measurement fails
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    );
  };

  // Handle "Explore Collection" press
  const handleExplorePress = () => {
    // Navigate to Home tab
    navigation.navigate('Tabs');
    // Small delay to ensure navigation is complete
    setTimeout(scrollToAllProducts, 400);
  };

  return (
    <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Container>
          {/* Header - with Logo and better spacing */}
          {!isWide && (
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Logo variant="mark" height={46} />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.brand}>Fashionable Flair</Text>
                  <Text style={styles.tagline}>Jewellery that speaks your style</Text>
                </View>
              </View>
            </View>
          )}

          {/* Hero banner */}
          <View style={[styles.hero, isWide && styles.heroWide]}>
            <Image
              source={require('@/assets/hero-background.jpg')}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="right"
              transition={200}
            />
            {/* Scrim so the copy stays legible over whatever's behind it in
                the photo — heavier on the left where the text sits, fading
                out toward the right so the jewellery in the image stays
                fully visible. */}
            <LinearGradient
              colors={[
                isDark ? 'rgba(7,17,31,0.82)' : 'rgba(15,28,46,0.78)',
                isDark ? 'rgba(7,17,31,0.35)' : 'rgba(15,28,46,0.4)',
                'rgba(0,0,0,0)',
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>HANDPICKED COLLECTION</Text>
              </View>
              <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>Jewellery That Feels Like You</Text>
              <Text style={styles.heroSubtitle}>
                {products.length > 0
                  ? `${products.length}+ pieces, handpicked — not mass-imported`
                  : 'New pieces coming soon'}
              </Text>
              <TouchableOpacity
                style={styles.heroCta}
                activeOpacity={0.85}
                onPress={handleExplorePress}
              >
                <Text style={styles.heroCtaText}>Shop the Collection</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TrustBar variant="light" />
            </View>
          </View>

          {/* Categories */}
          <View style={styles.categorySection}>
            <SectionHeader title="Shop by Category" />
            <View style={styles.categorySpacer} />
            {isWide ? (
              <View style={[styles.categoryGrid, { gap: GRID_GAP }]}>
                {categories.map((item) => (
                  <CategoryPill
                    key={item.key}
                    category={item}
                    onPress={() =>
                      navigation.navigate('CategoryProducts', { category: item.key, label: item.label })
                    }
                  />
                ))}
              </View>
            ) : (
              <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <CategoryPill
                    category={item}
                    onPress={() =>
                      navigation.navigate('CategoryProducts', { category: item.key, label: item.label })
                    }
                  />
                )}
              />
            )}
          </View>

          {/* Scrollable promo banner strip */}
          <BannerCarousel />

          {/* Featured */}
          {featured.length > 0 && (
            <>
              <SectionHeader title="Editor's Pick" />
              <ProductRow items={featured} isWide={isWide} />
            </>
          )}

          {/* New arrivals */}
          {newArrivals.length > 0 && (
            <>
              <SectionHeader title="New Arrivals" />
              <ProductRow items={newArrivals} isWide={isWide} />
            </>
          )}

          {/* Best sellers */}
          {bestSellers.length > 0 && (
            <>
              <SectionHeader title="Best Sellers" />
              <ProductRow items={bestSellers} isWide={isWide} />
            </>
          )}

          {/* Recently viewed */}
          {recentlyViewed.length > 0 && (
            <>
              <SectionHeader title="Recently Viewed" />
              <ProductRow items={recentlyViewed} isWide={isWide} />
            </>
          )}

          {/* Full catalog grid - "All Products" section with ref */}
          <View ref={allProductsRef}>
            <SectionHeader title="All Products" />
            {loading && products.length === 0 ? (
              <ProductGridSkeleton count={6} columns={columns} />
            ) : products.length > 0 ? (
              <View style={{ gap: GRID_GAP }}>
                {chunk(products, columns).map((row, rowIndex) => (
                  <View key={rowIndex} style={[styles.gridRow, { gap: GRID_GAP }]}>
                    {row.map((item) => (
                      <ProductCard key={item.id} product={item} columns={columns} />
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="cube-outline"
                title="No products yet"
                subtitle="Check back soon — new pieces are on the way."
              />
            )}
          </View>

          {/* Why choose us — trust features */}
          <WhyChooseUs />

          {/* Google reviews CTA */}
          <GoogleReviewsSection />

          {!isWide && <View style={{ height: spacing.xxl }} />}
        </Container>

        {isWide && <Footer />}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === 'web' ? spacing.xl : spacing.lg,
      paddingBottom: spacing.md,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    logo: {
      width: 50,
      height: 50,
      borderRadius: radius.sm,
    },
    headerTextContainer: {
      flex: 1,
    },
    brand: { 
      ...typography.h1, 
      color: colors.textPrimary,
      fontSize: Platform.OS === 'web' ? 28 : 24,
    },
    tagline: { 
      ...typography.bodySmall, 
      color: colors.textSecondary, 
      marginTop: 2,
      fontSize: Platform.OS === 'web' ? 14 : 12,
    },
    hero: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      padding: spacing.xl,
      overflow: 'hidden',
      position: 'relative',
      minHeight: 300,
      justifyContent: 'center',
    },
    heroWide: {
      marginTop: spacing.xl,
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xxl,
      minHeight: 400,
    },
    heroContent: { maxWidth: 560 },
    heroBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
    },
    heroBadgeText: { ...typography.caption, color: colors.textInverse, letterSpacing: 1 },
    heroTitle: { ...typography.h2, color: colors.textInverse },
    heroTitleWide: { fontSize: 38 },
    heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.88)', marginTop: spacing.xs },
    heroCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.textInverse,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      marginTop: spacing.lg,
    },
    heroCtaText: { ...typography.button, color: colors.primary },
    categorySection: {
      marginTop: spacing.md,
    },
    categorySpacer: {
      height: spacing.sm,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    gridRow: {
      flexDirection: 'row',
    },
  });
}