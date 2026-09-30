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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useModalBackClose } from '@/hooks/useModalBackClose';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import type { Session } from '@supabase/supabase-js';
import Logo from './Logo';

const leafLight = require('@/assets/privacy/privacy-leaf-light.png');
const leafDark = require('@/assets/privacy/privacy-leaf-dark.png');

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
type Mode = 'signIn' | 'signUp';
type FieldKey = 'name' | 'email' | 'password' | 'confirm';

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
 * full-screen login / create-account page (browsing, wishlist, profile
 * etc. all still work as a guest). On phones it's a single column with a
 * pinned header bar above a normally-flowing (not artificially centered)
 * body, so a short form (login) and a long one (register) both read the
 * same way. On wide/web screens the same form sits beside a decorative
 * panel instead of floating alone in a mostly-empty page. */
export default function CustomerAuthModal({ visible, reason, onClose, onAuthenticated }: Props) {
  useModalBackClose(visible, onClose);
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const leafSource = isDark ? leafDark : leafLight;
  const { signIn, signUp } = useAuth();
  const { name: profileName, updateProfile } = useProfile();

  const [mode, setMode] = useState<Mode>('signIn');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

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
  }, [visible, mode]);

  useEffect(() => {
    if (visible) setMode('signIn');
  }, [visible]);

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);
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

      const { error: authError, needsConfirmation, session } = await signUp(email.trim(), password);
      if (authError) {
        setError(authError);
        return;
      }
      // Use the name they just typed as their profile name (only if they
      // hadn't already set one as a guest — never overwrite it).
      if (fullName.trim() && !profileName) updateProfile({ name: fullName.trim() });

      if (needsConfirmation || !session) {
        // The project has "Confirm email" on — there's no session yet
        // until they click the link, so say so plainly and don't call
        // onAuthenticated: nothing is actually signed in yet, so the
        // caller (e.g. the Premium paywall) must not proceed as if it were.
        setConfirmationSent(true);
        return;
      }
      // Confirmation is off for this project, so signUp already produced a
      // real session — safe to proceed immediately.
      onAuthenticated(session);
    } finally {
      setSubmitting(false);
    }
  };

  const gradientColors: [string, string] = isDark ? ['#EBCB85', colors.gold] : [colors.primary, colors.primaryDark];
  const buttonTextColor = isDark ? '#1B1405' : '#FFFFFF';
  const isSignIn = mode === 'signIn';

  const form = confirmationSent ? (
    <View style={styles.confirmationBox}>
      <View style={styles.confirmationIcon}>
        <Ionicons name="mail-outline" size={28} color={colors.primary} />
      </View>
      <Text style={styles.confirmationTitle}>Check your inbox</Text>
      <Text style={styles.confirmationText}>We’ve sent a confirmation link to {email.trim()}. Confirm it, then log in.</Text>
    </View>
  ) : (
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

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity activeOpacity={0.88} onPress={handleSubmit} disabled={submitting} style={{ marginTop: spacing.lg }}>
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
              <Text style={[styles.submitButtonText, { color: buttonTextColor }]}>
                {isSignIn ? 'Log In' : 'Create Account'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={buttonTextColor} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {!isSignIn && (
        <Text style={styles.termsText}>By creating an account you agree to our Terms of Service and Privacy Policy.</Text>
      )}
    </>
  );

  // A back button that floats over everything, always in the same corner
  // of the viewport — one implementation, one placement, on both layouts,
  // instead of being embedded inside content that scrolls or resizes
  // around it.
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
      <Text style={styles.title}>{confirmationSent ? 'Almost there' : isSignIn ? 'Welcome Back' : 'Create Account'}</Text>
      {!confirmationSent && (
        <Text style={styles.subtitle}>
          {reason ||
            (isSignIn
              ? 'Log in to your account and continue your journey with us.'
              : 'Be the first to explore our latest collections, exclusive offers and more.')}
        </Text>
      )}
    </>
  );

  const switchLink = !confirmationSent && (
    <TouchableOpacity style={styles.switchModeBtn} onPress={() => setMode(isSignIn ? 'signUp' : 'signIn')}>
      <Text style={styles.switchModeText}>
        {isSignIn ? "Don't have an account? " : 'Already have an account? '}
        <Text style={{ color: colors.primary, fontFamily: fonts.bodySemiBold }}>{isSignIn ? 'Create one' : 'Log in'}</Text>
      </Text>
    </TouchableOpacity>
  );

  // Real reasons to log in, not filler — this is what balances the short
  // login form (2 fields) against the page. Only shown on login: the
  // register form already has four fields plus terms copy, and adding
  // this there is what was pushing it into needing a scroll.
  const trustRow = isSignIn && !confirmationSent && (
    <View style={styles.trustRow}>
      <View style={styles.trustDivider} />
      {[
        { icon: 'sync-outline', label: 'Synced across every device' },
        { icon: 'diamond-outline', label: 'Unlocks Premium & your saved profile' },
        { icon: 'lock-closed-outline', label: 'Your details stay private' },
      ].map((item) => (
        <View key={item.label} style={styles.trustItem}>
          <View style={styles.trustIconWrap}>
            <Ionicons name={item.icon as any} size={15} color={colors.primary} />
          </View>
          <Text style={styles.trustLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );

  if (isWide) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.wideScreen}>
          <View style={styles.wideBackWrap}>{backButton}</View>

          {/* Decorative panel — fills the space a single centred column used
              to leave empty, instead of stretching the form itself
              uncomfortably wide. */}
          <View style={styles.widePanel}>
            <LinearGradient
              colors={isDark ? ['#0B2647', '#13345F'] : [colors.primary, colors.primaryDark]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Image source={leafSource} style={styles.widePanelLeafTop} contentFit="contain" pointerEvents="none" />
            <Image source={leafSource} style={styles.widePanelLeafBottom} contentFit="contain" pointerEvents="none" />
            <View style={styles.widePanelContent}>
              <View style={styles.widePanelMark}>
                <Logo variant="mark" height={30} />
              </View>
              <Text style={styles.widePanelBrand}>Fashionable Flair</Text>
              <Text style={styles.widePanelTagline}>Jewellery That Speaks Your Style</Text>
              <View style={styles.wideDiamondWrap}>
                <Ionicons name="diamond" size={110} color="#F3D98A" style={{ opacity: 0.95 }} />
                <Ionicons name="sparkles" size={26} color="#F3D98A" style={styles.sparkleA} />
                <Ionicons name="sparkles" size={16} color="#F3D98A" style={styles.sparkleB} />
              </View>
              <Text style={styles.widePanelQuote}>"Every piece tells a story — keep yours synced, wherever you shop."</Text>
            </View>
          </View>

          <View style={styles.wideFormPanel}>
            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.wideFormScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.wideFormColumn}>
                  {heading}
                  <View style={[styles.formArea, styles.formCard]}>{form}</View>
                  {switchLink}
                  {trustRow}
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        {/* Brand wash runs most of the screen height (not just a header
            strip) so the bottom of the page reads as designed rather than
            trailing off into flat white/black. */}
        <LinearGradient
          colors={
            isDark
              ? ['#10305A', colors.background, colors.background]
              : [colors.primaryLight, colors.background, colors.background]
          }
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.orb, styles.orbGold]} pointerEvents="none" />
        <View style={[styles.orb, styles.orbBlue]} pointerEvents="none" />
        <View style={styles.artWrap} pointerEvents="none">
          <Ionicons name="diamond" size={64} color={colors.gold} style={{ opacity: isDark ? 0.9 : 0.75 }} />
          <Ionicons name="sparkles" size={20} color={colors.gold} style={styles.sparkleA} />
          <Ionicons name="sparkles" size={13} color={colors.gold} style={styles.sparkleB} />
        </View>
        <Image source={leafSource} style={styles.bottomLeaf} contentFit="contain" pointerEvents="none" />

        <SafeAreaView style={{ flex: 1 }}>
          {/* Pinned header bar — back button + brand, left-aligned like an
              ordinary navbar. Never scrolls away, and the body below always
              starts right after it (no forced centering, so a short form
              never floats in a gap and a long one just flows normally). */}
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
                {trustRow}
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
    orb: { position: 'absolute', borderRadius: 999 },
    orbGold: { width: 220, height: 220, top: -70, right: -70, backgroundColor: `${colors.gold}22` },
    orbBlue: { width: 180, height: 180, top: 60, left: -90, backgroundColor: `${colors.primary}1A` },
    artWrap: { position: 'absolute', top: 58, right: 24, alignItems: 'center', justifyContent: 'center' },
    sparkleA: { position: 'absolute', top: -12, left: -16, opacity: 0.9 },
    sparkleB: { position: 'absolute', bottom: -8, right: -14, opacity: 0.8 },
    // Small and pushed into the corner on purpose — it's there so the
    // bottom of the screen doesn't read as flat empty space, not to sit
    // behind any text, so it stays low-opacity and mostly off-screen.
    bottomLeaf: {
      position: 'absolute',
      bottom: -30,
      left: -35,
      width: 150,
      height: 110,
      opacity: 0.45,
      transform: [{ rotate: '10deg' }],
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

    title: { ...typography.h1, fontFamily: fonts.headingBold, color: colors.textPrimary, marginTop: spacing.md },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, maxWidth: 320 },

    // ---------- Wide / web layout: decorative panel + form panel ----------
    wideScreen: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
    wideBackWrap: {
      position: 'absolute',
      top: spacing.lg,
      left: spacing.lg,
      zIndex: 10,
      // Web ignores SafeAreaView's top inset since there's no notch to
      // avoid, so this sits directly under the browser chrome instead.
    },
    widePanel: { flex: 5, minWidth: 320, maxWidth: 480, overflow: 'hidden' },
    widePanelLeafTop: {
      position: 'absolute',
      top: -20,
      right: -20,
      width: 200,
      height: 150,
      opacity: 0.5,
      transform: [{ rotate: '180deg' }],
    },
    widePanelLeafBottom: { position: 'absolute', bottom: -20, left: -20, width: 220, height: 160, opacity: 0.55 },
    widePanelContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    widePanelMark: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1.5,
      borderColor: '#F3D98A',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    widePanelBrand: {
      ...typography.h2,
      fontFamily: fonts.headingBold,
      color: '#FFFFFF',
      marginTop: spacing.md,
      textAlign: 'center',
    },
    widePanelTagline: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.75)',
      textTransform: 'uppercase',
      letterSpacing: 1.4,
      marginTop: 4,
    },
    wideDiamondWrap: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl + 8, marginBottom: spacing.xl },
    widePanelQuote: {
      ...typography.body,
      fontFamily: fonts.headingMedium,
      color: 'rgba(255,255,255,0.92)',
      textAlign: 'center',
      maxWidth: 300,
      lineHeight: 24,
    },
    wideFormPanel: { flex: 6 },
    wideFormScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
    wideFormColumn: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: spacing.lg },

    formArea: { marginTop: spacing.lg },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 6px 24px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 3 }),
    },

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

    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${colors.danger}1A`,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
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
    termsText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },

    switchModeBtn: { alignItems: 'center', marginTop: spacing.lg, paddingVertical: spacing.sm },
    switchModeText: { ...typography.bodySmall, color: colors.textSecondary },

    trustRow: { marginTop: spacing.lg, gap: spacing.sm + 2 },
    trustDivider: { height: 1, backgroundColor: colors.divider, marginBottom: spacing.xs },
    trustItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    trustIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trustLabel: { ...typography.caption, color: colors.textSecondary, flex: 1 },

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
