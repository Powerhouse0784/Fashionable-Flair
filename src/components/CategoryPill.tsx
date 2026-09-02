import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { Category, CategoryKey } from '@/types/product';

interface Props {
  category: Category;
  onPress: () => void;
}

export default function CategoryPill({ category, onPress }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // Alternating warm tints so the category row reads as a designed set of
  // icon "chips" rather than plain outline icons floating on the page.
  const tints: Record<CategoryKey, string> = {
    earrings: colors.primaryLight,
    necklaces: colors.goldLight,
    pendants: colors.primaryLight,
    'jewellery-sets': colors.goldLight,
    bracelets: colors.primaryLight,
    'hair-accessories': colors.goldLight,
  };
  const tint = tints[category.key] ?? colors.primaryLight;

  return (
    <TouchableOpacity style={styles.pill} activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: tint }, Platform.OS === 'web' && styles.iconCircleWeb]}>
        <Ionicons name={category.icon as any} size={24} color={colors.primaryDark} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    pill: {
      width: 84,
      alignItems: 'center',
      marginRight: spacing.md,
    },
    iconCircle: {
      width: 60,
      height: 60,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCircleWeb: {
      // @ts-ignore - web-only, no-op on native
      transitionDuration: '150ms',
    },
    label: {
      ...typography.caption,
      fontFamily: fonts.bodyMedium,
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: spacing.sm,
      textTransform: 'none',
    },
  });
}
