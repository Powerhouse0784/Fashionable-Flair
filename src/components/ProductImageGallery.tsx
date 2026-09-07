import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { CategoryKey } from '@/types/product';
import { hapticSelection } from '@/utils/haptics';
import ProductPlaceholder from './ProductPlaceholder';

interface Props {
  images: string[]; // already filtered to real photos — may be empty
  category: CategoryKey;
  width: number; // exact rendered width of the container, for paging math
  /** Fires on a double-tap anywhere on the image — the Instagram-style
   *  "double tap to like" gesture. Optional so this component still works
   *  fine anywhere that doesn't need it. */
  onDoubleTap?: () => void;
}

const DOUBLE_TAP_WINDOW_MS = 300;

/**
 * Swipeable photo gallery, Amazon/Flipkart-style — one photo per page with
 * dot indicators. Falls back to the single designed placeholder when there
 * are no real photos at all, so callers don't need to branch on that.
 */
export default function ProductImageGallery({ images, category, width, onDoubleTap }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeIndex, setActiveIndex] = useState(0);
  const [heartVisible, setHeartVisible] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const useNativeDriver = Platform.OS !== 'web';

  // FIX: Reset scroll when images change
  React.useEffect(() => {
    if (flatListRef.current && images.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
    setActiveIndex(0);
  }, [images]);

  const triggerHeartBurst = () => {
    hapticSelection();
    setHeartVisible(true);
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver, speed: 18, bounciness: 10 }),
      Animated.delay(350),
      Animated.timing(heartScale, { toValue: 0, duration: 200, useNativeDriver }),
    ]).start(() => setHeartVisible(false));
  };

  const handleTap = () => {
    if (!onDoubleTap) return;
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
      onDoubleTap();
      triggerHeartBurst();
      lastTapRef.current = 0; // avoid a triple-tap re-triggering immediately
    } else {
      lastTapRef.current = now;
    }
  };

  const HeartOverlay = heartVisible && (
    <Animated.View style={[styles.heartBurst, { transform: [{ scale: heartScale }] }]} pointerEvents="none">
      <Ionicons name="heart" size={90} color="#FFFFFF" />
    </Animated.View>
  );

  if (images.length === 0) {
    return (
      <Pressable onPress={handleTap} style={{ width, height: width }}>
        <ProductPlaceholder category={category} />
        {HeartOverlay}
      </Pressable>
    );
  }

  if (images.length === 1) {
    return (
      <Pressable onPress={handleTap} style={{ width, height: width }}>
        <Image 
          source={{ uri: images[0] }} 
          style={styles.image} 
          contentFit="cover" 
          transition={200}
          cachePolicy="memory-disk"
        />
        {HeartOverlay}
      </Pressable>
    );
  }

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex && index >= 0 && index < images.length) {
      setActiveIndex(index);
    }
  };

  // FIX: Handle scroll to specific index
  const scrollToIndex = (index: number) => {
    if (flatListRef.current && index >= 0 && index < images.length) {
      flatListRef.current.scrollToOffset({ offset: index * width, animated: true });
    }
  };

  return (
    <View style={{ width, height: width, position: 'relative' }}>
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(uri, i) => `${uri}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        // FIX: Important props for scroll to work properly
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        removeClippedSubviews={false}
        renderItem={({ item }) => (
          <View style={{ width, height: width }}>
            <Image 
              source={{ uri: item }} 
              style={{ width: '100%', height: '100%' }} 
              contentFit="cover" 
              transition={200}
              cachePolicy="memory-disk"
              onError={() => console.log('Failed to load image:', item)}
            />
          </View>
        )}
      />
      {/* FIX: Dots with dark background for visibility on any image */}
      <View style={styles.dotsContainer} pointerEvents="none">
        <View style={styles.dots}>
          {images.map((_, i) => (
            <Pressable
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
              onPress={() => scrollToIndex(i)}
            />
          ))}
        </View>
      </View>
      {HeartOverlay}
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    image: { width: '100%', height: '100%' },
    dotsContainer: {
      position: 'absolute',
      bottom: 12,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(0,0,0,0.3)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
      backgroundColor: '#FFD700',
      width: 20,
    },
    heartBurst: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web'
        ? ({ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' } as any)
        : { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }),
    },
  });
}