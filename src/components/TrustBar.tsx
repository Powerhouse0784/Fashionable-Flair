import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

const ITEMS: { icon: string; label: string }[] = [
  { icon: 'shield-checkmark', label: 'Verified Meesho Seller' },
  { icon: 'cube', label: 'Pan-India Delivery' },
  { icon: 'cash', label: 'Cash on Delivery' },
  { icon: 'refresh', label: 'Easy Returns' },
];

interface Props {
  /** 'light' = white text/icons for use on the colored hero banner (default).
   *  'dark' = for use on a plain background. */
  variant?: 'light' | 'dark';
}

export default function TrustBar({ variant = 'light' }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isLight = variant === 'light';
  const textColor = isLight ? colors.textInverse : colors.textPrimary;
  const iconBg = isLight ? 'rgba(255,255,255,0.22)' : colors.primaryLight;
  const iconColor = isLight ? colors.textInverse : colors.primary;

  return (
    <View style={styles.wrap}>
      {ITEMS.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={item.icon as any} size={16} color={iconColor} />
          </View>
          <Text style={[styles.label, { color: textColor }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: spacing.xl,
      rowGap: spacing.sm,
      marginTop: spacing.lg,
    },
    item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { ...typography.bodySmall, fontFamily: fonts.bodyBold },
  });
}
