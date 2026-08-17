import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';

interface Props {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

// No horizontal padding here on purpose — this always sits inside a
// Container, which already supplies the page gutter. Adding padding here
// too was one of the double-gutter bugs.
export default function SectionHeader({ title, actionLabel, onActionPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  action: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold },
});
