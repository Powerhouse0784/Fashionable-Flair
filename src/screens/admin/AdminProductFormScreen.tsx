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
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@/theme';
import { fonts } from '@/hooks/useAppFonts';
import { RootStackParamList } from '@/types/navigation';
import { CategoryKey, Product } from '@/types/product';
import { categories } from '@/data/categories';
import { useProducts } from '@/context/ProductsContext';
import { useToast } from '@/context/ToastContext';
import { getProductById } from '@/utils/productHelpers';
import { createProduct, updateProduct, uploadProductImage, ProductInput } from '@/services/productService';
import { hapticSuccess } from '@/utils/haptics';
import Container from '@/components/Container';
import ProductPlaceholder from '@/components/ProductPlaceholder';

type FormRoute = RouteProp<RootStackParamList, 'AdminProductForm'>;

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
  const navigation = useNavigation<any>();
  const route = useRoute<FormRoute>();
  const productId = route.params?.productId;
  const isEditing = !!productId;

  const { products, applyLocalUpsert } = useProducts();
  const { showToast } = useToast();
  const existing = isEditing ? getProductById(products, productId!) : undefined;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [remoteImage, setRemoteImage] = useState<string | undefined>(undefined);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
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
      setRemoteImage(existing.image);
    }
  }, [existing?.id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add a product image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

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

      let imageUrl = remoteImage;
      if (localImageUri) {
        imageUrl = await uploadProductImage(localImageUri, workingId);
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
        image: imageUrl,
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
      navigation.goBack();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong while saving.');
      showToast('Save failed — see error below', 'error');
    } finally {
      setSaving(false);
    }
  };

  const previewUri = localImageUri || (remoteImage && !remoteImage.includes('placehold.co') ? remoteImage : null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Container>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.imagePreview} contentFit="cover" transition={150} />
            ) : (
              <ProductPlaceholder category={form.category} />
            )}
            <View style={styles.imagePickerOverlay}>
              <Ionicons name="camera" size={18} color={colors.textInverse} />
              <Text style={styles.imagePickerText}>{previewUri ? 'Change Photo' : 'Add Photo'}</Text>
            </View>
          </TouchableOpacity>

          <Field label="Title *">
            <TextInput style={styles.input} value={form.title} onChangeText={(v) => set('title', v)} placeholder="Trendy Jewellery Set" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Subtitle">
            <TextInput style={styles.input} value={form.subtitle} onChangeText={(v) => set('subtitle', v)} placeholder="+2 More" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Price (₹) *">
            <TextInput style={styles.input} value={form.price} onChangeText={(v) => set('price', v)} keyboardType="numeric" placeholder="274" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Category *">
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

          <Field label="Meesho Product URL *">
            <TextInput
              style={styles.input}
              value={form.meeshoUrl}
              onChangeText={(v) => set('meeshoUrl', v)}
              autoCapitalize="none"
              placeholder="https://www.meesho.com/..."
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <Field label="Material">
            <TextInput style={styles.input} value={form.material} onChangeText={(v) => set('material', v)} placeholder="Oxidized silver" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Rating (0–5)">
            <TextInput style={styles.input} value={form.rating} onChangeText={(v) => set('rating', v)} keyboardType="numeric" placeholder="3.1" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Description">
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
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
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
  imagePicker: {
    width: 140,
    height: 140,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginTop: spacing.lg,
    alignSelf: 'center',
    position: 'relative',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePickerOverlay: {
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
  imagePickerText: { ...typography.caption, color: colors.textInverse },
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
