import { Product } from '@/types/product';

/**
 * Seed data uses placehold.co as a stand-in for "no real photo yet" — this
 * is the single source of truth for that check, used everywhere a photo
 * needs to be shown or filtered out (was previously duplicated across
 * ProductCard, ProductDetailScreen, and AdminDashboardScreen separately).
 */
export function hasRealPhoto(url?: string): boolean {
  return !!url && !url.includes('placehold.co');
}

/**
 * Returns every real photo for a product, in display order. Falls back to
 * the legacy single `image` field for products saved before multi-image
 * support existed, so nothing that was already in the catalog breaks.
 */
export function getProductImages(product: Pick<Product, 'image' | 'images'>): string[] {
  const gallery = (product.images ?? []).filter(hasRealPhoto);
  if (gallery.length > 0) return gallery;
  return hasRealPhoto(product.image) ? [product.image as string] : [];
}

/** The single best photo to use as a thumbnail (card grids, admin list). */
export function getPrimaryImage(product: Pick<Product, 'image' | 'images'>): string | undefined {
  return getProductImages(product)[0];
}
