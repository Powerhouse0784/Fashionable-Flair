import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useProducts } from '@/context/ProductsContext';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';
import { Offer, fetchAllOffers, createOffer, updateOffer, deleteOffer } from '@/services/offerService';
import { confirmAsync, alertInfo } from '@/utils/confirm';
import { useToast } from '@/context/ToastContext';
import { useModalBackClose } from '@/hooks/useModalBackClose';
import AdminShell from './AdminShell';

type Status = 'upcoming' | 'active' | 'expired';

function statusOf(offer: Offer): Status {
  const now = Date.now();
  const starts = new Date(offer.startsAt).getTime();
  const ends = new Date(offer.endsAt).getTime();
  if (now < starts) return 'upcoming';
  if (now > ends) return 'expired';
  return 'active';
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeStr(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parses "YYYY-MM-DD" + "HH:MM" (what the two plain text inputs collect)
 * into an ISO string, or null if either is malformed — no native date
 * picker is installed in this project, so simple validated text fields
 * do the job on every platform without adding a new dependency. */
function parseLocal(dateStr: string, timeStr: string): string | null {
  const m = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const t = timeStr.trim().match(/^(\d{2}):(\d{2})$/);
  if (!m || !t) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(t[1]), Number(t[2]), 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatWindow(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

interface FormState {
  offerId: string | null;
  product: Product | null;
  offerPrice: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

function blankForm(): FormState {
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    offerId: null,
    product: null,
    offerPrice: '',
    startDate: toDateStr(now),
    startTime: toTimeStr(now),
    endDate: toDateStr(end),
    endTime: toTimeStr(end),
  };
}

export default function AdminOffersScreen() {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const styles = makeStyles(colors);
  const { products } = useProducts();
  const { showToast } = useToast();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const load = () => {
    setLoading(true);
    fetchAllOffers()
      .then(setOffers)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const sortedOffers = useMemo(() => {
    const rank: Record<Status, number> = { active: 0, upcoming: 1, expired: 2 };
    return [...offers].sort((a, b) => rank[statusOf(a)] - rank[statusOf(b)]);
  }, [offers]);

  const openCreate = () => {
    setForm(blankForm());
    setFormOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setForm({
      offerId: offer.id,
      product: productById.get(offer.productId) || null,
      offerPrice: String(offer.offerPrice),
      startDate: toDateStr(new Date(offer.startsAt)),
      startTime: toTimeStr(new Date(offer.startsAt)),
      endDate: toDateStr(new Date(offer.endsAt)),
      endTime: toTimeStr(new Date(offer.endsAt)),
    });
    setFormOpen(true);
  };

  const applyDuration = (days: number) => {
    const start = parseLocal(form.startDate, form.startTime);
    const base = start ? new Date(start) : new Date();
    const end = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setForm((f) => ({ ...f, endDate: toDateStr(end), endTime: toTimeStr(end) }));
  };

  const handleSave = async () => {
    if (!form.product) return alertInfo('Pick a product', 'Choose which product this offer applies to.');
    const price = Number(form.offerPrice);
    if (!price || price <= 0) return alertInfo('Invalid offer price', 'Enter a price greater than 0.');
    if (price >= form.product.price) {
      const ok = await confirmAsync(
        'Offer price isn’t lower',
        `${formatPrice(price)} isn’t less than the product’s normal price of ${formatPrice(form.product.price)}. Save anyway?`,
        'Save Anyway'
      );
      if (!ok) return;
    }
    const startsAt = parseLocal(form.startDate, form.startTime);
    const endsAt = parseLocal(form.endDate, form.endTime);
    if (!startsAt || !endsAt) return alertInfo('Invalid dates', 'Use the format YYYY-MM-DD for date and HH:MM for time.');
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      return alertInfo('Invalid window', 'The end time must be after the start time.');
    }

    setSaving(true);
    try {
      if (form.offerId) {
        await updateOffer(form.offerId, { productId: form.product.id, offerPrice: price, startsAt, endsAt });
        showToast('Offer updated', 'success');
      } else {
        await createOffer({ productId: form.product.id, offerPrice: price, startsAt, endsAt });
        showToast('Offer created', 'success');
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      alertInfo('Couldn’t save', e?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (offer: Offer) => {
    const product = productById.get(offer.productId);
    const confirmed = await confirmAsync('Delete this offer?', product ? `On ${product.title}.` : undefined, 'Delete');
    if (!confirmed) return;
    try {
      await deleteOffer(offer.id);
      showToast('Offer deleted', 'success');
      load();
    } catch (e: any) {
      alertInfo('Couldn’t delete', e?.message || 'Something went wrong.');
    }
  };

  const filteredPickerProducts = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, pickerQuery]);

  const statusBadgeStyle = (s: Status) =>
    s === 'active' ? styles.badgeActive : s === 'upcoming' ? styles.badgeUpcoming : styles.badgeExpired;
  const statusLabel = (s: Status) => (s === 'active' ? 'Active' : s === 'upcoming' ? 'Upcoming' : 'Expired');

  return (
    <AdminShell active="AdminOffers">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Offers & Discounts</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading…' : `${offers.length} offer${offers.length === 1 ? '' : 's'} total`}
            </Text>
          </View>
          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.88} onPress={openCreate}>
            <Ionicons name="add" size={18} color={colors.textInverse} />
            <Text style={styles.ctaButtonText}>New Offer</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : sortedOffers.length === 0 ? (
          <Text style={styles.emptyText}>
            No offers yet. Tap "New Offer" to put a product on sale for a limited time — it'll show on the Home
            page and in Profile → Offers & Deals while it's live.
          </Text>
        ) : (
          <View style={[styles.offersGrid, isWide && styles.offersGridWide]}>
            {sortedOffers.map((offer) => {
              const product = productById.get(offer.productId);
              const status = statusOf(offer);
              return (
                <View key={offer.id} style={[styles.offerCard, isWide && styles.offerCardWide]}>
                  <View style={styles.offerCardTop}>
                    <Image
                      source={{ uri: product?.image || product?.images?.[0] }}
                      style={styles.offerThumb}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.offerProductTitle} numberOfLines={1}>
                        {product?.title || 'Deleted product'}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.offerPrice}>{formatPrice(offer.offerPrice)}</Text>
                        {product && (
                          <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
                        )}
                      </View>
                    </View>
                    <View style={[styles.badge, statusBadgeStyle(status)]}>
                      <Text style={styles.badgeText}>{statusLabel(status)}</Text>
                    </View>
                  </View>

                  <Text style={styles.offerWindow}>
                    {formatWindow(offer.startsAt)} → {formatWindow(offer.endsAt)}
                  </Text>

                  <View style={styles.offerActions}>
                    <TouchableOpacity style={styles.offerActionBtn} onPress={() => openEdit(offer)}>
                      <Ionicons name="create-outline" size={15} color={colors.textSecondary} />
                      <Text style={styles.offerActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.offerActionBtn} onPress={() => handleDelete(offer)}>
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      <Text style={[styles.offerActionText, { color: colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit offer form */}
      <OfferFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
        onPickProduct={() => setPickerOpen(true)}
        onApplyDuration={applyDuration}
        colors={colors}
        styles={styles}
      />

      {/* Product picker */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.pickerTitle}>Choose a product</Text>
            <TextInput
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder="Search products…"
              placeholderTextColor={colors.textMuted}
              style={styles.pickerSearch}
            />
            <FlatList
              data={filteredPickerProducts}
              keyExtractor={(p) => p.id}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setForm((f) => ({ ...f, product: item }));
                    setPickerOpen(false);
                    setPickerQuery('');
                  }}
                >
                  <Image source={{ uri: item.image || item.images?.[0] }} style={styles.pickerThumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerRowTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.pickerRowPrice}>{formatPrice(item.price)}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No products match.</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </AdminShell>
  );
}

function OfferFormModal({
  visible,
  onClose,
  form,
  setForm,
  saving,
  onSave,
  onPickProduct,
  onApplyDuration,
  colors,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  saving: boolean;
  onSave: () => void;
  onPickProduct: () => void;
  onApplyDuration: (days: number) => void;
  colors: ColorTheme;
  styles: any;
}) {
  useModalBackClose(visible, onClose);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.formSheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.handle} />
            <Text style={styles.pickerTitle}>{form.offerId ? 'Edit Offer' : 'New Offer'}</Text>

            <Text style={styles.fieldLabel}>Product</Text>
            <TouchableOpacity style={styles.productPickButton} onPress={onPickProduct}>
              {form.product ? (
                <>
                  <Image
                    source={{ uri: form.product.image || form.product.images?.[0] }}
                    style={styles.pickerThumb}
                    contentFit="cover"
                  />
                  <Text style={styles.productPickText} numberOfLines={1}>{form.product.title}</Text>
                </>
              ) : (
                <Text style={styles.productPickPlaceholder}>Tap to choose a product…</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            {form.product && (
              <Text style={styles.fieldHint}>Normal price: {formatPrice(form.product.price)}</Text>
            )}

            <Text style={styles.fieldLabel}>Offer price (₹)</Text>
            <TextInput
              value={form.offerPrice}
              onChangeText={(v) => setForm((f) => ({ ...f, offerPrice: v.replace(/[^0-9.]/g, '') }))}
              keyboardType="numeric"
              placeholder="e.g. 399"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Starts</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                value={form.startDate}
                onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { flex: 1.3 }]}
              />
              <TextInput
                value={form.startTime}
                onChangeText={(v) => setForm((f) => ({ ...f, startTime: v }))}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { flex: 1 }]}
              />
            </View>

            <Text style={styles.fieldLabel}>Ends</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                value={form.endDate}
                onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { flex: 1.3 }]}
              />
              <TextInput
                value={form.endTime}
                onChangeText={(v) => setForm((f) => ({ ...f, endTime: v }))}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { flex: 1 }]}
              />
            </View>

            <View style={styles.durationRow}>
              {[1, 3, 7, 30].map((d) => (
                <TouchableOpacity key={d} style={styles.durationChip} onPress={() => onApplyDuration(d)}>
                  <Text style={styles.durationChipText}>{d} day{d === 1 ? '' : 's'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.saveButtonText}>{form.offerId ? 'Save Changes' : 'Create Offer'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },

    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    ctaButtonText: { ...typography.button, color: colors.textInverse },

    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },

    offersGrid: { marginTop: spacing.lg, gap: spacing.sm },
    offersGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
    offerCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    offerCardWide: { width: '32%' },
    offerCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    offerThumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
    offerProductTitle: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
    offerPrice: { ...typography.body, fontFamily: fonts.bodySemiBold, color: colors.primary },
    originalPrice: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'line-through' },

    badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
    badgeActive: { backgroundColor: `${colors.success}18` },
    badgeUpcoming: { backgroundColor: `${colors.primary}18` },
    badgeExpired: { backgroundColor: `${colors.textMuted}18` },
    badgeText: { ...typography.caption, color: colors.textPrimary, fontSize: 11 },

    offerWindow: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
    offerActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
    offerActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    offerActionText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },

    pickerSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing.lg,
      maxHeight: '80%',
    },
    pickerTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    pickerSearch: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.bodySmall,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    pickerThumb: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
    pickerRowTitle: { ...typography.bodySmall, color: colors.textPrimary },
    pickerRowPrice: { ...typography.caption, color: colors.textMuted },

    formSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing.lg,
      maxHeight: '88%',
    },
    fieldLabel: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold, marginTop: spacing.md, marginBottom: spacing.xs },
    fieldHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    textInput: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.bodySmall,
      color: colors.textPrimary,
    },
    dateTimeRow: { flexDirection: 'row', gap: spacing.sm },
    durationRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
    durationChip: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    durationChipText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bodySemiBold },

    productPickButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    productPickText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
    productPickPlaceholder: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },

    formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.sm },
    cancelButton: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
    cancelButtonText: { ...typography.button, color: colors.textSecondary },
    saveButton: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.primary },
    saveButtonText: { ...typography.button, color: colors.textInverse },
  });
}
