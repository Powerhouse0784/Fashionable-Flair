import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

export type SortOption = 'default' | 'price-asc' | 'price-desc';

const OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'default', label: 'Newest First', icon: 'sparkles-outline' },
  { key: 'price-asc', label: 'Price: Low to High', icon: 'arrow-up-outline' },
  { key: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down-outline' },
];

interface Props {
  visible: boolean;
  value: SortOption;
  onSelect: (option: SortOption) => void;
  onClose: () => void;
}

export default function SortSheet({ visible, value, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Sort By</Text>
          {OPTIONS.map((opt) => {
            const active = value === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={styles.option}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(opt.key);
                  onClose();
                }}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name={opt.icon as any} size={18} color={active ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt.label}</Text>
                </View>
                {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
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
    title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    optionText: { ...typography.body, color: colors.textPrimary },
    optionTextActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  });
}
