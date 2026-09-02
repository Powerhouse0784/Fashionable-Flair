import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { RootStackParamList } from '@/types/navigation';
import { CategoryKey, Product } from '@/types/product';
import { categories } from '@/data/categories';
import { useProducts } from '@/context/ProductsContext';
import { useToast } from '@/context/ToastContext';
import { getProductById } from '@/utils/productHelpers';
import { getProductImages } from '@/utils/productImages';
import { createProduct, updateProduct, uploadProductImage, ProductInput } from '@/services/productService';
import { hapticSuccess } from '@/utils/haptics';
import { goBackOrTo } from '@/utils/navigation';
import Container from '@/components/Container';
import ProductPlaceholder from '@/components/ProductPlaceholder';

type FormRoute = RouteProp<RootStackParamList, 'AdminProductForm'>;

const MAX_IMAGES = 6;

interface FormState {
  title: string;
  subtitle: string;
  price: string;
  category: CategoryKey;
  rating: string;
  ratingLabel: string;
  meeshoUrl: string;
  description: string;
  material: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
}

// A pending photo, whether already saved on the server or just picked
// locally and not yet uploaded. Rendering both the same way (as one list)
// keeps the thumbnail strip and reorder/remove logic simple — "upload on
// save" only matters at save time, not in the UI.
interface PendingPhoto {
  key: string;
  uri: string; // remote URL, or a local file:/blob: URI for a fresh pick
  isNew: boolean;
  mimeType?: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  subtitle: '',
  price: '',
  category: 'earrings',
  rating: '',
  ratingLabel: '',
  meeshoUrl: '',
  description: '',
  material: '',
  isNewArrival: false,
  isBestSeller: false,
  isFeatured: false,
  isAvailable: true,
};

export default function AdminProductFormScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<FormRoute>();
  const productId = route.params?.productId;
  const isEditing = !!productId;

  const { products, applyLocalUpsert } = useProducts();
  const { showToast } = useToast();
  const existing = isEditing ? getProductById(products, productId!) : undefined;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        subtitle: existing.subtitle ?? '',
        price: String(existing.price),
        category: existing.category,
        rating: existing.rating ? String(existing.rating) : '',
        ratingLabel: existing.ratingLabel ?? '',
        meeshoUrl: existing.meeshoUrl,
        description: existing.description ?? '',
        material: existing.material ?? '',
        isNewArrival: !!existing.isNewArrival,
        isBestSeller: !!existing.isBestSeller,
        isFeatured: !!existing.isFeatured,
        isAvailable: existing.isAvailable ?? true,
      });
      setPhotos(
        getProductImages(existing).map((uri, i) => ({ key: `existing-${i}-${uri}`, uri, isNew: false }))
      );
    }
  }, [existing?.id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add product photos.');
      return;
    }
    const remainingSlots = MAX_IMAGES - photos.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit reached', `You can add up to ${MAX_IMAGES} photos per product.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });
    if (!result.canceled && result.assets.length > 0) {
      const picked: PendingPhoto[] = result.assets.map((asset, i) => ({
        key: `new-${Date.now()}-${i}`,
        uri: asset.uri,
        isNew: true,
        mimeType: asset.mimeType,
      }));
      setPhotos((prev) => [...prev, ...picked]);
    }
  };

  const removePhoto = (key: string) => setPhotos((prev) => prev.filter((p) => p.key !== key));

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.price.trim() || Number.isNaN(parseFloat(form.price))) return 'Enter a valid price.';
    if (!form.meeshoUrl.trim().startsWith('http')) return 'Enter a full Meesho product URL.';
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const workingId = productId ?? form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

      // Upload every newly-picked photo (existing ones are already URLs and
      // pass through untouched), preserving the order shown in the strip.
      const finalImages: string[] = [];
      for (const photo of photos) {
        if (photo.isNew) {
          const uploadedUrl = await uploadProductImage(photo.uri, workingId, photo.mimeType);
          finalImages.push(uploadedUrl);
        } else {
          finalImages.push(photo.uri);
        }
      }

      const payload: ProductInput = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        price: parseFloat(form.price),
        currency: 'INR',
        category: form.category,
        rating: form.rating.trim() ? parseFloat(form.rating) : 0,
        ratingLabel: form.ratingLabel.trim() || undefined,
        meeshoUrl: form.meeshoUrl.trim(),
        image: finalImages[0],
        images: finalImages,
        description: form.description.trim() || undefined,
        material: form.material.trim() || undefined,
        isNewArrival: form.isNewArrival,
        isBestSeller: form.isBestSeller,
        isFeatured: form.isFeatured,
        isAvailable: form.isAvailable,
      };

      let saved: Product;
      if (isEditing) {
        saved = await updateProduct(productId!, payload);
      } else {
        saved = await createProduct({ ...payload, id: workingId });
      }

      applyLocalUpsert(saved);
      showToast(isEditing ? 'Product updated' : 'Product added', 'success');
      hapticSuccess();
      goBackOrTo(navigation, 'AdminDashboard');
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong while saving.');
      showToast('Save failed — see error below', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOrTo(navigation, 'AdminDashboard')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Container>
          <Field label={`Photos (${photos.length}/${MAX_IMAGES}) — first is the cover photo`} colors={colors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
              {photos.length === 0 ? (
                <TouchableOpacity style={styles.emptyPhotoTile} onPress={pickImages} activeOpacity={0.85}>
                  <ProductPlaceholder category={form.category} compact />
                  <View style={styles.addOverlay}>
                    <Ionicons name="camera" size={16} color={colors.textInverse} />
                    <Text style={styles.addOverlayText}>Add Photos</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <>
                  {photos.map((photo, index) => (
                    <View key={photo.key} style={styles.photoTile}>
                      <Image source={{ uri: photo.uri }} style={styles.photoImage} contentFit="cover" transition={150} />
                      {index === 0 && (
                        <View style={styles.coverBadge}>
                          <Text style={styles.coverBadgeText}>Cover</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.removeBadge} onPress={() => removePhoto(photo.key)}>
                        <Ionicons name="close" size={14} color={colors.textInverse} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {photos.length < MAX_IMAGES && (
                    <TouchableOpacity style={styles.addTile} onPress={pickImages} activeOpacity={0.85}>
                      <Ionicons name="add" size={26} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </Field>

          <Field label="Title *" colors={colors}>
            <TextInput style={styles.input} value={form.title} onChangeText={(v) => set('title', v)} placeholder="Trendy Jewellery Set" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Subtitle" colors={colors}>
            <TextInput style={styles.input} value={form.subtitle} onChangeText={(v) => set('subtitle', v)} placeholder="+2 More" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Price (₹) *" colors={colors}>
            <TextInput style={styles.input} value={form.price} onChangeText={(v) => set('price', v)} keyboardType="numeric" placeholder="274" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Category *" colors={colors}>
            <View style={styles.chipRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.chip, form.category === c.key && styles.chipActive]}
                  onPress={() => set('category', c.key)}
                >
                  <Text style={[styles.chipText, form.category === c.key && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Meesho Product URL *" colors={colors}>
            <TextInput
              style={styles.input}
              value={form.meeshoUrl}
              onChangeText={(v) => set('meeshoUrl', v)}
              autoCapitalize="none"
              placeholder="https://www.meesho.com/..."
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <Field label="Material" colors={colors}>
            <TextInput style={styles.input} value={form.material} onChangeText={(v) => set('material', v)} placeholder="Oxidized silver" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Rating (0–5)" colors={colors}>
            <TextInput style={styles.input} value={form.rating} onChangeText={(v) => set('rating', v)} keyboardType="numeric" placeholder="3.1" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Description" colors={colors}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              numberOfLines={3}
              placeholder="Optional longer description"
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>In Stock</Text>
            <Switch value={form.isAvailable} onValueChange={(v) => set('isAvailable', v)} trackColor={{ true: colors.primary }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>New Arrival</Text>
            <Switch value={form.isNewArrival} onValueChange={(v) => set('isNewArrival', v)} trackColor={{ true: colors.primary }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Bestseller</Text>
            <Switch value={form.isBestSeller} onValueChange={(v) => set('isBestSeller', v)} trackColor={{ true: colors.primary }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Featured (Editor's Pick)</Text>
            <Switch value={form.isFeatured} onValueChange={(v) => set('isFeatured', v)} trackColor={{ true: colors.primary }} />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Product'}</Text>}
          </TouchableOpacity>
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: ColorTheme }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    photoStrip: { paddingVertical: spacing.sm, gap: spacing.sm },
    emptyPhotoTile: {
      width: 140,
      height: 140,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
      position: 'relative',
    },
    addOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingVertical: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    addOverlayText: { ...typography.caption, color: '#FFFFFF' },
    photoTile: {
      width: 100,
      height: 100,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
      position: 'relative',
    },
    photoImage: { width: '100%', height: '100%' },
    coverBadge: {
      position: 'absolute',
      bottom: 4,
      left: 4,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    coverBadgeText: { fontSize: 9, fontFamily: fonts.bodyBold, color: '#FFFFFF' },
    removeBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addTile: {
      width: 100,
      height: 100,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    field: { marginTop: spacing.lg },
    label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase' },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.bodySmall, color: colors.textSecondary },
    chipTextActive: { color: colors.textInverse, fontFamily: fonts.bodySemiBold },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
    },
    switchLabel: { ...typography.body, color: colors.textPrimary },
    errorText: { ...typography.bodySmall, color: colors.danger, marginTop: spacing.lg, textAlign: 'center' },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    saveButtonText: { ...typography.button, color: colors.textInverse },
  });
}
