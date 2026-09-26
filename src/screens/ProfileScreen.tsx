import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useWishlist } from '@/context/WishlistContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { getAvatarByIndex } from '@/data/avatars';
import { getOwnedTestimonialIds, MAX_TESTIMONIALS_PER_DEVICE } from '@/utils/testimonialOwnership';
import { useIsWideScreen } from '@/hooks/useResponsive';
import Container from '@/components/Container';
import Logo from '@/components/Logo';
import DownloadAppButton from '@/components/DownloadAppButton';
import AvatarPickerModal from '@/components/AvatarPickerModal';
import EditProfileModal from '@/components/EditProfileModal';
import { confirmAsync, alertInfo } from '@/utils/confirm';

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
}

function MenuItem({ icon, label, subtitle, onPress, rightSlot }: MenuItemProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconCircle}>
          <Ionicons name={icon as any} size={18} color={colors.primary} />
        </View>
        <View style={styles.menuTextCol}>
          <Text style={styles.menuLabel}>{label}</Text>
          {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightSlot ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />)}
    </TouchableOpacity>
  );
}

interface StatBoxProps {
  icon: string;
  value: string;
  label: string;
}

function StatBox({ icon, value, label }: StatBoxProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon as any} size={18} color={colors.gold} style={{ marginBottom: 4 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Same "en-IN" locale formatting the rest of the app uses for dates
 * (see src/utils/date.ts), just month+year — "member since" doesn't need
 * the exact day. */
function formatMemberSince(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

const SECRET_TAP_COUNT = 5;
const SECRET_TAP_WINDOW_MS = 2500;

/** Soft card lift used across the app (see ProductCard/TestimonialCard) —
 * pulled out here since the profile card, app-promo card and every menu
 * card on this screen all want the same subtle depth. */
function cardShadow(colors: ColorTheme) {
  return Platform.OS === 'web'
    ? ({ boxShadow: `0 2px 10px ${colors.shadow}` } as any)
    : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 };
}

export default function ProfileScreen() {
  const { colors, preference, setPreference } = useTheme();
  const styles = makeStyles(colors);
  const { isAdmin, signOut } = useAuth();
  const { name, bio, avatarIndex, memberSince, updateProfile } = useProfile();
  const { wishlistIds } = useWishlist();
  const { recentlyViewedIds } = useRecentlyViewed();
  const isWide = useIsWideScreen();
  const navigation = useNavigation<any>();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tapHintVisible, setTapHintVisible] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  // Re-read on every focus (not just mount) so submitting a testimonial on
  // another tab is reflected here the moment the shopper comes back.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getOwnedTestimonialIds().then((ids) => {
        if (!cancelled) setReviewCount(ids.length);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleSecretTap = () => {
    if (isAdmin) return;
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

  const handleAdminSignOut = async () => {
    const confirmed = await confirmAsync('Sign out of admin?', undefined, 'Sign Out');
    if (confirmed) signOut();
  };

  const handleOffersPress = async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Check out our latest offers and deals on Meesho!')) {
        Linking.openURL('https://www.meesho.com/h6z4l');
      }
      return;
    }
    Alert.alert('Offers & Deals', 'Check out our latest offers and deals on Meesho!', [
      {
        text: 'View on Meesho',
        onPress: () => Linking.openURL('https://www.meesho.com/h6z4l'),
      },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const handleNotificationsPress = async () => {
    if (Platform.OS === 'web') {
      alertInfo('Notifications', "You'll get browser alerts here once you enable them — nothing new right now.");
      return;
    }
    try {
      if (Constants.appOwnership === 'expo') {
        alertInfo('Notifications', 'Push notifications need the full app build to work — not available in this preview.');
        return;
      }
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        alertInfo('Notifications', "You're all set — we'll let you know about new arrivals and offers.");
      } else {
        const goToSettings = await confirmAsync(
          'Notifications are off',
          "Turn them on in your device settings to hear about new arrivals and offers.",
          'Open Settings'
        );
        if (goToSettings) Linking.openSettings();
      }
    } catch {
      alertInfo('Notifications', 'You have no new notifications at this time.');
    }
  };

  const memberSinceLabel = formatMemberSince(memberSince);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* On wide/web layouts TopNav (see AppShell) already shows the logo
          and brand name at the very top of the page, so this compact bar
          — logo mark + name + tagline, nothing else — only appears on
          narrow layouts where there's no TopNav at all. It sits outside
          Container/ScrollView so it spans the full width like a real
          navbar, with the divider line reaching both edges. */}
      {!isWide && (
        <View style={styles.navbar}>
          <View style={styles.navbarLogo}>
            <Logo variant="mark" height={20} />
          </View>
          <View style={styles.navbarTextCol}>
            <Text style={styles.navbarTitle} numberOfLines={1}>Fashionable Flair</Text>
            <Text style={styles.navbarSubtitle} numberOfLines={1}>Jewellery That Speaks Your Style</Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <Container style={{ paddingTop: spacing.lg }}>
          {/* Profile card — purely local (no login), lets a shopper put a
              name, avatar and short line about themselves on their own tab. */}
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <TouchableOpacity
                style={styles.avatarWrap}
                activeOpacity={0.85}
                onPress={() => setAvatarPickerOpen(true)}
                accessibilityLabel="Change your avatar"
              >
                {avatarIndex ? (
                  <Image source={getAvatarByIndex(avatarIndex)} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                    <Ionicons name="person-outline" size={28} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera-outline" size={12} color={colors.textInverse} />
                </View>
              </TouchableOpacity>

              <View style={styles.profileTextCol}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {name || 'Add your name'}
                </Text>
                {memberSinceLabel ? (
                  <View style={styles.memberSinceRow}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.memberSinceText}>Member since {memberSinceLabel}</Text>
                  </View>
                ) : null}
                <Text style={styles.profileBio} numberOfLines={2}>
                  {bio ? `"${bio}"` : 'Tap edit to add a line about yourself'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editIconBtn}
                activeOpacity={0.75}
                onPress={() => setEditProfileOpen(true)}
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <StatBox icon="heart-outline" value={String(wishlistIds.length)} label="Wishlist" />
              <View style={styles.statDivider} />
              <StatBox icon="eye-outline" value={String(recentlyViewedIds.length)} label="Products Viewed" />
              <View style={styles.statDivider} />
              <StatBox icon="star-outline" value={`${reviewCount}/${MAX_TESTIMONIALS_PER_DEVICE}`} label="Reviews" />
            </View>
          </View>

          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Store Management</Text>
              <View style={styles.card}>
                <MenuItem
                  icon="shield-checkmark"
                  label="Open Admin Dashboard"
                  subtitle="Manage products, orders & content"
                  onPress={() => navigation.navigate('AdminDashboard')}
                />
                <MenuItem icon="log-out-outline" label="Sign Out of Admin" onPress={handleAdminSignOut} />
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Shop</Text>
          <View style={styles.card}>
            <MenuItem
              icon="heart-outline"
              label="My Wishlist"
              subtitle="Your favourite pieces, always within reach"
              onPress={() => navigation.navigate('Tabs', { screen: 'Wishlist' })}
            />
            <MenuItem
              icon="storefront-outline"
              label="Visit our Meesho Store"
              subtitle="Browse the full catalog & checkout securely"
              onPress={() => Linking.openURL('https://www.meesho.com/h6z4l')}
            />
            <MenuItem
              icon="pricetag-outline"
              label="Offers & Deals"
              subtitle="Exclusive discounts just for you"
              onPress={handleOffersPress}
            />
            <MenuItem
              icon="star-outline"
              label="Testimonials"
              subtitle="Read reviews & share your experience"
              onPress={() => navigation.navigate('Testimonials')}
            />
          </View>

          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.themeRow}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="moon-outline" size={18} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>Appearance</Text>
              </View>
              <View style={styles.themeSegment}>
                {(['light', 'dark', 'system'] as const).map((opt) => {
                  const active = preference === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.themeOption, active && styles.themeOptionActive]}
                      onPress={() => setPreference(opt)}
                    >
                      <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
                        {opt === 'light' ? 'Light' : opt === 'dark' ? 'Dark' : 'Auto'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              subtitle="New arrivals, offers & updates"
              onPress={handleNotificationsPress}
            />
          </View>

          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuItem icon="help-circle-outline" label="FAQs" subtitle="Answers to common questions" onPress={() => navigation.navigate('FAQ')} />
            <MenuItem icon="chatbubble-ellipses-outline" label="Contact Us" subtitle="We usually reply within a day" onPress={() => navigation.navigate('Contact')} />
            <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
            <MenuItem icon="reader-outline" label="Terms of Service" onPress={() => navigation.navigate('Terms')} />
            <MenuItem icon="information-circle-outline" label="About Fashionable Flair" onPress={() => navigation.navigate('About')} />
          </View>

          {/* Download CTA lives down here rather than up top, so the page
              opens straight into the shopper's own profile instead of a
              sales pitch — this is just a closing nudge for web visitors
              before the footer. Never shown on the native app itself. */}
          {Platform.OS === 'web' && (
            <View style={styles.appPromoCard}>
              <View style={styles.appPromoIconWrap}>
                <Ionicons name="phone-portrait-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.appPromoTitle}>Get the Android App</Text>
              <Text style={styles.appPromoSubtitle}>Shop faster, right from your phone</Text>
              <DownloadAppButton style={{ marginTop: spacing.md }} />
            </View>
          )}

          <TouchableOpacity onPress={handleSecretTap} activeOpacity={1} style={styles.footer}>
            <Text style={styles.footerText}>Fashionable Flair · v1.0.0</Text>
            {tapHintVisible && <View style={styles.footerDot} />}
          </TouchableOpacity>

          <View style={{ height: spacing.xxl }} />
        </Container>
      </ScrollView>

      <AvatarPickerModal
        visible={avatarPickerOpen}
        value={avatarIndex}
        onSelect={(index) => updateProfile({ avatarIndex: index })}
        onClose={() => setAvatarPickerOpen(false)}
      />

      <EditProfileModal
        visible={editProfileOpen}
        name={name}
        bio={bio}
        avatarIndex={avatarIndex}
        onSave={(values) => updateProfile(values)}
        onClose={() => setEditProfileOpen(false)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    // Compact, narrow-screen-only navbar: logo mark + name + tagline and
    // nothing else — deliberately no settings/notification icons here.
    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    navbarLogo: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.gold,
    },
    navbarTextCol: { flex: 1, minWidth: 0 },
    navbarTitle: { ...typography.body, fontFamily: fonts.headingMedium, color: colors.textPrimary },
    navbarSubtitle: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 9.5,
      marginTop: 1,
    },

    appPromoCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      ...cardShadow(colors),
    },
    appPromoIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    appPromoTitle: { ...typography.h3, fontFamily: fonts.headingMedium, color: colors.textPrimary },
    appPromoSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },

    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...cardShadow(colors),
    },
    profileTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    avatarWrap: { width: 64, height: 64 },
    avatarImage: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: colors.gold,
      backgroundColor: colors.surfaceAlt,
    },
    avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    cameraBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    profileTextCol: { flex: 1, minWidth: 0 },
    profileName: { ...typography.h3, color: colors.textPrimary },
    memberSinceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    memberSinceText: { ...typography.caption, color: colors.textMuted },
    profileBio: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, fontStyle: 'italic' },
    editIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },

    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 32, backgroundColor: colors.divider },
    statValue: { ...typography.body, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
    statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 1, textAlign: 'center' },

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
      ...cardShadow(colors),
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
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    menuIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuTextCol: { flex: 1, minWidth: 0 },
    menuLabel: { ...typography.body, color: colors.textPrimary },
    menuSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    themeSegment: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: radius.pill,
      padding: 3,
      gap: 2,
    },
    themeOption: { paddingHorizontal: spacing.sm + 2, paddingVertical: 5, borderRadius: radius.pill },
    themeOptionActive: { backgroundColor: colors.primary },
    themeOptionText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    themeOptionTextActive: { color: colors.textInverse },
    footer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
    footerText: { ...typography.caption, color: colors.textMuted },
    footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryLight },
  });
}
