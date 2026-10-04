import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { RootStackParamList } from '@/types/navigation';
import { ActiveOffer } from '@/services/offerService';
import { useContentMetrics } from '@/hooks/useResponsive';
import { getPrimaryImage } from '@/utils/productImages';
import { formatPrice } from '@/utils/formatPrice';
import ProductPlaceholder from './ProductPlaceholder';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  offer: ActiveOffer;
  compact?: boolean;
  columns?: number;
}

/** Days remaining until an offer ends, for the "Ends in …" countdown chip.
 * Rounds up so an offer ending later today still reads "Ends today"
 * rather than "0 days left", which would look broken. */
function daysLeft(endsAt: string): number {
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function OfferProductCard({ offer, compact, columns }: Props) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { product } = offer;
  const { cardWidth: gridCardWidth } = useContentMetrics(columns);
  const cardWidth = compact ? 168 : gridCardWidth;
  const primaryImage = getPrimaryImage(product);
  const percentOff = Math.round(((product.price - offer.offerPrice) / product.price) * 100);
  const left = daysLeft(offer.endsAt);

  return (
    <View style={{ width: cardWidth }}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={[styles.card, Platform.OS === 'web' && styles.webHover]}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      >
        <View style={styles.imageWrap}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage }} style={styles.image} contentFit="cover" transition={200} />
          ) : (
            <ProductPlaceholder category={product.category} compact={compact} />
          )}
          {percentOff > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{percentOff}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.offerPrice}>{formatPrice(offer.offerPrice)}</Text>
            <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
          </View>
          <View style={styles.endsChip}>
            <Text style={styles.endsChipText}>{left === 0 ? 'Ends today' : `Ends in ${left} day${left === 1 ? '' : 's'}`}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    webHover: Platform.OS === 'web' ? ({ cursor: 'pointer', transition: 'transform 0.15s ease' } as any) : {},
    imageWrap: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceAlt },
    image: { width: '100%', height: '100%' },
    discountBadge: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      backgroundColor: colors.danger,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    discountBadgeText: { ...typography.caption, color: '#fff', fontSize: 11, fontFamily: fonts.bodySemiBold },
    info: { padding: spacing.sm },
    title: { ...typography.bodySmall, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
    offerPrice: { ...typography.price, color: colors.primary },
    originalPrice: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'line-through' },
    endsChip: {
      alignSelf: 'flex-start',
      backgroundColor: `${colors.gold}18`,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      marginTop: spacing.xs,
    },
    endsChipText: { ...typography.caption, color: colors.gold, fontSize: 11 },
  });
}
