import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '@/theme';

interface Props {
  label: string;
  variant?: 'primary' | 'gold' | 'success';
}

export default function Badge({ label, variant = 'primary' }: Props) {
  const bg =
    variant === 'gold' ? colors.goldLight : variant === 'success' ? '#DCF0E2' : colors.primaryLight;
  const fg =
    variant === 'gold' ? colors.primaryDark : variant === 'success' ? colors.success : colors.primaryDark;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { ...typography.caption, textTransform: 'uppercase' },
});
