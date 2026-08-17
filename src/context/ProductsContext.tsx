import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types/product';
import { products as fallbackProducts } from '@/data/products';
import { fetchProducts, subscribeToProducts } from '@/services/productService';
import { isSupabaseConfigured } from '@/services/supabaseClient';

const CACHE_KEY = '@fashionable_flair/products_cache';

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  refreshing: boolean;
  lastSynced: Date | null;
  /** true once data has come from Supabase at least once (this session or cached) */
  isLive: boolean;
  refresh: () => Promise<void>;
  /** Instantly reflect an admin change in the UI without waiting for the
   *  realtime round-trip (which still arrives afterward and reconciles). */
  applyLocalUpsert: (product: Product) => void;
  applyLocalDelete: (id: string) => void;
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const sync = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    const remote = await fetchProducts();
    if (remote) {
      setProducts(remote);
      setIsLive(true);
      setLastSynced(new Date());
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote)).catch((err) =>
        console.warn('Failed to cache synced products', err)
      );
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    (async () => {
      // Show last-known synced data instantly (no spinner-then-flash), then
      // reconcile with a fresh fetch in the background.
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          setProducts(JSON.parse(cached));
          setIsLive(true);
        }
      } catch (err) {
        console.warn('Failed to read product cache', err);
      }
      await sync();

      // Live updates: any admin add/edit/delete pushes to every open app
      // instantly, no manual refresh needed. No-op if Supabase isn't
      // configured yet.
      if (isSupabaseConfigured) {
        unsubscribeRef.current = subscribeToProducts(() => sync());
      }
    })();

    return () => {
      unsubscribeRef.current?.();
    };
  }, [sync]);

  const applyLocalUpsert = useCallback((product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
    });
  }, []);

  const applyLocalDelete = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      products,
      loading,
      refreshing,
      lastSynced,
      isLive,
      refresh: () => sync(true),
      applyLocalUpsert,
      applyLocalDelete,
    }),
    [products, loading, refreshing, lastSynced, isLive, sync, applyLocalUpsert, applyLocalDelete]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within a ProductsProvider');
  return ctx;
}
