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
import { usePremium } from '@/context/PremiumContext';
import { useWishlist } from '@/context/WishlistContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { resolveProfileAvatarSource } from '@/data/profileAvatar';
import { getTestimonialLimit } from '@/utils/testimonialOwnership';
import { countMyTestimonials } from '@/services/testimonialService';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { ACCENT_THEMES, PREMIUM_APPEARANCES } from '@/theme';
import {
  PREMIUM_PRICE_INR,
  PREMIUM_TESTIMONIAL_LIMIT,
  PREMIUM_AVATAR_COUNT,
  PREMIUM_THEME_COUNT,
  PREMIUM_APPEARANCE_COUNT,
} from '@/config/premium';
import Container from '@/components/Container';
import MobileTopBar from '@/components/MobileTopBar';
import DownloadAppButton from '@/components/DownloadAppButton';
import ProfileAvatarPickerModal from '@/components/ProfileAvatarPickerModal';
import EditProfileModal from '@/components/EditProfileModal';
import PremiumPaywallModal from '@/components/PremiumPaywallModal';
import CustomerAuthModal from '@/components/CustomerAuthModal';
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

function formatExpiryDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
  const { colors, preference, setPreference, accentTheme, setAccentTheme } = useTheme();
  const styles = makeStyles(colors);
  const { isAdmin, session, signOut } = useAuth();
  const { name, bio, avatarIndex, memberSince, isGuest, updateProfile } = useProfile();
  const { isPremium, premiumExpiresAt } = usePremium();
  const { wishlistIds } = useWishlist();
  const { recentlyViewedIds } = useRecentlyViewed();
  const isWide = useIsWideScreen();
  const navigation = useNavigation<any>();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tapHintVisible, setTapHintVisible] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [accountAuthModalVisible, setAccountAuthModalVisible] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const testimonialLimit = getTestimonialLimit(isPremium);

  // Re-read on every focus (not just mount) so submitting a review on
  // another tab is reflected here the moment the shopper comes back.
  // Reviews are account-based now (see TestimonialsScreen) — a guest
  // simply has none to count.
  useFocusEffect(
    useCallback(() => {
      if (!session?.user?.id) {
        setReviewCount(0);
        return;
      }
      let cancelled = false;
      countMyTestimonials(session.user.id).then((count) => {
        if (!cancelled) setReviewCount(count);
      });
      return () => {
        cancelled = true;
      };
    }, [session?.user?.id])
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

  const handleAccountSignOut = async () => {
    const confirmed = await confirmAsync(
      'Log out?',
      'Your Premium status and saved profile stay right where they are \u2014 log back in anytime to pick them up again.',
      'Log Out'
    );
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
          and brand name at the very top of the page, so this shared bar —
          identical across Search, Wishlist, and Profile — only appears on
          narrow layouts where there's no TopNav at all. See MobileTopBar
          for why it's one shared component rather than each screen having
          its own slightly-different header. */}
      {!isWide && <MobileTopBar />}

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
                  <Image source={resolveProfileAvatarSource(avatarIndex)} style={styles.avatarImage} contentFit="cover" />
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
                <View style={styles.nameRow}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {name || (isGuest ? 'Add your name' : 'Add your account name')}
                  </Text>
                  {isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="diamond" size={10} color={colors.gold} />
                      <Text style={styles.premiumBadgeText}>Premium</Text>
                    </View>
                  )}
                  {isGuest ? (
                    <View style={styles.guestBadge}>
                      <Ionicons name="person-outline" size={10} color={colors.textMuted} />
                      <Text style={styles.guestBadgeText}>Guest</Text>
                    </View>
                  ) : (
                    <View style={styles.accountBadge}>
                      <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                      <Text style={styles.accountBadgeText}>Signed In</Text>
                    </View>
                  )}
                </View>
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
              <StatBox icon="star-outline" value={`${reviewCount}/${testimonialLimit}`} label="Reviews" />
            </View>
          </View>

          {isPremium ? (
            <TouchableOpacity style={styles.premiumStatusCard} activeOpacity={0.85} onPress={() => setPremiumModalVisible(true)}>
              <View style={styles.premiumStatusIconWrap}>
                <Ionicons name="diamond" size={18} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumStatusTitle}>Premium Member</Text>
                <Text style={styles.premiumStatusSubtitle}>Active until {formatExpiryDate(premiumExpiresAt)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.premiumUpsellCard} activeOpacity={0.9} onPress={() => setPremiumModalVisible(true)}>
              <View style={styles.premiumUpsellTop}>
                <View style={styles.premiumStatusIconWrap}>
                  <Ionicons name="diamond" size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.premiumStatusTitle}>Go Premium</Text>
                  <Text style={styles.premiumStatusSubtitle}>
                    {PREMIUM_TESTIMONIAL_LIMIT} reviews, {PREMIUM_AVATAR_COUNT}+ exclusive avatars, {PREMIUM_THEME_COUNT} themes & {PREMIUM_APPEARANCE_COUNT} appearances
                  </Text>
                </View>
                <View style={styles.premiumPricePill}>
                  <Text style={styles.premiumPricePillText}>₹{PREMIUM_PRICE_INR}/mo</Text>
                </View>
              </View>
              <View style={styles.premiumUpsellCta}>
                <Text style={styles.premiumUpsellCtaText}>View Benefits</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.gold} />
              </View>
            </TouchableOpacity>
          )}

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
            <View style={styles.appearanceBlock}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="contrast-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuLabel}>Premium Appearances</Text>
                  <Text style={styles.menuSubtitle}>Ivory, Blush, Twilight & Espresso are Premium-only</Text>
                </View>
              </View>
              <View style={styles.appearanceTileRow}>
                {PREMIUM_APPEARANCES.map((appearance) => {
                  const locked = !isPremium;
                  const active = preference === appearance.id;
                  return (
                    <TouchableOpacity
                      key={appearance.id}
                      style={[styles.appearanceTile, active && styles.appearanceTileActive]}
                      activeOpacity={0.85}
                      onPress={() => (locked ? setPremiumModalVisible(true) : setPreference(appearance.id))}
                      accessibilityLabel={`${appearance.label} appearance${locked ? ' (Premium)' : ''}`}
                    >
                      <View style={[styles.appearancePreview, { backgroundColor: appearance.preview.background }]}>
                        <View style={[styles.appearancePreviewCard, { backgroundColor: appearance.preview.surface }]}>
                          <View style={[styles.appearancePreviewLine, { backgroundColor: appearance.preview.text }]} />
                          <View style={[styles.appearancePreviewLine, styles.appearancePreviewLineShort, { backgroundColor: appearance.preview.text }]} />
                          <View style={[styles.appearancePreviewDot, { backgroundColor: appearance.preview.accent }]} />
                        </View>
                        {locked ? (
                          <View style={styles.appearanceBadge}>
                            <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
                          </View>
                        ) : (
                          active && (
                            <View style={[styles.appearanceBadge, { backgroundColor: colors.primary }]}>
                              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                            </View>
                          )
                        )}
                      </View>
                      <Text style={[styles.appearanceLabel, active && styles.appearanceLabelActive]} numberOfLines={1}>
                        {appearance.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.accentBlock}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuLabel}>Theme Colour</Text>
                  <Text style={styles.menuSubtitle}>
                    {ACCENT_THEMES.find((a) => a.id === accentTheme)?.label ?? 'Classic'} · {PREMIUM_THEME_COUNT} gemstone themes are Premium-only
                  </Text>
                </View>
              </View>
              <View style={styles.accentSwatchRow}>
                {ACCENT_THEMES.map((accent) => {
                  const locked = accent.premium && !isPremium;
                  const active = accentTheme === accent.id;
                  return (
                    <TouchableOpacity
                      key={accent.id}
                      style={[styles.accentSwatch, { backgroundColor: accent.swatch }, active && styles.accentSwatchActive]}
                      activeOpacity={0.8}
                      onPress={() => (locked ? setPremiumModalVisible(true) : setAccentTheme(accent.id))}
                      accessibilityLabel={`${accent.label}${locked ? ' (Premium)' : ''}`}
                    >
                      {locked ? (
                        <Ionicons name="lock-closed" size={11} color="#FFFFFF" />
                      ) : (
                        active && <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
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

          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {session ? (
              <>
                <MenuItem icon="person-circle-outline" label="Signed In" subtitle={session.user?.email ?? undefined} />
                <MenuItem icon="log-out-outline" label="Log Out" onPress={handleAccountSignOut} />
              </>
            ) : (
              <MenuItem
                icon="log-in-outline"
                label="Log In / Create Account"
                subtitle="Keep your Premium & profile synced everywhere"
                onPress={() => setAccountAuthModalVisible(true)}
              />
            )}
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

      <ProfileAvatarPickerModal
        visible={avatarPickerOpen}
        value={avatarIndex}
        isPremium={isPremium}
        onSelect={(index) => updateProfile({ avatarIndex: index })}
        onRequestUpgrade={() => {
          setAvatarPickerOpen(false);
          setPremiumModalVisible(true);
        }}
        onClose={() => setAvatarPickerOpen(false)}
      />

      <EditProfileModal
        visible={editProfileOpen}
        name={name}
        bio={bio}
        avatarIndex={avatarIndex}
        isPremium={isPremium}
        onSave={(values) => updateProfile(values)}
        onRequestUpgrade={() => {
          setEditProfileOpen(false);
          setPremiumModalVisible(true);
        }}
        onClose={() => setEditProfileOpen(false)}
      />

      <PremiumPaywallModal visible={premiumModalVisible} onClose={() => setPremiumModalVisible(false)} />

      <CustomerAuthModal
        visible={accountAuthModalVisible}
        reason="Log in or create an account to keep your Premium status and profile synced across every device."
        onClose={() => setAccountAuthModalVisible(false)}
        onAuthenticated={() => setAccountAuthModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },


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
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
    profileName: { ...typography.h3, color: colors.textPrimary },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.goldLight,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    premiumBadgeText: { ...typography.caption, color: colors.gold, fontFamily: fonts.bodySemiBold, fontSize: 10 },
    guestBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    guestBadgeText: { ...typography.caption, color: colors.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 10 },
    accountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.successLight,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    accountBadgeText: { ...typography.caption, color: colors.success, fontFamily: fonts.bodySemiBold, fontSize: 10 },
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

    premiumStatusIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.goldLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    premiumStatusTitle: { ...typography.body, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
    premiumStatusSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    premiumStatusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.gold,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...cardShadow(colors),
    },
    premiumUpsellCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.gold,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...cardShadow(colors),
    },
    premiumUpsellTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    premiumPricePill: {
      backgroundColor: colors.goldLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    premiumPricePillText: { ...typography.caption, color: colors.gold, fontFamily: fonts.bodySemiBold },
    premiumUpsellCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    premiumUpsellCtaText: { ...typography.caption, color: colors.gold, fontFamily: fonts.bodySemiBold },

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
    appearanceBlock: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: spacing.md,
    },
    appearanceTileRow: { flexDirection: 'row', gap: spacing.xs },
    appearanceTile: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      padding: 4,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    appearanceTileActive: { borderColor: colors.primary },
    appearancePreview: {
      width: '100%',
      height: 64,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 8,
      justifyContent: 'center',
    },
    appearancePreviewCard: { flex: 1, borderRadius: 6, padding: 6, justifyContent: 'center', gap: 4 },
    appearancePreviewLine: { height: 4, borderRadius: 2, width: '70%', opacity: 0.55 },
    appearancePreviewLineShort: { width: '40%', opacity: 0.3 },
    appearancePreviewDot: { position: 'absolute', right: 6, bottom: 6, width: 10, height: 10, borderRadius: 5 },
    appearanceBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    appearanceLabel: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    appearanceLabelActive: { color: colors.textPrimary },
    accentBlock: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: spacing.md,
    },
    accentSwatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    accentSwatch: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    accentSwatchActive: { borderColor: colors.textPrimary },
    footer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
    footerText: { ...typography.caption, color: colors.textMuted },
    footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryLight },
  });
}
