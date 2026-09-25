import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { AVATARS, randomAvatarIndex } from '@/data/avatars';

interface Props {
  visible: boolean;
  value: number | null;
  onSelect: (index: number) => void;
  onClose: () => void;
}

/** Grid of the 50 preset portraits a testimonial author can appear as.
 * Picking one is entirely optional — leaving it blank gets a random one
 * assigned on submit (see randomAvatarIndex), same visual treatment
 * either way. */
export default function AvatarPickerModal({ visible, value, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Choose Your Avatar</Text>
            <TouchableOpacity
              onPress={() => {
                onSelect(randomAvatarIndex());
                onClose();
              }}
            >
              <Text style={styles.randomText}>Surprise Me</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Optional — we'll pick one for you if you skip this.</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            <View style={styles.grid}>
              {AVATARS.map((source, i) => {
                const index = i + 1;
                const selected = value === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.avatarSlot}
                    activeOpacity={0.8}
                    onPress={() => onSelect(index)}
                  >
                    <Image
                      source={source}
                      style={[styles.avatarImage, selected && styles.avatarImageSelected]}
                      contentFit="cover"
                    />
                    {selected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color={colors.textInverse} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} activeOpacity={0.85} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
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
    randomText: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold },
    subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.sm },
    avatarSlot: { width: 56, height: 56 },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    avatarImageSelected: { borderColor: colors.primary },
    checkBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    doneButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    doneButtonText: { ...typography.button, color: colors.textInverse },
  });
}
