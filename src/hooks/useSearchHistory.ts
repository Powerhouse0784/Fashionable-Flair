import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fashionable_flair/search_history';
const MAX_ITEMS = 8;

/** Recent search terms, persisted on-device — same local-only pattern as
 *  Wishlist and Recently Viewed, no account or server involved. */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setHistory(JSON.parse(stored));
      })
      .catch((err) => console.warn('Failed to load search history', err))
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history)).catch((err) =>
      console.warn('Failed to persist search history', err)
    );
  }, [history, isLoaded]);

  const addSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const withoutDuplicate = prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...withoutDuplicate].slice(0, MAX_ITEMS);
    });
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { history, addSearch, clearHistory };
}
