import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import {
  AdminCustomer,
  fetchCustomers,
  blockCustomer,
  unblockCustomer,
  deleteCustomer,
} from '@/services/customerService';
import { confirmAsync, alertInfo } from '@/utils/confirm';
import { useToast } from '@/context/ToastContext';
import { getAvatarByIndex } from '@/data/avatars';
import { getPremiumAvatarByIndex } from '@/data/premiumAvatars';
import { isPremiumAvatarIndex, decodePremiumAvatarIndex } from '@/data/profileAvatar';
import AdminShell, { useAdminSearch } from './AdminShell';

type FilterKey = 'all' | 'premium' | 'normal' | 'blocked';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'premium', label: 'Premium' },
  { key: 'normal', label: 'Normal' },
  { key: 'blocked', label: 'Blocked' },
];

function avatarSource(avatarIndex: number | null) {
  if (avatarIndex == null) return null;
  if (isPremiumAvatarIndex(avatarIndex)) return getPremiumAvatarByIndex(decodePremiumAvatarIndex(avatarIndex));
  return getAvatarByIndex(avatarIndex);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminCustomersScreen() {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const styles = makeStyles(colors);
  const { showToast } = useToast();
  const { query } = useAdminSearch();

  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchCustomers()
      .then(setCustomers)
      .catch((e) => setError(e?.message || 'Could not load customers.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const stats = useMemo(() => {
    const total = customers.length;
    const premium = customers.filter((c) => c.isPremium).length;
    const blocked = customers.filter((c) => c.isBlocked).length;
    return { total, premium, blocked, normal: total - premium };
  }, [customers]);

  const filtered = useMemo(() => {
    let list = customers;
    if (filter === 'premium') list = list.filter((c) => c.isPremium);
    else if (filter === 'normal') list = list.filter((c) => !c.isPremium);
    else if (filter === 'blocked') list = list.filter((c) => c.isBlocked);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, filter, query]);

  const handleBlockToggle = async (c: AdminCustomer) => {
    const action = c.isBlocked ? 'Unblock' : 'Block';
    const confirmed = await confirmAsync(
      `${action} this customer?`,
      c.isBlocked
        ? `${c.name || c.email || 'This customer'} will be able to sign in again.`
        : `${c.name || c.email || 'This customer'} won't be able to sign in until you unblock them. Their data is kept.`,
      action
    );
    if (!confirmed) return;
    setBusyId(c.id);
    try {
      if (c.isBlocked) await unblockCustomer(c.id);
      else await blockCustomer(c.id);
      showToast(c.isBlocked ? 'Customer unblocked' : 'Customer blocked', 'success');
      load();
    } catch (e: any) {
      alertInfo(`Couldn't ${action.toLowerCase()}`, e?.message || 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (c: AdminCustomer) => {
    const confirmed = await confirmAsync(
      'Delete this customer?',
      `${c.name || c.email || 'This account'} and their reviews will be permanently removed. This can't be undone.`,
      'Delete'
    );
    if (!confirmed) return;
    setBusyId(c.id);
    try {
      await deleteCustomer(c.id);
      showToast('Customer deleted', 'success');
      load();
    } catch (e: any) {
      alertInfo("Couldn't delete", e?.message || 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  };

  const header = (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.title}>Customers</Text>
      <Text style={styles.subtitle}>
        {loading ? 'Loading…' : `${stats.total} signed-up customer${stats.total === 1 ? '' : 's'} · ${stats.premium} Premium · ${stats.blocked} blocked`}
      </Text>

      <View style={[styles.statsRow, isWide && styles.statsRowWide]}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.gold }]}>{stats.premium}</Text>
          <Text style={styles.statLabel}>Premium</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.normal}</Text>
          <Text style={styles.statLabel}>Normal</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.danger }]}>{stats.blocked}</Text>
          <Text style={styles.statLabel}>Blocked</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <AdminShell active="AdminCustomers" searchable>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item }) => {
          const avatar = avatarSource(item.avatarIndex);
          const busy = busyId === item.id;
          return (
            <View style={[styles.card, isWide && styles.cardWide]}>
              <View style={styles.cardMain}>
                {avatar ? (
                  <Image source={avatar} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={18} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{item.name || 'No name set'}</Text>
                    {item.isPremium && (
                      <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={10} color={colors.gold} />
                        <Text style={styles.premiumBadgeText}>Premium</Text>
                      </View>
                    )}
                    {item.isBlocked && (
                      <View style={styles.blockedBadge}>
                        <Text style={styles.blockedBadgeText}>Blocked</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.email} numberOfLines={1}>{item.email || 'No email'}</Text>
                  <Text style={styles.metaLine}>
                    Joined {formatDate(item.createdAt)} · Last seen {formatDate(item.lastSignInAt)} · {item.reviewCount} review{item.reviewCount === 1 ? '' : 's'}
                  </Text>
                  {item.isPremium && item.premiumExpiresAt && (
                    <Text style={styles.metaLine}>Premium until {formatDate(item.premiumExpiresAt)}</Text>
                  )}
                </View>
              </View>

              <View style={styles.actionsRow}>
                {busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleBlockToggle(item)}>
                      <Ionicons
                        name={item.isBlocked ? 'lock-open-outline' : 'lock-closed-outline'}
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.actionBtnText}>{item.isBlocked ? 'Unblock' : 'Block'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm }}>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity onPress={load}>
                <Text style={[styles.emptyText, { color: colors.primary }]}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {query.trim() || filter !== 'all' ? 'No customers match.' : 'No one has signed up yet.'}
            </Text>
          )
        }
      />
    </AdminShell>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    list: { padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 1000, width: '100%', alignSelf: 'center' },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
    statsRowWide: { flexWrap: 'nowrap' },
    statCard: {
      flex: 1,
      minWidth: 90,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      alignItems: 'center',
    },
    statValue: { ...typography.h3, color: colors.textPrimary },
    statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

    filterRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
    },
    filterChipActive: { backgroundColor: colors.primary },
    filterChipText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },
    filterChipTextActive: { color: colors.textInverse },

    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardMain: { flexDirection: 'row', gap: spacing.sm, flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },

    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
    name: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    email: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    metaLine: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: `${colors.gold}18`,
      borderRadius: radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    premiumBadgeText: { ...typography.caption, color: colors.gold, fontSize: 10 },
    blockedBadge: {
      backgroundColor: `${colors.danger}18`,
      borderRadius: radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    blockedBadgeText: { ...typography.caption, color: colors.danger, fontSize: 10 },

    actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, alignSelf: 'flex-end' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionBtnText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },

    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  });
}
