import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

interface AuthContextValue {
  session: Session | null;
  /** True only if this user's id is present in the `admins` table — not just "logged in". */
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Customer self-registration — a regular signed-up shopper, never an
   * admin (that still only ever comes from the `admins` table above). */
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CONFIG_ERROR = 'Sign-in isn\u2019t configured yet — see SUPABASE_SETUP.md.';

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

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(() => ({ session, isAdmin, loading, signIn, signUp, signOut }), [session, isAdmin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
