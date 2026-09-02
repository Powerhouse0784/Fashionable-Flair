import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

interface Props {
  label: string;
  variant?: 'primary' | 'gold' | 'success';
}

export default function Badge({ label, variant = 'primary' }: Props) {
  const { colors } = useTheme();
  const bg =
    variant === 'gold' ? colors.goldLight : variant === 'success' ? colors.successLight : colors.primaryLight;
  const fg =
    variant === 'gold' ? colors.primaryDark : variant === 'success' ? colors.success : colors.primaryDark;
  const styles = makeStyles(colors);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 1px 3px ${colors.shadow}` } as any)
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 1,
          }),
    },
    text: { ...typography.caption, fontFamily: fonts.bodyBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  });
}
