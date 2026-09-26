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
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { getAvatarByIndex } from '@/data/avatars';
import AvatarPickerModal from './AvatarPickerModal';

interface Props {
  visible: boolean;
  name: string;
  bio: string;
  avatarIndex: number | null;
  onSave: (values: { name: string; bio: string; avatarIndex: number | null }) => void;
  onClose: () => void;
}

const NAME_MAX = 40;
const BIO_MAX = 80;

/** Bottom-sheet editor for the local, on-device profile shown on the
 * Profile tab — name, a short one-line bio, and an avatar picked from the
 * same 50-portrait set testimonials use. Nothing here leaves the device. */
export default function EditProfileModal({ visible, name, bio, avatarIndex, onSave, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { height: windowHeight } = useWindowDimensions();

  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [draftAvatar, setDraftAvatar] = useState<number | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraftName(name);
    setDraftBio(bio);
    setDraftAvatar(avatarIndex);
  }, [visible, name, bio, avatarIndex]);

  useEffect(() => {
    // Same defensive cleanup as TestimonialFormModal: react-native-web's
    // Modal can leave the page's scroll locked if this unmounts mid-close.
    if (Platform.OS !== 'web' || visible) return;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [visible]);

  const handleSave = () => {
    onSave({ name: draftName.trim(), bio: draftBio.trim(), avatarIndex: draftAvatar });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
          <Pressable
            style={[styles.sheet, { maxHeight: Math.round(windowHeight * 0.9) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 420, flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity style={styles.avatarPicker} activeOpacity={0.85} onPress={() => setAvatarPickerOpen(true)}>
                {draftAvatar ? (
                  <Image source={getAvatarByIndex(draftAvatar)} style={styles.avatarPreview} contentFit="cover" />
                ) : (
                  <View style={[styles.avatarPreview, styles.avatarPlaceholder]}>
                    <Ionicons name="person-outline" size={26} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera-outline" size={12} color={colors.textInverse} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint} onPress={() => setAvatarPickerOpen(true)}>
                {draftAvatar ? 'Change avatar' : 'Choose an avatar'}
              </Text>

              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={colors.textMuted}
                maxLength={NAME_MAX}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>A Line About You</Text>
                <Text style={styles.charCount}>{draftBio.length}/{BIO_MAX}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={draftBio}
                onChangeText={(t) => setDraftBio(t.slice(0, BIO_MAX))}
                placeholder="e.g. Jewellery makes every moment more special"
                placeholderTextColor={colors.textMuted}
                maxLength={BIO_MAX}
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>

      <AvatarPickerModal
        visible={avatarPickerOpen}
        value={draftAvatar}
        onSelect={setDraftAvatar}
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
    avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', borderColor: colors.border },
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
    avatarHint: {
      ...typography.caption,
      color: colors.primary,
      fontFamily: fonts.bodySemiBold,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
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
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    saveButtonText: { ...typography.button, color: colors.textInverse },
  });
}
