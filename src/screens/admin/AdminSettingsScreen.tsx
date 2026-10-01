import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useAuth } from '@/context/AuthContext';
import { confirmAsync } from '@/utils/confirm';
import AdminShell from './AdminShell';

export default function AdminSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const styles = makeStyles(colors);
  const { session, signOut } = useAuth();

  const handleSignOut = async () => {
    const confirmed = await confirmAsync('Sign out?', undefined, 'Sign Out');
    if (!confirmed) return;
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const rows: { icon: string; label: string; sub?: string; onPress: () => void; danger?: boolean }[] = [
    {
      icon: 'notifications-outline',
      label: 'Push Notifications',
      sub: 'Send an update to everyone with the app installed',
      onPress: () => navigation.navigate('AdminNotify'),
    },
    {
      icon: 'storefront-outline',
      label: 'Back to Shop',
      sub: 'Leave the admin panel',
      onPress: () => navigation.navigate('Tabs'),
    },
    {
      icon: 'log-out-outline',
      label: 'Sign Out',
      onPress: handleSignOut,
      danger: true,
    },
  ];

  return (
    <AdminShell active="AdminSettings">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle} numberOfLines={1}>Signed in as {session?.user?.email || 'admin'}</Text>

        <View style={styles.card}>
          {rows.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
              activeOpacity={0.75}
              onPress={r.onPress}
            >
              <Ionicons name={r.icon as any} size={19} color={r.danger ? colors.danger : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, r.danger && { color: colors.danger }]}>{r.label}</Text>
                {!!r.sub && <Text style={styles.rowSub}>{r.sub}</Text>}
              </View>
              {!r.danger && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AdminShell>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 640 },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { ...typography.body, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    rowSub: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  });
}
