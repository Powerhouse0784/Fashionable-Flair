import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { radius, spacing, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useContentMetrics } from '@/hooks/useResponsive';

const BANNERS = [
  require('@/assets/banners/banner-1.jpg'),
  require('@/assets/banners/banner-2.jpg'),
  require('@/assets/banners/banner-3.jpg'),
  require('@/assets/banners/banner-4.jpg'),
  require('@/assets/banners/banner-5.jpg'),
];

const AUTO_ADVANCE_MS = 4000;
// Source banners are ~1568x524 (≈2.99:1) — used to size the strip so it
// never looks cropped oddly on very wide or very narrow viewports.
const ASPECT_RATIO = 1568 / 524;

/**
 * Auto-advancing, swipeable promotional banner strip for the homepage.
 * Built on a plain paged ScrollView (no extra carousel dependency) so it
 * works identically on native and web. Pauses auto-advance while the user
 * is actively dragging, and shows tap-able dots so they can jump to any
 * slide directly.
 */
export default function BannerCarousel() {
  const { colors } = useTheme();
  const { innerWidth } = useContentMetrics();
  const styles = makeStyles(colors);

  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isDragging = useRef(false);
  const slideWidth = innerWidth;
  const slideHeight = slideWidth / ASPECT_RATIO;

  const goTo = useCallback(
    (i: number) => {
      const next = ((i % BANNERS.length) + BANNERS.length) % BANNERS.length;
      scrollRef.current?.scrollTo({ x: next * slideWidth, animated: true });
      setIndex(next);
    },
    [slideWidth]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDragging.current) goTo(index + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [index, goTo]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setIndex(newIndex);
  };

  if (slideWidth <= 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => (isDragging.current = true)}
        onScrollEndDrag={() => (isDragging.current = false)}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={{ borderRadius: radius.lg }}
      >
        {BANNERS.map((src, i) => (
          <View key={i} style={{ width: slideWidth, height: slideHeight }}>
            <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.dots, { pointerEvents: 'box-none' }]}>
        {BANNERS.map((_, i) => (
          <TouchableOpacity
            key={i}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onPress={() => goTo(i)}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
    },
    dots: {
      position: 'absolute',
      bottom: spacing.sm,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.55)',
    },
    dotActive: {
      backgroundColor: '#FFFFFF',
      width: 18,
    },
  });
}
