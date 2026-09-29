import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useModalBackClose } from '@/hooks/useModalBackClose';
import { fonts } from '@/hooks/useAppFonts';
import { useAuth } from '@/context/AuthContext';
import type { Session } from '@supabase/supabase-js';

interface Props {
  visible: boolean;
  /** Shown above the form to explain WHY it's asking — e.g. "Log in to
   * subscribe to Premium." Defaults to a generic line if omitted. */
  reason?: string;
  onClose: () => void;
  /** Fires once sign-in/sign-up genuinely succeeds (session established),
   * with that exact session — pass this session on rather than reading it
   * back from useAuth(), which may not have re-rendered with it yet. */
  onAuthenticated: (session: Session) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lightweight email/password login+register sheet. This is the ONLY
 * place in the app that ever asks a shopper to sign in — everything else
 * (browsing, wishlist, testimonials, profile) still works as a guest. */
export default function CustomerAuthModal({ visible, reason, onClose, onAuthenticated }: Props) {
  // So a back-press (Android hardware button, or the browser's back/edge-
  // swipe on web) closes just this sheet instead of skipping straight
  // through to whatever screen opened it — see useModalBackClose.
  useModalBackClose(visible, onClose);
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setConfirmationSent(false);
  }, [visible, mode]);

  const handleSubmit = async () => {
    setError(null);
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
      if (needsConfirmation || !session) {
        // The project has "Confirm email" on, so there is no session yet
        // until they click the link — say so plainly, and crucially don't
        // call onAuthenticated: nothing is actually signed in yet, so the
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>{mode === 'signIn' ? 'Log In' : 'Create Account'}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.reason}>{reason || 'Sign in to keep your Fashionable Flair data across devices.'}</Text>

            {confirmationSent ? (
              <View style={styles.confirmationBox}>
                <Ionicons name="mail-outline" size={24} color={colors.primary} />
                <Text style={styles.confirmationText}>Account created — check your email to confirm, then log in.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                />

                {mode === 'signUp' && (
                  <>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </>
                )}

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.submitButtonText}>{mode === 'signIn' ? 'Log In' : 'Create Account'}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchModeBtn}
                  onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
                >
                  <Text style={styles.switchModeText}>
                    {mode === 'signIn' ? "Don't have an account? " : 'Already have an account? '}
                    <Text style={{ color: colors.primary, fontFamily: fonts.bodySemiBold }}>
                      {mode === 'signIn' ? 'Create one' : 'Log in'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
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
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { ...typography.h3, color: colors.textPrimary },
    reason: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
    label: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs, marginTop: spacing.md },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      ...typography.body,
    },
    errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    submitButtonText: { ...typography.button, color: colors.textInverse },
    switchModeBtn: { alignItems: 'center', marginTop: spacing.md },
    switchModeText: { ...typography.bodySmall, color: colors.textSecondary },
    confirmationBox: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
    confirmationText: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },
  });
}
