import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * There's no login system, so "who can edit/delete this testimonial" is
 * answered by a random id generated once on this device and stored
 * locally — never shown anywhere, never sent except when this device
 * itself asks to edit or delete one of its own testimonials. The
 * Supabase functions that handle those two actions (see
 * `services/testimonialService.ts`) only touch a row if the token
 * matches, so this is effectively a private "edit key" rather than a
 * real identity — good enough to stop someone else editing your
 * testimonial, not meant to withstand a determined attacker digging
 * through network requests. Treat it like a secret link.
 */

const OWNER_TOKEN_KEY = '@fashionable_flair/testimonial_owner_token';
const OWNED_IDS_KEY = '@fashionable_flair/testimonial_owned_ids';

/** Max testimonials one device is allowed to have submitted at once. */
export const MAX_TESTIMONIALS_PER_DEVICE = 2;

function uuidv4(): string {
  // Good enough for a device-local secret — not used for anything
  // cryptographically sensitive.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedToken: string | null = null;

/** The same value every time, for this device, forever (until app data is cleared). */
export async function getOwnerToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  try {
    const existing = await AsyncStorage.getItem(OWNER_TOKEN_KEY);
    if (existing) {
      cachedToken = existing;
      return existing;
    }
  } catch (err) {
    console.warn('Failed to read testimonial owner token', err);
  }
  const fresh = uuidv4();
  cachedToken = fresh;
  try {
    await AsyncStorage.setItem(OWNER_TOKEN_KEY, fresh);
  } catch (err) {
    console.warn('Failed to persist testimonial owner token', err);
  }
  return fresh;
}

async function getOwnedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(OWNED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function rememberOwnedTestimonial(id: string): Promise<void> {
  const ids = await getOwnedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    try {
      await AsyncStorage.setItem(OWNED_IDS_KEY, JSON.stringify(ids));
    } catch (err) {
      console.warn('Failed to remember testimonial ownership', err);
    }
  }
}

export async function forgetOwnedTestimonial(id: string): Promise<void> {
  const ids = await getOwnedIds();
  const next = ids.filter((existing) => existing !== id);
  try {
    await AsyncStorage.setItem(OWNED_IDS_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('Failed to forget testimonial ownership', err);
  }
}

/** IDs of testimonials this device has submitted, so the UI can show Edit/Delete only on those cards. */
export async function getOwnedTestimonialIds(): Promise<string[]> {
  return getOwnedIds();
}

export async function canAddMoreTestimonials(): Promise<boolean> {
  const ids = await getOwnedIds();
  return ids.length < MAX_TESTIMONIALS_PER_DEVICE;
}
