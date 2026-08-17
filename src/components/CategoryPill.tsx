import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme';
import { Category } from '@/types/product';

interface Props {
  category: Category;
  onPress: () => void;
}

export default function CategoryPill({ category, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.pill} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name={category.icon as any} size={22} color={colors.primary} />
      <Text style={styles.label} numberOfLines={2}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 88,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs,
    textTransform: 'none',
  },
});
