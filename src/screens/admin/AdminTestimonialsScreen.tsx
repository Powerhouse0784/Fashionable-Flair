import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { Testimonial } from '@/types/testimonial';
import { fetchTestimonials, adminDeleteTestimonial } from '@/services/testimonialService';
import { getAvatarByIndex } from '@/data/avatars';
import { formatReviewDate } from '@/utils/date';
import { useToast } from '@/context/ToastContext';
import { goBackOrTo } from '@/utils/navigation';
import { confirmAsync, alertInfo } from '@/utils/confirm';
import RatingStars from '@/components/RatingStars';

/**
 * Moderation for shopper-submitted testimonials (the "Share Your
 * Experience" form on the public Testimonials screen — no login needed
 * there, so this is the backstop against anything spammy or inappropriate
 * getting through). The bundled launch reviews don't appear here — they're
 * not stored in Supabase, so there's nothing for this screen to manage;
 * edit those directly in `data/testimonialsSeed.ts` if needed.
 */
export default function AdminTestimonialsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchTestimonials().then((data) => {
      setTestimonials(data);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const handleDelete = async (item: Testimonial) => {
    const confirmed = await confirmAsync('Delete this testimonial?', `From ${item.name}. This can\u2019t be undone.`, 'Delete');
    if (!confirmed) return;
    try {
      await adminDeleteTestimonial(item.id);
      showToast('Testimonial deleted', 'success');
      load();
    } catch (e: any) {
      alertInfo('Couldn\u2019t delete', e?.message || 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOrTo(navigation, 'AdminDashboard')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testimonials</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={testimonials}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        ListHeaderComponent={
          !loading ? (
            <Text style={styles.countLabel}>
              {testimonials.length} shopper-submitted testimonial{testimonials.length === 1 ? '' : 's'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Image source={getAvatarByIndex(item.avatarIndex)} style={styles.avatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.city, item.product].filter(Boolean).join(' · ') || formatReviewDate(item.createdAt)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
            <RatingStars rating={item.rating} size={13} showLabel={false} />
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.date}>{formatReviewDate(item.createdAt)}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              No shopper-submitted testimonials yet — they\u2019ll show up here as people use the "Share Your Experience" form.
            </Text>
          ) : (
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },
    countLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.gold, backgroundColor: colors.surfaceAlt },
    name: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    meta: { ...typography.caption, color: colors.textMuted },
    body: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 19 },
    date: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  });
}
