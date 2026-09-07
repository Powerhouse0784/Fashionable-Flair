import React, { useRef } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useIsWideScreen } from '@/hooks/useResponsive';
import { GRID_GAP } from '@/constants/layout';
import ProductCard from '@/components/ProductCard';
import CategoryPill from '@/components/CategoryPill';
import SectionHeader from '@/components/SectionHeader';
import Container from '@/components/Container';
import Footer from '@/components/Footer';
import TrustBar from '@/components/TrustBar';
import EmptyState from '@/components/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { products, refreshing, refresh } = useProducts();
  const { recentlyViewedIds } = useRecentlyViewed();
  const featured = getFeaturedProducts(products);
  const newArrivals = getNewArrivals(products);
  const bestSellers = getBestSellers(products);
  const recentlyViewed = recentlyViewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);
  const isWide = useIsWideScreen();
  
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Container>
          {/* Header - with Logo and better spacing */}
          {!isWide && (
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('@/assets/icon.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.brand}>Fashionable Flair</Text>
                  <Text style={styles.tagline}>Jewellery that speaks your style</Text>
                </View>
              </View>
            </View>
          )}

          {/* Hero banner */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, isWide && styles.heroWide]}
          >
            <View style={[styles.heroDecorOuter, { pointerEvents: 'none' }]} />
            <View style={[styles.heroDecorInner, { pointerEvents: 'none' }]} />
            {isWide && (
              <View style={[styles.heroIconCluster, { pointerEvents: 'none' }]}>
                <Ionicons name="diamond" size={64} color="rgba(255,255,255,0.14)" style={styles.heroIcon1} />
                <Ionicons name="heart" size={44} color="rgba(255,255,255,0.14)" style={styles.heroIcon2} />
                <Ionicons name="sparkles" size={52} color="rgba(255,255,255,0.14)" style={styles.heroIcon3} />
                <Ionicons name="infinite" size={40} color="rgba(255,255,255,0.14)" style={styles.heroIcon4} />
              </View>
            )}
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>NEW SEASON</Text>
              </View>
              <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>New Season, New Sparkle</Text>
              <Text style={styles.heroSubtitle}>
                {products.length > 0
                  ? `${products.length}+ handpicked pieces${products[0]?.rating ? ` · rated ${products[0].rating.toFixed(1)}★ by shoppers` : ''}`
                  : 'New pieces coming soon'}
              </Text>
              <TouchableOpacity
                style={styles.heroCta}
                activeOpacity={0.85}
                onPress={handleExplorePress}
              >
                <Text style={styles.heroCtaText}>Explore the Collection</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TrustBar variant="light" />
            </View>
          </LinearGradient>

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
            {products.length > 0 ? (
              <View style={[styles.grid, { gap: GRID_GAP }]}>
                {products.map((item) => (
                  <ProductCard key={item.id} product={item} />
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
    },
    heroWide: {
      marginTop: spacing.xl,
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xxl,
    },
    heroDecorOuter: {
      position: 'absolute',
      top: -60,
      right: -60,
      width: 220,
      height: 220,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroDecorInner: {
      position: 'absolute',
      bottom: -80,
      right: 60,
      width: 160,
      height: 160,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    heroIconCluster: {
      position: 'absolute',
      right: '8%',
      top: 0,
      bottom: 0,
      width: 320,
    },
    heroIcon1: { position: 'absolute', top: '18%', left: '40%' },
    heroIcon2: { position: 'absolute', top: '50%', left: '10%' },
    heroIcon3: { position: 'absolute', top: '65%', left: '55%' },
    heroIcon4: { position: 'absolute', top: '30%', left: '75%' },
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
    heroSubtitle: { ...typography.body, color: colors.primaryLight, marginTop: spacing.xs },
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
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  });
}