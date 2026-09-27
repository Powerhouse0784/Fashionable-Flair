import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

interface Props {
  label: string;
  icon: string; // Ionicons name
  active: boolean;
  onPress: () => void;
}

export default function SearchCategoryChip({ label, icon, active, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const activeIconColor = isDark ? colors.textPrimary : colors.textInverse;

  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive, Platform.OS === 'web' && styles.chipWeb]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={15}
        color={active ? activeIconColor : colors.textSecondary}
      />
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorTheme, isDark: boolean) {
  const activeBg = isDark ? colors.gold : colors.primary;
  const activeText = isDark ? colors.textPrimary : colors.textInverse;
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md + 2,
      height: 36,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginRight: spacing.sm,
    },
    chipWeb: {
      // @ts-ignore - web-only, no-op on native
      cursor: 'pointer',
      // @ts-ignore
      transitionDuration: '150ms',
    },
    chipActive: {
      backgroundColor: activeBg,
      borderColor: activeBg,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 8px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 }),
    },
    label: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.bodyMedium },
    labelActive: { color: activeText, fontFamily: fonts.bodySemiBold },
  });
}
