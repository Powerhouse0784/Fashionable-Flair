import React from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
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

// On a phone (or a narrow browser tab) a horizontal-scroll carousel makes
// sense — the row is naturally wider than the screen. On a wide desktop
// browser the same 2-3 items just leave most of the row blank, so there
// we switch to a wrapping grid instead, which is what ProductRow does.
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

  return (
    <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Container>
          {/* Header — hidden on wide/web since TopNav already shows the brand */}
          {!isWide && (
            <View style={styles.header}>
              <Text style={styles.brand}>Fashionable Flair</Text>
              <Text style={styles.tagline}>Jewellery that speaks your style</Text>
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
                onPress={() => navigation.navigate('CategoryProducts', { category: 'earrings', label: 'Earrings & Studs' })}
              >
                <Text style={styles.heroCtaText}>Explore the Collection</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TrustBar variant="light" />
            </View>
          </LinearGradient>

          {/* Categories — wraps to fill the row on wide screens instead of
              trailing off into blank space after 6 items */}
          <SectionHeader title="Shop by Category" />
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

          {/* Recently viewed — only ever shown once the shopper has actually
              looked at something, on this device */}
          {recentlyViewed.length > 0 && (
            <>
              <SectionHeader title="Recently Viewed" />
              <ProductRow items={recentlyViewed} isWide={isWide} />
            </>
          )}

          {/* Full catalog grid */}
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
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    brand: { ...typography.h1, color: colors.textPrimary },
    tagline: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
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
    // Fills the otherwise-empty right side of the hero on wide screens with
    // a loose icon cluster — cheap, free, no real photography needed, and
    // reads as intentional brand texture rather than dead space.
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
