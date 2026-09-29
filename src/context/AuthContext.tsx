import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

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
  /** Customer self-registration — a regular signed-up shopper, never an
   * admin (that still only ever comes from the `admins` table above). */
  signUp: (email: string, password: string) => Promise<SignUpResult>;
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

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR, needsConfirmation: false, session: null };
    const { data, error } = await supabase.auth.signUp({ email, password });
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

  const signOut = async () => {
    // { scope: 'local' } clears this device's session immediately, even if
    // the network call to also revoke it server-side fails (offline, a
    // timeout, Supabase briefly unreachable). Without it, a failed revoke
    // can leave the old session sitting in storage — meaning the same
    // account silently signs back in on the next app launch, looking
    // exactly like "logging out didn't work".
    await supabase.auth.signOut({ scope: 'local' });
  };

  const value = useMemo(() => ({ session, isAdmin, loading, signIn, signUp, signOut }), [session, isAdmin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
