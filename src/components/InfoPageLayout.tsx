import React, { ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { goBackOrTo } from '@/utils/navigation';
import Container from '@/components/Container';
import WebPageWrapper from '@/components/WebPageWrapper';
import Footer from '@/components/Footer';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
}

/**
 * Shared chrome for the static info pages (About, Privacy, Terms). On web
 * this now always sits inside WebPageWrapper (persistent top nav) and ends
 * with the same Footer as Home — so clicking a footer link doesn't feel
 * like leaving the site, it feels like turning a page on it. Native/narrow
 * keeps its own compact back-button header, matching every other screen.
 */
export default function InfoPageLayout({ title, subtitle, icon, children }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const isWide = useIsWideScreen();

  return (
    <WebPageWrapper>
      <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          {!isWide && (
            <View style={styles.header}>
              <TouchableOpacity onPress={() => goBackOrTo(navigation, 'Tabs')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}

          <Container>
            <View style={[styles.hero, isWide && styles.heroWide]}>
              {icon && (
                <View style={styles.heroIcon}>
                  <Ionicons name={icon as any} size={22} color={colors.textInverse} />
                </View>
              )}
              <Text style={[styles.title, isWide && styles.titleWide]}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <View style={{ marginTop: spacing.xl }}>{children}</View>
          </Container>
          {isWide && <Footer />}
        </ScrollView>
      </SafeAreaView>
    </WebPageWrapper>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    hero: { marginTop: spacing.sm },
    heroWide: { marginTop: spacing.xxl, alignItems: 'center' },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { ...typography.h1, color: colors.textPrimary },
    titleWide: { fontSize: 36, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  });
}
