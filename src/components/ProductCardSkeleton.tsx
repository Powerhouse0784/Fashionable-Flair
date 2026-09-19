import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useContentMetrics } from '@/hooks/useResponsive';

interface Props {
  compact?: boolean;
  columns?: number;
}

/**
 * Placeholder matching ProductCard's exact layout (same image aspect
 * ratio, same title/price line heights), shown while the initial product
 * fetch is in flight — a soft shimmer reads as "still loading" far more
 * clearly than a single spinner floating in an empty page, and the page
 * doesn't visually "jump" once real cards swap in since the placeholders
 * already occupy the right shape and space.
 */
export default function ProductCardSkeleton({ compact, columns }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { cardWidth: gridCardWidth } = useContentMetrics(columns);
  const cardWidth = compact ? 168 : gridCardWidth;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Animated.View style={[styles.block, styles.imageBlock, { opacity }]} />
      <View style={styles.info}>
        <Animated.View style={[styles.block, styles.titleBlock, { opacity }]} />
        <Animated.View style={[styles.block, styles.subtitleBlock, { opacity }]} />
        <Animated.View style={[styles.block, styles.priceBlock, { opacity }]} />
      </View>
    </View>
  );
}

/** A row of skeleton cards, for dropping straight into a grid while
 * products are loading — pass the same `columns`/`compact` the real grid
 * will use so the placeholder count and sizing line up. */
export function ProductGridSkeleton({ count = 6, columns, compact }: { count?: number; columns?: number; compact?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} columns={columns} compact={compact} />
      ))}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    block: { backgroundColor: colors.surfaceAlt },
    imageBlock: { width: '100%', aspectRatio: 1 },
    info: { padding: spacing.md, gap: spacing.xs },
    titleBlock: { height: 14, borderRadius: radius.sm, width: '85%' },
    subtitleBlock: { height: 11, borderRadius: radius.sm, width: '60%' },
    priceBlock: { height: 16, borderRadius: radius.sm, width: '45%', marginTop: spacing.xs },
  });
}
