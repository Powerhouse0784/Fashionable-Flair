import { spacing } from '@/theme';

// No max-width cap anymore — the site uses the full browser width, with
// gutter (edge padding) that scales up gracefully as the window gets wider,
// and more grid columns kicking in at larger breakpoints so the extra
// width goes to more visible products, not empty margins.
export const GUTTER_MOBILE = spacing.lg; // 16
export const GUTTER_TABLET = 32;
export const GUTTER_DESKTOP = 48;
export const GUTTER_WIDE = 64;

export const GRID_GAP = spacing.md; // 12 — a bit more breathing room between cards

export const BREAKPOINTS = {
  sm: 600,   // tablet / large phone landscape
  md: 900,   // small desktop browser
  lg: 1200,  // desktop
  xl: 1600,  // wide desktop / large monitor
};
