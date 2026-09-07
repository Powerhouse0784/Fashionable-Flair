import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { CategoryKey } from '@/types/product';
import { hapticSelection } from '@/utils/haptics';
import ProductPlaceholder from './ProductPlaceholder';

interface Props {
  images: string[];
  category: CategoryKey;
  width: number;
  onDoubleTap?: () => void;
}

const DOUBLE_TAP_WINDOW_MS = 300;

export default function ProductImageGallery({ images, category, width, onDoubleTap }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeIndex, setActiveIndex] = useState(0);
  const [heartVisible, setHeartVisible] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
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

  // FIX: Time-based double-tap detection - works on both platforms
  const handleTap = () => {
    if (!onDoubleTap) return;

    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
      // Double tap detected!
      onDoubleTap();
      triggerHeartBurst();
      lastTapRef.current = 0;
    } else {
      // Single tap - record the time
      lastTapRef.current = now;
    }
  };

  const HeartOverlay = heartVisible && (
    <Animated.View
      style={[styles.heartBurst, { transform: [{ scale: heartScale }] }]}
      pointerEvents="none"
    >
      <Ionicons name="heart" size={90} color="#FFFFFF" />
    </Animated.View>
  );

  // FIX: Render the gallery with tap handler on the container
  const renderGallery = () => {
    if (images.length === 0) {
      return (
        <View style={{ width, height: width }}>
          <ProductPlaceholder category={category} />
          {HeartOverlay}
        </View>
      );
    }

    if (images.length === 1) {
      return (
        <TouchableOpacity
          activeOpacity={1}
          style={{ width, height: width }}
          onPress={handleTap}
        >
          <Image
            source={{ uri: images[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          {HeartOverlay}
        </TouchableOpacity>
      );
    }

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      if (index !== activeIndex && index >= 0 && index < images.length) {
        setActiveIndex(index);
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
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          removeClippedSubviews={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={1}
              style={{ width, height: width }}
              onPress={handleTap}
            >
              <Image
                source={{ uri: item }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                onError={() => console.log('Failed to load image:', item)}
              />
            </TouchableOpacity>
          )}
        />
        {/* Dots with dark background */}
        <View style={styles.dotsContainer} pointerEvents="none">
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>
        {HeartOverlay}
      </View>
    );
  };

  // FIX: Web uses div with click handlers
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          width: width,
          height: width,
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
        }}
        onClick={handleTap}
        onDoubleClick={(e) => {
          e.preventDefault();
          if (onDoubleTap) {
            onDoubleTap();
            triggerHeartBurst();
          }
        }}
      >
        {renderGallery()}
      </div>
    );
  }

  // FIX: Native uses TouchableOpacity wrapper with time-based detection
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{ width, height: width, position: 'relative' }}
      onPress={handleTap}
    >
      {renderGallery()}
    </TouchableOpacity>
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