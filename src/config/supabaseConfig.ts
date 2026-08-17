/**
 * Reads from .env (see .env.example). Expo inlines any variable prefixed
 * with EXPO_PUBLIC_ into the JS bundle at build time — this is Expo's
 * built-in env support, no extra package needed.
 *
 * Note on "public" here: the Supabase anon key is MEANT to be shipped
 * inside client apps — every Supabase project works this way. It is not
 * a secret like a service-role key would be; the real access control is
 * the Row Level Security policies from SUPABASE_SETUP.md (public read,
 * admin-only write via the `admins` table). Moving it to .env is about
 * keeping it out of git history, not about hiding it from end users —
 * that part isn't possible for a client-side app regardless of where the
 * value is stored before build time.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
