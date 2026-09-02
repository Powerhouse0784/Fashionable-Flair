import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import InfoPageLayout from '@/components/InfoPageLayout';
import InfoSection from '@/components/InfoSection';

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <InfoPageLayout title="About Fashionable Flair" subtitle="Jewellery that speaks your style" icon="diamond">
      <InfoSection>
        Fashionable Flair started as a small, hand-curated jewellery collection — earrings, necklaces,
        pendants, bracelets, and hair accessories chosen for everyday elegance without the everyday price
        tag. Every piece in this catalog has been personally selected, not mass-imported.
      </InfoSection>

      <InfoSection heading="How this works">
        This app is a showcase of our full catalog, built for browsing the way we'd want to browse —
        fast, clear, and without clutter. When you find something you love, "Buy Now" takes you straight
        to our storefront on Meesho, where your order is placed, paid for, and shipped securely.
      </InfoSection>

      <InfoSection heading="Why Meesho?">
        Meesho handles the logistics — secure payments, order tracking, and delivery across India — so we
        can focus on what we do best: finding pieces worth wearing.
      </InfoSection>

      <View style={styles.card}>
        <Ionicons name="storefront" size={22} color={colors.primary} />
        <Text style={styles.cardText}>All purchases are completed on our official Meesho store.</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.meesho.com/h6z4l')}>
          <Text style={styles.cardLink}>Visit the store →</Text>
        </TouchableOpacity>
      </View>
    </InfoPageLayout>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    cardText: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },
    cardLink: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold },
  });
}
