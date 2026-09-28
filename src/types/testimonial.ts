/**
 * A customer testimonial shown on the Testimonials screen. Two sources
 * feed the same shape: a small set of curated launch reviews bundled with
 * the app (see `data/testimonialsSeed.ts`, `isSeed: true`), and real ones
 * shoppers submit themselves via the "Share Your Experience" form, stored
 * in Supabase. Both render through the exact same card component so
 * there's no visual difference between the two.
 *
 * Writing a review requires a signed-in account (see AuthContext and
 * CUSTOMER_ACCOUNTS_SETUP.md) — a submitted testimonial's "owner" is
 * simply whoever's `user_id` it carries, enforced by the same Postgres
 * row-level-security rule that already protects the `profiles` table
 * (`auth.uid() = user_id`), not a client-side secret. Older rows from
 * before accounts existed may still carry the legacy `ownerToken`
 * column instead and have `user_id: null` — those are effectively
 * read-only now (see the note in utils/testimonialOwnership.ts).
 */
export interface Testimonial {
  id: string;
  name: string;
  city?: string;
  rating: number; // 1-5
  product?: string; // e.g. "Pendants & Chains" — free text, not a strict category key
  body: string;
  avatarIndex: number; // 1-50, see data/avatars.ts
  createdAt: string; // ISO date
  isSeed?: boolean; // true for the bundled launch reviews — not stored in Supabase, so admin can't delete them and nobody "owns" one
  user_id?: string; // the account that wrote it — absent on seed data and on legacy pre-account rows
}

export type TestimonialInput = {
  name: string;
  city?: string;
  rating: number;
  product?: string;
  body: string;
  avatarIndex: number;
};
