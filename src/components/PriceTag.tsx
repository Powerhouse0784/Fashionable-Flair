import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors, typography } from '@/theme';
import { formatPrice } from '@/utils/formatPrice';

interface Props {
  amount: number;
  style?: TextStyle;
}

export default function PriceTag({ amount, style }: Props) {
  return <Text style={[styles.price, style]}>{formatPrice(amount)}</Text>;
}

const styles = StyleSheet.create({
  price: { ...typography.price, color: colors.textPrimary },
});
