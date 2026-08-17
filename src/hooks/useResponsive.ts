import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS, GUTTER_MOBILE, GUTTER_TABLET, GUTTER_DESKTOP, GUTTER_WIDE, GRID_GAP } from '@/constants/layout';

function columnsForWidth(width: number): number {
  if (width >= BREAKPOINTS.xl) return 6;
  if (width >= BREAKPOINTS.lg) return 5;
  if (width >= BREAKPOINTS.md) return 4;
  if (width >= BREAKPOINTS.sm) return 3;
  return 2;
}

function gutterForWidth(width: number): number {
  if (width >= BREAKPOINTS.xl) return GUTTER_WIDE;
  if (width >= BREAKPOINTS.lg) return GUTTER_DESKTOP;
  if (width >= BREAKPOINTS.md) return GUTTER_TABLET;
  return GUTTER_MOBILE;
}

/** How many product-card columns to render for the current viewport. */
export function useColumns(): number {
  const { width } = useWindowDimensions();
  return columnsForWidth(width);
}

/** True once the viewport is wide enough to be considered "desktop web". */
export function useIsWideScreen(): boolean {
  const { width } = useWindowDimensions();
  return width >= BREAKPOINTS.md;
}

/**
 * Single source of truth for every horizontal-layout number in the app.
 * Full browser width is used (no centered/capped content box) — only the
 * edge gutter and column count scale up as the viewport grows, so a wide
 * monitor shows more products per row instead of dead margins.
 */
export function useContentMetrics(columnsOverride?: number) {
  const { width } = useWindowDimensions();
  const sidePadding = gutterForWidth(width);
  const innerWidth = width - sidePadding * 2;
  const columns = columnsOverride ?? columnsForWidth(width);
  const cardWidth = (innerWidth - GRID_GAP * (columns - 1)) / columns;
  return { sidePadding, innerWidth, columns, cardWidth };
}
