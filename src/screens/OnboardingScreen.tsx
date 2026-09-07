import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

interface Slide {
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    title: '✨ Welcome to\nFashionable Flair',
    description: 'Discover jewellery that speaks your style — explore our handpicked collection.',
  },
  {
    title: '❤️ Save What You Love',
    description: 'Tap the heart on any product to add it to your Wishlist — saved right on your device.',
  },
  {
    title: '🛡️ Secure Checkout',
    description: 'Ready to buy? "Buy Now" takes you to our Meesho store for secure purchase.',
  },
  {
    title: '💬 Have Questions?',
    description: 'Our AI assistant can answer anything about products, orders, or our app.',
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const isLast = index === SLIDES.length - 1;
  const isWeb = Platform.OS === 'web';

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const goNext = () => {
    if (isLast) {
      onDone();
      return;
    }
    const nextOffset = (index + 1) * width;
    listRef.current?.scrollToOffset({ offset: nextOffset, animated: true });
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width, height }]}>
      {/* Decorative elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />

      {/* Content wrapper with flex distribution */}
      <View style={styles.contentWrapper}>
        <View style={styles.topSpacer} />

        {/* FIX: Big Logo covering full circle */}
        <View style={styles.iconContainer}>
          <Image 
            source={require('@/assets/icon.png')} 
            style={styles.centerLogo}
            resizeMode="cover"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, isWeb && styles.titleWeb]}>
            {item.title}
          </Text>

          <Text style={[styles.description, isWeb && styles.descriptionWeb]}>
            {item.description}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.background, colors.surfaceAlt]}
      style={[styles.safe, { height }]}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Skip Button - Top Right (dark) */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onDone}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides - Takes full remaining space */}
        <View style={styles.slidesContainer}>
          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            renderItem={renderSlide}
            style={styles.flatList}
          />
        </View>

        {/* Footer - Bottom with progress and button */}
        <View style={styles.footer}>
          <View style={styles.progressContainer}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i === index && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.textInverse}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function makeStyles(colors: ColorTheme) {
  const isWeb = Platform.OS === 'web';

  return StyleSheet.create({
    safe: { flex: 1 },
    safeArea: { flex: 1 },
    
    // Dark Skip Button
    skipButton: {
      position: 'absolute',
      top: isWeb ? 20 : 10,
      right: isWeb ? 24 : 14,
      zIndex: 100,
      backgroundColor: '#111827',
      paddingHorizontal: isWeb ? 16 : 12,
      paddingVertical: isWeb ? 8 : 5,
      borderRadius: radius.pill,
    },
    skipText: {
      color: '#FFFFFF',
      fontFamily: fonts.bodySemiBold,
      fontSize: isWeb ? 13 : 12,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    
    slidesContainer: {
      flex: 1,
      marginTop: 0,
    },
    flatList: {
      flex: 1,
    },
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    contentWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: isWeb ? 600 : '100%',
      paddingHorizontal: isWeb ? spacing.xxl : spacing.xl,
      paddingVertical: isWeb ? spacing.xl : spacing.lg,
    },
    topSpacer: {
      flex: 1,
      maxHeight: isWeb ? 20 : 10,
    },
    bottomSpacer: {
      flex: 1,
      maxHeight: isWeb ? 20 : 10,
    },
    decorativeCircle1: {
      position: 'absolute',
      top: isWeb ? '5%' : '8%',
      right: isWeb ? '5%' : '8%',
      width: isWeb ? 180 : 120,
      height: isWeb ? 180 : 120,
      borderRadius: 90,
      backgroundColor: colors.primary + '06',
    },
    decorativeCircle2: {
      position: 'absolute',
      bottom: isWeb ? '10%' : '12%',
      left: isWeb ? '5%' : '8%',
      width: isWeb ? 120 : 80,
      height: isWeb ? 120 : 80,
      borderRadius: 60,
      backgroundColor: colors.primary + '04',
    },
    decorativeCircle3: {
      position: 'absolute',
      top: '50%',
      right: isWeb ? '3%' : '5%',
      width: isWeb ? 80 : 50,
      height: isWeb ? 80 : 50,
      borderRadius: 40,
      backgroundColor: colors.primary + '03',
    },
    
    // FIX: Big Logo filling entire circle
    iconContainer: {
      width: isWeb ? 140 : 110,
      height: isWeb ? 140 : 110,
      borderRadius: isWeb ? 70 : 55,
      marginBottom: isWeb ? spacing.md : spacing.md,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.primary + '30',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    centerLogo: {
      width: '100%',
      height: '100%',
      borderRadius: isWeb ? 70 : 55,
    },
    
    textContainer: {
      alignItems: 'center',
      width: '100%',
    },
    title: {
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: isWeb ? spacing.xs : spacing.xs,
      lineHeight: isWeb ? 32 : 26,
      fontWeight: '700',
      fontSize: isWeb ? 22 : 19,
      paddingHorizontal: spacing.sm,
    },
    titleWeb: {
      fontSize: 24,
      lineHeight: 34,
    },
    description: {
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: isWeb ? 22 : 18,
      maxWidth: isWeb ? 450 : 360,
      fontSize: isWeb ? 14 : 13,
      paddingHorizontal: spacing.sm,
      opacity: 0.75,
    },
    descriptionWeb: {
      fontSize: 15,
      lineHeight: 24,
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: isWeb ? spacing.md : spacing.md,
    },
    progressDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.border,
      opacity: 0.4,
    },
    progressDotActive: {
      backgroundColor: colors.primary,
      width: 20,
      opacity: 1,
    },
    footer: {
      paddingHorizontal: isWeb ? spacing.xxl : spacing.xl,
      paddingBottom: isWeb ? spacing.xl : spacing.xl,
      paddingTop: spacing.sm,
      gap: spacing.md,
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: isWeb ? spacing.md : spacing.md,
      paddingHorizontal: spacing.xl,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      minHeight: isWeb ? 48 : 46,
      width: '100%',
      maxWidth: isWeb ? 240 : '100%',
      alignSelf: 'center',
    },
    nextButtonText: {
      color: colors.textInverse,
      fontSize: isWeb ? 15 : 15,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  });
}