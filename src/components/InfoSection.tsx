import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

interface Props {
  heading?: string;
  children: React.ReactNode;
}

export default function InfoSection({ heading, children }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      {heading && <Text style={styles.heading}>{heading}</Text>}
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    section: { marginBottom: spacing.lg },
    heading: { ...typography.h3, fontFamily: fonts.heading, color: colors.textPrimary, marginBottom: spacing.sm },
    body: { ...typography.body, color: colors.textSecondary, lineHeight: 23 },
  });
}
