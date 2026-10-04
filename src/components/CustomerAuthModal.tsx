import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useModalBackClose } from '@/hooks/useModalBackClose';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { alertInfo } from '@/utils/confirm';
import type { Session } from '@supabase/supabase-js';
import Logo from './Logo';

// Decorative corners and hero scene, cropped from the approved login
// reference art (see fashionable_flair_login_assets.zip) — the text and
// UI chrome baked into that reference's own screenshots were cropped
// away; only the clean floral/jewellery artwork is used here, with every
// label, field and button in this file being real text, not an image.
const topCornerLight = require('@/assets/auth/top_corner_light.jpg');
const topCornerDark = require('@/assets/auth/top_corner_dark.jpg');
const bottomCornerLight = require('@/assets/auth/bottom_corner_light.jpg');
const bottomCornerDark = require('@/assets/auth/bottom_corner_dark.jpg');
const heroLight = require('@/assets/auth/hero_light.jpg');
const heroDark = require('@/assets/auth/hero_dark.jpg');

interface Props {
  visible: boolean;
  /** Shown under the title to explain WHY it's asking — e.g. "Log in to
   * subscribe to Premium." Defaults to a generic line if omitted. */
  reason?: string;
  onClose: () => void;
  /** Fires once sign-in/sign-up genuinely succeeds (session established),
   * with that exact session — pass this session on rather than reading it
   * back from useAuth(), which may not have re-rendered with it yet. */
  onAuthenticated: (session: Session) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Mode = 'signIn' | 'signUp' | 'forgotPassword';
type FieldKey = 'name' | 'email' | 'password' | 'confirm';

const TRUST_BADGES = [
  { icon: 'diamond-outline', label: 'Premium Quality\nJewellery' },
  { icon: 'shield-checkmark-outline', label: 'Secure & Easy\nPayments' },
  { icon: 'people-outline', label: 'Trusted by\nThousands' },
] as const;

const SOCIAL_BUTTONS = [
  { key: 'google', icon: 'logo-google', color: '#EA4335', label: 'Google' },
  { key: 'apple', icon: 'logo-apple', color: null, label: 'Apple' },
  { key: 'facebook', icon: 'logo-facebook', color: '#1877F2', label: 'Facebook' },
] as const;

interface FieldProps {
  icon: string;
  label?: string;
  focused: boolean;
  colors: ColorTheme;
  right?: React.ReactNode;
  inputRef?: React.RefObject<TextInput | null>;
  inputProps: React.ComponentProps<typeof TextInput>;
}

function Field({ icon, label, focused, colors, right, inputRef, inputProps }: FieldProps) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <Ionicons name={icon as any} size={18} color={focused ? colors.primary : colors.textMuted} />
        <TextInput
          ref={inputRef as any}
          style={styles.fieldInput}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          {...inputProps}
        />
        {right}
      </View>
    </View>
  );
}

/** The one place in the app that ever asks a shopper to sign in — a
 * full-screen login / create-account / reset-password page (browsing,
 * wishlist, profile etc. all still work as a guest). Narrow screens get a
 * single scrolling column; wide screens get the form beside a jewellery
 * hero image and trust badges instead of floating alone in empty space. */
export default function CustomerAuthModal({ visible, reason, onClose, onAuthenticated }: Props) {
  useModalBackClose(visible, onClose);
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const topCorner = isDark ? topCornerDark : topCornerLight;
  const bottomCorner = isDark ? bottomCornerDark : bottomCornerLight;
  const heroImage = isDark ? heroDark : heroLight;
  const { signIn, signUp, resetPassword } = useAuth();
  const { name: profileName, updateProfile } = useProfile();

  const [mode, setMode] = useState<Mode>('signIn');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const emailRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const confirmRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (!visible) return;
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError(null);
    setConfirmationSent(false);
    setResetSent(false);
  }, [visible, mode]);

  useEffect(() => {
    if (visible) setMode('signIn');
  }, [visible]);

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);

    if (mode === 'forgotPassword') {
      if (!EMAIL_PATTERN.test(email.trim())) {
        setError('Enter a valid email address.');
        return;
      }
      setSubmitting(true);
      try {
        const { error: resetError } = await resetPassword(email.trim());
        if (resetError) {
          setError(resetError);
          return;
        }
        setResetSent(true);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'signUp' && !fullName.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signUp' && password !== confirmPassword) {
      setError('Passwords don\u2019t match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        const { error: authError, session } = await signIn(email.trim(), password);
        if (authError || !session) {
          setError(authError ?? 'Something went wrong signing in.');
          return;
        }
        onAuthenticated(session);
        return;
      }

      const { error: authError, needsConfirmation, session } = await signUp(email.trim(), password, fullName.trim());
      if (authError) {
        setError(authError);
        return;
      }
      if (fullName.trim() && !profileName) updateProfile({ name: fullName.trim() });

      if (needsConfirmation || !session) {
        setConfirmationSent(true);
        return;
      }
      onAuthenticated(session);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialPress = (label: string) => {
    alertInfo(`${label} sign-in`, `${label} sign-in isn\u2019t set up yet \u2014 please use your email for now.`);
  };

  const gradientColors: [string, string] = isDark ? ['#EBCB85', colors.gold] : [colors.primary, colors.primaryDark];
  const buttonTextColor = isDark ? '#1B1405' : '#FFFFFF';
  const isSignIn = mode === 'signIn';
  const isForgotPassword = mode === 'forgotPassword';

  const submitButton = (label: string) => (
    <TouchableOpacity activeOpacity={0.88} onPress={handleSubmit} disabled={submitting} style={{ marginTop: spacing.sm }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.submitButton, submitting && { opacity: 0.75 }]}
      >
        {submitting ? (
          <ActivityIndicator color={buttonTextColor} />
        ) : (
          <>
            <Text style={[styles.submitButtonText, { color: buttonTextColor }]}>{label}</Text>
            <Ionicons name="arrow-forward" size={18} color={buttonTextColor} />
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const errorBox = error ? (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
      <Text style={styles.errorText}>{error}</Text>
    </View>
  ) : null;

  let form: React.ReactNode;

  if (confirmationSent) {
    form = (
      <View style={styles.confirmationBox}>
        <View style={styles.confirmationIcon}>
          <Ionicons name="mail-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.confirmationTitle}>Check your inbox</Text>
        <Text style={styles.confirmationText}>We’ve sent a confirmation link to {email.trim()}. Confirm it, then log in.</Text>
      </View>
    );
  } else if (resetSent) {
    form = (
      <>
        <View style={styles.confirmationBox}>
          <View style={styles.confirmationIcon}>
            <Ionicons name="mail-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.confirmationTitle}>Check your inbox</Text>
          <Text style={styles.confirmationText}>
            If an account exists for {email.trim()}, we’ve sent a link to reset the password.
          </Text>
        </View>
        <TouchableOpacity style={styles.switchModeBtn} onPress={() => setMode('signIn')}>
          <Text style={styles.switchModeText}>
            <Text style={{ color: colors.primary, fontFamily: fonts.bodySemiBold }}>Back to Log In</Text>
          </Text>
        </TouchableOpacity>
      </>
    );
  } else if (isForgotPassword) {
    form = (
      <>
        <Field
          icon="mail-outline"
          label="Email Address"
          colors={colors}
          focused={focusedField === 'email'}
          inputRef={emailRef}
          inputProps={{
            value: email,
            onChangeText: setEmail,
            placeholder: 'you@example.com',
            autoCapitalize: 'none',
            keyboardType: 'email-address',
            autoComplete: 'email',
            returnKeyType: 'go',
            onFocus: () => setFocusedField('email'),
            onBlur: () => setFocusedField(null),
            onSubmitEditing: handleSubmit,
          }}
        />
        {errorBox}
        {submitButton('Send Reset Link')}
        <TouchableOpacity style={styles.switchModeBtn} onPress={() => setMode('signIn')}>
          <Text style={styles.switchModeText}>
            <Text style={{ color: colors.primary, fontFamily: fonts.bodySemiBold }}>Back to Log In</Text>
          </Text>
        </TouchableOpacity>
      </>
    );
  } else {
    form = (
      <>
        {!isSignIn && (
          <Field
            icon="person-outline"
            label="Full Name"
            colors={colors}
            focused={focusedField === 'name'}
            inputProps={{
              value: fullName,
              onChangeText: setFullName,
              placeholder: 'Enter your full name',
              autoCapitalize: 'words',
              autoComplete: 'name',
              returnKeyType: 'next',
              onFocus: () => setFocusedField('name'),
              onBlur: () => setFocusedField(null),
              onSubmitEditing: () => emailRef.current?.focus(),
              maxLength: 40,
            }}
          />
        )}
        <Field
          icon="mail-outline"
          label={isSignIn ? undefined : 'Email Address'}
          colors={colors}
          focused={focusedField === 'email'}
          inputRef={emailRef}
          inputProps={{
            value: email,
            onChangeText: setEmail,
            placeholder: 'you@example.com',
            autoCapitalize: 'none',
            keyboardType: 'email-address',
            autoComplete: 'email',
            returnKeyType: 'next',
            onFocus: () => setFocusedField('email'),
            onBlur: () => setFocusedField(null),
            onSubmitEditing: () => passwordRef.current?.focus(),
          }}
        />
        <Field
          icon="lock-closed-outline"
          label={isSignIn ? undefined : 'Password'}
          colors={colors}
          focused={focusedField === 'password'}
          inputRef={passwordRef}
          right={
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          }
          inputProps={{
            value: password,
            onChangeText: setPassword,
            placeholder: 'At least 6 characters',
            secureTextEntry: !showPassword,
            autoCapitalize: 'none',
            autoComplete: isSignIn ? 'current-password' : 'new-password',
            returnKeyType: isSignIn ? 'go' : 'next',
            onFocus: () => setFocusedField('password'),
            onBlur: () => setFocusedField(null),
            onSubmitEditing: () => (isSignIn ? handleSubmit() : confirmRef.current?.focus()),
          }}
        />
        {!isSignIn && (
          <Field
            icon="shield-checkmark-outline"
            label="Confirm Password"
            colors={colors}
            focused={focusedField === 'confirm'}
            inputRef={confirmRef}
            inputProps={{
              value: confirmPassword,
              onChangeText: setConfirmPassword,
              placeholder: 'Re-enter your password',
              secureTextEntry: !showPassword,
              autoCapitalize: 'none',
              autoComplete: 'new-password',
              returnKeyType: 'go',
              onFocus: () => setFocusedField('confirm'),
              onBlur: () => setFocusedField(null),
              onSubmitEditing: handleSubmit,
            }}
          />
        )}

        {isSignIn && (
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe((v) => !v)} activeOpacity={0.7}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color={colors.textInverse} />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('forgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        )}

        {errorBox}
        {submitButton(isSignIn ? 'Log In' : 'Create Account')}

        {!isSignIn && (
          <Text style={styles.termsText}>By creating an account you agree to our Terms of Service and Privacy Policy.</Text>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.socialRow}>
          {SOCIAL_BUTTONS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={styles.socialButton}
              activeOpacity={0.8}
              onPress={() => handleSocialPress(s.label)}
              accessibilityLabel={`Continue with ${s.label}`}
            >
              <Ionicons name={s.icon as any} size={20} color={s.color ?? colors.textPrimary} />
            </TouchableOpacity>
          ))}
        </View>
      </>
    );
  }

  const switchLink = !confirmationSent && !resetSent && !isForgotPassword && (
    <TouchableOpacity style={styles.switchModeBtn} onPress={() => setMode(isSignIn ? 'signUp' : 'signIn')}>
      <Text style={styles.switchModeText}>
        {isSignIn ? "Don't have an account? " : 'Already have an account? '}
        <Text style={{ color: colors.primary, fontFamily: fonts.bodySemiBold }}>{isSignIn ? 'Create one' : 'Log in'}</Text>
      </Text>
    </TouchableOpacity>
  );

  const titleText = confirmationSent || resetSent ? 'Almost there' : isForgotPassword ? 'Reset Password' : isSignIn ? 'Welcome Back' : 'Create Account';
  const subtitleText =
    !confirmationSent && !resetSent
      ? reason ||
        (isForgotPassword
          ? "Enter your email and we'll send you a link to reset your password."
          : isSignIn
          ? 'Log in to your account and continue your jewellery journey.'
          : 'Be the first to explore our latest collections, exclusive offers and more.')
      : null;

  const backButton = (
    <TouchableOpacity
      style={styles.backButton}
      onPress={onClose}
      accessibilityLabel="Close"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.8}
    >
      <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
    </TouchableOpacity>
  );

  const brandRow = (
    <View style={styles.brandRow}>
      <View style={styles.brandMark}>
        <Logo variant="mark" height={22} />
      </View>
      <View>
        <Text style={styles.brandName}>Fashionable Flair</Text>
        <Text style={styles.brandTagline}>Jewellery That Speaks Your Style</Text>
      </View>
    </View>
  );

  const heading = (
    <>
      <Text style={styles.title}>{titleText}</Text>
      {subtitleText ? <Text style={styles.subtitle}>{subtitleText}</Text> : null}
    </>
  );

  if (isWide) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.screen}>
          <Image source={topCorner} style={styles.wideTopCornerImg} resizeMode="cover" />
          <Image source={bottomCorner} style={styles.wideBottomCornerImg} resizeMode="cover" />

          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.wideScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.wideWrap}>
                <View style={styles.wideHeaderRow}>
                  {backButton}
                  {brandRow}
                </View>

                <View style={styles.wideColumns}>
                  <View style={styles.wideLeftCol}>
                    {heading}
                    <View style={styles.formArea}>{form}</View>
                    {switchLink}
                  </View>

                  <View style={styles.wideRightCol}>
                    <View style={styles.heroImageWrap}>
                      <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
                    </View>
                    <View style={styles.trustRow}>
                      {TRUST_BADGES.map((b) => (
                        <View key={b.label} style={styles.trustItem}>
                          <View style={styles.trustIconWrap}>
                            <Ionicons name={b.icon as any} size={20} color={colors.primary} />
                          </View>
                          <Text style={styles.trustLabel}>{b.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <Image source={topCorner} style={styles.topCornerImg} resizeMode="cover" pointerEvents="none" />
        <Image source={bottomCorner} style={styles.bottomCornerImg} resizeMode="cover" pointerEvents="none" />

        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.headerBar}>
            {backButton}
            {brandRow}
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.column}>
                {heading}
                <View style={styles.formArea}>{form}</View>
                {switchLink}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    // ---------- Decorative corners (narrow) ----------
    topCornerImg: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 120,
      height: 230,
      opacity: 0.9,
      borderBottomLeftRadius: radius.lg,
    },
    bottomCornerImg: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: 230,
      height: 130,
      opacity: 0.9,
      borderTopRightRadius: radius.lg,
    },

    // ---------- Pinned header bar (narrow layout) ----------
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 3px 10px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 }),
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    brandMark: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1.5,
      borderColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    brandName: { ...typography.body, fontFamily: fonts.headingMedium, color: colors.textPrimary },
    brandTagline: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 9.5,
      marginTop: 1,
    },

    scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    column: { width: '100%', alignSelf: 'center' },

    title: { fontSize: 28, lineHeight: 34, fontFamily: fonts.headingBold, color: colors.textPrimary, marginTop: spacing.md },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, maxWidth: 340 },

    // ---------- Wide / web layout ----------
    wideTopCornerImg: { position: 'absolute', top: 0, right: 0, width: 220, height: 190, opacity: 0.55 },
    wideBottomCornerImg: { position: 'absolute', bottom: 0, left: 0, width: 260, height: 150, opacity: 0.55 },
    wideScrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
    wideWrap: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: spacing.xl },
    wideHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
    wideColumns: { flexDirection: 'row', gap: spacing.xxl, alignItems: 'flex-start' },
    wideLeftCol: { flex: 5, maxWidth: 440 },
    wideRightCol: { flex: 6, alignItems: 'center' },
    heroImageWrap: {
      width: '100%',
      aspectRatio: 1170 / 730,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 6px 24px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 3 }),
    },
    heroImage: { width: '100%', height: '100%' },
    trustRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: spacing.lg },
    trustItem: { alignItems: 'center', gap: spacing.xs, maxWidth: 130 },
    trustIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: colors.gold,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trustLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 16 },

    formArea: { marginTop: spacing.lg },

    fieldWrap: { marginBottom: spacing.md },
    fieldLabel: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold, marginBottom: 6 },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 52,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    fieldFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
    fieldInput: {
      flex: 1,
      color: colors.textPrimary,
      ...typography.body,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
    },

    optionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    rememberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    rememberText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    forgotText: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodySemiBold },

    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${colors.danger}1A`,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    errorText: { ...typography.caption, color: colors.danger, flex: 1 },

    submitButton: {
      height: 54,
      borderRadius: radius.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    submitButtonText: { ...typography.button },
    termsText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { ...typography.caption, color: colors.textMuted },
    socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
    socialButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 8px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 }),
    },

    switchModeBtn: { alignItems: 'center', marginTop: spacing.lg, paddingVertical: spacing.sm },
    switchModeText: { ...typography.bodySmall, color: colors.textSecondary },

    confirmationBox: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
    confirmationIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmationTitle: { ...typography.h3, color: colors.textPrimary },
    confirmationText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  });
}
