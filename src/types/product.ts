export type CategoryKey =
  | 'earrings'
  | 'pendants'
  | 'jewellery-sets'
  | 'bracelets'
  | 'hair-accessories';

export interface Product {
  id: string;
  title: string;
  subtitle?: string;          // e.g. "+2 More" variant note from Meesho
  price: number;
  /** Optional "was" price shown struck through next to `price` when higher,
   * to display a discount (e.g. "₹399 → ₹208 · 48% off"). Omit/null for no
   * discount badge. Nullable (not just optional) so an admin can explicitly
   * clear a previously-set discount — an `undefined` field is dropped
   * entirely from a Supabase update payload rather than clearing the
   * column, which would silently leave the old value in place. */
  compareAtPrice?: number | null;
  currency: 'INR';
  category: CategoryKey;
  rating: number;
  ratingLabel?: string;       // e.g. "3.1 Star Supplier"
  meeshoUrl: string;
  image?: string;              // primary/first photo — kept for backward compatibility
  images?: string[];           // full photo gallery, in display order. image is images[0] once set.
  description?: string;
  material?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  /** false = sold out. Shown as an "Out of Stock" badge, Buy Now disabled. Defaults to true if omitted. */
  isAvailable?: boolean;
}

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string; // Ionicons name (fallback if no image)
  image?: any; // require() image source shown in the category circle
}

/** Admin-curated customer review, shown on a product's detail page. Since
 * checkout happens on Meesho (not in this app), reviews aren't collected
 * from in-app verified purchases — the admin panel lets staff add genuine
 * reviews sourced from the product's actual Meesho reviews. */
export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  rating: number; // 1-5
  body: string;
  createdAt: string; // ISO date
}
