import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Animated,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useProducts } from '@/context/ProductsContext';
import { useColumns, useIsWideScreen } from '@/hooks/useResponsive';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { categories } from '@/data/categories';
import { CategoryKey } from '@/types/product';
import { GRID_GAP } from '@/constants/layout';
import ProductCard from '@/components/ProductCard';
import NoProductsFound, { NoProductsDecor } from '@/components/NoProductsFound';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { useScrollVisibilityHandler } from '@/context/ScrollVisibilityContext';
import Container from '@/components/Container';
import SortSheet, { SortOption } from '@/components/SortSheet';
import FilterSheet, { FilterState, DEFAULT_FILTERS, countActiveFilters } from '@/components/FilterSheet';
import SearchCategoryChip from '@/components/SearchCategoryChip';
import MobileQuickNav from '@/components/MobileQuickNav';

function matchesPriceRange(price: number, range: FilterState['priceRange']): boolean {
  if (range === 'under-200') return price < 200;
  if (range === '200-400') return price >= 200 && price <= 400;
  if (range === 'above-400') return price > 400;
  return true;
}

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const navigation = useNavigation<any>();
  const columns = useColumns();
  const isWide = useIsWideScreen();
  const handleScroll = useScrollVisibilityHandler();
  const { products, loading, refreshing, refresh } = useProducts();
  const { history, addSearch, clearHistory } = useSearchHistory();

  const {
    isListening,
    isSupported: micSupported,
    error: voiceError,
    toggle: toggleVoice,
  } = useVoiceSearch({
    onResult: (transcript) => setQuery(transcript),
    onFinalResult: (transcript) => addSearch(transcript),
  });

  // Gentle pulse behind the mic icon while it's actively listening.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isListening) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 550, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isListening, pulse]);

  const results = useMemo(() => {
    const filtered = products.filter((p) => {
      const matchesQuery =
        query.trim().length === 0 ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.material?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !filters.category || p.category === filters.category;
      const matchesPrice = matchesPriceRange(p.price, filters.priceRange);
      const matchesStock = !filters.inStockOnly || p.isAvailable !== false;
      return matchesQuery && matchesCategory && matchesPrice && matchesStock;
    });

    if (sortOption === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortOption === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered; // 'default' — already newest-first from the sync query
  }, [query, filters, sortOption, products]);

  const activeFilterCount = countActiveFilters(filters);
  const showEmpty = !(loading && products.length === 0) && results.length === 0;
  const sortLabel =
    sortOption === 'price-asc' ? 'Price ↑' : sortOption === 'price-desc' ? 'Price ↓' : 'Sort';

  const selectCategory = (key: CategoryKey | null) =>
    setFilters((f) => ({ ...f, category: f.category === key ? null : key }));

  const submitSearch = () => {
    addSearch(query);
  };

  const header = (
    <View>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[styles.searchBar, inputFocused && styles.searchBarFocused]}
      >
        <Ionicons name="search" size={19} color={inputFocused ? colors.primary : colors.textMuted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={isListening ? 'Listening…' : 'Search earrings, pendants, sets...'}
          placeholderTextColor={isListening ? colors.primary : colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
          selectionColor={colors.primary}
          accessibilityLabel="Search products"
        />
        {query.length > 0 && (
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        {micSupported && (
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            onPress={toggleVoice}
            style={styles.micButton}
            accessibilityLabel={isListening ? 'Stop voice search' : 'Search by voice'}
          >
            <Animated.View
              style={[
                styles.micPulse,
                isListening && { backgroundColor: isDark ? colors.gold : colors.primary },
                { transform: [{ scale: pulse }] },
              ]}
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={17}
                color={isListening ? (isDark ? colors.textPrimary : colors.textInverse) : colors.textSecondary}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </Pressable>

      {voiceError && (
        <View style={styles.voiceErrorBanner}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.voiceErrorText}>{voiceError}</Text>
        </View>
      )}

      <View style={styles.categoryRowWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          <SearchCategoryChip
            label="All"
            icon="grid-outline"
            active={!filters.category}
            onPress={() => selectCategory(null)}
          />
          {categories.map((c) => (
            <SearchCategoryChip
              key={c.key}
              label={c.label.split(' & ')[0]}
              icon={c.icon}
              active={filters.category === c.key}
              onPress={() => selectCategory(c.key)}
            />
          ))}
        </ScrollView>
        {Platform.OS !== 'web' && (
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.categoryFade}
          />
        )}
      </View>

      {query.length === 0 && history.length > 0 && (
        <View style={styles.historyRow}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.historyClear}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyChips}>
            {history.map((term) => (
              <TouchableOpacity key={term} style={styles.historyChip} onPress={() => setQuery(term)}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.historyChipText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, activeFilterCount > 0 && styles.toolbarButtonActive]}
          onPress={() => setFilterSheetVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFilterCount > 0 ? colors.textInverse : colors.textSecondary}
          />
          <Text style={[styles.toolbarText, activeFilterCount > 0 && styles.toolbarTextActive]}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>

        <View style={styles.toolbarDivider} />

        <TouchableOpacity
          style={[styles.toolbarButton, sortOption !== 'default' && styles.toolbarButtonActive]}
          onPress={() => setSortSheetVisible(true)}
        >
          <Ionicons
            name="swap-vertical"
            size={16}
            color={sortOption !== 'default' ? colors.textInverse : colors.textSecondary}
          />
          <Text style={[styles.toolbarText, sortOption !== 'default' && styles.toolbarTextActive]}>{sortLabel}</Text>
        </TouchableOpacity>

        <Text style={styles.resultCount}>
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {showEmpty && <NoProductsDecor />}
      {!isWide && <MobileQuickNav />}
      <Container style={{ flex: 1 }}>
        {loading && products.length === 0 ? (
          <>
            {header}
            <ProductGridSkeleton count={6} columns={columns} />
          </>
        ) : showEmpty ? (
          <>
            {header}
            <NoProductsFound
              hasActiveFilters={query.trim().length > 0 || activeFilterCount > 0}
              onClearFilters={() => {
                setQuery('');
                setFilters(DEFAULT_FILTERS);
              }}
              onExploreCategories={() => navigation.navigate('Tabs', { screen: 'Home' })}
            />
          </>
        ) : (
          <FlatList
            key={`search-${columns}`}
            data={results}
            keyExtractor={(item) => item.id}
            numColumns={columns}
            columnWrapperStyle={{ gap: GRID_GAP }}
            contentContainerStyle={{ gap: GRID_GAP, paddingBottom: spacing.xxl, flexGrow: 1 }}
            ListHeaderComponent={header}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
            renderItem={({ item }) => <ProductCard product={item} columns={columns} />}
          />
        )}
      </Container>

      <FilterSheet
        visible={filterSheetVisible}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterSheetVisible(false)}
      />
      <SortSheet
        visible={sortSheetVisible}
        value={sortOption}
        onSelect={setSortOption}
        onClose={() => setSortSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      height: 52,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 10px ${colors.shadow}`, cursor: 'text' } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 2 }),
    },
    searchBarFocused: {
      borderColor: colors.primary,
      // Soft focus ring instead of the browser's default black outline.
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 0 0 4px ${colors.primary}26, 0 2px 10px ${colors.shadow}` } as any)
        : {}),
    },
    input: {
      flex: 1,
      marginLeft: spacing.sm,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: 0,
      // Web: a bare <input> draws its own black focus rectangle + border —
      // those were the "two black lines". Strip them so the whole pill is
      // the text area, and tint the blinking caret with the brand colour.
      ...(Platform.OS === 'web'
        ? ({
            outlineStyle: 'none',
            outlineWidth: 0,
            borderWidth: 0,
            backgroundColor: 'transparent',
            height: '100%',
            caretColor: colors.primary,
          } as any)
        : {}),
    },
    clearButton: { marginRight: spacing.xs },
    micButton: { marginLeft: spacing.xs },
    micPulse: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    voiceErrorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: -spacing.sm,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    voiceErrorText: { ...typography.caption, color: colors.danger, flexShrink: 1 },
    categoryRowWrap: { position: 'relative', marginBottom: spacing.md },
    categoryRow: { paddingRight: spacing.xl },
    categoryFade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 28 },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    toolbarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    toolbarButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    toolbarText: { ...typography.bodySmall, color: colors.textSecondary },
    toolbarTextActive: { color: colors.textInverse, fontFamily: fonts.bodySemiBold },
    toolbarDivider: { width: 1, height: 20, backgroundColor: colors.border },
    resultCount: { ...typography.caption, color: colors.textMuted, marginLeft: 'auto' },
    historyRow: { marginBottom: spacing.md },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    historyTitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase' },
    historyClear: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodySemiBold },
    historyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    historyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    historyChipText: { ...typography.bodySmall, color: colors.textSecondary },
  });
}
