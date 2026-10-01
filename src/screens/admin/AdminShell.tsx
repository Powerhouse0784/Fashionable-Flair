import React, { createContext, useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { confirmAsync } from '@/utils/confirm';
import Logo from '@/components/Logo';

export type AdminNavKey =
  | 'AdminHome'
  | 'AdminDashboard'
  | 'AdminOrders'
  | 'AdminCustomers'
  | 'AdminCategories'
  | 'AdminOffers'
  | 'AdminAllReviews'
  | 'AdminTestimonials'
  | 'AdminSettings';

interface NavItem {
  key: AdminNavKey;
  label: string;
  icon: string;
  comingSoon?: { title: string; icon: string; description: string };
}

const NAV_ITEMS: NavItem[] = [
  { key: 'AdminHome', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'AdminDashboard', label: 'Products', icon: 'cube-outline' },
  {
    key: 'AdminOrders',
    label: 'Orders',
    icon: 'receipt-outline',
    comingSoon: {
      title: 'Orders',
      icon: 'receipt-outline',
      description:
        "Checkout happens on Meesho, not in this app, so there's no in-app order history to manage yet — Meesho's own seller dashboard is the source of truth for orders today.",
    },
  },
  {
    key: 'AdminCustomers',
    label: 'Customers',
    icon: 'people-outline',
    comingSoon: {
      title: 'Customers',
      icon: 'people-outline',
      description:
        'A customer list tying together accounts, Premium status, and order history is a natural next step now that sign-in exists — just not wired up here yet.',
    },
  },
  { key: 'AdminCategories', label: 'Categories', icon: 'pricetags-outline' },
  {
    key: 'AdminOffers',
    label: 'Offers & Discounts',
    icon: 'gift-outline',
    comingSoon: {
      title: 'Offers & Discounts',
      icon: 'gift-outline',
      description:
        'Store-wide sales and coupon codes aren\u2019t built yet — for now, discounts are set per product from its Compare-at Price field in the product editor.',
    },
  },
  { key: 'AdminAllReviews', label: 'Reviews', icon: 'star-outline' },
  { key: 'AdminTestimonials', label: 'Testimonials', icon: 'chatbubbles-outline' },
  { key: 'AdminSettings', label: 'Settings', icon: 'settings-outline' },
];

interface AdminShellContextValue {
  query: string;
  setQuery: (q: string) => void;
}
const AdminShellContext = createContext<AdminShellContextValue>({ query: '', setQuery: () => {} });
/** Products screen reads the top bar's search box through this, rather
 * than the search box living inside the Products screen itself — it
 * needs to stay put in the shell so it doesn't disappear when browsing
 * to a different admin section. */
export const useAdminSearch = () => useContext(AdminShellContext);

interface Props {
  active: AdminNavKey;
  children: React.ReactNode;
  /** Only the Products page actually uses what's typed into the search box. */
  searchable?: boolean;
}

export default function AdminShell({ active, children, searchable }: Props) {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const navigation = useNavigation<any>();
  const { session, signOut } = useAuth();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const goTo = (item: NavItem) => {
    setDrawerOpen(false);
    if (item.comingSoon) {
      navigation.navigate('AdminComingSoon', item.comingSoon);
    } else {
      navigation.navigate(item.key);
    }
  };

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    const confirmed = await confirmAsync('Sign out?', undefined, 'Sign Out');
    if (!confirmed) return;
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const email = session?.user?.email || 'Admin';
  const initials = email.slice(0, 1).toUpperCase();

  const navList = (onNavigate: (item: NavItem) => void) => (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.navRow, isActive && styles.navRowActive]}
            activeOpacity={0.75}
            onPress={() => onNavigate(item)}
          >
            <Ionicons name={item.icon as any} size={18} color={isActive ? colors.primary : colors.textSecondary} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]} numberOfLines={1}>
              {item.label}
            </Text>
            {item.comingSoon && <View style={styles.soonDot} />}
          </TouchableOpacity>
        );
      })}
    </>
  );

  const topBar = (
    <View style={styles.topBar}>
      {!isWide && (
        <TouchableOpacity onPress={() => setDrawerOpen(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      {isWide ? (
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchable ? 'Search products, categories, or SKU...' : 'Search products...'}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {Platform.OS === 'web' && <Text style={styles.kbdHint}>\u2318K</Text>}
        </View>
      ) : (
        <View style={styles.brandRow}>
          <Logo variant="mark" height={22} />
          <Text style={styles.brandText} numberOfLines={1}>Fashionable Flair</Text>
        </View>
      )}

      <View style={styles.topBarActions}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminNotify')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {isWide && (
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.8} onPress={() => setProfileMenuOpen(true)}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.profileName} numberOfLines={1}>{email.split('@')[0]}</Text>
              <Text style={styles.profileRole}>Administrator</Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.shell, isWide && styles.shellWide]}>
        {isWide && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarLogoRow}>
              <Logo variant="mark" height={34} />
              <View>
                <Text style={styles.sidebarBrand}>Fashionable Flair</Text>
                <Text style={styles.sidebarTagline}>Jewellery That Tells Your Story</Text>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: spacing.lg }}>
              {navList((item) => goTo(item))}
            </ScrollView>

            <TouchableOpacity
              style={styles.helpCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Contact')}
            >
              <Ionicons name="headset-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.helpTitle}>Need help?</Text>
                <Text style={styles.helpSubtitle}>Contact support</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.main}>
          {topBar}
          <View style={styles.content}>
            <AdminShellContext.Provider value={{ query, setQuery }}>{children}</AdminShellContext.Provider>
          </View>
        </View>
      </View>

      {/* Mobile nav drawer */}
      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)}>
          <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sidebarLogoRow}>
              <Logo variant="mark" height={30} />
              <View>
                <Text style={styles.sidebarBrand}>Fashionable Flair</Text>
                <Text style={styles.sidebarTagline}>Admin Panel</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: spacing.md }}>
              {navList((item) => goTo(item))}
              <View style={styles.drawerDivider} />
              <TouchableOpacity style={styles.navRow} onPress={() => { setDrawerOpen(false); navigation.navigate('Tabs'); }}>
                <Ionicons name="storefront-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.navLabel}>Back to Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navRow} onPress={() => { setDrawerOpen(false); handleSignOut(); }}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                <Text style={[styles.navLabel, { color: colors.danger }]}>Sign Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Desktop profile dropdown */}
      <Modal visible={profileMenuOpen} transparent animationType="fade" onRequestClose={() => setProfileMenuOpen(false)}>
        <Pressable style={styles.drawerBackdrop} onPress={() => setProfileMenuOpen(false)}>
          <View style={styles.profileMenu}>
            <Text style={styles.profileMenuEmail} numberOfLines={1}>{email}</Text>
            <View style={styles.drawerDivider} />
            <TouchableOpacity style={styles.navRow} onPress={() => { setProfileMenuOpen(false); navigation.navigate('AdminSettings'); }}>
              <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navRow} onPress={() => { setProfileMenuOpen(false); navigation.navigate('Tabs'); }}>
              <Ionicons name="storefront-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>Back to Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navRow} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.navLabel, { color: colors.danger }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    shell: { flex: 1 },
    shellWide: { flexDirection: 'row' },

    sidebar: {
      width: 240,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
    },
    sidebarLogoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
    sidebarBrand: { ...typography.body, fontFamily: fonts.heading, color: colors.textPrimary },
    sidebarTagline: { ...typography.caption, color: colors.textMuted, fontSize: 9.5, letterSpacing: 0.5 },

    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.md,
      marginBottom: 2,
    },
    navRowActive: { backgroundColor: `${colors.primary}18` },
    navLabel: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
    navLabelActive: { color: colors.primary, fontFamily: fonts.bodySemiBold },
    soonDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },

    helpCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      marginTop: spacing.md,
    },
    helpTitle: { ...typography.caption, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    helpSubtitle: { ...typography.caption, color: colors.textMuted },

    main: { flex: 1, minWidth: 0 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      maxWidth: 440,
    },
    searchInput: { flex: 1, ...typography.bodySmall, color: colors.textPrimary, padding: 0 },
    kbdHint: { ...typography.caption, color: colors.textMuted, backgroundColor: colors.surface, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
    brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    brandText: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary, flexShrink: 1 },
    topBarActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    profileButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    avatarCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: { ...typography.bodySmall, color: colors.textInverse, fontFamily: fonts.bodySemiBold },
    profileName: { ...typography.caption, fontFamily: fonts.bodySemiBold, color: colors.textPrimary, textTransform: 'capitalize' },
    profileRole: { ...typography.caption, color: colors.textMuted, fontSize: 10 },

    content: { flex: 1 },

    drawerBackdrop: { flex: 1, backgroundColor: colors.overlay },
    drawer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 280,
      backgroundColor: colors.surface,
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    drawerDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
    profileMenu: {
      position: 'absolute',
      top: 56,
      right: spacing.lg,
      width: 220,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 8px 24px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }),
    },
    profileMenuEmail: { ...typography.caption, color: colors.textMuted, paddingHorizontal: spacing.sm + 2, paddingBottom: spacing.xs },
  });
}
