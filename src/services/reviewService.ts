import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ProductReview } from '@/types/product';

const TABLE = 'reviews';

export async function fetchReviews(productId: string): Promise<ProductReview[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('productId', productId)
    .order('createdAt', { ascending: false });
  if (error) {
    console.warn('Failed to fetch reviews', error.message);
    return [];
  }
  return (data as ProductReview[]) || [];
}

export type ReviewInput = Omit<ProductReview, 'id' | 'createdAt'>;

export async function createReview(input: ReviewInput): Promise<ProductReview> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...input, createdAt: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProductReview;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
