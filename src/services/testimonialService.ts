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

/** How many reviews this account already has — used to enforce the free
 * (2) vs Premium (4) limit client-side before even opening the form (the
 * `testimonial_limit_trigger` in Postgres is what actually enforces it,
 * this is just for a fast, friendly message). */
export async function countMyTestimonials(userId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { count, error } = await supabase
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    console.warn('Failed to count testimonials', error.message);
    return 0;
  }
  return count ?? 0;
}

export async function createTestimonial(input: TestimonialInput, userId: string): Promise<Testimonial> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...input, user_id: userId, createdAt: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Testimonial;
}

/** Relies entirely on the "Users can update their own testimonial" RLS
 * policy (auth.uid() = user_id) — no token to pass, Supabase already
 * knows who's asking from the logged-in session. */
export async function updateOwnTestimonial(id: string, input: TestimonialInput): Promise<Testimonial> {
  const { data, error } = await supabase.from(TABLE).update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as Testimonial;
}

/** Same as above — RLS (auth.uid() = user_id) is what actually stops
 * this from deleting someone else's review, not anything in this call. */
export async function deleteOwnTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Admin moderation — the signed-in admin session is what authorizes
 * this (see the "Admins can delete any testimonial" RLS policy), no
 * owner token needed. */
export async function adminDeleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
