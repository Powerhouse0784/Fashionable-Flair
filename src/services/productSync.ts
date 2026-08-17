import Papa from 'papaparse';
import { Product, CategoryKey } from '@/types/product';
import { SHEET_CSV_URL } from '@/config/sheetConfig';

const VALID_CATEGORIES: CategoryKey[] = [
  'earrings',
  'necklaces',
  'pendants',
  'jewellery-sets',
  'bracelets',
  'hair-accessories',
];

function toBool(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}

function rowToProduct(row: Record<string, string>): Product | null {
  const id = row.id?.trim();
  const title = row.title?.trim();
  const price = parseFloat(row.price);
  const category = row.category?.trim() as CategoryKey;
  const rating = parseFloat(row.rating);
  const meeshoUrl = row.meeshoUrl?.trim();

  // Skip rows that are missing the fields the app actually needs to
  // render a card safely, rather than crashing the whole sync over one
  // typo'd spreadsheet row.
  if (!id || !title || !meeshoUrl || Number.isNaN(price) || !VALID_CATEGORIES.includes(category)) {
    console.warn('Skipping invalid product row from sheet:', row);
    return null;
  }

  return {
    id,
    title,
    subtitle: row.subtitle?.trim() || undefined,
    price,
    currency: 'INR',
    category,
    rating: Number.isNaN(rating) ? 0 : rating,
    ratingLabel: row.ratingLabel?.trim() || undefined,
    meeshoUrl,
    image: row.image?.trim() || `https://placehold.co/600x600/F1E2B8/8F4A54?text=${encodeURIComponent(title)}`,
    description: row.description?.trim() || undefined,
    material: row.material?.trim() || undefined,
    isNewArrival: toBool(row.isNewArrival),
    isBestSeller: toBool(row.isBestSeller),
    isFeatured: toBool(row.isFeatured),
  };
}

/**
 * Fetches and parses the published Google Sheet. Returns null (not an
 * empty array) on any failure — missing URL, network error, empty sheet,
 * every row invalid — so the caller can tell "no live data available" apart
 * from "the sheet legitimately has zero products" and fall back safely.
 */
export async function fetchRemoteProducts(): Promise<Product[] | null> {
  if (!SHEET_CSV_URL) return null;

  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const csvText = await res.text();

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const productList = parsed.data.map(rowToProduct).filter((p): p is Product => p !== null);
    return productList.length > 0 ? productList : null;
  } catch (err) {
    console.warn('Failed to fetch/parse product sheet, using fallback catalog', err);
    return null;
  }
}
