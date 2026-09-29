import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { fetchPremiumStatusFor, PremiumStatus } from '@/services/premiumService';
import { useAuth } from './AuthContext';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface PremiumContextValue {
  isPremium: boolean;
  premiumSince: string | null;
  premiumExpiresAt: string | null;
  /** Whole days left in the current period, 0 once it's expired or never subscribed. */
  daysRemaining: number;
  isLoaded: boolean;
  /** Re-fetches this account's premium status from Supabase and returns
   * it directly — call after a verified payment, or whenever it's worth
   * double-checking. Returns the fetched value (not just updating state)
   * so a caller that needs the authoritative answer *right now* — e.g.
   * the paywall, immediately after a fresh login — doesn't have to trust
   * that this context has already re-rendered with it. */
  refresh: () => Promise<PremiumStatus>;
  /** Applies the since/expiresAt a payment-verification call just
   * returned, instantly, without waiting on a network round trip —
   * it's the same value the server just wrote, so this is optimistic
   * only in timing, not in trust. */
  applyServerPremium: (since: string, expiresAt: string) => void;
}

const NOT_PREMIUM: PremiumStatus = { isPremium: false, premiumSince: null, premiumExpiresAt: null };

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

  const [status, setStatus] = useState<PremiumStatus>(NOT_PREMIUM);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchStatus = useCallback(async (): Promise<PremiumStatus> => {
    if (!userId || !isSupabaseConfigured) {
      setStatus(NOT_PREMIUM);
      setIsLoaded(true);
      return NOT_PREMIUM;
    }
    try {
      const next = await fetchPremiumStatusFor(userId);
      setStatus(next);
      return next;
    } finally {
      setIsLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    setIsLoaded(false);
    fetchStatus();
  }, [fetchStatus]);

  const applyServerPremium = (nextSince: string, nextExpiresAt: string) => {
    setStatus({ isPremium: new Date(nextExpiresAt).getTime() > Date.now(), premiumSince: nextSince, premiumExpiresAt: nextExpiresAt });
  };

  const daysRemaining = status.isPremium
    ? Math.max(0, Math.ceil((new Date(status.premiumExpiresAt as string).getTime() - Date.now()) / MS_PER_DAY))
    : 0;

  const value = useMemo(
    () => ({
      isPremium: status.isPremium,
      premiumSince: status.premiumSince,
      premiumExpiresAt: status.premiumExpiresAt,
      daysRemaining,
      isLoaded,
      refresh: fetchStatus,
      applyServerPremium,
    }),
    [status, daysRemaining, isLoaded, fetchStatus]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within a PremiumProvider');
  return ctx;
}
