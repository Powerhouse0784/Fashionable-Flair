import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { categories } from '@/data/categories';
import { CategoryKey } from '@/types/product';

export type PriceRange = 'all' | 'under-200' | '200-400' | 'above-400';

export interface FilterState {
  category: CategoryKey | null;
  priceRange: PriceRange;
  inStockOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = { category: null, priceRange: 'all', inStockOnly: false };

export function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.category) n++;
  if (f.priceRange !== 'all') n++;
  if (f.inStockOnly) n++;
  return n;
}

const PRICE_RANGES: { key: PriceRange; label: string }[] = [
  { key: 'all', label: 'Any Price' },
  { key: 'under-200', label: 'Under ₹200' },
  { key: '200-400', label: '₹200 – ₹400' },
  { key: 'above-400', label: 'Above ₹400' },
];

interface Props {
  visible: boolean;
  value: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
  /** Hide the category section — used on a category-locked screen where
   *  showing "which category" again would be redundant/confusing. */
  hideCategory?: boolean;
}

export default function FilterSheet({ visible, value, onApply, onClose, hideCategory }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [draft, setDraft] = React.useState<FilterState>(value);

  React.useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const activeCount = countActiveFilters(draft);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={() => setDraft(DEFAULT_FILTERS)}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {!hideCategory && (
              <>
                <Text style={styles.sectionLabel}>Category</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, draft.category === null && styles.chipActive]}
                    onPress={() => setDraft((d) => ({ ...d, category: null }))}
                  >
                    <Text style={[styles.chipText, draft.category === null && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {categories.map((c) => {
                    const active = draft.category === c.key;
                    return (
                      <TouchableOpacity
                        key={c.key}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setDraft((d) => ({ ...d, category: c.key }))}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.sectionLabel}>Price</Text>
            <View style={styles.chipRow}>
              {PRICE_RANGES.map((pr) => {
                const active = draft.priceRange === pr.key;
                return (
                  <TouchableOpacity
                    key={pr.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDraft((d) => ({ ...d, priceRange: pr.key }))}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{pr.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.sectionLabel}>In Stock Only</Text>
              <Switch
                value={draft.inStockOnly}
                onValueChange={(v) => setDraft((d) => ({ ...d, inStockOnly: v }))}
                trackColor={{ true: colors.primary }}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyButton}
            activeOpacity={0.85}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          >
            <Text style={styles.applyButtonText}>
              Show Results{activeCount > 0 ? ` (${activeCount} filter${activeCount > 1 ? 's' : ''})` : ''}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary },
  clearText: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold },
  sectionLabel: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse, fontFamily: fonts.bodySemiBold },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  applyButtonText: { ...typography.button, color: colors.textInverse },
  });
}
