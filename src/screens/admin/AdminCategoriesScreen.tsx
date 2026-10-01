import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useProducts } from '@/context/ProductsContext';
import { categories } from '@/data/categories';
import AdminShell from './AdminShell';

/**
 * Categories are a fixed set defined in code (`data/categories.ts`), not a
 * database table — there's no "add a category" button here because there's
 * nowhere for it to write to yet. What this screen does do for real: show
 * how many live products sit in each one, and jump straight to a
 * pre-filtered Products list.
 */
export default function AdminCategoriesScreen() {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const navigation = useNavigation<any>();
  const styles = makeStyles(colors);
  const { products } = useProducts();

  const withCounts = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        count: products.filter((p) => p.category === c.key).length,
      })),
    [products]
  );

  const columns = isWide ? 3 : 1;
  const rows: (typeof withCounts)[] = [];
  for (let i = 0; i < withCounts.length; i += columns) rows.push(withCounts.slice(i, i + columns));

  return (
    <AdminShell active="AdminCategories">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>
          {categories.length} categories \u2014 fixed set, not database-managed. Tap one to see its products.
        </Text>

        <View style={{ gap: spacing.md }}>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.card, isWide && { flex: 1 }]}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('CategoryProducts', { category: c.key, label: c.label })}
                >
                  {c.image ? (
                    <Image source={c.image} style={styles.cardImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.cardImage, styles.cardImageFallback]}>
                      <Ionicons name={c.icon as any} size={22} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardLabel} numberOfLines={1}>{c.label}</Text>
                    <Text style={styles.cardCount}>{c.count} product{c.count === 1 ? '' : 's'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
              {isWide &&
                row.length < columns &&
                Array.from({ length: columns - row.length }).map((_, i2) => <View key={`pad-${i2}`} style={{ flex: 1 }} />)}
            </View>
          ))}
        </View>
      </ScrollView>
    </AdminShell>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg, maxWidth: 520 },
    row: { flexDirection: 'row', gap: spacing.md },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 8px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 }),
    },
    cardImage: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
    cardImageFallback: { alignItems: 'center', justifyContent: 'center' },
    cardLabel: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    cardCount: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  });
}
