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
import { spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

interface Slide {
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    title: '✨ Welcome to\nFashionable Flair',
    description:
      'Discover jewellery that speaks your style — explore our handpicked collection.',
  },
  {
    title: '❤️ Save What You Love',
    description:
      'Tap the heart on any product to add it to your Wishlist — saved right on your device.',
  },
  {
    title: '🛡️ Secure Checkout',
    description:
      'Ready to buy? "Buy Now" takes you to our Meesho store for secure purchase.',
  },
  {
    title: '💬 Have Questions?',
    description:
      'Our AI assistant can answer anything about products, orders, or our app.',
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
  const listRef = useRef<FlatList<Slide>>(null);

  const isLast = index === SLIDES.length - 1;
  const isWeb = Platform.OS === 'web';

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);

    if (newIndex !== index && newIndex >= 0 && newIndex < SLIDES.length) {
      setIndex(newIndex);
    }
  };

  const goNext = () => {
    if (isLast) {
      onDone();
      return;
    }

    listRef.current?.scrollToOffset({
      offset: (index + 1) * width,
      animated: true,
    });
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      {/* Background decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />

      <View style={styles.contentWrapper}>
        <View style={styles.topSpacer} />

        {/* App logo */}
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
      style={[styles.safe, { minHeight: height }]}
    >
      {/* edges makes content start below Android/iPhone status area */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Skip button is safely positioned in normal layout */}
        <View style={styles.topHeader}>
          <View style={styles.headerSpacer} />

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onDone}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
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

        {/* Footer */}
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
              style={{ marginLeft: 7 }}
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
    safe: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
    },

    /*
      This header is inside SafeAreaView.
      So Skip automatically starts after Android status bar.
    */
    topHeader: {
      height: isWeb ? 58 : 66,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: isWeb ? 28 : 18,
    },

    headerSpacer: {
      flex: 1,
    },

    skipButton: {
      backgroundColor: '#111827',
      paddingHorizontal: isWeb ? 16 : 15,
      paddingVertical: isWeb ? 8 : 8,
      borderRadius: radius.pill,
      minHeight: 34,
      alignItems: 'center',
      justifyContent: 'center',

      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },

    skipText: {
      color: '#FFFFFF',
      fontFamily: fonts.bodySemiBold,
      fontSize: isWeb ? 13 : 13,
      fontWeight: '600',
      letterSpacing: 0.3,
    },

    slidesContainer: {
      flex: 1,
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
      paddingVertical: isWeb ? spacing.md : spacing.sm,
    },

    topSpacer: {
      flex: 1,
      maxHeight: isWeb ? 25 : 14,
    },

    bottomSpacer: {
      flex: 1,
      maxHeight: isWeb ? 25 : 14,
    },

    decorativeCircle1: {
      position: 'absolute',
      top: isWeb ? '5%' : '8%',
      right: isWeb ? '5%' : '8%',
      width: isWeb ? 180 : 120,
      height: isWeb ? 180 : 120,
      borderRadius: isWeb ? 90 : 60,
      backgroundColor: `${colors.primary}08`,
    },

    decorativeCircle2: {
      position: 'absolute',
      bottom: isWeb ? '10%' : '12%',
      left: isWeb ? '5%' : '8%',
      width: isWeb ? 120 : 80,
      height: isWeb ? 120 : 80,
      borderRadius: isWeb ? 60 : 40,
      backgroundColor: `${colors.primary}06`,
    },

    decorativeCircle3: {
      position: 'absolute',
      top: '48%',
      right: isWeb ? '3%' : '5%',
      width: isWeb ? 80 : 50,
      height: isWeb ? 80 : 50,
      borderRadius: isWeb ? 40 : 25,
      backgroundColor: `${colors.primary}04`,
    },

    iconContainer: {
      width: isWeb ? 140 : 112,
      height: isWeb ? 140 : 112,
      borderRadius: isWeb ? 70 : 56,
      marginBottom: isWeb ? spacing.md : spacing.md,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: `${colors.primary}30`,

      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 6,
    },

    centerLogo: {
      width: '100%',
      height: '100%',
      borderRadius: isWeb ? 70 : 56,
    },

    textContainer: {
      alignItems: 'center',
      width: '100%',
    },

    title: {
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
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
      lineHeight: isWeb ? 22 : 19,
      maxWidth: isWeb ? 450 : 360,
      fontSize: isWeb ? 14 : 13,
      paddingHorizontal: spacing.sm,
      opacity: 0.78,
    },

    descriptionWeb: {
      fontSize: 15,
      lineHeight: 24,
    },

    footer: {
      paddingHorizontal: isWeb ? spacing.xxl : spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: isWeb ? spacing.xl : spacing.lg,
      gap: spacing.md,
    },

    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },

    progressDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.border,
      opacity: 0.4,
    },

    progressDotActive: {
      width: 20,
      backgroundColor: colors.primary,
      opacity: 1,
    },

    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: isWeb ? 48 : 48,
      width: '100%',
      maxWidth: isWeb ? 240 : '100%',
      alignSelf: 'center',

      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },

    nextButtonText: {
      color: colors.textInverse,
      fontSize: isWeb ? 15 : 15,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  });
}