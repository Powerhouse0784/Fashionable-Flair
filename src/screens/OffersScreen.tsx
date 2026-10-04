import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useViewportWidth } from '@/hooks/useViewportWidth';
import { GRID_GAP } from '@/constants/layout';
import { RootStackParamList } from '@/types/navigation';
import { ActiveOffer, fetchActiveOffers } from '@/services/offerService';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import EmptyState from '@/components/EmptyState';
import Container from '@/components/Container';
import MobileTopBar from '@/components/MobileTopBar';
import OfferProductCard from '@/components/OfferProductCard';
import { useScrollVisibilityHandler } from '@/context/ScrollVisibilityContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Split a flat list into fixed-size rows so the grid renders reliably at
 * any width — same approach as WishlistScreen/HomeScreen. */
function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export default function OffersScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const isWide = useIsWideScreen();
  const width = useViewportWidth();
  const styles = makeStyles(colors, isDark);
  const accent = isDark ? colors.gold : colors.primary;
  const { products, loading: productsLoading, refreshing, refresh } = useProducts();
  const handleScroll = useScrollVisibilityHandler();

  const [offers, setOffers] = useState<ActiveOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);

  const loadOffers = () => {
    if (productsLoading) return;
    setOffersLoading(true);
    fetchActiveOffers(products)
      .then(setOffers)
      .finally(() => setOffersLoading(false));
  };

  useEffect(loadOffers, [products, productsLoading]);

  const loading = productsLoading || offersLoading;
  const columns = width >= 760 ? 2 : 1;
  const rows = useMemo(() => chunk(offers, columns), [offers, columns]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isWide && <MobileTopBar />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.xxl }}
      >
        <Container>
          <View style={[styles.titleRow, isWide && styles.titleRowWide]}>
            <View style={styles.titleLeft}>
              <View style={styles.titleIconWrap}>
                <Ionicons name="gift" size={20} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, isWide && styles.titleWide]}>Offers & Deals</Text>
                <Text style={styles.subtitle}>Limited-time prices on pieces we've picked out.</Text>
              </View>
            </View>
            {offers.length > 0 && (
              <View style={styles.countPill}>
                <Ionicons name="flash" size={12} color={colors.primary} />
                <Text style={styles.countPillText}>{offers.length} live now</Text>
              </View>
            )}
          </View>
        </Container>

        <Container style={{ flex: 1 }}>
          {loading ? (
            <ProductGridSkeleton count={4} columns={columns} />
          ) : offers.length === 0 ? (
            <EmptyState
              icon="gift-outline"
              title="No offers right now"
              subtitle="Check back soon — new deals are added regularly."
            />
          ) : (
            <View style={{ gap: GRID_GAP, marginTop: spacing.xl }}>
              {rows.map((row, i) => (
                <View key={i} style={styles.gridRow}>
                  {row.map((offer) => (
                    <OfferProductCard key={offer.id} offer={offer} />
                  ))}
                  {columns > 1 &&
                    row.length < columns &&
                    Array.from({ length: columns - row.length }).map((_, i2) => (
                      <View key={`pad-${i2}`} style={{ flex: 1 }} />
                    ))}
                </View>
              ))}
            </View>
          )}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme, isDark: boolean) {
  const accent = isDark ? colors.gold : colors.primary;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
    titleRowWide: { marginTop: spacing.xxl },
    titleLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: spacing.sm },
    titleIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: isDark ? `${accent}26` : `${accent}18`,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    title: { ...typography.h2, color: colors.textPrimary },
    titleWide: { fontSize: 32, lineHeight: 38 },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    countPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: `${colors.gold}22`,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
    },
    countPillText: { ...typography.caption, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
    gridRow: { flexDirection: 'row', gap: GRID_GAP, alignItems: 'stretch' },
  });
}
