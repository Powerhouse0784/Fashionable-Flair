import React from 'react';
import { Text, TextStyle } from 'react-native';
import { typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { formatPrice } from '@/utils/formatPrice';

interface Props {
  amount: number;
  style?: TextStyle;
}

export default function PriceTag({ amount, style }: Props) {
  const { colors } = useTheme();
  return <Text style={[{ ...typography.price, color: colors.textPrimary }, style]}>{formatPrice(amount)}</Text>;
}
