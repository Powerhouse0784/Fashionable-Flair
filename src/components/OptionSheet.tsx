import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

export interface SheetOption {
  key: string;
  label: string;
  icon?: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: SheetOption[];
  value: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

/** Small single-select bottom sheet — used for the Wishlist screen's
 * "All Items" and "Sort by" pickers. Same backdrop/sheet treatment as the
 * app's other bottom sheets (FilterSheet, AvatarPickerModal) for a
 * consistent feel. */
export default function OptionSheet({ visible, title, options, value, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {options.map((opt) => {
            const active = opt.key === value;
            return (
              <TouchableOpacity
                key={opt.key}
                style={styles.row}
                activeOpacity={0.75}
                onPress={() => {
                  onSelect(opt.key);
                  onClose();
                }}
              >
                {opt.icon && <Ionicons name={opt.icon as any} size={17} color={active ? colors.primary : colors.textSecondary} style={{ marginRight: spacing.sm }} />}
                <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{opt.label}</Text>
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
      maxWidth: 420,
      width: '100%',
      alignSelf: 'center',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
    title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
    rowLabelActive: { color: colors.primary, fontFamily: fonts.bodySemiBold },
  });
}
