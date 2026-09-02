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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

interface Slide {
  icon: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'diamond',
    title: 'Welcome to Fashionable Flair',
    description: 'Jewellery that speaks your style — browse our full handpicked collection.',
  },
  {
    icon: 'heart',
    title: 'Save What You Love',
    description: 'Tap the heart on any product to add it to your Wishlist — saved right on your device, no account needed.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Secure Checkout via Meesho',
    description: 'When you\u2019re ready to buy, "Buy Now" takes you straight to our Meesho store to complete your purchase securely.',
  },
  {
    icon: 'chatbubble-ellipses',
    title: 'Have a Question? Just Ask',
    description: 'Our chat assistant can answer anything about the app, our products, or how ordering works — any time.',
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const isLast = index === SLIDES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const goNext = () => {
    if (isLast) {
      onDone();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <LinearGradient colors={[colors.background, colors.surfaceAlt]} style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity style={styles.skipButton} onPress={onDone} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon as any} size={40} color={colors.textInverse} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={goNext} activeOpacity={0.85}>
            <Text style={styles.nextButtonText}>{isLast ? 'Get Started' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1 },
    skipButton: { alignSelf: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    skipText: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
      lineHeight: 22,
    },
    footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.xl },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 24 },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
    },
    nextButtonText: { ...typography.button, color: colors.textInverse },
  });
}
