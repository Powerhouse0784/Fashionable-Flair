import { FREE_TESTIMONIAL_LIMIT, PREMIUM_TESTIMONIAL_LIMIT } from '@/config/premium';

/**
 * Writing a review now requires a signed-in account (see AuthContext and
 * CUSTOMER_ACCOUNTS_SETUP.md), so "who can edit/delete this testimonial"
 * is answered by the testimonial's own `user_id` column plus ordinary
 * Postgres row-level security (`auth.uid() = user_id`) — see
 * services/testimonialService.ts. There's no local device token to
 * manage here anymore; this file now only holds the free-vs-Premium
 * review limit.
 *
 * (Rows submitted before accounts existed still carry the old
 * `ownerToken` column and have `user_id: null` — those are effectively
 * read-only now, since nothing signed-in matches a null user_id. That's
 * an acceptable trade-off pre-launch; the two Postgres functions that
 * used to service them, `update_own_testimonial`/`delete_own_testimonial`,
 * are harmless left in place if you'd rather keep that door open.)
 */

/** Max testimonials one account is allowed to have at once — more for
 * Premium members (see src/config/premium.ts for the numbers). */
export function getTestimonialLimit(isPremium: boolean): number {
  return isPremium ? PREMIUM_TESTIMONIAL_LIMIT : FREE_TESTIMONIAL_LIMIT;
}
