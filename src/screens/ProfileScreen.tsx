import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '@/theme';
import { useProducts } from '@/context/ProductsContext';
import { useAuth } from '@/context/AuthContext';
import Container from '@/components/Container';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
}

function MenuItem({ icon, label, onPress, rightSlot }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      {rightSlot ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />)}
    </TouchableOpacity>
  );
}

function formatSyncTime(date: Date | null): string {
  if (!date) return 'Not synced yet';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

// No customer accounts in this app — shoppers just browse, wishlist, and
// buy on Meesho. The only thing hiding behind a login is store management.
// Tapping the footer 5x is the sole entry point for anyone not already
// signed in as admin; nothing on screen hints this exists otherwise.
const SECRET_TAP_COUNT = 5;
const SECRET_TAP_WINDOW_MS = 2500;

export default function ProfileScreen() {
  const { isLive, lastSynced, refreshing, refresh } = useProducts();
  const { isAdmin, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tapHintVisible, setTapHintVisible] = useState(false);

  const handleSecretTap = () => {
    if (isAdmin) return; // already have visible access, no need for the gesture
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      setTapHintVisible(false);
    }, SECRET_TAP_WINDOW_MS);

    if (tapCountRef.current >= 3) setTapHintVisible(true);

    if (tapCountRef.current >= SECRET_TAP_COUNT) {
      tapCountRef.current = 0;
      setTapHintVisible(false);
      navigation.navigate('AdminLogin');
    }
  };

  const handleAdminSignOut = () => {
    Alert.alert('Sign out of admin?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name="diamond" size={26} color={colors.textInverse} />
            </View>
            <Text style={styles.name}>Fashionable Flair</Text>
            <Text style={styles.subtitle}>Jewellery that speaks your style</Text>
          </View>

          {/* Only ever visible on a device signed in as an allow-listed
              admin — regular visitors never see this section. */}
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Store Management</Text>
              <View style={styles.card}>
                <MenuItem
                  icon="shield-checkmark"
                  label="Open Admin Dashboard"
                  onPress={() => navigation.navigate('AdminDashboard')}
                />
                <MenuItem icon="log-out-outline" label="Sign Out of Admin" onPress={handleAdminSignOut} />
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Catalog</Text>
          <View style={styles.card}>
            <MenuItem
              icon={isLive ? 'cloud-done-outline' : 'cloud-offline-outline'}
              label={isLive ? 'Live catalog — synced' : 'Using local catalog'}
              rightSlot={<Text style={styles.syncTime}>{formatSyncTime(lastSynced)}</Text>}
            />
            <MenuItem
              icon="refresh-outline"
              label={refreshing ? 'Refreshing…' : 'Refresh Catalog Now'}
              onPress={refreshing ? undefined : refresh}
              rightSlot={refreshing ? <ActivityIndicator size="small" color={colors.primary} /> : undefined}
            />
          </View>

          <Text style={styles.sectionTitle}>Shop</Text>
          <View style={styles.card}>
            <MenuItem icon="storefront-outline" label="Visit our Meesho Store" onPress={() => Linking.openURL('https://www.meesho.com/h6z4l')} />
            <MenuItem icon="heart-outline" label="My Wishlist" onPress={() => navigation.navigate('Tabs', { screen: 'Wishlist' })} />
            <MenuItem icon="pricetag-outline" label="Offers & Deals" />
          </View>

          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <MenuItem icon="notifications-outline" label="Notifications" />
            <MenuItem icon="moon-outline" label="Dark Mode" />
            <MenuItem icon="language-outline" label="Language" />
          </View>

          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuItem icon="help-circle-outline" label="FAQs" />
            <MenuItem icon="chatbubble-ellipses-outline" label="Contact Us" />
            <MenuItem icon="document-text-outline" label="Privacy Policy" />
            <MenuItem icon="reader-outline" label="Terms of Service" />
            <MenuItem icon="information-circle-outline" label="About Fashionable Flair" />
          </View>

          <TouchableOpacity onPress={handleSecretTap} activeOpacity={1} style={styles.footer}>
            <Text style={styles.footerText}>Fashionable Flair · v1.0.0</Text>
            {tapHintVisible && <View style={styles.footerDot} />}
          </TouchableOpacity>

          <View style={{ height: spacing.xxl }} />
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuLabel: { ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm },
  syncTime: { ...typography.caption, color: colors.textMuted },
  footer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
  footerText: { ...typography.caption, color: colors.textMuted },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryLight },
});
