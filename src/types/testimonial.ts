/**
 * A customer testimonial shown on the Testimonials screen. Two sources
 * feed the same shape: a small set of curated launch reviews bundled with
 * the app (see `data/testimonialsSeed.ts`, `isSeed: true`), and real ones
 * shoppers submit themselves via the "Share Your Experience" form, stored
 * in Supabase. Both render through the exact same card component so
 * there's no visual difference between the two.
 *
 * There's no login system, so a submitted testimonial's "owner" is
 * whoever's device holds its `ownerToken` — a random id generated once
 * per device and stored locally (see `utils/testimonialOwnership.ts`).
 * That token is never shown anywhere; it's the only thing that lets
 * someone edit or delete a testimonial they wrote, later, without an
 * account.
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
  isSeed?: boolean; // true for the bundled launch reviews — not stored in Supabase, so admin can't delete them and a device never "owns" one
}

export type TestimonialInput = {
  name: string;
  city?: string;
  rating: number;
  product?: string;
  body: string;
  avatarIndex: number;
};
