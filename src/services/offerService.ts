import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Product } from '@/types/product';

const TABLE = 'offers';

/** A raw row from the `offers` table — see OFFERS_SETUP.md. */
export interface Offer {
  id: string;
  productId: string;
  offerPrice: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

/** An offer merged with the product it applies to — what the Home page
 * section and the in-app Offers screen actually render. */
export interface ActiveOffer extends Offer {
  product: Product;
}

function fromRow(row: any): Offer {
  return {
    id: row.id,
    productId: row.product_id,
    offerPrice: Number(row.offer_price),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Every offer ever created, newest first — for the admin screen, which
 * shows past/upcoming offers too, not just currently-active ones. */
export async function fetchAllOffers(): Promise<Offer[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('Failed to fetch offers', error.message);
    return [];
  }
  return (data || []).map(fromRow);
}

/**
 * Offers that are live right now (starts_at <= now <= ends_at), merged
 * with their product — on a product that's in stock. This is what the
 * Home page section and the customer-facing Offers screen show; the
 * window check happens here on the client's own clock, which is fine for
 * a merchandising feature like this (nothing payment-sensitive rides on
 * the exact second it flips).
 */
export async function fetchActiveOffers(products: Product[]): Promise<ActiveOffer[]> {
  const all = await fetchAllOffers();
  const now = Date.now();
  const productById = new Map(products.map((p) => [p.id, p]));
  const active: ActiveOffer[] = [];
  for (const offer of all) {
    const starts = new Date(offer.startsAt).getTime();
    const ends = new Date(offer.endsAt).getTime();
    if (now < starts || now > ends) continue;
    const product = productById.get(offer.productId);
    if (!product || product.isAvailable === false) continue;
    active.push({ ...offer, product });
  }
  return active;
}

export interface OfferInput {
  productId: string;
  offerPrice: number;
  startsAt: string; // ISO
  endsAt: string; // ISO
}

export async function createOffer(input: OfferInput): Promise<Offer> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        product_id: input.productId,
        offer_price: input.offerPrice,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
      },
    ])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function updateOffer(id: string, input: Partial<OfferInput>): Promise<Offer> {
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.productId !== undefined) payload.product_id = input.productId;
  if (input.offerPrice !== undefined) payload.offer_price = input.offerPrice;
  if (input.startsAt !== undefined) payload.starts_at = input.startsAt;
  if (input.endsAt !== undefined) payload.ends_at = input.endsAt;
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function deleteOffer(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
