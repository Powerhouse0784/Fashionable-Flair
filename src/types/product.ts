export type CategoryKey =
  | 'earrings'
  | 'necklaces'
  | 'pendants'
  | 'jewellery-sets'
  | 'bracelets'
  | 'hair-accessories';

export interface Product {
  id: string;
  title: string;
  subtitle?: string;          // e.g. "+2 More" variant note from Meesho
  price: number;
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
  icon: string; // Ionicons name
}
