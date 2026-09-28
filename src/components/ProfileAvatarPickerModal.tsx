import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { AVATARS, PREMIUM_AVATARS, encodePremiumAvatarIndex, randomFreeProfileAvatarIndex } from '@/data/profileAvatar';

interface Props {
  visible: boolean;
  /** Free: 1–50. Premium: 1001–1050 (see data/profileAvatar.ts). */
  value: number | null;
  isPremium: boolean;
  onSelect: (index: number) => void;
  /** Called instead of onSelect when a non-Premium shopper taps a locked avatar. */
  onRequestUpgrade: () => void;
  onClose: () => void;
}

/** Profile-screen avatar picker: the same 50 free portraits everyone has
 * always had, plus a second grid of 50 Premium-only portraits — locked
 * and dimmed with a lock badge until the device has an active
 * subscription (see PremiumContext), at which point they behave exactly
 * like the free grid. */
export default function ProfileAvatarPickerModal({ visible, value, isPremium, onSelect, onRequestUpgrade, onClose }: Props) {
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
                onSelect(randomFreeProfileAvatarIndex());
                onClose();
              }}
            >
              <Text style={styles.randomText}>Surprise Me</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            <Text style={styles.sectionLabel}>Free Avatars</Text>
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

            <View style={styles.premiumHeaderRow}>
              <Text style={styles.sectionLabel}>Premium Avatars</Text>
              {!isPremium && (
                <View style={styles.lockPill}>
                  <Ionicons name="lock-closed" size={10} color={colors.gold} />
                  <Text style={styles.lockPillText}>Premium</Text>
                </View>
              )}
            </View>

            {!isPremium && (
              <TouchableOpacity style={styles.unlockBanner} activeOpacity={0.85} onPress={onRequestUpgrade}>
                <Ionicons name="sparkles" size={16} color={colors.gold} />
                <Text style={styles.unlockBannerText}>Unlock 50 exclusive avatars with Premium</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            <View style={styles.grid}>
              {PREMIUM_AVATARS.map((source, i) => {
                const encodedIndex = encodePremiumAvatarIndex(i + 1);
                const selected = isPremium && value === encodedIndex;
                return (
                  <TouchableOpacity
                    key={encodedIndex}
                    style={styles.avatarSlot}
                    activeOpacity={0.8}
                    onPress={() => (isPremium ? onSelect(encodedIndex) : onRequestUpgrade())}
                  >
                    <Image
                      source={source}
                      style={[
                        styles.avatarImage,
                        selected && styles.avatarImageSelected,
                        !isPremium && styles.avatarImageLocked,
                      ]}
                      contentFit="cover"
                    />
                    {!isPremium ? (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                      </View>
                    ) : (
                      selected && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={12} color={colors.textInverse} />
                        </View>
                      )
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
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    title: { ...typography.h3, color: colors.textPrimary },
    randomText: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.bodySemiBold },
    sectionLabel: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
    },
    premiumHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
    },
    lockPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.goldLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
    },
    lockPillText: { ...typography.caption, color: colors.gold, fontFamily: fonts.bodySemiBold },
    unlockBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.goldLight,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    unlockBannerText: { ...typography.caption, color: colors.textPrimary, fontFamily: fonts.bodySemiBold, flex: 1 },
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
    avatarImageLocked: { opacity: 0.55 },
    lockOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
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
