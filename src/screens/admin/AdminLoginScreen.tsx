import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import Container from '@/components/Container';

export default function AdminLoginScreen() {
  const navigation = useNavigation<any>();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your admin email and password.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    showToast('Signed in', 'success');
    navigation.replace('AdminDashboard');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Container style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="lock-closed" size={28} color={colors.textInverse} />
            </View>
            <Text style={styles.title}>Store Admin</Text>
            <Text style={styles.subtitle}>Sign in to manage the product catalog.</Text>

            {!isSupabaseConfigured && (
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={styles.warningText}>
                  Supabase isn't configured yet. Complete SUPABASE_SETUP.md first, then this screen will work.
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="admin@yourstore.com"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>

            <Text style={styles.hint}>
              Admin accounts are created in the Supabase dashboard, not here — see SUPABASE_SETUP.md.{'\n'}
              Forgot your password? Reset it from Supabase → Authentication → Users.
            </Text>
          </View>
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingVertical: spacing.md },
  content: { flex: 1, alignItems: 'center', paddingTop: spacing.xxl, maxWidth: 400, alignSelf: 'center', width: '100%' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  warningBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.goldLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  warningText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
  field: { width: '100%', marginTop: spacing.lg },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  errorText: { ...typography.bodySmall, color: colors.danger, marginTop: spacing.md, textAlign: 'center' },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonText: { ...typography.button, color: colors.textInverse },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center', lineHeight: 18 },
});
