import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { goBackOrTo } from '@/utils/navigation';
import { submitContactForm } from '@/services/emailService';
import { useToast } from '@/context/ToastContext';
import Container from '@/components/Container';
import WebPageWrapper from '@/components/WebPageWrapper';
import Footer from '@/components/Footer';

const PHONE = '8448822940';
const EMAIL = 'fashionableflair786@gmail.com';
const ADDRESS = 'R-3/A-2, 5 Mohan Garden, Uttam Nagar, New Delhi - 110059';

interface MethodProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ColorTheme;
}

function ContactMethod({ icon, title, subtitle, onPress, colors }: MethodProps) {
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity style={styles.method} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.methodIcon}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const isWide = useIsWideScreen();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleCall = () => Linking.openURL(`tel:${PHONE}`);
  const handleWhatsApp = () => Linking.openURL(`https://wa.me/91${PHONE}`);
  const handleEmail = () => Linking.openURL(`mailto:${EMAIL}?subject=${encodeURIComponent('Fashionable Flair — Question')}`);
  const handleDirections = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSending(true);
    try {
      await submitContactForm(name.trim(), email.trim(), message.trim());
      setSent(true);
      showToast('Message sent — we\u2019ll get back to you soon', 'success');
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  return (
    <WebPageWrapper>
      <SafeAreaView style={styles.safe} edges={isWide ? [] : ['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          {!isWide && (
            <View style={styles.header}>
              <TouchableOpacity onPress={() => goBackOrTo(navigation, 'Tabs')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}

          <Container>
            <View style={[styles.hero, isWide && styles.heroWide]}>
              <View style={styles.heroIcon}>
                <Ionicons name="chatbubbles" size={22} color={colors.textInverse} />
              </View>
              <Text style={[styles.title, isWide && styles.titleWide]}>Contact Us</Text>
              <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
                Got a question or ran into an issue with the app or website? We're here for that.
              </Text>
            </View>

            <View style={styles.scopeBanner}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={styles.scopeBannerText}>
                This form is for questions about the <Text style={{ fontFamily: fonts.bodySemiBold }}>app or website</Text> —
                bugs, feedback, or general questions. For anything about a specific{' '}
                <Text style={{ fontFamily: fonts.bodySemiBold }}>order, payment, or product</Text>, please contact Meesho
                directly — they handle every purchase.
              </Text>
            </View>

            <View style={[styles.contentRow, isWide && styles.contentRowWide]}>
              <View style={[styles.methodsCol, isWide && styles.methodsColWide]}>
                <View style={styles.card}>
                  <ContactMethod icon="call-outline" title="Call Us" subtitle={PHONE} onPress={handleCall} colors={colors} />
                  <ContactMethod icon="logo-whatsapp" title="WhatsApp" subtitle="Chat with us directly" onPress={handleWhatsApp} colors={colors} />
                  <ContactMethod icon="mail-outline" title="Email Us" subtitle={EMAIL} onPress={handleEmail} colors={colors} />
                  <ContactMethod icon="location-outline" title="Our Address" subtitle={ADDRESS} onPress={handleDirections} colors={colors} />
                </View>

                <View style={styles.note}>
                  <Ionicons name="storefront" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteTitle}>Have a question about an order?</Text>
                    <Text style={styles.noteText}>
                      Orders, payments, and deliveries are all handled by Meesho, not us — they'll be able to help faster.
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://www.meesho.com/h6z4l')}>
                      <Text style={styles.noteLink}>Go to our Meesho store →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[styles.formCol, isWide && styles.formColWide]}>
                <View style={styles.card}>
                  {sent ? (
                    <View style={styles.successBox}>
                      <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                      <Text style={styles.successTitle}>Message sent</Text>
                      <Text style={styles.successText}>We've received it and will reply to {email}.</Text>
                      <TouchableOpacity onPress={() => { setSent(false); setName(''); setEmail(''); setMessage(''); }}>
                        <Text style={styles.sendAnotherLink}>Send another message</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ padding: spacing.lg }}>
                      <Text style={styles.formTitle}>Report an issue or ask a question</Text>
                      <View style={styles.field}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textMuted} />
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.textMuted} />
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.label}>Message</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={message}
                          onChangeText={setMessage}
                          multiline
                          numberOfLines={5}
                          placeholder="Describe the bug, feedback, or question about the app/website..."
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                      {error && <Text style={styles.errorText}>{error}</Text>}
                      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={sending} activeOpacity={0.85}>
                        {sending ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.submitButtonText}>Send Message</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Container>
          {isWide && <Footer />}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </WebPageWrapper>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    hero: { marginTop: spacing.sm },
    heroWide: { marginTop: spacing.xxl, alignItems: 'center' },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { ...typography.h1, color: colors.textPrimary },
    titleWide: { fontSize: 36, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    subtitleWide: { textAlign: 'center', maxWidth: 460 },
    scopeBanner: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
      maxWidth: 640,
      alignSelf: 'center',
      width: '100%',
    },
    scopeBannerText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1, lineHeight: 20 },
    contentRow: { marginTop: spacing.xl, gap: spacing.xl },
    contentRowWide: { flexDirection: 'row', alignItems: 'flex-start' },
    methodsCol: { width: '100%' },
    methodsColWide: { flex: 1 },
    formCol: { width: '100%' },
    formColWide: { flex: 1.2 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    method: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    methodIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodTitle: { ...typography.body, color: colors.textPrimary },
    methodSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    note: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    noteTitle: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    noteText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    noteLink: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold, marginTop: spacing.xs },
    formTitle: { ...typography.h3, fontFamily: fonts.heading, color: colors.textPrimary, marginBottom: spacing.md },
    field: { marginTop: spacing.md },
    label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase' },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    errorText: { ...typography.bodySmall, color: colors.danger, marginTop: spacing.md },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    submitButtonText: { ...typography.button, color: colors.textInverse },
    successBox: { alignItems: 'center', padding: spacing.xl },
    successTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
    successText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
    sendAnotherLink: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold, marginTop: spacing.lg },
  });
}
