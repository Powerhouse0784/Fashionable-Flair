import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

// Lets the in-app browser auth session close itself cleanly once Google
// redirects back, instead of lingering as an open tab/dialog — a no-op on
// native, relevant on web (see Supabase + Expo's own integration guide).
WebBrowser.maybeCompleteAuthSession();

interface SignInResult {
  error: string | null;
  /** The session that was just established — pass this straight to
   * whatever needs to act on "this exact account, right now" (e.g.
   * checking Premium status) instead of reading it back from context,
   * which may not have re-rendered with the new session yet. */
  session: Session | null;
}

interface SignUpResult {
  error: string | null;
  /** True if the account was created but needs email confirmation before
   * it can sign in — there is no session yet, so callers must NOT treat
   * this as "logged in" (see CustomerAuthModal). False whenever `error`
   * is set, and also false on a normal immediate-session signup (email
   * confirmation turned off in the Supabase project). */
  needsConfirmation: boolean;
  /** Same idea as SignInResult.session — only set when needsConfirmation
   * is false and there's no error. */
  session: Session | null;
}

interface AuthContextValue {
  session: Session | null;
  /** True only if this user's id is present in the `admins` table — not just "logged in". */
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  /** Google sign-in/sign-up — the same account either way, Supabase treats
   * it as one identity provider among others on the same user. Returns a
   * `session` only on native once the whole round trip (browser → Google →
   * back into the app) has actually completed; on web this instead
   * navigates the page away to Google, so it always resolves with no
   * session/error of its own — the real result arrives later via
   * onAuthStateChange when the page comes back. */
  signInWithGoogle: () => Promise<SignInResult>;
  /** Customer self-registration — a regular signed-up shopper, never an
   * admin (that still only ever comes from the `admins` table above). */
  signUp: (email: string, password: string, fullName?: string) => Promise<SignUpResult>;
  /** Sends a password-reset email via Supabase. Always reports success
   * even for an email with no account — same reasoning as the signup
   * "already registered" case above, just in the other direction: telling
   * the truth here would let a stranger use this form to check which
   * emails are registered at all. */
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const ALREADY_REGISTERED_ERROR = 'An account with this email already exists \u2014 please log in instead.';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CONFIG_ERROR = "Sign-in isn't configured yet — see SUPABASE_SETUP.md.";

// Same session/identity for two different audiences: the store owner (and
// anyone they allow-list in the `admins` table) uses this to reach the
// admin panel, and — since adding customer accounts, see
// CUSTOMER_ACCOUNTS_SETUP.md — a regular shopper uses the exact same
// sign-in/sign-up to keep their Premium purchase and profile synced
// across devices. Browsing, wishlisting, etc. still need no login at
// all; this is only ever required at the point of buying Premium.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async (userId: string | undefined) => {
    if (!userId || !isSupabaseConfigured) {
      setIsAdmin(false);
      return;
    }
    const { data, error } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
    if (error) {
      // Fails closed — if the admins table can't be reached for any reason,
      // treat this session as not-admin rather than risk a false positive.
      console.warn('Admin status check failed', error.message);
      setIsAdmin(false);
      return;
    }
    setIsAdmin(!!data);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await checkAdminStatus(data.session?.user?.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      await checkAdminStatus(newSession?.user?.id);
    });

    return () => listener.subscription.unsubscribe();
  }, [checkAdminStatus]);

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR, session: null };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null, session: data.session ?? null };
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<SignUpResult> => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR, needsConfirmation: false, session: null };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Stashed in the auth user's own metadata at signup mainly so it's
      // visible against the account in the Supabase dashboard — the name
      // shown in the app comes from updateProfile() in CustomerAuthModal,
      // set from this same value right after a successful signup.
      options: fullName ? { data: { full_name: fullName } } : undefined,
    });
    if (error) return { error: error.message, needsConfirmation: false, session: null };

    // Supabase deliberately returns a "success" here — no error at all —
    // when the email already belongs to a confirmed account, so that a
    // stranger can't use signup to probe which emails are registered. The
    // only tell is an empty `identities` array. Without this check the
    // app would believe a brand-new account had just been created (and,
    // since there's still no session, likely show "check your email" for
    // an account whose confirmation email went out days or months ago).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: ALREADY_REGISTERED_ERROR, needsConfirmation: false, session: null };
    }

    // A session here means the project has email confirmation turned off
    // and this account can be used immediately; no session means a real
    // confirmation email is on its way and there is nothing to log into yet.
    return { error: null, needsConfirmation: !data.session, session: data.session ?? null };
  };

  const signInWithGoogle = async (): Promise<SignInResult> => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR, session: null };

    try {
      if (Platform.OS === 'web') {
        // Full-page redirect to Google, then back to this same origin.
        // supabase-js (detectSessionInUrl: true, web-only — see
        // supabaseClient.ts) finishes the code exchange on its own as soon
        // as the page reloads with ?code=... in the URL, and the session
        // shows up through the onAuthStateChange listener above — there is
        // nothing left for this function to hand back synchronously.
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        return { error: error?.message ?? null, session: null };
      }

      // Native: ask Supabase for the Google consent URL without letting it
      // try to open a browser itself (skipBrowserRedirect), open that URL
      // in a transient, cookie-isolated in-app browser tab ourselves, and
      // wait for Google to redirect it to our own custom URL scheme.
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        return { error: error?.message ?? 'Could not start Google sign-in.', session: null };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        // User backed out of the Google screen or dismissed the browser —
        // not a real failure worth putting in front of them as an error.
        return { error: null, session: null };
      }

      // Parsed with expo-auth-session's own helper rather than the URL
      // constructor: Supabase's redirect can carry its params after a `#`
      // instead of a `?`, which URL/URLSearchParams on some RN engines
      // won't pick up, silently dropping the `code`.
      const { params, errorCode } = QueryParams.getQueryParams(result.url);
      if (errorCode) return { error: errorCode, session: null };
      if (params.error) return { error: params.error_description || params.error, session: null };

      const code = params.code;
      if (!code) return { error: 'Google sign-in did not return a valid code.', session: null };

      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) return { error: exchangeError.message, session: null };
      return { error: null, session: sessionData.session ?? null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Google sign-in failed.', session: null };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    // Deliberately ignore `error` for "user not found"-type cases (Supabase
    // itself doesn't actually distinguish this from other failures in the
    // response), and only surface genuinely unexpected failures.
    if (error && !/user not found/i.test(error.message)) {
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    // { scope: 'local' } clears this device's session immediately, even if
    // the network call to also revoke it server-side fails (offline, a
    // timeout, Supabase briefly unreachable). Without it, a failed revoke
    // can leave the old session sitting in storage — meaning the same
    // account silently signs back in on the next app launch, looking
    // exactly like "logging out didn't work".
    await supabase.auth.signOut({ scope: 'local' });
  };

  const value = useMemo(
    () => ({ session, isAdmin, loading, signIn, signUp, signInWithGoogle, resetPassword, signOut }),
    [session, isAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
