import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

interface AuthContextValue {
  session: Session | null;
  /** True only if this user's id is present in the `admins` table — not just "logged in". */
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CONFIG_ERROR = 'Admin sign-in isn\u2019t configured yet — see SUPABASE_SETUP.md.';

// There is no customer-facing account system in this app — shoppers just
// browse, wishlist, and buy on Meesho, no login needed. This context exists
// solely so the store owner (and anyone they allow-list) can sign in to
// manage the catalog. Admin accounts are created directly in the Supabase
// dashboard (see SUPABASE_SETUP.md), not through any screen in the app.
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(() => ({ session, isAdmin, loading, signIn, signOut }), [session, isAdmin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
