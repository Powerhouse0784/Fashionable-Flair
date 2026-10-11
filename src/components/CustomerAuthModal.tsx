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
import { Image as CornerImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
// Light-theme corner art is a transparent PNG (true alpha, not a flat
// background colour) so it blends into colors.background with zero seam,
// since no sampled/baked-in background shade can ever exactly match the
// theme token pixel-for-pixel. Dark-theme corner art stays JPG — on the
// dark background its own canvas colour already reads as seamless.
const topCornerLight = require('@/assets/auth/top_corner_light.png');
const topCornerDark = require('@/assets/auth/top_corner_dark.jpg');
const bottomCornerLight = require('@/assets/auth/bottom_corner_light.png');
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
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const topCorner = isDark ? topCornerDark : topCornerLight;
  const bottomCorner = isDark ? bottomCornerDark : bottomCornerLight;
  const heroImage = isDark ? heroDark : heroLight;
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { name: profileName, updateProfile } = useProfile();

  const [mode, setMode] = useState<Mode>('signIn');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
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
    setAgreeToTerms(false);
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
    if (mode === 'signUp' && !agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
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

  const handleSocialPress = async (key: string, label: string) => {
    if (key !== 'google') {
      alertInfo(`${label} sign-in`, `${label} sign-in isn\u2019t set up yet \u2014 please use your email for now.`);
      return;
    }
    if (submitting || googleSubmitting) return;
    setError(null);
    setGoogleSubmitting(true);
    try {
      const { error: authError, session } = await signInWithGoogle();
      if (authError) {
        setError(authError);
        return;
      }
      // On web, signInWithGoogle navigates the page away to Google and
      // resolves with no session of its own \u2014 the redirect back lands on
      // a fresh load of this same screen, where AuthContext's own
      // onAuthStateChange (already listening) picks the session up and
      // whatever gated this modal open reacts to it normally. On native,
      // a null session with no error just means the user backed out of
      // the Google screen \u2014 nothing to do either way.
      if (session) onAuthenticated(session);
    } finally {
      setGoogleSubmitting(false);
    }
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
    // Pulled out of the JSX below (rather than written inline four times)
    // so the wide/desktop layout can pair them up two-to-a-row — see
    // fieldRow/fieldRowItem below — without duplicating every prop.
    const fullNameField = !isSignIn ? (
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
    ) : null;

    const emailField = (
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
    );

    const passwordField = (
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
    );

    const confirmField = !isSignIn ? (
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
    ) : null;

    form = (
      <>
        {/* Sign-up on a tablet/desktop-width screen pairs Full Name+Email
            and Password+Confirm Password two-to-a-row (matches the
            approved reference) — everywhere else (sign-in always, or any
            narrow screen) stays single-column, since a half-width field
            next to nothing looks like a layout bug rather than a choice. */}
        {isWide && !isSignIn ? (
          <>
            <View style={styles.fieldRow}>
              <View style={styles.fieldRowItem}>{fullNameField}</View>
              <View style={styles.fieldRowItem}>{emailField}</View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldRowItem}>{passwordField}</View>
              <View style={styles.fieldRowItem}>{confirmField}</View>
            </View>
          </>
        ) : (
          <>
            {fullNameField}
            {emailField}
            {passwordField}
            {confirmField}
          </>
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

        {!isSignIn && (
          <View style={styles.termsRow}>
            <TouchableOpacity
              onPress={() => setAgreeToTerms((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.checkbox, styles.termsCheckbox, agreeToTerms && styles.checkboxChecked]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreeToTerms }}
              accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
            >
              {agreeToTerms && <Ionicons name="checkmark" size={12} color={colors.textInverse} />}
            </TouchableOpacity>
            <Text style={styles.termsRowText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        )}

        {errorBox}
        {submitButton(isSignIn ? 'Log In' : 'Create Account')}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.socialRow}>
          {SOCIAL_BUTTONS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.socialButton, googleSubmitting && { opacity: 0.7 }]}
              activeOpacity={0.8}
              disabled={googleSubmitting}
              onPress={() => handleSocialPress(s.key, s.label)}
              accessibilityLabel={`Continue with ${s.label}`}
            >
              {googleSubmitting ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Ionicons name={s.icon as any} size={19} color={s.color ?? colors.textPrimary} />
              )}
              <Text style={styles.socialButtonText}>
                {googleSubmitting ? 'Connecting…' : `Continue with ${s.label}`}
              </Text>
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
          {/* Full-bleed ambient background art — pinned to the real screen
              corners (not the centred content). IMPORTANT: on this RN-Web
              build, LinearGradient only fades correctly when the stop list
              starts with 'transparent' and ends with a location of exactly
              1 — a gradient written the other way round (solid colour
              first) renders INVERTED, which is what was masking the art
              right at the true corner (the "gap") while leaving the inner,
              page-facing edge solid. Every gradient below follows that
              transparent-first/location-1-last rule, with `start` placed
              at the true screen corner (fully visible) and `end` pointing
              into the page (faded to the exact background colour). */}
          <View style={styles.wideTopCornerImg} pointerEvents="none">
            <CornerImage
              source={topCorner}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={{ top: 0, right: 0 }}
            />
            {/* visible at the right edge (true corner), fades toward the left (into the page) */}
            <LinearGradient
              colors={['transparent', 'transparent', colors.background]}
              locations={[0, 0.7, 1]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* visible at the top edge (true corner), fades toward the bottom (an artificial cut) */}
            <LinearGradient
              colors={['transparent', 'transparent', colors.background]}
              locations={[0, 0.78, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={styles.wideBottomCornerImg} pointerEvents="none">
            <CornerImage
              source={bottomCorner}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={{ bottom: 0, left: 0 }}
            />
            {/* visible at the left edge (true corner), fades toward the right (into the page) */}
            <LinearGradient
              colors={['transparent', 'transparent', colors.background]}
              locations={[0, 0.65, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* visible at the bottom edge (true corner), fades toward the top (an artificial cut) */}
            <LinearGradient
              colors={['transparent', 'transparent', colors.background]}
              locations={[0, 0.7, 1]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

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
        {/* Same gradient-faded treatment as the wide layout (see the big
            comment there): fades the two edges facing into the page/text
            to the exact background colour so the art blends in and never
            sits behind text reducing its contrast, instead of a hard,
            fully-opaque rectangle. */}
        <View style={styles.topCornerImg} pointerEvents="none">
          <CornerImage
            source={topCorner}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={{ top: 0, right: 0 }}
          />
          {/* visible at the right edge (true corner), fades toward the left (into the page/header text) */}
          <LinearGradient
            colors={['transparent', 'transparent', colors.background]}
            locations={[0, 0.65, 1]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {/* visible at the top edge (true corner), fades toward the bottom (an artificial cut) */}
          <LinearGradient
            colors={['transparent', 'transparent', colors.background]}
            locations={[0, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.bottomCornerImg} pointerEvents="none">
          <CornerImage
            source={bottomCorner}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={{ bottom: 0, left: 0 }}
          />
          {/* visible at the left edge (true corner), fades toward the right (into the page) */}
          <LinearGradient
            colors={['transparent', 'transparent', colors.background]}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {/* visible at the bottom edge (true corner), fades toward the top (an artificial cut) */}
          <LinearGradient
            colors={['transparent', 'transparent', colors.background]}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

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
      width: 90,
      height: 140,
      borderBottomLeftRadius: radius.lg,
      overflow: 'hidden',
    },
    bottomCornerImg: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: 160,
      height: 90,
      borderTopRightRadius: radius.lg,
      overflow: 'hidden',
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
    // Pinned to the full screen (not the centred content card), and sized
    // to actually read as background art on a big monitor — a tall column
    // down the right edge and a wide band along the bottom-left — rather
    // than a small isolated thumbnail. These are containers (image + a
    // gradient-fade overlay, see JSX) rather than plain <Image> styles now;
    // opacity dims the whole thing so it stays ambient, never competing
    // with the card's own text or imagery.
    // No container opacity any more — that was dimming even the "fully
    // visible" zone right at the true corner down to 40-45% strength,
    // which read as "barely there" in dark mode and as an outright gap in
    // light mode (pale art at 40% over an already-pale page ≈ invisible).
    // The gradient overlays are now the only thing fading anything, so the
    // art is at full, true strength right at the corner.
    wideTopCornerImg: { position: 'absolute', top: 0, right: 0, width: 260, height: 696, overflow: 'hidden' },
    wideBottomCornerImg: { position: 'absolute', bottom: 0, left: 0, width: 340, height: 186, overflow: 'hidden' },
    wideScrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
    // No real cap any more (was 1280, before that 1040) — on a laptop or
    // desktop this should fill the actual browser width, not sit in a
    // fixed-size card with huge dead margins either side. 1900 is just a
    // sanity ceiling so an ultra-wide/4K monitor doesn't stretch the form
    // absurdly far; every normal laptop/desktop width is under it.
    wideWrap: { width: '100%', maxWidth: 1900, alignSelf: 'center', paddingHorizontal: spacing.xxl },
    wideHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
    wideColumns: { flexDirection: 'row', gap: spacing.xxl, alignItems: 'flex-start' },
    // No maxWidth any more — these grow with wideWrap via their flex
    // share, so the form and hero image actually use the screen instead
    // of stopping at a fixed pixel width and leaving space unused.
    wideLeftCol: { flex: 5 },
    wideRightCol: { flex: 6, alignItems: 'center' },
    heroImageWrap: {
      width: '100%',
      aspectRatio: 936 / 398,
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

    // Wide/desktop sign-up only: Full Name+Email and Password+Confirm each
    // share a row instead of stacking, matching the reference's two-column
    // desktop form.
    fieldRow: { flexDirection: 'row', gap: spacing.md },
    fieldRowItem: { flex: 1 },

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

    // Sign-up's "I agree to..." checkbox — same checkbox visual as
    // "Remember me" above, just left-aligned against wrapping text instead
    // of a single-line label, so it needs its own top-aligned row style.
    termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.sm },
    termsCheckbox: { marginTop: 2 },
    termsRowText: { flex: 1, ...typography.caption, color: colors.textSecondary, lineHeight: 17 },
    termsLink: { color: colors.primary, fontFamily: fonts.bodySemiBold },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { ...typography.caption, color: colors.textMuted },
    socialRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      width: '100%',
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 8px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 }),
    },
    socialButtonText: { ...typography.button, color: colors.textPrimary },

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
