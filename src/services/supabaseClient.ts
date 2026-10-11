import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabaseConfig';

export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

// A dummy client when not configured yet lets the rest of the app import
// this safely without null-checking everywhere — every call against it
// will simply fail gracefully and the app falls back to local data (see
// ProductsContext), rather than crashing on startup because the config
// file is still blank.
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // PKCE (rather than the older implicit flow) is what lets Google
      // sign-in work the same way on native and web: signInWithOAuth
      // stashes a code verifier in `storage` above, and whoever receives
      // the redirect back (this file on web, AuthContext on native) trades
      // the `code` in that redirect URL for a session with the matching
      // verifier — see signInWithGoogle in AuthContext.tsx.
      flowType: 'pkce',
      // On web the OAuth redirect lands back on this same page with
      // ?code=... in the URL, and supabase-js can finish the exchange on
      // its own right here. On native there is no page URL to detect from
      // — AuthContext's signInWithGoogle captures the redirect itself
      // (via the in-app browser) and calls exchangeCodeForSession
      // explicitly, so this must stay off there or the two would race.
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);
