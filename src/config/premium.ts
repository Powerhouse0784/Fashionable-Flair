/**
 * One place for every Premium-plan number and benefit copy, so the
 * paywall, the profile badge, the avatar picker and the testimonial
 * limit all read from the same source instead of repeating magic
 * numbers in five different files.
 */

// TODO: this is set to ₹1 for testing the checkout flow end-to-end
// cheaply — change back to 20 before real users start paying.
export const PREMIUM_PRICE_INR = 1;
export const PREMIUM_BILLING_PERIOD = 'month';

export const FREE_TESTIMONIAL_LIMIT = 2;
export const PREMIUM_TESTIMONIAL_LIMIT = 4;

export const FREE_AVATAR_COUNT = 50; // src/data/avatars.ts
export const PREMIUM_AVATAR_COUNT = 50; // src/data/premiumAvatars.ts

export const PREMIUM_THEME_COUNT = 3; // src/theme/accentThemes.ts

export interface PremiumBenefit {
  icon: string; // Ionicons name
  title: string;
  description: string;
}

/** Shown on the paywall, in this order. The first three are the
 * concrete unlocks; the rest are the "why upgrade" extras. */
export const PREMIUM_BENEFITS: PremiumBenefit[] = [
  {
    icon: 'star',
    title: `${PREMIUM_TESTIMONIAL_LIMIT} Reviews Per Device`,
    description: `Share up to ${PREMIUM_TESTIMONIAL_LIMIT} testimonials instead of the usual ${FREE_TESTIMONIAL_LIMIT} — more room to tell your story.`,
  },
  {
    icon: 'sparkles',
    title: `${PREMIUM_AVATAR_COUNT}+ Exclusive Avatars`,
    description: 'A whole new set of portraits, available only to Premium members.',
  },
  {
    icon: 'color-palette',
    title: `${PREMIUM_THEME_COUNT} Exclusive Themes`,
    description: 'Restyle the entire app in Ruby, Emerald or Amethyst — yours to switch anytime.',
  },
  {
    icon: 'ribbon',
    title: 'Premium Badge',
    description: 'A gold Premium badge on your profile, visible whenever you share a review.',
  },
  {
    icon: 'flash',
    title: 'Priority Support',
    description: 'Your messages on Contact Us jump the queue and get answered first.',
  },
  {
    icon: 'gift',
    title: 'Early Access',
    description: 'First look at new arrivals and sales, before everyone else.',
  },
];
