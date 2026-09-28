import { lightColors, darkColors, ColorTheme } from './colors';

/** Free choices — resolved by ThemeContext from the system when 'system'. */
export type FreeAppearanceId = 'light' | 'dark' | 'system';
/** Premium-only full-palette appearances, on top of Light / Dark / Auto. */
export type PremiumAppearanceId = 'ivory' | 'blush' | 'twilight' | 'espresso';
export type AppearanceId = FreeAppearanceId | PremiumAppearanceId;

interface PremiumAppearanceDef {
  id: PremiumAppearanceId;
  label: string;
  tagline: string;
  /** Whether this palette is dark-based — drives status-bar icon colour and
   * every screen that swaps light/dark artwork off `isDark`. */
  isDark: boolean;
  icon: string; // Ionicons name
  palette: ColorTheme;
}

/**
 * Premium appearances. Each one is a complete palette built on the same
 * keys as light/dark (so no component needs to know they exist), spread
 * from the matching base first so any key not restated here — status
 * colours, gold, star — stays identical to Light or Dark.
 */
const PREMIUM_APPEARANCE_DEFS: PremiumAppearanceDef[] = [
  {
    id: 'ivory',
    label: 'Ivory',
    tagline: 'Warm parchment, like a jewellery box',
    isDark: false,
    icon: 'sunny',
    palette: {
      ...lightColors,
      primaryLight: '#E3ECF7',
      background: '#FBF7EF',
      surface: '#FFFDF8',
      surfaceAlt: '#F3EBDB',
      textPrimary: '#2B2418',
      textSecondary: '#6B5F4B',
      textMuted: '#8F826B',
      border: '#E6DAC3',
      divider: '#EFE5D1',
      overlay: 'rgba(43, 36, 24, 0.45)',
      shadow: 'rgba(120, 90, 40, 0.16)',
    },
  },
  {
    id: 'blush',
    label: 'Blush',
    tagline: 'Soft rose petals, light and romantic',
    isDark: false,
    icon: 'rose',
    palette: {
      ...lightColors,
      primary: '#C0436A',
      primaryDark: '#9A3354',
      primaryLight: '#FADDE5',
      background: '#FFF6F7',
      surface: '#FFFCFC',
      surfaceAlt: '#FBE6EA',
      textPrimary: '#3A1F27',
      textSecondary: '#7A5560',
      textMuted: '#A5838D',
      border: '#F0D3DA',
      divider: '#F7E2E7',
      overlay: 'rgba(58, 31, 39, 0.45)',
      shadow: 'rgba(192, 67, 106, 0.14)',
    },
  },
  {
    id: 'twilight',
    label: 'Twilight',
    tagline: 'Deep plum evenings',
    isDark: true,
    icon: 'cloudy-night',
    palette: {
      ...darkColors,
      primary: '#7C6CF0',
      primaryDark: '#5F4FD4',
      primaryLight: '#2A2150',
      background: '#120D1F',
      surface: '#1B1430',
      surfaceAlt: '#271C45',
      textPrimary: '#F6F1FF',
      textSecondary: '#C7BBE0',
      textMuted: '#8477A6',
      border: '#3D2E66',
      divider: '#2C2150',
      overlay: 'rgba(8, 4, 20, 0.72)',
      shadow: 'rgba(10, 4, 30, 0.6)',
    },
  },
  {
    id: 'espresso',
    label: 'Espresso',
    tagline: 'Rich velvet brown with a golden glow',
    isDark: true,
    icon: 'cafe',
    palette: {
      ...darkColors,
      primary: '#B8692E',
      primaryDark: '#96521F',
      primaryLight: '#3A2414',
      background: '#140F0B',
      surface: '#1E1712',
      surfaceAlt: '#2A2019',
      textPrimary: '#F8F1E7',
      textSecondary: '#D3C4B0',
      textMuted: '#8C7C69',
      border: '#43342A',
      divider: '#30251D',
      overlay: 'rgba(12, 7, 3, 0.72)',
      shadow: 'rgba(0, 0, 0, 0.6)',
    },
  },
];

export interface PremiumAppearanceMeta {
  id: PremiumAppearanceId;
  label: string;
  tagline: string;
  isDark: boolean;
  icon: string;
  /** Preview colours for the picker tile: page, card, and accent. */
  preview: { background: string; surface: string; accent: string; text: string };
}

export const PREMIUM_APPEARANCES: PremiumAppearanceMeta[] = PREMIUM_APPEARANCE_DEFS.map((d) => ({
  id: d.id,
  label: d.label,
  tagline: d.tagline,
  isDark: d.isDark,
  icon: d.icon,
  preview: { background: d.palette.background, surface: d.palette.surface, accent: d.palette.primary, text: d.palette.textPrimary },
}));

const ALL_APPEARANCE_IDS = new Set<string>(['light', 'dark', 'system', ...PREMIUM_APPEARANCE_DEFS.map((d) => d.id)]);

export function isAppearanceId(value: unknown): value is AppearanceId {
  return typeof value === 'string' && ALL_APPEARANCE_IDS.has(value);
}

export function isPremiumAppearance(id: AppearanceId): id is PremiumAppearanceId {
  return PREMIUM_APPEARANCE_DEFS.some((d) => d.id === id);
}

/** The palette + dark flag for a Premium appearance. */
export function getPremiumAppearance(id: PremiumAppearanceId): { palette: ColorTheme; isDark: boolean } {
  const def = PREMIUM_APPEARANCE_DEFS.find((d) => d.id === id) as PremiumAppearanceDef;
  return { palette: def.palette, isDark: def.isDark };
}

/** What a shopper without Premium gets instead of a Premium appearance —
 * the free look closest to it (dark ones fall back to Dark, Ivory to Light). */
export function freeFallbackFor(id: PremiumAppearanceId): 'light' | 'dark' {
  return getPremiumAppearance(id).isDark ? 'dark' : 'light';
}
