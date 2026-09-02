import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  rating: number; // 0–5
  size?: number;
  showLabel?: boolean;
}

export default function RatingStars({ rating, size = 13, showLabel = true }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const rounded = Math.round(rating);
  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < rounded ? 'star' : 'star-outline'}
            size={size}
            color={colors.star}
            style={{ marginRight: 1 }}
          />
        ))}
      </View>
      {showLabel && <Text style={styles.label}>{rating.toFixed(1)}</Text>}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    stars: { flexDirection: 'row', marginRight: 4 },
    label: { ...typography.caption, color: colors.textSecondary },
  });
}
