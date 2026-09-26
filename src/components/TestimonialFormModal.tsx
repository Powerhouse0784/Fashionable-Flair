import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { categories } from '@/data/categories';
import { getAvatarByIndex } from '@/data/avatars';
import { Testimonial, TestimonialInput } from '@/types/testimonial';
import { alertInfo } from '@/utils/confirm';
import AvatarPickerModal from './AvatarPickerModal';

interface Props {
  visible: boolean;
  /** Present when editing an existing testimonial; absent when adding a new one. */
  initial?: Testimonial | null;
  saving?: boolean;
  onSubmit: (input: TestimonialInput) => void;
  onClose: () => void;
}

const MIN_BODY_LENGTH = 20;
const MAX_BODY_LENGTH = 500;

export default function TestimonialFormModal({ visible, initial, saving, onSubmit, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { height: windowHeight } = useWindowDimensions();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);
  const [product, setProduct] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [avatarIndex, setAvatarIndex] = useState<number | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setCity(initial?.city ?? '');
    setRating(initial?.rating ?? 5);
    setProduct(initial?.product ?? null);
    setBody(initial?.body ?? '');
    setAvatarIndex(initial?.avatarIndex ?? null);
  }, [visible, initial]);

  useEffect(() => {
    // Defensive cleanup only: react-native-web's Modal disables page scroll
    // while open by setting the body's overflow, and is meant to restore it
    // on close. If that restore is ever skipped — e.g. the component
    // unmounts mid-close, or two modals briefly overlap — the whole page is
    // left unable to scroll until it's refreshed. Re-asserting it here every
    // time this modal closes costs nothing when everything already worked,
    // and rescues the page when it didn't.
    if (Platform.OS !== 'web' || visible) return;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [visible]);

  const handleSubmit = () => {
    if (!name.trim()) {
      alertInfo('Add your name', 'Let other shoppers know who this review is from.');
      return;
    }
    if (body.trim().length < MIN_BODY_LENGTH) {
      alertInfo('Tell us a bit more', `A few more words would help — at least ${MIN_BODY_LENGTH} characters.`);
      return;
    }
    onSubmit({
      name: name.trim(),
      city: city.trim() || undefined,
      rating,
      product: product ?? undefined,
      body: body.trim(),
      avatarIndex: avatarIndex ?? Math.floor(Math.random() * 50) + 1,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          // 'undefined' on Android means this modal's own window never
          // adjusts for the keyboard — Android normally resizes the screen
          // for you, but a Modal opens its own window that doesn't inherit
          // that behaviour, so the keyboard was free to cover the lower half
          // of the form (submit button included) with no way to scroll it
          // back into view. 'height' makes this modal shrink like iOS's
          // 'padding' does.
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <Pressable
            style={[styles.sheet, { maxHeight: Math.round(windowHeight * 0.92) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>{initial ? 'Edit Your Review' : 'Share Your Experience'}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              // flexShrink lets this area give up height to the keyboard (or
              // to a short screen) instead of pushing the header and submit
              // button off-screen with no way to reach them — the fixed
              // 480 alone had no give, which is what made the sheet feel
              // "stuck" on shorter phones or once the keyboard opened.
              style={{ maxHeight: 480, flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity style={styles.avatarPicker} activeOpacity={0.85} onPress={() => setAvatarPickerOpen(true)}>
                <Image
                  source={avatarIndex ? getAvatarByIndex(avatarIndex) : undefined}
                  style={styles.avatarPreview}
                  contentFit="cover"
                />
                {!avatarIndex && (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person-outline" size={22} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera-outline" size={12} color={colors.textInverse} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint} onPress={() => setAvatarPickerOpen(true)}>
                {avatarIndex ? 'Change avatar' : 'Choose an avatar (optional)'}
              </Text>

              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={colors.textMuted}
                maxLength={40}
              />

              <Text style={styles.label}>City (optional)</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Jaipur"
                placeholderTextColor={colors.textMuted}
                maxLength={30}
              />

              <Text style={styles.label}>Your Rating</Text>
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color={colors.star} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>What did you buy? (optional)</Text>
              <View style={styles.chipRow}>
                {categories.map((c) => {
                  const active = product === c.label;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setProduct(active ? null : c.label)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Your Review</Text>
                <Text style={styles.charCount}>{body.length}/{MAX_BODY_LENGTH}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={body}
                onChangeText={(t) => setBody(t.slice(0, MAX_BODY_LENGTH))}
                placeholder="How was the quality, packaging, and delivery? What did you love?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
              />
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={handleSubmit} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.submitButtonText}>{initial ? 'Save Changes' : 'Post Review'}</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>

      <AvatarPickerModal
        visible={avatarPickerOpen}
        value={avatarIndex}
        onSelect={setAvatarIndex}
        onClose={() => setAvatarPickerOpen(false)}
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
      // Caps the whole sheet — handle, header, scrollable fields and the
      // submit button together — to just under the full screen, so on a
      // short device the submit button is always inside that cap rather
      // than being pushed past the bottom edge.
      maxHeight: '92%', // fallback if the JS-computed inline value below can't apply for any reason
      alignSelf: 'center',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    title: { ...typography.h3, color: colors.textPrimary },
    avatarPicker: { alignSelf: 'center', marginTop: spacing.xs },
    avatarPreview: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2,
      borderColor: colors.gold,
      backgroundColor: colors.surfaceAlt,
    },
    avatarPlaceholder: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 2,
      borderColor: colors.border,
    },
    avatarEditBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    avatarHint: { ...typography.caption, color: colors.primary, fontFamily: fonts.bodySemiBold, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
    label: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs, marginTop: spacing.md },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
    charCount: { ...typography.caption, color: colors.textMuted },
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
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    starPicker: { flexDirection: 'row', gap: spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    chipTextActive: { color: colors.textInverse },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    submitButtonText: { ...typography.button, color: colors.textInverse },
  });
}
