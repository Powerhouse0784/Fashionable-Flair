import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography, spacing, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
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
}
