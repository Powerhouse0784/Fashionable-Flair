import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticSelection } from '@/utils/haptics';

const STORAGE_KEY = '@fashionable_flair/wishlist';

interface WishlistContextValue {
  wishlistIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isLoaded: boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setWishlistIds(JSON.parse(stored));
      } catch (err) {
        console.warn('Failed to load wishlist from storage', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return; // avoid overwriting storage before initial load completes
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistIds)).catch((err) =>
      console.warn('Failed to persist wishlist', err)
    );
  }, [wishlistIds, isLoaded]);

  const toggleWishlist = (productId: string) => {
    hapticSelection();
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  const clearWishlist = () => setWishlistIds([]);

  const value = useMemo(
    () => ({ wishlistIds, isWishlisted, toggleWishlist, clearWishlist, isLoaded }),
    [wishlistIds, isLoaded]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
