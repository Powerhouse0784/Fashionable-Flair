import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import InfoPageLayout from '@/components/InfoPageLayout';
import TestimonialCard from '@/components/TestimonialCard';
import TestimonialFormModal from '@/components/TestimonialFormModal';
import { Testimonial, TestimonialInput } from '@/types/testimonial';
import { testimonialsSeed } from '@/data/testimonialsSeed';
import {
  fetchTestimonials,
  createTestimonial,
  updateOwnTestimonial,
  deleteOwnTestimonial,
} from '@/services/testimonialService';
import {
  getOwnerToken,
  getOwnedTestimonialIds,
  rememberOwnedTestimonial,
  forgetOwnedTestimonial,
  canAddMoreTestimonials,
  MAX_TESTIMONIALS_PER_DEVICE,
} from '@/utils/testimonialOwnership';
import { useToast } from '@/context/ToastContext';
import { confirmAsync, alertInfo } from '@/utils/confirm';
import { hapticSuccess } from '@/utils/haptics';

type RatingFilter = 'all' | 5 | 4 | 3;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export default function TestimonialsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const { showToast } = useToast();

  const columns = width >= 1100 ? 3 : width >= 700 ? 2 : 1;

  const [remote, setRemote] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<RatingFilter>('all');

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [remoteData, owned] = await Promise.all([fetchTestimonials(), getOwnedTestimonialIds()]);
    setRemote(remoteData);
    setOwnedIds(owned);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const all = useMemo(
    () =>
      [...testimonialsSeed, ...remote].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [remote]
  );

  const stats = useMemo(() => {
    const total = all.length || 1;
    const sum = all.reduce((acc, t) => acc + t.rating, 0);
    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const count = all.filter((t) => Math.round(t.rating) === star).length;
      return { star, count, pct: Math.round((count / total) * 100) };
    });
    return { average: all.length ? sum / all.length : 0, total: all.length, breakdown };
  }, [all]);

  const filtered = useMemo(() => {
    if (filter === 'all') return all;
    if (filter === 3) return all.filter((t) => Math.round(t.rating) <= 3);
    return all.filter((t) => Math.round(t.rating) === filter);
  }, [all, filter]);

  const rows = useMemo(() => chunk(filtered, columns), [filtered, columns]);

  const handleAddPress = async () => {
    const canAdd = await canAddMoreTestimonials();
    if (!canAdd) {
      alertInfo(
        'You\u2019ve reached the limit',
        `Up to ${MAX_TESTIMONIALS_PER_DEVICE} reviews per device \u2014 edit or delete one of yours below to post a different one.`
      );
      return;
    }
    setEditing(null);
    setFormVisible(true);
  };

  const handleEditPress = (t: Testimonial) => {
    setEditing(t);
    setFormVisible(true);
  };

  const handleDeletePress = async (t: Testimonial) => {
    const confirmed = await confirmAsync('Delete your review?', 'This can\u2019t be undone.', 'Delete');
    if (!confirmed) return;
    try {
      const token = await getOwnerToken();
      await deleteOwnTestimonial(t.id, token);
      await forgetOwnedTestimonial(t.id);
      showToast('Review deleted', 'success');
      load();
    } catch (e: any) {
      alertInfo('Couldn\u2019t delete', e?.message || 'Something went wrong.');
    }
  };

  const handleSubmit = async (input: TestimonialInput) => {
    setSaving(true);
    try {
      const token = await getOwnerToken();
      if (editing) {
        await updateOwnTestimonial(editing.id, token, input);
        showToast('Review updated', 'success');
      } else {
        const created = await createTestimonial(input, token);
        await rememberOwnedTestimonial(created.id);
        showToast('Thanks for sharing your experience!', 'success');
      }
      hapticSuccess();
      setFormVisible(false);
      setEditing(null);
      load();
    } catch (e: any) {
      alertInfo('Couldn\u2019t save your review', e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const FILTERS: { key: RatingFilter; label: string }[] = [
    { key: 'all', label: 'All Reviews' },
    { key: 5, label: '5 Star' },
    { key: 4, label: '4 Star' },
    { key: 3, label: '3 & Below' },
  ];

  return (
    <InfoPageLayout
      title="Customer Testimonials"
      subtitle="Real experiences from real customers — no account needed to share yours"
      icon="chatbubbles-outline"
    >
      {/* Stats dashboard */}
      <View style={styles.statsCard}>
        <View style={styles.statsMain}>
          <Text style={styles.statsNumber}>{stats.average.toFixed(1)}</Text>
          <View>
            <View style={styles.statsStars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons
                  key={n}
                  name={n <= Math.round(stats.average) ? 'star' : 'star-outline'}
                  size={16}
                  color={colors.star}
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text style={styles.statsCaption}>
              Based on {stats.total} verified review{stats.total === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <View style={styles.breakdown}>
          {stats.breakdown.map((row) => (
            <View key={row.star} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{row.star}★</Text>
              <View style={styles.breakdownTrack}>
                <View style={[styles.breakdownFill, { width: `${row.pct}%` }]} />
              </View>
              <Text style={styles.breakdownPct}>{row.pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaButton} activeOpacity={0.88} onPress={handleAddPress}>
        <Ionicons name="create-outline" size={18} color={colors.textInverse} />
        <Text style={styles.ctaButtonText}>Share Your Experience</Text>
      </TouchableOpacity>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid */}
      {loading && remote.length === 0 ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>No reviews in this range yet.</Text>
      ) : (
        <View style={{ gap: spacing.md }}>
          {rows.map((row, i) => (
            <View key={i} style={styles.gridRow}>
              {row.map((t) => (
                <TestimonialCard
                  key={t.id}
                  testimonial={t}
                  isOwn={ownedIds.includes(t.id)}
                  onEdit={() => handleEditPress(t)}
                  onDelete={() => handleDeletePress(t)}
                  style={{ flex: 1 }}
                />
              ))}
              {/* pad the last row so cards don't stretch to fill a partial row */}
              {row.length < columns &&
                Array.from({ length: columns - row.length }).map((_, i2) => <View key={`pad-${i2}`} style={{ flex: 1 }} />)}
            </View>
          ))}
        </View>
      )}

      <TestimonialFormModal
        visible={formVisible}
        initial={editing}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={() => {
          setFormVisible(false);
          setEditing(null);
        }}
      />
    </InfoPageLayout>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    statsCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,

      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 2px 12px ${colors.shadow}` } as any)
        : { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 12, elevation: 2 }),
    },
    statsMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    statsNumber: { fontSize: 44, fontFamily: fonts.heading, color: colors.textPrimary, lineHeight: 48 },
    statsStars: { flexDirection: 'row', marginBottom: 4 },
    statsCaption: { ...typography.caption, color: colors.textMuted },
    breakdown: { gap: spacing.xs },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    breakdownLabel: { ...typography.caption, color: colors.textSecondary, width: 24 },
    breakdownTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
    breakdownFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
    breakdownPct: { ...typography.caption, color: colors.textMuted, width: 34, textAlign: 'right' },

    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      marginBottom: spacing.lg,

      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 4px 12px ${colors.primary}40` } as any)
        : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }),
    },
    ctaButtonText: { ...typography.button, color: colors.textInverse },

    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    filterChipTextActive: { color: colors.textInverse },

    gridRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
    loadingRow: { paddingVertical: spacing.xxl, alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  });
}
