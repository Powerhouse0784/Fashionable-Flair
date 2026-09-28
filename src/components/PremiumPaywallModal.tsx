import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useAuth } from '@/context/AuthContext';
import { usePremium } from '@/context/PremiumContext';
import { PREMIUM_BENEFITS, PREMIUM_PRICE_INR } from '@/config/premium';
import { WEBSITE_URL } from '@/config/socialLinks';
import { startPremiumCheckout, isWebCheckoutSupported, CHECKOUT_DISMISSED } from '@/services/premiumService';
import { alertInfo } from '@/utils/confirm';
import { hapticSuccess } from '@/utils/haptics';
import CustomerAuthModal from './CustomerAuthModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

/** Doubles as the sales paywall (not Premium yet) and the "your
 * subscription" status screen (already Premium) — same benefits list
 * either way, just a different call to action at the bottom. Buying
 * requires an account (see CUSTOMER_ACCOUNTS_SETUP.md for why); a guest
 * who taps Subscribe is asked to log in or register first, right here,
 * without losing their place. */
export default function PremiumPaywallModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { session } = useAuth();
  const { isPremium, premiumExpiresAt, applyServerPremium } = usePremium();
  const [checkingOut, setCheckingOut] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const runCheckout = async () => {
    setCheckingOut(true);
    try {
      const result = await startPremiumCheckout(1);
      applyServerPremium(result.premiumSince, result.premiumExpiresAt);
      hapticSuccess();
      onClose();
      alertInfo('Welcome to Premium! \u2728', 'Your exclusive avatars, themes and extra reviews are unlocked.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      if (message !== CHECKOUT_DISMISSED) {
        alertInfo('Checkout Didn\u2019t Complete', message);
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isWebCheckoutSupported) {
      Linking.openURL(WEBSITE_URL);
      return;
    }
    if (!session) {
      setAuthModalVisible(true);
      return;
    }
    runCheckout();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.crownWrap}>
            <Ionicons name="diamond" size={28} color={colors.gold} />
          </View>
          <Text style={styles.title}>Fashionable Flair Premium</Text>

          {isPremium ? (
            <View style={styles.statusPill}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.statusPillText}>Active until {formatDate(premiumExpiresAt)}</Text>
            </View>
          ) : (
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>₹{PREMIUM_PRICE_INR}</Text>
              <Text style={styles.priceUnit}>/ month</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
            {PREMIUM_BENEFITS.map((benefit) => (
              <View key={benefit.title} style={styles.benefitRow}>
                <View style={styles.benefitIconWrap}>
                  <Ionicons name={benefit.icon as any} size={16} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {isPremium ? (
            <Text style={styles.disclaimer}>
              This is a one-month pass, not an auto-renewing subscription — come back and subscribe again anytime to extend it.
            </Text>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.subscribeButton, checkingOut && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleSubscribe}
                disabled={checkingOut}
              >
                {checkingOut ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={styles.subscribeButtonText}>
                    {!isWebCheckoutSupported
                      ? 'Subscribe on Our Website'
                      : session
                      ? `Subscribe Now \u2014 \u20b9${PREMIUM_PRICE_INR}/month`
                      : 'Log In to Subscribe'}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={styles.disclaimer}>
                {!isWebCheckoutSupported
                  ? `In-app purchases aren\u2019t available on ${Platform.OS === 'ios' ? 'iOS' : 'Android'} yet \u2014 you\u2019ll be taken to our website to subscribe.`
                  : session
                  ? 'Charged once via Razorpay for one month \u2014 renew anytime after it ends.'
                  : 'Premium is tied to your account so a real purchase never gets lost \u2014 log in or create one first.'}
              </Text>
            </>
          )}
        </Pressable>
      </Pressable>

      <CustomerAuthModal
        visible={authModalVisible}
        reason="Log in or create an account to subscribe to Premium — this keeps your purchase safe even if you clear your browser or switch devices."
        onClose={() => setAuthModalVisible(false)}
        onAuthenticated={() => {
          setAuthModalVisible(false);
          runCheckout();
        }}
      />
    </Modal>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
      alignItems: 'center',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
    closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 1 },
    crownWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.goldLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: spacing.xs, marginBottom: spacing.md },
    priceValue: { ...typography.h1, fontFamily: fonts.headingBold, color: colors.gold },
    priceUnit: { ...typography.body, color: colors.textMuted, marginBottom: 4 },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.successLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    statusPillText: { ...typography.caption, color: colors.success, fontFamily: fonts.bodySemiBold },
    benefitRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', width: '100%', marginBottom: spacing.md },
    benefitIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitTitle: { ...typography.body, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
    benefitDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    subscribeButton: {
      backgroundColor: colors.gold,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 6,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginTop: spacing.sm,
    },
    subscribeButtonText: { ...typography.button, color: colors.textInverse },
    disclaimer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  });
}
