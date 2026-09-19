import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { RootStackParamList } from '@/types/navigation';
import { ProductReview } from '@/types/product';
import { fetchReviews, createReview, deleteReview } from '@/services/reviewService';
import { useToast } from '@/context/ToastContext';
import { hapticSuccess } from '@/utils/haptics';
import { goBackOrTo } from '@/utils/navigation';
import RatingStars from '@/components/RatingStars';

type ReviewsRoute = RouteProp<RootStackParamList, 'AdminReviews'>;

/**
 * Reviews for a product aren't collected from in-app verified purchases
 * (checkout happens on Meesho, not here) — this screen is where store
 * staff add genuine reviews sourced from the product's actual Meesho
 * listing, so the product page shows real customer feedback instead of a
 * bare star number with nothing behind it.
 */
export default function AdminReviewsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<ReviewsRoute>();
  const { productId, productTitle } = route.params;
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  const load = () => {
    setLoading(true);
    fetchReviews(productId).then((data) => {
      setReviews(data);
      setLoading(false);
    });
  };

  useEffect(load, [productId]);

  const handleAdd = async () => {
    if (!authorName.trim() || !body.trim()) {
      Alert.alert('Missing info', 'Enter both a name and the review text.');
      return;
    }
    setSaving(true);
    try {
      await createReview({ productId, authorName: authorName.trim(), rating, body: body.trim() });
      setAuthorName('');
      setBody('');
      setRating(5);
      hapticSuccess();
      showToast('Review added', 'success');
      load();
    } catch (e: any) {
      Alert.alert('Couldn\u2019t add review', e?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete review?', 'This can\u2019t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(id);
            showToast('Review deleted', 'success');
            load();
          } catch (e: any) {
            Alert.alert('Couldn\u2019t delete', e?.message || 'Something went wrong.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBackOrTo(navigation, 'AdminDashboard')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Reviews · {productTitle}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          ListHeaderComponent={
            <View style={styles.addCard}>
              <Text style={styles.addCardTitle}>Add a review</Text>
              <TextInput
                style={styles.input}
                value={authorName}
                onChangeText={setAuthorName}
                placeholder="Customer name"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={26} color={colors.star} />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={body}
                onChangeText={setBody}
                placeholder="What did they say? (copy from the real Meesho review)"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.addButtonText}>Add Review</Text>}
              </TouchableOpacity>

              <Text style={styles.listLabel}>
                {loading ? 'Loading…' : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.authorName}>{item.authorName}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
              <RatingStars rating={item.rating} size={13} showLabel={false} />
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>No reviews yet — add the first one above.</Text> : null
          }
        />
      </KeyboardAvoidingView>
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
    addCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    addCardTitle: { ...typography.h3, fontFamily: fonts.headingMedium, color: colors.textPrimary, marginBottom: spacing.md },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      marginBottom: spacing.md,
      ...typography.body,
    },
    textArea: { minHeight: 90, textAlignVertical: 'top' },
    starPicker: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
    },
    addButtonText: { ...typography.button, color: colors.textInverse },
    listLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
    reviewCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    authorName: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    body: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 19 },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  });
}
