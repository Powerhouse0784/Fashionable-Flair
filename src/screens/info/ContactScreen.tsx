import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const isWeb = Platform.OS === 'web';

const bgWaveLight = require('@/assets/contact/contact-wave-light.jpg');
const bgWaveDark = require('@/assets/contact/contact-wave-dark.jpg');
const heroPhotoLight = require('@/assets/contact/contact-hero-light.jpg');
const heroPhotoDark = require('@/assets/contact/contact-hero-dark.jpg');
const flowerLight = require('@/assets/contact/contact-flower-light.jpg');
const flowerDark = require('@/assets/contact/contact-flower-dark.jpg');

// Shorter than FAQScreen's — this page's content (two side-by-side cards)
// runs less tall, so the atmospheric background art only needs to cover the
// top slice before fading into the flat page color. See FAQScreen for the
// full reasoning on why this is a fixed height rather than measured content.
const BG_HEIGHT = 640;

const PHONE = '8448822940';
const EMAIL = 'fashionableflair786@gmail.com';
const ADDRESS = 'R-3/A-2, 5 Mohan Garden, Uttam Nagar, New Delhi - 110059';

interface MethodProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ColorTheme;
  isDark: boolean;
}

function ContactMethod({ icon, title, subtitle, onPress, colors, isDark }: MethodProps) {
  const styles = makeStyles(colors, isDark);
  return (
    <TouchableOpacity style={styles.method} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.methodIcon}>
        <Ionicons name={icon as any} size={19} color={isDark ? '#1A1300' : colors.textInverse} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

interface FieldProps {
  icon: string;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  colors: ColorTheme;
  isDark: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address';
}

function FormField({ icon, label, value, onChangeText, placeholder, colors, isDark, multiline, keyboardType }: FieldProps) {
  const styles = makeStyles(colors, isDark);
  return (
    <View style={[styles.field, multiline && styles.fieldMultiline]}>
      <View style={[styles.fieldIcon, multiline && styles.fieldIconTop]}>
        <Ionicons name={icon as any} size={17} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

export default function ContactScreen() {
  const { colors, isDark, isCustomAppearance } = useTheme();
  const styles = makeStyles(colors, isDark);
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
            {/* The artwork is painted for the classic blue palette, so it's skipped
              under a Premium appearance (Ivory / Blush / Twilight / Espresso) rather than clash. */}
          {!isCustomAppearance && (
            <View style={styles.bgWrap} pointerEvents="none">
              <Image source={isDark ? bgWaveDark : bgWaveLight} style={styles.bgImage} resizeMode="cover" />
              <LinearGradient colors={['transparent', colors.background]} locations={[0.65, 1]} style={styles.bgFade} />
            </View>
          )}

            {!isWide && (
              <View style={styles.header}>
                <TouchableOpacity onPress={() => goBackOrTo(navigation, 'Tabs')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            )}

            <Container>
              {/* ---------- Hero ---------- */}
              <View style={[styles.hero, isWide && styles.heroWide]}>
                <View style={[styles.heroText, isWide && styles.heroTextWide]}>
                  <View style={styles.eyebrowBadge}>
                    <Text style={styles.eyebrowText}>GET IN TOUCH</Text>
                  </View>
                  <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>Contact Us</Text>
                  <Text style={styles.heroLead}>We'd love to hear from you!</Text>
                  <View style={styles.heroRule} />
                  <Text style={styles.heroSubtitle}>
                    Have a question, feedback, or need assistance? Our team is here to help. Feel free to reach out to
                    us — we'll get back to you as soon as possible.
                  </Text>
                </View>

                <View style={[styles.heroArtShadowWrap, isWide && styles.heroArtShadowWrapWide]}>
                  <View style={styles.heroArtWrap}>
                    <Image
                      source={isDark ? heroPhotoDark : heroPhotoLight}
                      style={styles.heroArt}
                      resizeMode="cover"
                      accessibilityLabel="A necklace displayed in an open jewellery box surrounded by flowers"
                    />
                  </View>
                </View>
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

              {/* ---------- Cards ---------- */}
              <View style={[styles.contentRow, isWide && styles.contentRowWide]}>
                <View style={[styles.methodsCol, isWide && styles.methodsColWide]}>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Get in Touch</Text>
                    <Text style={styles.cardSubtitle}>You can reach us through any of the following methods. We're here to help!</Text>

                    <View style={styles.methodList}>
                      <ContactMethod icon="call-outline" title="Call Us" subtitle={`+91 ${PHONE} · Mon – Sat, 10:00 AM – 7:00 PM`} onPress={handleCall} colors={colors} isDark={isDark} />
                      <ContactMethod icon="logo-whatsapp" title="WhatsApp" subtitle="Chat with us directly · Quick replies, anytime" onPress={handleWhatsApp} colors={colors} isDark={isDark} />
                      <ContactMethod icon="mail-outline" title="Email Us" subtitle={`${EMAIL} · We reply within 24 hours`} onPress={handleEmail} colors={colors} isDark={isDark} />
                      <ContactMethod icon="location-outline" title="Our Address" subtitle={`${ADDRESS} · Visit us (by appointment)`} onPress={handleDirections} colors={colors} isDark={isDark} />
                    </View>

                    <TouchableOpacity style={styles.helpBanner} onPress={handleWhatsApp} activeOpacity={0.8}>
                      <View style={styles.helpBannerIcon}>
                        <Ionicons name="headset-outline" size={17} color={isDark ? '#1A1300' : colors.textInverse} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.helpBannerTitle}>Need immediate help?</Text>
                        <Text style={styles.helpBannerSubtitle}>Our support team is here for you.</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={isDark ? colors.gold : colors.primary} />
                    </TouchableOpacity>
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
                      <View>
                        <Text style={styles.cardTitle}>Report an issue or ask a question</Text>
                        <Text style={styles.cardSubtitle}>Fill out the form below and we'll get back to you soon.</Text>

                        <View style={styles.formFields}>
                          <FormField
                            icon="person-outline"
                            label="Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Your name"
                            colors={colors}
                            isDark={isDark}
                          />
                          <FormField
                            icon="mail-outline"
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            colors={colors}
                            isDark={isDark}
                            keyboardType="email-address"
                          />
                          <FormField
                            icon="chatbubble-ellipses-outline"
                            label="Message"
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Describe your query or issue..."
                            colors={colors}
                            isDark={isDark}
                            multiline
                          />
                        </View>

                        {error && <Text style={styles.errorText}>{error}</Text>}
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={sending} activeOpacity={0.85}>
                          {sending ? (
                            <ActivityIndicator color={isDark ? '#1A1300' : colors.textInverse} />
                          ) : (
                            <>
                              <Ionicons name="paper-plane-outline" size={16} color={isDark ? '#1A1300' : colors.textInverse} />
                              <Text style={styles.submitButtonText}>Send Message</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* ---------- Footer band ---------- */}
              <View style={styles.flowerBand}>
                <Image source={isDark ? flowerDark : flowerLight} style={styles.flowerImage} resizeMode="cover" />
                <Image
                  source={isDark ? flowerDark : flowerLight}
                  style={[styles.flowerImage, styles.flowerImageMirrored]}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.trustRow}>
                <View style={styles.trustLine} />
                <Text style={styles.trustText}>Your Trust Inspires Us</Text>
                <Ionicons name="heart" size={13} color={colors.gold} style={{ marginLeft: 6 }} />
                <View style={styles.trustLine} />
              </View>
            </Container>
            {isWide && <Footer />}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </WebPageWrapper>
  );
}

function makeStyles(colors: ColorTheme, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },

    // ---------- Decorative background ----------
    bgWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: BG_HEIGHT },
    bgImage: { width: '100%', height: '100%' },
    bgFade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 },

    // ---------- Hero ----------
    hero: {
      marginTop: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: isDark ? colors.surface : colors.surfaceAlt,
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'transparent',
      padding: spacing.xl,
      overflow: 'hidden',
      ...(isWeb
        ? ({ boxShadow: `0 8px 24px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 2 }),
    },
    heroWide: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xl,
      padding: spacing.xxl,
    },
    heroText: {},
    heroTextWide: { flex: 1, paddingRight: spacing.xxl, maxWidth: 600 },
    eyebrowBadge: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? 'rgba(147, 197, 253, 0.16)' : '#E3F0FD',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      marginBottom: spacing.md,
    },
    eyebrowText: {
      fontSize: 11,
      fontFamily: fonts.bodyBold,
      letterSpacing: 1,
      color: isDark ? '#8FC1FA' : '#1B4F91',
    },
    heroTitle: {
      fontSize: 34,
      lineHeight: 40,
      fontFamily: fonts.headingBold,
      color: colors.textPrimary,
    },
    heroTitleWide: { fontSize: 46, lineHeight: 52 },
    heroLead: { ...typography.body, fontFamily: fonts.bodySemiBold, color: colors.textPrimary, marginTop: spacing.xs },
    heroRule: {
      width: 56,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.gold,
      marginVertical: spacing.md,
    },
    heroSubtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
    heroArtShadowWrap: {
      // Matches the source photos' own 620x276 proportions exactly, so
      // "cover" shows the whole image with nothing cropped off the sides.
      width: 280,
      aspectRatio: 620 / 276,
      alignSelf: 'center',
      marginTop: spacing.xl,
      borderRadius: radius.lg,
      ...(isWeb
        ? ({ boxShadow: `0 10px 26px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 3 }),
    },
    heroArtShadowWrapWide: { width: 400, marginTop: 0 },
    heroArtWrap: {
      flex: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'transparent',
    },
    heroArt: { width: '100%', height: '100%' },

    // ---------- Scope banner ----------
    scopeBanner: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    scopeBannerText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1, lineHeight: 20 },

    // ---------- Cards ----------
    contentRow: { marginTop: spacing.xl, gap: spacing.xl },
    contentRowWide: { flexDirection: 'row', alignItems: 'flex-start' },
    methodsCol: { width: '100%', gap: spacing.md },
    methodsColWide: { flex: 1, gap: spacing.md },
    formCol: { width: '100%' },
    formColWide: { flex: 1.15 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...(isWeb
        ? ({ boxShadow: `0 4px 16px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 1 }),
    },
    cardTitle: { ...typography.h3, fontFamily: fonts.heading, color: colors.textPrimary },
    cardSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },

    methodList: { marginTop: spacing.lg, gap: spacing.md },
    method: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    methodIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.gold : colors.primary,
    },
    methodTitle: { ...typography.body, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    methodSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2, lineHeight: 16 },

    helpBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: isDark ? colors.background : colors.surfaceAlt,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    helpBannerIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.gold : colors.primary,
    },
    helpBannerTitle: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    helpBannerSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 1 },

    note: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    noteTitle: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    noteText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    noteLink: { ...typography.bodySmall, color: colors.gold, fontFamily: fonts.bodySemiBold, marginTop: spacing.xs },

    // ---------- Form ----------
    formFields: { marginTop: spacing.lg, gap: spacing.md },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      backgroundColor: colors.background,
    },
    fieldMultiline: { alignItems: 'flex-start' },
    fieldIcon: { width: 20, alignItems: 'center' },
    fieldIconTop: { marginTop: 3 },
    fieldLabel: { ...typography.caption, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    fieldInput: { ...typography.body, color: colors.textPrimary, padding: 0, marginTop: 1 },
    fieldInputMultiline: { minHeight: 60, textAlignVertical: 'top' },
    errorText: { ...typography.bodySmall, color: colors.danger, marginTop: spacing.md },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: isDark ? colors.gold : colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      marginTop: spacing.lg,
    },
    submitButtonText: { ...typography.button, color: isDark ? '#1A1300' : colors.textInverse },
    successBox: { alignItems: 'center', padding: spacing.xl },
    successTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
    successText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
    sendAnotherLink: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold, marginTop: spacing.lg },

    // ---------- Footer band ----------
    flowerBand: { flexDirection: 'row', height: 110, marginTop: spacing.xxl, borderRadius: radius.md, overflow: 'hidden' },
    flowerImage: { flex: 1, height: '100%' },
    flowerImageMirrored: { transform: [{ scaleX: -1 }] },
    trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
    trustLine: { width: 56, height: 1, backgroundColor: colors.border },
    trustText: { ...typography.caption, fontFamily: fonts.script, fontSize: 16, color: colors.textSecondary },
  });
}
