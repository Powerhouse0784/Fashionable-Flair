import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { Product } from '@/types/product';
import { RootStackParamList } from '@/types/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useContentMetrics } from '@/hooks/useResponsive';
import { getPrimaryImage } from '@/utils/productImages';
import ProductPlaceholder from './ProductPlaceholder';
import PriceTag from './PriceTag';
import RatingStars from './RatingStars';
import Badge from './Badge';

interface Props {
  product: Product;
  compact?: boolean; // horizontal-scroll carousels use a fixed width instead of the grid
  columns?: number;  // override the auto-detected column count (used by FlatList grids)
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProductCard({ product, compact, columns }: Props) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const { cardWidth: gridCardWidth } = useContentMetrics(columns);
  const cardWidth = compact ? 168 : gridCardWidth;
  const scale = useRef(new Animated.Value(1)).current;
  const primaryImage = getPrimaryImage(product);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: Platform.OS !== 'web', speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 20 }).start();

  return (
    <Animated.View style={{ width: cardWidth, transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={[styles.card, Platform.OS === 'web' && styles.webHover]}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.imageWrap}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage }} style={styles.image} contentFit="cover" transition={200} />
          ) : (
            <ProductPlaceholder category={product.category} compact={compact} />
          )}
          <TouchableOpacity
            style={styles.heartButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => toggleWishlist(product.id)}
          >
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={18}
              color={wishlisted ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
          {(product.isNewArrival || product.isBestSeller) && (
            <View style={styles.badgeWrap}>
              <Badge
                label={product.isNewArrival ? 'New' : 'Bestseller'}
                variant={product.isNewArrival ? 'success' : 'gold'}
              />
            </View>
          )}
          {product.isAvailable === false && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {product.title}
          </Text>
          {product.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {product.subtitle}
            </Text>
          ) : null}
          <View style={styles.bottomRow}>
            <PriceTag amount={product.price} style={{ fontSize: 15 }} />
            <RatingStars rating={product.rating} size={11} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 6px ${colors.shadow}` } as any)
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 2,
          }),
    },
    webHover: {
      // @ts-ignore - web-only CSS properties, harmless no-op on native
      cursor: 'pointer',
      // @ts-ignore
      transitionDuration: '150ms',
      // @ts-ignore
      boxShadow: `0 4px 10px ${colors.shadow}`,
    },
    imageWrap: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: colors.surfaceAlt,
      position: 'relative',
    },
    image: { width: '100%', height: '100%' },
    heartButton: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      backgroundColor: colors.surface,
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 1px 4px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 }),
    },
    badgeWrap: { position: 'absolute', top: spacing.xs, left: spacing.xs },
    outOfStockOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.72)',
      paddingVertical: 5,
      alignItems: 'center',
    },
    outOfStockText: { ...typography.caption, color: colors.textInverse, fontFamily: fonts.bodyBold },
    info: { padding: spacing.md },
    title: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
  });
}
