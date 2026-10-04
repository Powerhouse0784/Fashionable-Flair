import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import AdminShell, { AdminNavKey } from './AdminShell';

/**
 * Shared placeholder for sidebar items that don't have a real screen
 * behind them yet — an honest "not built yet, here's why" instead of a
 * broken or faked-out page.
 */
export default function AdminComingSoonScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const route = useRoute<any>();
  const { title, icon, description } = route.params as { title: string; icon: string; description: string };

  // Best-effort match back to the sidebar item that led here, so it still
  // highlights correctly rather than defaulting to nothing active. Nothing
  // in the sidebar routes here anymore (Orders was removed outright,
  // Customers and Offers & Discounts both got real screens), but the
  // screen is kept around in case a future sidebar item needs an honest
  // "not built yet" placeholder again.
  const activeKey = ({} as Record<string, AdminNavKey>)[title] as AdminNavKey | undefined;

  return (
    <AdminShell active={activeKey ?? 'AdminHome'}>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon as any} size={26} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </AdminShell>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: `${colors.primary}18`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { ...typography.h3, color: colors.textPrimary },
    description: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, maxWidth: 420 },
  });
}
