// Single source of truth for every outbound contact/social link used by
// QuickActionsSidebar, Footer, and ContactScreen — change a number or
// handle once here instead of hunting through components.

/** Digits only, with country code, no '+' or spaces (used for wa.me links). */
export const WHATSAPP_NUMBER = '918448822940';

/** Prefilled text a visitor's WhatsApp chat opens with. */
export const WHATSAPP_DEFAULT_MESSAGE = "Hi! I'm interested in your jewellery collection.";

/** Official Fashionable Flair Instagram profile. */
export const INSTAGRAM_URL = 'https://www.instagram.com/fashionableflair786?stkn=anltOHQwNzB1ZGdx';

/** Same number the footer and Contact page already call/link to. */
export const SUPPORT_PHONE = '8448822940';

/**
 * TODO: replace with the real hosted APK download link once you have one
 * (e.g. a GitHub Release asset, Supabase Storage public file, or your own
 * server). Used only by the "Download App" button, which only ever shows
 * on the web build — native app users obviously don't need it.
 */
export const APK_DOWNLOAD_URL = 'https://example.com/fashionable-flair.apk';
