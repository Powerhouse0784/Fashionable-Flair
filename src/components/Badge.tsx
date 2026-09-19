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
    // textPrimary (not primaryDark) for gold specifically — goldLight is a
    // dark brown tint in the dark theme, and primaryDark (a mid-blue) had
    // poor contrast against it there, on top of just looking odd next to
    // gold. textPrimary is built to contrast against each theme's own
    // surface tones, which goldLight closely tracks in both themes.
    variant === 'gold' ? colors.textPrimary : variant === 'success' ? colors.success : colors.primaryDark;
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
