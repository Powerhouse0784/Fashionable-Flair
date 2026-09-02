import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Product } from '@/types/product';

const TABLE = 'products';
const BUCKET = 'product-images';

// --- Reads ---------------------------------------------------------------

export async function fetchProducts(): Promise<Product[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from(TABLE).select('*').order('createdAt', { ascending: false });
  if (error) {
    console.warn('Failed to fetch products from Supabase', error.message);
    return null;
  }
  // Trust Supabase as the source of truth once it's reachable — including
  // a genuinely empty table. Treating "empty" the same as "unreachable"
  // (falling back to the old local seed catalog) was actively misleading
  // once an admin is managing real inventory: deleting the only product
  // made the entire 21-item placeholder catalog reappear, which looked
  // exactly like "the delete didn't work."
  return data as Product[];
}

/**
 * Subscribes to live INSERT/UPDATE/DELETE changes on the products table so
 * every device sees new/edited/removed products without needing to
 * manually refresh. Returns an unsubscribe function.
 */
export function subscribeToProducts(onChange: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('products-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onChange())
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// --- Writes (admin only — enforced by Row Level Security, not just the UI) ---

export type ProductInput = Omit<Product, 'id'> & { id?: string };

export async function createProduct(input: ProductInput): Promise<Product> {
  const id = input.id || slugify(input.title) + '-' + Date.now().toString(36);
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...input, id }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const { data, error } = await supabase.from(TABLE).update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// --- Image upload ----------------------------------------------------------

/**
 * Uploads a locally-picked image (from expo-image-picker) to the
 * product-images storage bucket and returns its public URL.
 *
 * `mimeType` should come from the picker's own result (expo-image-picker
 * returns `assets[0].mimeType`) rather than being guessed from the file
 * URI — on web the picker returns a `blob:` URL with no real file
 * extension in it (e.g. `blob:http://localhost:8081/550e8400-...`), so
 * parsing "the bit after the last dot" grabbed garbage text and produced
 * an invalid Content-Type header, which the browser rejected outright.
 * Native URIs usually do have a real extension, but trusting the picker's
 * mimeType works reliably on both platforms, so it's the default now.
 */
export async function uploadProductImage(
  localUri: string,
  productId: string,
  mimeType?: string
): Promise<string> {
  const contentType = mimeType || guessContentTypeFromUri(localUri);
  const fileExt = contentType.split('/')[1] || 'jpg';
  const filePath = `${productId}-${Date.now()}.${fileExt}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, arrayBuffer, { contentType, upsert: true });
  if (error) {
    // Supabase's raw error here is just "Bucket not found" — not obvious
    // that it means "you haven't created the product-images bucket yet"
    // unless you already know to look for that. Make it actionable.
    if (error.message.toLowerCase().includes('bucket not found')) {
      throw new Error(
        `Storage bucket "${BUCKET}" doesn't exist yet in your Supabase project. Create it under Storage → New bucket (name it exactly "product-images", toggle Public ON) — see SUPABASE_SETUP.md step 3.`
      );
    }
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

// Fallback only used if a caller doesn't pass mimeType (shouldn't happen
// from the admin form, but keeps this function safe to call from anywhere).
function guessContentTypeFromUri(uri: string): string {
  const cleanUri = uri.split('?')[0];
  const ext = cleanUri.includes('.') ? cleanUri.split('.').pop()?.toLowerCase() : null;
  const known: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
  };
  return (ext && known[ext]) || 'image/jpeg';
}
