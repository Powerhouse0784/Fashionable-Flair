import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Testimonial, TestimonialInput } from '@/types/testimonial';

const TABLE = 'testimonials';

/** Real, shopper-submitted testimonials from Supabase. Empty until the
 * table's been set up (see SUPABASE_SETUP.md § 11) — the screen still
 * works fine without it, just showing the bundled launch reviews. */
export async function fetchTestimonials(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) {
    console.warn('Failed to fetch testimonials', error.message);
    return [];
  }
  return (data as Testimonial[]) || [];
}

export async function createTestimonial(
  input: TestimonialInput,
  ownerToken: string
): Promise<Testimonial> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...input, ownerToken, createdAt: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Testimonial;
}

/** Only succeeds if `ownerToken` matches the row's — enforced inside the
 * Postgres function, not just by this call's arguments, so it can't be
 * bypassed by editing someone else's id. */
export async function updateOwnTestimonial(
  id: string,
  ownerToken: string,
  input: TestimonialInput
): Promise<Testimonial> {
  const { data, error } = await supabase.rpc('update_own_testimonial', {
    p_id: id,
    p_owner_token: ownerToken,
    p_name: input.name,
    p_city: input.city ?? null,
    p_rating: input.rating,
    p_product: input.product ?? null,
    p_body: input.body,
    p_avatar_index: input.avatarIndex,
  });
  if (error) throw new Error(error.message);
  return data as Testimonial;
}

export async function deleteOwnTestimonial(id: string, ownerToken: string): Promise<void> {
  const { error } = await supabase.rpc('delete_own_testimonial', {
    p_id: id,
    p_owner_token: ownerToken,
  });
  if (error) throw new Error(error.message);
}

/** Admin moderation — the signed-in admin session is what authorizes
 * this (see the "Admins can delete any testimonial" RLS policy), no
 * owner token needed. */
export async function adminDeleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
