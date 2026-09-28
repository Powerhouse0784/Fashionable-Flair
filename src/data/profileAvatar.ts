import { AVATARS, getAvatarByIndex } from './avatars';
import { PREMIUM_AVATARS, getPremiumAvatarByIndex } from './premiumAvatars';

/**
 * The Profile screen's avatar is entirely local (no backend row to
 * migrate — see ProfileContext), so rather than adding a second field
 * just to say "which set is this index from", a premium avatar is
 * simply stored as (its 1-based index + 1000). Free avatars stay
 * 1–50 exactly as before, so an avatar picked before this feature
 * existed still resolves correctly with no migration needed.
 *
 * This offset is specific to the Profile avatar — testimonials keep
 * using plain 1–50 indices into AVATARS unchanged (see
 * components/AvatarPickerModal.tsx), since gating premium avatars there
 * would need the same rule enforced against whoever is submitting the
 * testimonial, not just the current device's profile.
 */
export const PREMIUM_AVATAR_OFFSET = 1000;

export function isPremiumAvatarIndex(index: number): boolean {
  return index > PREMIUM_AVATAR_OFFSET;
}

export function encodePremiumAvatarIndex(rawIndex: number): number {
  return rawIndex + PREMIUM_AVATAR_OFFSET;
}

export function decodePremiumAvatarIndex(encodedIndex: number): number {
  return encodedIndex - PREMIUM_AVATAR_OFFSET;
}

/** Resolves a Profile avatarIndex (free or premium-encoded) to an image source. */
export function resolveProfileAvatarSource(index: number): any {
  return isPremiumAvatarIndex(index)
    ? getPremiumAvatarByIndex(decodePremiumAvatarIndex(index))
    : getAvatarByIndex(index);
}

/** A random FREE avatar index — used for "Surprise Me" so a shopper who
 * isn't Premium never lands on a locked avatar by chance. */
export function randomFreeProfileAvatarIndex(): number {
  return Math.floor(Math.random() * AVATARS.length) + 1;
}

export { AVATARS, PREMIUM_AVATARS };
