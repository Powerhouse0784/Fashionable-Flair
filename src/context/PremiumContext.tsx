import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { useAuth } from './AuthContext';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface PremiumContextValue {
  isPremium: boolean;
  premiumSince: string | null;
  premiumExpiresAt: string | null;
  /** Whole days left in the current period, 0 once it's expired or never subscribed. */
  daysRemaining: number;
  isLoaded: boolean;
  /** Re-fetches this account's premium status from Supabase — call after
   * a verified payment, or whenever it's worth double-checking. */
  refresh: () => Promise<void>;
  /** Applies the since/expiresAt a payment-verification call just
   * returned, instantly, without waiting on a network round trip —
   * it's the same value the server just wrote, so this is optimistic
   * only in timing, not in trust. */
  applyServerPremium: (since: string, expiresAt: string) => void;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

/**
 * Premium is only ever for a signed-in account — see
 * CUSTOMER_ACCOUNTS_SETUP.md for why: a device-local flag could be
 * cleared or lost, silently wasting a real purchase. So this reads
 * (and, via applyServerPremium, mirrors) the `profiles` table row for
 * whoever is currently logged in, and is simply "false" for a guest —
 * browsing, wishlist, and everything else remain guest-friendly; only
 * buying/holding Premium needs an account.
 */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [since, setSince] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) {
      setSince(null);
      setExpiresAt(null);
      setIsLoaded(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('premium_since, premium_expires_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.warn('Failed to load premium status', error.message);
        setSince(null);
        setExpiresAt(null);
      } else {
        setSince(data?.premium_since ?? null);
        setExpiresAt(data?.premium_expires_at ?? null);
      }
    } finally {
      setIsLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    setIsLoaded(false);
    fetchStatus();
  }, [fetchStatus]);

  const applyServerPremium = (nextSince: string, nextExpiresAt: string) => {
    setSince(nextSince);
    setExpiresAt(nextExpiresAt);
  };

  const isPremium = !!expiresAt && new Date(expiresAt).getTime() > Date.now();
  const daysRemaining = isPremium ? Math.max(0, Math.ceil((new Date(expiresAt as string).getTime() - Date.now()) / MS_PER_DAY)) : 0;

  const value = useMemo(
    () => ({
      isPremium,
      premiumSince: since,
      premiumExpiresAt: expiresAt,
      daysRemaining,
      isLoaded,
      refresh: fetchStatus,
      applyServerPremium,
    }),
    [isPremium, since, expiresAt, daysRemaining, isLoaded, fetchStatus]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within a PremiumProvider');
  return ctx;
}
