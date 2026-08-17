import { Product, CategoryKey } from '@/types/product';

// Pure functions operating on whatever product list is passed in — used
// with the live (sheet-synced) list from useProducts(), so results stay
// correct whether the data came from the sheet or the local fallback.
export const getProductById = (list: Product[], id: string) => list.find((p) => p.id === id);

export const getProductsByCategory = (list: Product[], category: CategoryKey | string) =>
  list.filter((p) => p.category === category);

export const getFeaturedProducts = (list: Product[]) => list.filter((p) => p.isFeatured);
export const getNewArrivals = (list: Product[]) => list.filter((p) => p.isNewArrival);
export const getBestSellers = (list: Product[]) => list.filter((p) => p.isBestSeller);
