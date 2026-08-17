import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fashionable_flair/recently_viewed';
const MAX_ITEMS = 12;

interface RecentlyViewedContextValue {
  recentlyViewedIds: string[];
  trackView: (productId: string) => void;
  isLoaded: boolean;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setIds(JSON.parse(stored));
      } catch (err) {
        console.warn('Failed to load recently viewed', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch((err) =>
      console.warn('Failed to persist recently viewed', err)
    );
  }, [ids, isLoaded]);

  const trackView = useCallback((productId: string) => {
    setIds((prev) => {
      const withoutCurrent = prev.filter((id) => id !== productId);
      return [productId, ...withoutCurrent].slice(0, MAX_ITEMS);
    });
  }, []);

  const value = useMemo(
    () => ({ recentlyViewedIds: ids, trackView, isLoaded }),
    [ids, trackView, isLoaded]
  );

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  return ctx;
}
